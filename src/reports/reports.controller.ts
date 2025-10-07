import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersQueryDto } from './dto/orders.query.dto';
import { TransactionsQueryDto } from './dto/transactions.query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  // Extrato de transações - visível para ADMIN/GESTOR/OPERADOR
  @Get('transactions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  transactions(@Req() req: any, @Query() q: TransactionsQueryDto) {
    return this.svc.transactions(req.tenantId, q);
  }

  // Pedidos - visível para ADMIN/GESTOR/OPERADOR
  @Get('orders')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  orders(@Req() req: any, @Query() q: OrdersQueryDto) {
    return this.svc.orders(req.tenantId, q);
  }
}
