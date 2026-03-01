import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';

@Injectable()
export class PixService {
  async createPixCharge({ studentId, valueCents, tenant }: { studentId: string; valueCents: number; tenant: Tenant }) {
    if (tenant.pixProvider === 'gerencianet') {
      // Exemplo de integração Gerencianet
      // Aqui você usaria tenant.gerencianetClientId, tenant.gerencianetClientSecret, tenant.pixKey
      // ...chamada real ao PSP
      return {
        chargeId: 'gn_' + Math.random().toString(36).substring(2, 10),
        pixCopiaCola: '00020126...GN',
        qrCodeImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=gn',
        valueCents,
        studentId,
        status: 'pending',
      };
    } else if (tenant.pixProvider === 'mercadopago') {
      // Exemplo de integração Mercado Pago
      // Aqui você usaria tenant.mercadopagoAccessToken, tenant.mercadopagoPublicKey, tenant.pixKey
      // ...chamada real ao PSP
      return {
        chargeId: 'mp_' + Math.random().toString(36).substring(2, 10),
        pixCopiaCola: '00020126...MP',
        qrCodeImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=mp',
        valueCents,
        studentId,
        status: 'pending',
      };
    }
    throw new Error('Provedor Pix não configurado');
  }

  async confirmPixPayment(chargeId: string) {
    return { chargeId, status: 'paid' };
  }
}
