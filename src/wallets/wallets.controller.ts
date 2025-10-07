import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TopupDto } from './dto/topup.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly svc: WalletsService) {}

  @Get(':studentId')
  get(@Param('studentId') studentId: string, @Req() req: any) {
    return this.svc.get(req.tenantId, studentId);
  }

  @Post(':studentId/topup')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  topup(@Param('studentId') studentId: string, @Body() dto: TopupDto, @Req() req: any) {
    return this.svc.topup(req.tenantId, studentId, dto.amountCents, dto.note);
  }
}
