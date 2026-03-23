import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { PixService } from './pix.service';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

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
    private readonly notifications: NotificationsService,
    private readonly events: EventsGateway,
  ) {}

  @Post('pix-webhook')
  async handleWebhook(@Body() body: PixWebhookDto, @Headers('x-pix-secret') secret?: string) {
    console.log('--- PIX WEBHOOK RECEIVED ---', JSON.stringify(body, null, 2));

    const expectedSecret = process.env.PIX_WEBHOOK_SECRET;
    let isMercadoPago = false;
    let chargeId = body.chargeId;

    // Suporte ao payload webhook Mercado Pago (Webhooks)
    if (!chargeId && (body.type === 'payment' || body.action?.startsWith('payment')) && body.data?.id) {
      chargeId = body.data.id.toString();
      isMercadoPago = true;
    }
    // Suporte ao payload webhook Mercado Pago (IPN)
    else if (!chargeId && body.topic === 'payment' && body.resource) {
      const parts = body.resource.split('/');
      chargeId = parts[parts.length - 1];
      isMercadoPago = true;
    }

    if (!isMercadoPago && expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid Pix webhook secret');
    }

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

    const tx = await this.prisma.walletTransaction.findFirst({
      where: { requestId: chargeId },
      include: { tenant: true },
    });

    if (!tx) {
      return { ok: true, skipped: true };
    }

    // Validação de status diretamente do Mercado Pago
    if (tx.tenant.pixProvider === 'mercadopago' && tx.tenant.mercadopagoAccessToken) {
      const mpResp = await axios.get(`https://api.mercadopago.com/v1/payments/${chargeId}`, {
        headers: { Authorization: `Bearer ${tx.tenant.mercadopagoAccessToken}` },
        validateStatus: () => true, // não joga erro, valida em seguida
      });
      if (mpResp.status !== 200 || mpResp.data.status !== 'approved') {
        // Ignora webhooks ou atualizações de pagamentos não aprovados
        return { ok: true, skipped: true, mpStatus: mpResp.data?.status };
      }
    }

    await this.pix.confirmPixPayment(chargeId);

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

      const amountStr = (tx.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const student = await prismaTx.student.findUnique({ where: { id: wallet.studentId } });
      const studentName = student?.name || 'seu dependente';

      // Notify parent(s)
      const parents = await prismaTx.studentOnResponsavel.findMany({ where: { studentId: wallet.studentId } });
      for (const p of parents) {
        await this.notifications.create(
          wallet.tenantId,
          '💸 Pix Confirmado!',
          `O valor de ${amountStr} foi creditado com sucesso na carteira de ${studentName}.`,
          p.responsavelId,
        );
      }

      // Notify cantina operators
      await this.notifications.create(
        wallet.tenantId,
        'Novo Saldo (Pix)',
        `A carteira de ${studentName} foi recarregada com ${amountStr} via Pix.`,
        undefined,
        'OPERADOR'
      );

      // Emit WebSocket event
      this.events.emitPixPaid(chargeId, {
        tenantId: wallet.tenantId,
        studentId: wallet.studentId,
        amountCents: tx.amountCents,
        status: 'paid',
      });
    });

    return { ok: true };
  }
}
