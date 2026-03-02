import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';
import { PixService } from '../wallet/pix.service';
import { MoneyDto } from './dto/money.dto';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly svc: WalletsService,
    private readonly prisma: PrismaService,
    private readonly pix: PixService,
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

  // Endpoint para criar cobrança Pix (iniciado pelo responsável)
  @Post(':studentId/pix-charge')
  @Roles('RESPONSAVEL')
  async createPixCharge(
    @Param('studentId') studentId: string,
    @Body() body: { valueCents: number },
  ) {
    const { valueCents } = body;
    if (!valueCents || valueCents <= 0) {
      throw new BadRequestException('valueCents must be positive');
    }

    const wallet = await this.prisma.wallet.findFirst({ where: { studentId } });
    if (!wallet) {
      throw new BadRequestException('Carteira do aluno não encontrada');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: wallet.tenantId } });
    if (!tenant) {
      throw new BadRequestException('Cantina não encontrada');
    }

    const charge = await this.pix.createPixCharge({ studentId, valueCents, tenant });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        tenantId: wallet.tenantId,
        type: 'PIX',
        amountCents: valueCents,
        meta: { status: 'pending' },
        requestId: charge.chargeId,
      },
    });

    return charge;
  }
}
