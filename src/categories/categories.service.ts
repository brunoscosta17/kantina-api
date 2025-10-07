import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCategoryDto) {
    // unique por (tenantId, name)
    return this.prisma.category.create({
      data: { tenantId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async list(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async get(tenantId: string, id: string) {
    const c = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(tenantId, id);
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async remove(tenantId: string, id: string) {
    // Impedir delete se tiver itens no catálogo
    const hasItems = await this.prisma.catalogItem.findFirst({
      where: { tenantId, categoryId: id },
    });
    if (hasItems) throw new BadRequestException('Cannot delete category with items');
    await this.ensureExists(tenantId, id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(tenantId: string, id: string) {
    const exists = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException('Category not found');
  }
}
