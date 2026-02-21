import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, PrismaService],
})
export class TenantsModule {}
