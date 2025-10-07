import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateOrderDto, ListOrdersQueryDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  list(@Req() req: any, @Query() q: ListOrdersQueryDto) {
    return this.svc.list(req.tenantId, q);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.svc.create(req.tenantId, dto);
  }

  @Post(':id/fulfill')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  fulfill(@Req() req: any, @Param('id') id: string) {
    return this.svc.fulfill(req.tenantId, id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.svc.cancel(req.tenantId, id);
  }
}
