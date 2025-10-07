import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  @Get()
  list(@Req() req: any, @Query('categoryId') categoryId?: string) {
    return this.svc.list(req.tenantId, categoryId);
  }
}
