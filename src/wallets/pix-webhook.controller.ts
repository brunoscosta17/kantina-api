import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { PixService } from '../wallet/pix.service';
import { PrismaService } from '../prisma.service';

interface PixWebhookDto {
  chargeId?: string;
  // Payload de webhook Pix padrão Efí segue o modelo do Bacen,
  // com um array "pix" contendo objetos que possuem um txid.
  pix?: Array<{ txid?: string; [key: string]: any }>;
  [key: string]: any;
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

    let chargeId = body.chargeId;

    // Suporte ao payload de webhook Pix da Efí (array pix[0].txid)
    if (!chargeId && Array.isArray(body.pix) && body.pix.length > 0) {
      const firstPix = body.pix[0];
      if (firstPix && typeof firstPix.txid === 'string') {
        chargeId = firstPix.txid;
      }
    }

    if (!chargeId) {
      throw new BadRequestException('chargeId or pix[0].txid is required');
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
