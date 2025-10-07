import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersQueryDto } from './dto/orders.query.dto';
import { TransactionsQueryDto } from './dto/transactions.query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth() // apenas Bearer (tenant vem do JWT)
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('transactions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  transactions(@Req() req: Express.Request, @Query() q: TransactionsQueryDto) {
    return this.svc.transactions(req.tenantId!, q);
  }

  @Get('orders')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  orders(@Req() req: Express.Request, @Query() q: OrdersQueryDto) {
    return this.svc.orders(req.tenantId!, q);
  }
}
