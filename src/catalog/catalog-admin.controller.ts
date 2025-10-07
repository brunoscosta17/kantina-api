import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogAdminService } from './catalog-admin.service';
import { CreateCatalogItemDto } from './dto/create-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateCatalogItemDto } from './dto/update-item.dto';

@ApiTags('Catalog (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog/admin/items')
export class CatalogAdminController {
  constructor(private readonly svc: CatalogAdminService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  create(@Req() req: Express.Request, @Body() dto: CreateCatalogItemDto) {
    return this.svc.createItem(req.tenantId!, dto);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  list(@Req() req: Express.Request, @Query() q: QueryItemsDto) {
    return this.svc.listItems(req.tenantId!, q);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  get(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.getItem(req.tenantId!, id);
  }

  @Put(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  update(@Req() req: Express.Request, @Param('id') id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.svc.updateItem(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GESTOR')
  remove(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.removeItem(req.tenantId!, id);
  }
}
