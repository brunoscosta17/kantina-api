import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async resolveByCode(code: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { code },
      select: { id: true, name: true, code: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return { tenantId: tenant.id, name: tenant.name, code: tenant.code };
  }
}
