import { Injectable, NotFoundException } from '@nestjs/common';
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
}
