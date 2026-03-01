import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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

      // Cria usuários de teste com diferentes roles
      const testPassword = await bcrypt.hash('demo123', 10);
      await this.prisma.user.createMany({
        data: [
          {
            tenantId: tenant.id,
            email: 'gestor@demo.com',
            password: testPassword,
            role: 'GESTOR',
          },
          {
            tenantId: tenant.id,
            email: 'operador@demo.com',
            password: testPassword,
            role: 'OPERADOR',
          },
          {
            tenantId: tenant.id,
            email: 'responsavel@demo.com',
            password: testPassword,
            role: 'RESPONSAVEL',
          },
          {
            tenantId: tenant.id,
            email: 'aluno@demo.com',
            password: testPassword,
            role: 'ALUNO',
          },
        ],
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
        },        testUsers: [
          { email: 'gestor@demo.com', password: 'demo123', role: 'GESTOR' },
          { email: 'operador@demo.com', password: 'demo123', role: 'OPERADOR' },
          { email: 'responsavel@demo.com', password: 'demo123', role: 'RESPONSAVEL' },
          { email: 'aluno@demo.com', password: 'demo123', role: 'ALUNO' },
        ],        message: 'Demo data created successfully! Use the school code above to login.',
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
      const createdUsers: Array<{
        email: string;
        role: string;
        name: string;
        password: string;
      }> = [];

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

  // ===== FLAT CONTROLLER PATTERN FOR VERCEL =====
  // Auth endpoints
  @Post('auth-login')
  async authLogin(
    @Headers('x-tenant') tenantCode: string,
    @Body() body: { email: string; password: string },
  ) {
    return this._performLogin(tenantCode, body);
  }

  @Post('auth-refresh')
  async authRefresh(
    @Headers('x-tenant') tenantCode: string,
    @Body() body: { refreshToken: string },
  ) {
    try {
      if (!tenantCode) {
        return {
          statusCode: 400,
          message: 'Missing x-tenant header',
          error: 'Bad Request',
        };
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { code: tenantCode },
      });

      if (!tenant) {
        return {
          statusCode: 401,
          message: 'Invalid tenant code',
          error: 'Unauthorized',
        };
      }

      // Verify refresh token
      try {
        const decoded = jwt.verify(body.refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;

        const user = await this.prisma.user.findUnique({
          where: { id: decoded.sub },
        });

        if (!user || user.tenantId !== tenant.id) {
          return {
            statusCode: 401,
            message: 'Invalid refresh token',
            error: 'Unauthorized',
          };
        }

        // Generate new tokens
        const payload = {
          sub: user.id,
          tid: tenant.id,
          role: user.role,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
          expiresIn: '15m',
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
          expiresIn: '7d',
        });

        return {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: 900,
          role: user.role,
        };
      } catch {
        return {
          statusCode: 401,
          message: 'Invalid refresh token',
          error: 'Unauthorized',
        };
      }
    } catch (error: any) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  @Get('catalog-items')
  async catalogItems(
    @Headers('x-tenant') tenantCode: string,
  ) {
    try {
      if (!tenantCode) {
        return {
          statusCode: 400,
          message: 'Missing x-tenant header',
          error: 'Bad Request',
        };
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { code: tenantCode },
      });

      if (!tenant) {
        return {
          statusCode: 404,
          message: 'Tenant not found',
          error: 'Not Found',
        };
      }

      const items = await this.prisma.catalogItem.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        include: {
          category: true,
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { name: 'asc' },
        ],
      });

      return items;
    } catch (error: any) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  @Get('catalog-categories')
  async catalogCategories(
    @Headers('x-tenant') tenantCode: string,
  ) {
    try {
      if (!tenantCode) {
        return {
          statusCode: 400,
          message: 'Missing x-tenant header',
          error: 'Bad Request',
        };
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { code: tenantCode },
      });

      if (!tenant) {
        return {
          statusCode: 404,
          message: 'Tenant not found',
          error: 'Not Found',
        };
      }

      const categories = await this.prisma.category.findMany({
        where: {
          tenantId: tenant.id,
        },
        orderBy: { sortOrder: 'asc' },
      });

      return categories;
    } catch (error: any) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  // Endpoint de login direto para compatibilidade com Vercel
  @Post('login')
  async login(
    @Headers('x-tenant') tenantCode: string,
    @Body() body: { email: string; password: string },
  ) {
    return this._performLogin(tenantCode, body);
  }

  private async _performLogin(
    tenantCode: string,
    body: { email: string; password: string },
  ) {
    try {
      if (!tenantCode) {
        return {
          statusCode: 400,
          message: 'Missing x-tenant header',
          error: 'Bad Request',
        };
      }

      // Busca o tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { code: tenantCode },
      });

      if (!tenant) {
        return {
          statusCode: 401,
          message: 'Invalid tenant code',
          error: 'Unauthorized',
        };
      }

      // Busca o usuário
      const user = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: body.email,
          },
        },
      });

      if (!user) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        };
      }

      // Verifica senha
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        };
      }

      // Gera token JWT
      const payload = {
        sub: user.id,
        tid: tenant.id,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: '15m',
      });

      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
        expiresIn: '7d',
      });

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        role: user.role,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  // Endpoint de teste para login direto (para teste no mobile)
  @Post('test-login')
  async testLogin(
    @Headers('x-tenant') tenantCode: string,
    @Body() body: { email: string; password: string },
  ) {
    try {
      if (!tenantCode) {
        return {
          success: false,
          error: 'Missing x-tenant header',
        };
      }

      // Busca o tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { code: tenantCode },
      });

      if (!tenant) {
        return {
          success: false,
          error: 'Tenant not found',
        };
      }

      // Busca o usuário
      const user = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: body.email,
          },
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verifica senha
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        return {
          success: false,
          error: 'Invalid password',
        };
      }

      // Gera token JWT
      const payload = {
        sub: user.id,
        tid: tenant.id,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: '15m',
      });

      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
        expiresIn: '7d',
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        role: user.role,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
