import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async health() {
    await this.prisma.$queryRawUnsafe('SELECT 1'); // ping DB
    return { ok: true, ts: new Date().toISOString() };
  }
}
