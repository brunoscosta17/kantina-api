import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async get(tenantId: string, studentId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { tenantId, studentId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      balanceCents: wallet.balanceCents,
      lastTransactions: wallet.transactions,
    };
  }

  async topup(tenantId: string, studentId: string, amountCents: number, note?: string) {
    if (amountCents <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { tenantId, studentId },
        select: { id: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { increment: amountCents } },
        select: { id: true, balanceCents: true },
      });

      const trx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: 'TOPUP',
          amountCents,
          meta: note ? { note } : undefined,
        },
      });

      return { balanceCents: updated.balanceCents, lastTransaction: trx };
    });
  }
}
