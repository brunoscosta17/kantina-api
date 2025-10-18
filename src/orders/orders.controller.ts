import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateOrderDto, ListOrdersQueryDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Req() req: Request, @Query() q: ListOrdersQueryDto) {
    return this.ordersService.list(req.tenantId!, q);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.tenantId!, dto);
  }

  @Post(':id/fulfill')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  fulfill(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.fulfill(req.tenantId!, id);
  }

  @Post(':orderId/cancel')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  cancel(@Req() req: Request, @Param('orderId') orderId: string) {
    const actorUserId = (req.user as { sub?: string } | undefined)?.sub;
    if (!actorUserId) {
      throw new Error('Authenticated user id (sub) is required');
    }
    return this.ordersService.cancel(req.tenantId!, orderId, actorUserId);
  }
}
