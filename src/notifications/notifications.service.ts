import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, title: string, body: string, userId?: string, role?: string) {
    // 1. Salva no banco (notificação interna)
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        title,
        body,
        userId,
        role,
      },
    });

    // 2. Envio Push Real via Expo
    try {
      let tokens: string[] = [];

      if (userId) {
        // Busca token do usuário específico
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
        if (user?.pushToken) tokens.push(user.pushToken);
      } else if (role) {
        // Busca tokens de todos os usuários com esse papel no tenant
        const users = await this.prisma.user.findMany({
          where: { tenantId, role: role as any, pushToken: { not: null } },
          select: { pushToken: true }
        });
        tokens = users.map(u => u.pushToken!).filter(t => Expo.isExpoPushToken(t));
      }

      if (tokens.length > 0) {
        const messages: ExpoPushMessage[] = tokens.map(token => ({
          to: token,
          sound: 'default',
          title,
          body,
          data: { notificationId: notification.id },
        }));

        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await this.expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Erro ao enviar chunk de push:', error);
          }
        }
      }
    } catch (err) {
      console.error('Erro geral no fluxo de push notifications:', err);
    }

    return notification;
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
