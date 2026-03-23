import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PixService } from './pix.service';
import { PixWebhookController } from './pix-webhook.controller';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [NotificationsModule, EventsModule],
  controllers: [WalletsController, PixWebhookController],
  providers: [WalletsService, JwtAuthGuard, RolesGuard, Reflector, PixService],
})
export class WalletsModule {}
