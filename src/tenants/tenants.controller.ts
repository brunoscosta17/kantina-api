import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResolveTenantDto } from './dto/resolve-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('resolve')
  resolve(@Query() q: ResolveTenantDto) {
    return this.tenantsService.resolveByCode(q.code);
  }

  @Get(':tenantId')
  async getTenant(@Param('tenantId') tenantId: string) {
    return this.tenantsService.getById(tenantId);
  }

  @Patch(':tenantId/pix-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePixConfig(@Param('tenantId') tenantId: string, @Body() body: any) {
    return this.tenantsService.updatePixConfig(tenantId, body);
  }
}
