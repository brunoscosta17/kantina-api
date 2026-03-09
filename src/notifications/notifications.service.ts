import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, title: string, body: string, userId?: string, role?: string) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        title,
        body,
        userId,
        role,
      },
    });
  }

  async getMyNotifications(tenantId: string, userId: string, role: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        OR: [
          { userId },
          { role },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(tenantId: string, id: string, userId: string, role: string) {
    // Validate ownership before updating
    const notif = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId,
        OR: [{ userId }, { role }],
      },
    });
    
    if (!notif) return null;

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
