import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrdersQueryDto } from './dto/orders.query.dto';
import { TransactionsQueryDto } from './dto/transactions.query.dto';

function dateRange(from?: string, to?: string) {
  const r: { gte?: Date; lte?: Date } = {};
  if (from) r.gte = new Date(from);
  if (to) r.lte = new Date(to);
  return Object.keys(r).length ? r : undefined;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async transactions(tenantId: string, q: TransactionsQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      ...(q.type ? { type: q.type } : {}),
      ...(q.studentId ? { wallet: { studentId: q.studentId } } : {}),
      ...(q.from || q.to ? { createdAt: dateRange(q.from, q.to) } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        include: { wallet: { include: { student: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { data: rows, page, pageSize, total, hasNext: page * pageSize < total };
  }

  async orders(tenantId: string, q: OrdersQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      ...(q.studentId ? { studentId: q.studentId } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.from || q.to ? { createdAt: dateRange(q.from, q.to) } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { items: true, student: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { data: rows, page, pageSize, total, hasNext: page * pageSize < total };
  }
}
