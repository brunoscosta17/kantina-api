import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import express from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  @Get()
  list(@Req() req: express.Request, @Query('categoryId') categoryId?: string) {
    const tenantId = req.tenantId as string;
    return this.svc.list(tenantId, categoryId);
  }

  @Post()
  create(@Req() req: express.Request, @Body() data: any) {
    const tenantId = req.tenantId as string;
    return this.svc.createItem(tenantId, data);
  }

  @Patch(':id')
  update(@Req() req: express.Request, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.tenantId as string;
    return this.svc.updateItem(tenantId, id, data);
  }

  @Delete(':id')
  remove(@Req() req: express.Request, @Param('id') id: string) {
    const tenantId = req.tenantId as string;
    return this.svc.deleteItem(tenantId, id);
  }

  // CATEGORIES
  @Get('categories')
  @UseGuards(JwtAuthGuard)
  listCategories(@Req() req: express.Request) {
    const tenantId = req.tenantId as string;
    return this.svc.listCategories(tenantId);
  }

  @Post('categories')
  createCategory(@Req() req: express.Request, @Body() data: any) {
    const tenantId = req.tenantId as string;
    return this.svc.createCategory(tenantId, data);
  }

  @Patch('categories/:id')
  updateCategory(@Req() req: express.Request, @Param('id') id: string, @Body() data: any) {
    const tenantId = req.tenantId as string;
    return this.svc.updateCategory(tenantId, id, data);
  }

  @Delete('categories/:id')
  removeCategory(@Req() req: express.Request, @Param('id') id: string) {
    const tenantId = req.tenantId as string;
    return this.svc.deleteCategory(tenantId, id);
  }
}
