import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MoneyDto } from './dto/money.dto';
import { TopupDto } from './dto/topup.dto';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly svc: WalletsService,
  ) {}

  @Get(':studentId')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  get(@Req() req: Request, @Param('studentId') studentId: string) {
    return this.svc.get(req.tenantId!, studentId);
  }

  @Post(':studentId/topup')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  topup(@Req() req: Request, @Param('studentId') studentId: string, @Body() dto: MoneyDto) {
    return this.svc.topup(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }

  @Post(':studentId/debit')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  debit(@Req() req: Request, @Param('studentId') studentId: string, @Body() dto: MoneyDto) {
    return this.svc.debit(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }

  @Post(':studentId/refund')
  @Roles('ADMIN', 'GESTOR')
  refund(@Req() req: Request, @Param('studentId') studentId: string, @Body() dto: MoneyDto) {
    return this.svc.refund(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }
}
