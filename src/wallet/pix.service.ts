import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as fs from 'fs';

function createEfipayHttpClient(): AxiosInstance {
  const baseURL = process.env.EFI_PIX_BASE_URL || 'https://pix-h.api.efipay.com.br';
  const certPath = process.env.EFI_PIX_CERT_PATH;
  const certPassword = process.env.EFI_PIX_CERT_PASSWORD ?? '';

  if (!certPath) {
    throw new InternalServerErrorException('EFI_PIX_CERT_PATH is not configured');
  }

  let pfx: Buffer;
  try {
    pfx = fs.readFileSync(certPath);
  } catch (err) {
    throw new InternalServerErrorException('Failed to read Efipay certificate file');
  }

  const httpsAgent = new https.Agent({
    pfx,
    passphrase: certPassword,
  });

  return axios.create({
    baseURL,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

@Injectable()
export class PixService {
  private async getEfipayAccessToken(tenant: Tenant): Promise<string> {
    const clientId = tenant.gerencianetClientId;
    const clientSecret = tenant.gerencianetClientSecret;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Efipay client credentials not configured for tenant');
    }

    const http = createEfipayHttpClient();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const resp = await http.post(
      '/oauth/token',
      { grant_type: 'client_credentials' },
      {
        headers: {
          Authorization: `Basic ${basic}`,
        },
      },
    );

    if (!resp.data || !resp.data.access_token) {
      throw new InternalServerErrorException('Failed to obtain Efipay access token');
    }

    return resp.data.access_token as string;
  }

  async createPixCharge({ studentId, valueCents, tenant }: { studentId: string; valueCents: number; tenant: Tenant }) {
    if (tenant.pixProvider === 'gerencianet') {
      const http = createEfipayHttpClient();
      const accessToken = await this.getEfipayAccessToken(tenant);

      const originalValue = (valueCents / 100).toFixed(2);

      const cobResp = await http.post(
        '/v2/cob',
        {
          calendario: { expiracao: 3600 },
          valor: { original: originalValue },
          chave: tenant.pixKey,
          solicitacaoPagador: `Recarga carteira aluno ${studentId}`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const txid: string | undefined = cobResp.data?.txid;
      const locId: number | undefined = cobResp.data?.loc?.id;

      if (!txid) {
        throw new InternalServerErrorException('Efipay did not return txid for Pix charge');
      }

      let pixCopiaCola: string | undefined;
      let qrCodeImageUrl: string | undefined;

      if (locId) {
        const qrResp = await http.get(`/v2/loc/${locId}/qrcode`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        pixCopiaCola = qrResp.data?.qrcode;
        qrCodeImageUrl = qrResp.data?.imagemQrcode;
      }

      return {
        chargeId: txid,
        pixCopiaCola,
        qrCodeImageUrl,
        valueCents,
        studentId,
        status: 'pending',
      };
    } else if (tenant.pixProvider === 'mercadopago') {
      // Mantém integração mockada para Mercado Pago por enquanto
      return {
        chargeId: 'mp_' + Math.random().toString(36).substring(2, 10),
        pixCopiaCola: '00020126...MP',
        qrCodeImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=mp',
        valueCents,
        studentId,
        status: 'pending',
      };
    }
    throw new InternalServerErrorException('Provedor Pix não configurado');
  }

  async confirmPixPayment(chargeId: string) {
    // Para Efipay, o webhook é disparado apenas quando o pagamento é confirmado.
    // Neste momento não consultamos o status remoto, pois o fluxo interno
    // já trata a transação como paga quando o webhook é recebido.
    return { chargeId, status: 'paid' };
  }
}
