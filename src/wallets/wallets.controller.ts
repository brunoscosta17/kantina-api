import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WalletsService } from './wallets.service';

class MoneyDto {
  amountCents!: number;
  requestId?: string;
}

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly svc: WalletsService) {}

  @Get(':studentId')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  get(@Req() req: Express.Request, @Param('studentId') studentId: string) {
    return this.svc.get(req.tenantId!, studentId);
  }

  @Post(':studentId/topup')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  topup(@Req() req: Express.Request, @Param('studentId') studentId: string, @Body() dto: MoneyDto) {
    return this.svc.topup(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }

  @Post(':studentId/debit')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  debit(@Req() req: Express.Request, @Param('studentId') studentId: string, @Body() dto: MoneyDto) {
    return this.svc.debit(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }

  @Post(':studentId/refund')
  @Roles('ADMIN', 'GESTOR')
  refund(
    @Req() req: Express.Request,
    @Param('studentId') studentId: string,
    @Body() dto: MoneyDto,
  ) {
    return this.svc.refund(req.tenantId!, studentId, dto.amountCents, dto.requestId);
  }
}
