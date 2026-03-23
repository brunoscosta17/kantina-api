import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(data: { name: string; adminEmail: string; adminPassword: string }) {
    // 1. Verificar se usuário já existe globalmente (ou por tenant se preferir)
    const existingUser = await this.prisma.user.findFirst({ where: { email: data.adminEmail } });
    if (existingUser) throw new BadRequestException('Email já cadastrado');

    // 2. Criar Tenant com código aleatório de 6 dígitos
    const tenantCode = Math.floor(100000 + Math.random() * 900000).toString();

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          code: tenantCode,
        },
      });

      // 3. Criar Usuário Admin
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      // 4. Criar Categorias Iniciais (exemplo)
      const catLanches = await tx.category.create({
        data: {
          tenantId: tenant.id,
          name: 'Lanches',
          sortOrder: 1,
        },
      });

      const catBebidas = await tx.category.create({
        data: {
          tenantId: tenant.id,
          name: 'Bebidas',
          sortOrder: 2,
        },
      });

      // 5. Criar Itens de Exemplo
      await tx.catalogItem.create({
        data: {
          tenantId: tenant.id,
          categoryId: catLanches.id,
          name: 'Pão de Queijo',
          priceCents: 500,
        },
      });

      await tx.catalogItem.create({
        data: {
          tenantId: tenant.id,
          categoryId: catBebidas.id,
          name: 'Suco de Laranja',
          priceCents: 700,
        },
      });

      return {
        tenantId: tenant.id,
        tenantCode: tenant.code,
        adminId: admin.id,
      };
    });
  }
}
