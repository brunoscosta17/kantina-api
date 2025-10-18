import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
}
