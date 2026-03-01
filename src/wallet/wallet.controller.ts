import { Body, Controller, Param, Post } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PixService } from './pix.service';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly pix: PixService,
    private readonly prisma: PrismaService,
  ) {}

  // Endpoint para criar cobrança Pix
  @Post(':studentId/pix-charge')
  async createPixCharge(@Param('studentId') studentId: string, @Body() body: { valueCents: number }) {
    // Busca carteira do aluno
    const wallet = await this.prisma.wallet.findFirst({ where: { studentId } });
    if (!wallet) {
      throw new Error('Carteira do aluno não encontrada');
    }
    // Busca tenant (cantina)
    const tenant = await this.prisma.tenant.findUnique({ where: { id: wallet.tenantId } });
    if (!tenant) {
      throw new Error('Cantina não encontrada');
    }
    // Cria cobrança Pix usando dados do tenant
    const charge = await this.pix.createPixCharge({ studentId, valueCents: body.valueCents, tenant });
    // Salva cobrança no banco (simples)
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tenantId: wallet.tenantId,
        type: 'PIX',
        amountCents: body.valueCents,
        meta: { status: 'pending' },
        requestId: charge.chargeId,
      },
    });
    return charge;
  }

  // Endpoint para receber confirmação do Pix (webhook)
  @Post('pix-webhook')
  async pixWebhook(@Body() body: { chargeId: string }) {
    // Simula confirmação
    await this.pix.confirmPixPayment(body.chargeId);
    // Atualiza transação e saldo
    const tx = await this.prisma.walletTransaction.findFirst({ where: { requestId: body.chargeId } });
    if (tx && typeof tx.meta === 'object' && tx.meta !== null && (tx.meta as any).status !== 'paid') {
      await this.prisma.walletTransaction.update({
        where: { id: tx.id },
        data: { meta: { ...(tx.meta as object), status: 'paid' } },
      });
      await this.prisma.wallet.update({
        where: { id: tx.walletId },
        data: { balanceCents: { increment: tx.amountCents } },
      });
    }
    return { ok: true };
  }
}
