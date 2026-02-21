import { Controller, Get, Query } from '@nestjs/common';
import { ResolveTenantDto } from './dto/resolve-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('resolve')
  resolve(@Query() q: ResolveTenantDto) {
    return this.tenantsService.resolveByCode(q.code);
  }
}
