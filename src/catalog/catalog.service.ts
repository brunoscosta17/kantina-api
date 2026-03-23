import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string, categoryId?: string) {
    return this.prisma.catalogItem.findMany({
      where: { tenantId, ...(categoryId ? { categoryId } : {}) },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  // CATEGORIES
  listCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createCategory(tenantId: string, data: any) {
    return this.prisma.category.create({
      data: { ...data, tenantId },
    });
  }

  updateCategory(tenantId: string, id: string, data: any) {
    return this.prisma.category.update({
      where: { id, tenantId },
      data,
    });
  }

  deleteCategory(tenantId: string, id: string) {
    return this.prisma.category.delete({
      where: { id, tenantId },
    });
  }

  // ITEMS
  createItem(tenantId: string, data: any) {
    return this.prisma.catalogItem.create({
      data: { ...data, tenantId },
    });
  }

  updateItem(tenantId: string, id: string, data: any) {
    return this.prisma.catalogItem.update({
      where: { id, tenantId },
      data,
    });
  }

  deleteItem(tenantId: string, id: string) {
    return this.prisma.catalogItem.delete({
      where: { id, tenantId },
    });
  }
}
