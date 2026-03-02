import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type Tx = Prisma.TransactionClient; // <— tipo oficial do Prisma p/ transação

type Meta = Record<string, unknown> | undefined;

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async get(tenantId: string, studentId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { tenantId, studentId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.mapWallet(wallet);
  }

  async topup(
    tenantId: string,
    studentId: string,
    amountCents: number,
    requestId?: string,
    meta?: Meta,
  ) {
    if (amountCents <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await this.ensureWallet(tx, tenantId, studentId);

        // Idempotência
        const reused = await this.findByRequestId(tx, tenantId, requestId);
        if (reused) return this.reloadWallet(tx, wallet.id);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceCents: { increment: amountCents } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId,
            type: 'TOPUP',
            amountCents,
            requestId: requestId ?? null,
            meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
          },
        });

        const reloaded = await this.reloadWallet(tx, wallet.id);
        if (!reloaded) throw new NotFoundException('Wallet not found');
        return this.mapWallet(reloaded);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async debit(
    tenantId: string,
    studentId: string,
    amountCents: number,
    requestId?: string,
    meta?: Meta,
  ) {
    if (amountCents <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await this.ensureWallet(tx, tenantId, studentId);

        // Idempotência
        const reused = await this.findByRequestId(tx, tenantId, requestId);
        if (reused) return this.reloadWallet(tx, wallet.id);

        const current = await tx.wallet.findUnique({
          where: { id: wallet.id },
          select: { balanceCents: true },
        });
        if (!current) throw new NotFoundException('Wallet not found');
        if (current.balanceCents < amountCents) {
          throw new BadRequestException('Insufficient funds');
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceCents: { decrement: amountCents } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId,
            type: 'DEBIT',
            amountCents,
            requestId: requestId ?? null,
            meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
          },
        });

        const reloaded = await this.reloadWallet(tx, wallet.id);
        if (!reloaded) throw new NotFoundException('Wallet not found');
        return this.mapWallet(reloaded);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async refund(
    tenantId: string,
    studentId: string,
    amountCents: number,
    requestId?: string,
    meta?: Meta,
  ) {
    if (amountCents <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await this.ensureWallet(tx, tenantId, studentId);

        const reused = await this.findByRequestId(tx, tenantId, requestId);
        if (reused) return this.reloadWallet(tx, wallet.id);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceCents: { increment: amountCents } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId,
            type: 'REFUND',
            amountCents,
            requestId: requestId ?? null,
            meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
          },
        });

        const reloaded = await this.reloadWallet(tx, wallet.id);
        if (!reloaded) throw new NotFoundException('Wallet not found');
        return this.mapWallet(reloaded);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // --- helpers ---
  private async ensureWallet(tx: Tx, tenantId: string, studentId: string) {
    const wallet = await tx.wallet.findFirst({ where: { tenantId, studentId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  private async reloadWallet(tx: Tx, walletId: string) {
    return tx.wallet.findUnique({
      where: { id: walletId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  private async findByRequestId(tx: Tx, tenantId: string, requestId?: string | null) {
    if (!requestId) return null;
    return tx.walletTransaction.findFirst({ where: { tenantId, requestId } });
  }

  // Transforma a carteira e transações em um formato amigável para a API
  private mapWallet(wallet: {
    id: string;
    tenantId: string;
    studentId: string;
    balanceCents: number;
    transactions: {
      id: string;
      type: string;
      amountCents: number;
      createdAt: Date;
      meta: Prisma.JsonValue | null;
      requestId: string | null;
    }[];
  }) {
    return {
      id: wallet.id,
      tenantId: wallet.tenantId,
      studentId: wallet.studentId,
      balanceCents: wallet.balanceCents,
      transactions: wallet.transactions.map((t) => {
        const isCredit = t.type === 'TOPUP' || t.type === 'PIX' || t.type === 'REFUND';
        let label = t.type;
        if (t.type === 'TOPUP') label = 'Recarga manual';
        else if (t.type === 'PIX') label = 'Recarga Pix';
        else if (t.type === 'DEBIT') label = 'Débito de consumo';
        else if (t.type === 'REFUND') label = 'Estorno';

        return {
          id: t.id,
          type: t.type,
          label,
          direction: isCredit ? 'CREDIT' : 'DEBIT',
          amountCents: t.amountCents,
          createdAt: t.createdAt,
          requestId: t.requestId,
          meta: t.meta ?? undefined,
        };
      }),
    };
  }
}
