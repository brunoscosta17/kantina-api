import { Controller, Post } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma.service';

@Controller('tests')
export class TestsController {
  constructor(private prisma: PrismaService) {}

  @Post('seed-demo')
  async seedDemo() {
    // 1) Cria tenant
    const tenantId = uuid();
    const tenant = await this.prisma.tenant.create({
      data: { id: tenantId, name: 'Demo Tenant ' + tenantId.slice(0, 8) },
    });

    // 2) Cria admin
    const email = 'admin@demo.com';
    const raw = 'admin123';
    const password = await bcrypt.hash(raw, 10);

    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password,
        role: 'ADMIN',
      },
    });

    // 3) Retorna credenciais
    return {
      tenantId: tenant.id,
      email,
      password: raw,
      note: 'Endpoint temporário para testes. Remover/Proteger em prod.',
    };
  }
}
