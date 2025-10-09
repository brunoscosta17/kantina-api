import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, q: { studentId?: string; status?: string }) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(q.studentId ? { studentId: q.studentId } : {}),
        ...(q.status ? { status: q.status } : {}),
      },
      include: {
        items: true,
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateOrderDto) {
    // 1) validar itens (unificar IDs)
    const ids = [...new Set(dto.items.map((i) => i.itemId))];
    const catalogItems = await this.prisma.catalogItem.findMany({
      where: { tenantId, id: { in: ids }, isActive: true },
      select: { id: true, priceCents: true, name: true },
    });
    if (catalogItems.length !== ids.length) {
      throw new BadRequestException('Some items are invalid or inactive for this tenant');
    }
    const priceById = new Map(catalogItems.map((c) => [c.id, c.priceCents]));

    // 2) calcular total com base no catálogo atual (preço “congelado” no orderItem)
    const itemsPrepared = dto.items.map((i) => ({
      itemId: i.itemId,
      qty: i.qty,
      unitPriceCents: priceById.get(i.itemId)!,
    }));
    const totalCents = itemsPrepared.reduce((acc, it) => acc + it.unitPriceCents * it.qty, 0);

    // 3) transação: valida wallet, saldo, cria pedido, debita e lança transação
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { tenantId, studentId: dto.studentId },
        select: { id: true, balanceCents: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found for student');

      if (wallet.balanceCents < totalCents) {
        throw new BadRequestException('Insufficient balance');
      }

      const order = await tx.order.create({
        data: {
          tenantId,
          studentId: dto.studentId,
          status: 'PAID', // já paga via carteira
          items: {
            createMany: {
              data: itemsPrepared.map((it) => ({
                itemId: it.itemId,
                qty: it.qty,
                unitPriceCents: it.unitPriceCents,
              })),
            },
          },
        },
        include: { items: true },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCents: { decrement: totalCents } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          type: 'DEBIT',
          amountCents: totalCents,
          meta: { orderId: order.id },
        },
      });

      return { order, totalCents };
    });
  }

  async fulfill(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true, status: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PAID') {
      throw new BadRequestException('Only PAID orders can be fulfilled');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'FULFILLED' },
    });
  }

  async cancel(tenantId: string, orderId: string, actorUserId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: orderId, tenantId },
          include: { items: true, student: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        if (order.status === 'FULFILLED') {
          throw new BadRequestException('Cannot cancel a fulfilled order');
        }
        if (order.status === 'CANCELLED') {
          return order; // já cancelado (idempotente)
        }

        // Total do pedido
        const total = order.items.reduce((acc, it) => acc + it.unitPriceCents * it.qty, 0);

        // REFUND idempotente
        const requestId = `refund:order:${order.id}`;

        // Encontra wallet do aluno
        const wallet = await tx.wallet.findFirst({
          where: { tenantId, studentId: order.studentId },
        });
        if (!wallet) throw new NotFoundException('Wallet not found for student');

        // Verifica se já tem refund dessa ordem
        const existing = await tx.walletTransaction.findFirst({ where: { tenantId, requestId } });
        if (!existing && total > 0) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balanceCents: { increment: total } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              tenantId,
              type: 'REFUND',
              amountCents: total,
              meta: { reason: 'ORDER_CANCELLED', orderId: order.id, actorUserId },
              requestId,
            },
          });
        }

        const updated = await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
