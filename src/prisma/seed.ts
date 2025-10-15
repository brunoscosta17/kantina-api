import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { name: 'Escola Demo' },
    update: {},
    create: { name: 'Escola Demo' },
  });
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: { password },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      password,
      role: Role.ADMIN,
    },
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
