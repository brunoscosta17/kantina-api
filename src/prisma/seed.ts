import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { assertSeedIsAllowed } from './seed.guard';

assertSeedIsAllowed('default');

const prisma = new PrismaClient();
function genTenantCode6Digits(): string {
  // 0..999999 => "000000".."999999"
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
}

async function upsertTenantWithNumericCode(params: { id: string; name: string }) {
  // Se já existir, mantém id/name e garante code numérico (se estiver inválido)
  const existing = await prisma.tenant.findUnique({ where: { id: params.id } });

  if (existing) {
    const needsFix = !/^\d{6}$/.test(existing.code ?? '');
    return prisma.tenant.update({
      where: { id: params.id },
      data: {
        name: params.name,
        ...(needsFix ? { code: genTenantCode6Digits() } : {}),
      },
    });
  }

  // Se não existir, cria com code numérico e trata colisão
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = genTenantCode6Digits();
    try {
      return await prisma.tenant.create({
        data: { id: params.id, name: params.name, code },
      });
    } catch (e: any) {
      // P2002 = Unique constraint failed
      if (e?.code === 'P2002') continue;
      throw e;
    }
  }

  throw new Error('Falha ao gerar tenant code único após várias tentativas.');
}

async function main() {
  const tenant = await upsertTenantWithNumericCode({ id: 'default', name: 'default' });
  console.log('TENANT_CODE=', tenant.code);
  const password = await bcrypt.hash('admin123', 10);

  const adminEmail = 'admin@local.com';

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
    update: { password },
    create: { tenantId: tenant.id, email: adminEmail, password, role: Role.ADMIN },
  });

  const cat1 = await prisma.category.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Almoço' } },
    update: { sortOrder: 1 },
    create: { tenantId: tenant.id, name: 'Almoço', sortOrder: 1 },
  });

  const cat2 = await prisma.category.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Bebidas' } },
    update: { sortOrder: 2 },
    create: { tenantId: tenant.id, name: 'Bebidas', sortOrder: 2 },
  });

  await prisma.catalogItem.upsert({
    where: {
      tenantId_categoryId_name: { tenantId: tenant.id, categoryId: cat1.id, name: 'Prato do dia' },
    },
    update: { priceCents: 1800 },
    create: { tenantId: tenant.id, categoryId: cat1.id, name: 'Prato do dia', priceCents: 1800 },
  });

  await prisma.catalogItem.upsert({
    where: {
      tenantId_categoryId_name: { tenantId: tenant.id, categoryId: cat2.id, name: 'Água 500ml' },
    },
    update: { priceCents: 400 },
    create: { tenantId: tenant.id, categoryId: cat2.id, name: 'Água 500ml', priceCents: 400 },
  });

  const student = await prisma.student.upsert({
    where: {
      tenantId_name_classroom: { tenantId: tenant.id, name: 'Giovanna M.', classroom: '6ºA' },
    },
    update: {},
    create: { tenantId: tenant.id, name: 'Giovanna M.', classroom: '6ºA' },
  });

  await prisma.wallet.upsert({
    where: { studentId: student.id },
    update: { balanceCents: 4600 },
    create: { tenantId: tenant.id, studentId: student.id, balanceCents: 4600 },
  });

  console.log('Seed OK');
  console.log('TENANT_ID=', tenant.id);
  console.log('STUDENT_ID=', student.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
