import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { PixService } from '../wallet/pix.service';
import { PrismaService } from '../prisma.service';

interface PixWebhookDto {
  chargeId: string;
}

@Controller('wallets')
export class PixWebhookController {
  constructor(
    private readonly pix: PixService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('pix-webhook')
  async handleWebhook(@Body() body: PixWebhookDto, @Headers('x-pix-secret') secret?: string) {
    const expectedSecret = process.env.PIX_WEBHOOK_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid Pix webhook secret');
    }

    const { chargeId } = body;
    if (!chargeId) {
      throw new BadRequestException('chargeId is required');
    }

    await this.pix.confirmPixPayment(chargeId);

    const tx = await this.prisma.walletTransaction.findFirst({
      where: { requestId: chargeId },
    });

    if (!tx) {
      return { ok: true, skipped: true };
    }

    if (typeof tx.meta === 'object' && tx.meta !== null && (tx.meta as any).status === 'paid') {
      return { ok: true, alreadyProcessed: true };
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { id: tx.walletId } });
    if (!wallet) {
      return { ok: true, walletMissing: true };
    }

    await this.prisma.$transaction(async (prismaTx) => {
      await prismaTx.walletTransaction.update({
        where: { id: tx.id },
        data: {
          meta: {
            ...(tx.meta as object | null | undefined),
            status: 'paid',
          },
        },
      });

      await prismaTx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { increment: tx.amountCents } },
      });
    });

    return { ok: true };
  }
}
