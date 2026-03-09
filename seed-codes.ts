import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateAccessCode() {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.student.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
}

async function main() {
  const withoutCode = await prisma.student.findMany({
    where: { accessCode: null },
    select: { id: true },
  });

  console.log(`Found ${withoutCode.length} students without an access code.`);

  for (const student of withoutCode) {
    const code = await generateAccessCode();
    await prisma.student.update({
      where: { id: student.id },
      data: { accessCode: code },
    });
  }

  console.log(`Generated access codes for ${withoutCode.length} students.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
