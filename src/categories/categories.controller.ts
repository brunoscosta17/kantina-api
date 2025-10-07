import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  create(@Req() req: Express.Request, @Body() dto: CreateCategoryDto) {
    return this.svc.create(req.tenantId!, dto);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  list(@Req() req: Express.Request) {
    return this.svc.list(req.tenantId!);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  get(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.get(req.tenantId!, id);
  }

  @Put(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  update(@Req() req: Express.Request, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.svc.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GESTOR')
  remove(@Req() req: Express.Request, @Param('id') id: string) {
    return this.svc.remove(req.tenantId!, id);
  }
}
