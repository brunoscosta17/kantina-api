import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, code: true }
    });
    console.log('--- TENANTS IN DB ---');
    console.log(JSON.stringify(tenants, null, 2));
    console.log('---------------------');
  } catch (err) {
    console.error('Error querying tenants:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
