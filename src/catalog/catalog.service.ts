import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string, categoryId?: string) {
    return this.prisma.catalogItem.findMany({
      where: { tenantId, isActive: true, ...(categoryId ? { categoryId } : {}) },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }
}
