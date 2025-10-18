import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCatalogItemDto } from './dto/create-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateCatalogItemDto } from './dto/update-item.dto';

@Injectable()
export class CatalogAdminService {
  constructor(private prisma: PrismaService) {}

  async createItem(tenantId: string, dto: CreateCatalogItemDto) {
    // valida categoria do mesmo tenant
    const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, tenantId } });
    if (!cat) throw new BadRequestException('Invalid category');

    return this.prisma.catalogItem.create({
      data: {
        tenantId,
        categoryId: dto.categoryId,
        name: dto.name,
        priceCents: dto.priceCents,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listItems(tenantId: string, q: QueryItemsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // ✅ tipagem explícita elimina o `any`
    const where: Prisma.CatalogItemWhereInput = { tenantId };
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.active === 'true') where.isActive = true;
    if (q.active === 'false') where.isActive = false;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.catalogItem.count({ where }),
      this.prisma.catalogItem.findMany({
        where,
        include: { category: true },
        // (se quiser tipar também): as Prisma.CatalogItemOrderByWithRelationInput[]
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip,
        take: pageSize,
      }),
    ]);

    return { data: rows, page, pageSize, total, hasNext: page * pageSize < total };
  }

  async getItem(tenantId: string, id: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async updateItem(tenantId: string, id: string, dto: UpdateCatalogItemDto) {
    await this.ensureItem(tenantId, id);

    // ✅ “narrowing” evita que o ESLint veja `dto` como `any` ao acessar props
    const { categoryId, name, priceCents, imageUrl, isActive } = dto;

    if (categoryId) {
      const sameTenantCat = await this.prisma.category.findFirst({
        where: { id: categoryId, tenantId },
      });
      if (!sameTenantCat) throw new BadRequestException('Invalid category');
    }

    return this.prisma.catalogItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        priceCents,
        imageUrl: imageUrl ?? null,
        isActive,
      },
    });
  }

  async removeItem(tenantId: string, id: string) {
    await this.ensureItem(tenantId, id);
    await this.prisma.catalogItem.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureItem(tenantId: string, id: string) {
    const exists = await this.prisma.catalogItem.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Item not found');
  }
}
