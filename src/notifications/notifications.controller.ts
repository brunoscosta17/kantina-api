import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: Request) {
    const user = req.user as { sub: string; role: string };
    return this.svc.getMyNotifications(req.tenantId!, user.sub, user.role);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { sub: string; role: string };
    await this.svc.markAsRead(req.tenantId!, id, user.sub, user.role);
    return { success: true };
  }
}
