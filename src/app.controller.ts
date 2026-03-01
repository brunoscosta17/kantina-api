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

  // Endpoint para criar usuários de teste com diferentes perfis
  @Post('create-test-users')
  async createTestUsers() {
    try {
      // Busca o primeiro tenant disponível (ou você pode passar o código como parâmetro)
      const tenant = await this.prisma.tenant.findFirst();

      if (!tenant) {
        return {
          success: false,
          error: 'No tenant found. Create a tenant first using /create-demo-data',
        };
      }

      const testUsers = [
        {
          email: 'gestor@demo.com',
          role: 'GESTOR',
          name: 'João Gestor',
        },
        {
          email: 'operador@demo.com',
          role: 'OPERADOR',
          name: 'Maria Operadora',
        },
        {
          email: 'responsavel@demo.com',
          role: 'RESPONSAVEL',
          name: 'Carlos Responsável',
        },
        {
          email: 'aluno@demo.com',
          role: 'ALUNO',
          name: 'Ana Aluna',
        },
      ];

      const password = await bcrypt.hash('demo123', 10);
      const createdUsers = [];

      for (const userData of testUsers) {
        // Verifica se o usuário já existe
        const existingUser = await this.prisma.user.findFirst({
          where: {
            tenantId: tenant.id,
            email: userData.email,
          },
        });

        if (!existingUser) {
          const user = await this.prisma.user.create({
            data: {
              tenantId: tenant.id,
              email: userData.email,
              password,
              role: userData.role as any,
              isActive: true,
            },
          });

          createdUsers.push({
            email: userData.email,
            role: userData.role,
            name: userData.name,
            password: 'demo123',
          });
        }
      }

      return {
        success: true,
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
        },
        users: createdUsers,
        message: `Created ${createdUsers.length} test users. Use tenant code ${tenant.code} to login with any of the users above.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
