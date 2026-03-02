import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PixService } from '../wallet/pix.service';
import { PixWebhookController } from './pix-webhook.controller';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  controllers: [WalletsController, PixWebhookController],
  providers: [WalletsService, JwtAuthGuard, RolesGuard, Reflector, PixService],
})
export class WalletsModule {}
