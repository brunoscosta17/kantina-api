import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.create({ data: { name: 'Escola Demo' } });
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: { tenantId: tenant.id, email: 'admin@demo.com', password, role: 'ADMIN' },
  });

  const [cat1, cat2] = await prisma.$transaction([
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Almoço', sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Bebidas', sortOrder: 2 } }),
  ]);

  await prisma.catalogItem.createMany({
    data: [
      { tenantId: tenant.id, categoryId: cat1.id, name: 'Prato do dia', priceCents: 1800 },
      { tenantId: tenant.id, categoryId: cat2.id, name: 'Água 500ml', priceCents: 400 },
    ],
  });

  const student = await prisma.student.create({
    data: { tenantId: tenant.id, name: 'Giovanna M.', classroom: '6ºA' },
  });

  await prisma.wallet.create({
    data: { tenantId: tenant.id, studentId: student.id, balanceCents: 4600 },
  });

  console.log('Seed OK');
  console.log('TENANT_ID=', tenant.id);
  console.log('STUDENT_ID=', student.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
