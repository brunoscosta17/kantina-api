import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint para criar dados demo na produção
  @Post('create-demo-data')
  async createDemoData() {
    try {
      // Gera código único de 6 dígitos
      const genTenantCode6Digits = (): string => {
        return Math.floor(Math.random() * 1_000_000)
          .toString()
          .padStart(6, '0');
      };

      let code = genTenantCode6Digits();

      // Tenta criar tenant com código único
      let tenant: any = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          tenant = await this.prisma.tenant.create({
            data: {
              name: 'Demo School',
              code: code,
            },
          });
          break;
        } catch (e: any) {
          if (e?.code === 'P2002') {
            code = genTenantCode6Digits();
            continue;
          }
          throw e;
        }
      }

      if (!tenant) {
        throw new Error('Could not create unique tenant code');
      }

      // Cria usuário admin
      const password = await bcrypt.hash('admin123', 10);
      await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@demo.com',
          password: password,
          role: 'ADMIN',
        },
      });

      // Cria categorias básicas
      const categoryAlmoco = await this.prisma.category.create({
        data: { tenantId: tenant.id, name: 'Almoço', sortOrder: 1 },
      });

      const categoryBebidas = await this.prisma.category.create({
        data: { tenantId: tenant.id, name: 'Bebidas', sortOrder: 2 },
      });

      // Cria itens básicos
      await this.prisma.catalogItem.createMany({
        data: [
          {
            tenantId: tenant.id,
            categoryId: categoryAlmoco.id,
            name: 'Prato do dia',
            priceCents: 2000,
            isActive: true,
          },
          {
            tenantId: tenant.id,
            categoryId: categoryBebidas.id,
            name: 'Água 500ml',
            priceCents: 400,
            isActive: true,
          },
        ],
      });

      return {
        success: true,
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
        },
        login: {
          email: 'admin@demo.com',
          password: 'admin123',
        },
        message: 'Demo data created successfully! Use the school code above to login.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
