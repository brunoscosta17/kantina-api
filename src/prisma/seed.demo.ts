import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { assertSeedIsAllowed } from './seed.guard';

assertSeedIsAllowed('demo');

const prisma = new PrismaClient();

function genTenantCode6Digits(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
}

async function upsertTenantWithNumericCode(params: { id: string; name: string }) {
  const existing = await prisma.tenant.findUnique({ where: { id: params.id } });

  // Se já existe: garante que fica válido (6 dígitos numéricos)
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

  // Se não existe: cria tentando até não colidir no @unique
  for (let attempt = 0; attempt < 30; attempt++) {
    const code = genTenantCode6Digits();

    try {
      return await prisma.tenant.create({
        data: { id: params.id, name: params.name, code },
      });
    } catch (e: any) {
      // P2002 = violou unique (provavelmente Tenant.code)
      if (e?.code === 'P2002') continue;
      throw e;
    }
  }

  throw new Error('Não consegui gerar um Tenant.code único após várias tentativas.');
}
async function main() {
  // 1) Cria um novo tenant de demo (ou reaproveita se já existir)
  const tenant = await upsertTenantWithNumericCode({ id: '77abd4e8-76a2-4bd7-ab93-c112886c218a', name: 'Escola Kantina Demo' });
  console.log('TENANT_CODE=', tenant.code);
  // 2) Usuários (roles variados)
  const password = await bcrypt.hash('admin123', 10);
  // Cria responsáveis
  const responsaveis = await prisma.$transaction([
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'resp1@demo.com' } },
      update: {},
      create: { tenantId: tenant.id, email: 'resp1@demo.com', password, role: 'RESPONSAVEL' },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'resp2@demo.com' } },
      update: {},
      create: { tenantId: tenant.id, email: 'resp2@demo.com', password, role: 'RESPONSAVEL' },
    }),
  ]);

  await prisma.user.createMany({
    data: [
      { tenantId: tenant.id, email: 'admin@demo.com', password, role: 'ADMIN' },
      { tenantId: tenant.id, email: 'gestor@demo.com', password, role: 'GESTOR' },
      { tenantId: tenant.id, email: 'operador@demo.com', password, role: 'OPERADOR' },
    ],
    skipDuplicates: true,
  });

  // 3) Categorias
  await prisma.orderItem.deleteMany({});
  await prisma.catalogItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.category.deleteMany({ where: { tenantId: tenant.id } });
  const cats = await prisma.$transaction([
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Almoço', sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Lanches', sortOrder: 2 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Bebidas', sortOrder: 3 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Doces', sortOrder: 4 } }),
  ]);

  // 4) Itens de catálogo
  await prisma.catalogItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        categoryId: cats[0].id,
        name: 'Prato do dia',
        priceCents: 2000,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[1].id,
        name: 'Sanduíche',
        priceCents: 1200,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[1].id,
        name: 'Coxinha',
        priceCents: 800,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[2].id,
        name: 'Água 500ml',
        priceCents: 400,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[2].id,
        name: 'Suco natural',
        priceCents: 900,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[3].id,
        name: 'Barra de cereal',
        priceCents: 500,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        categoryId: cats[3].id,
        name: 'Chocolate',
        priceCents: 700,
        isActive: false,
      }, // um inativo p/ filtro
    ],
  });

  const items = await prisma.catalogItem.findMany({ where: { tenantId: tenant.id } });

  // 5) Alunos + carteiras
  await prisma.walletTransaction.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.wallet.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.order.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.studentOnResponsavel.deleteMany({
    where: {
      student: {
        tenantId: tenant.id
      }
    }
  });
  await prisma.student.deleteMany({ where: { tenantId: tenant.id } });
  const alunos = await prisma.$transaction([
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Ana Souza', classroom: '6ºA' } }),
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Bruno Lima', classroom: '6ºB' } }),
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Carlos Nunes', classroom: '7ºA' } }),
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Duda Castro', classroom: '7ºB' } }),
  ]);

  // Vincular alunos aos responsáveis
  await prisma.studentOnResponsavel.createMany({
    data: [
      { responsavelId: responsaveis[0].id, studentId: alunos[0].id }, // resp1 -> Ana Souza
      { responsavelId: responsaveis[0].id, studentId: alunos[1].id }, // resp1 -> Bruno Lima
      { responsavelId: responsaveis[1].id, studentId: alunos[2].id }, // resp2 -> Carlos Nunes
      { responsavelId: responsaveis[1].id, studentId: alunos[3].id }, // resp2 -> Duda Castro
    ],
    skipDuplicates: true,
  });

  await prisma.wallet.createMany({
    data: [
      { tenantId: tenant.id, studentId: alunos[0].id, balanceCents: 5000 },
      { tenantId: tenant.id, studentId: alunos[1].id, balanceCents: 1500 },
      { tenantId: tenant.id, studentId: alunos[2].id, balanceCents: 800 },
      { tenantId: tenant.id, studentId: alunos[3].id, balanceCents: 3000 },
    ],
  });

  const wallets = await prisma.wallet.findMany({ where: { tenantId: tenant.id } });

  // 6) Transações (topups e débitos)
  const now = new Date();
  function daysAgo(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  }

  const txData = [
    // TOPUPs
    {
      walletId: wallets[0].id,
      tenantId: tenant.id,
      type: 'TOPUP',
      amountCents: 3000,
      createdAt: daysAgo(7),
    },
    {
      walletId: wallets[1].id,
      tenantId: tenant.id,
      type: 'TOPUP',
      amountCents: 2000,
      createdAt: daysAgo(5),
    },
    {
      walletId: wallets[2].id,
      tenantId: tenant.id,
      type: 'TOPUP',
      amountCents: 1000,
      createdAt: daysAgo(2),
    },
    // DEBITs
    {
      walletId: wallets[0].id,
      tenantId: tenant.id,
      type: 'DEBIT',
      amountCents: 900,
      createdAt: daysAgo(6),
    },
    {
      walletId: wallets[1].id,
      tenantId: tenant.id,
      type: 'DEBIT',
      amountCents: 1600,
      createdAt: daysAgo(4),
    },
    {
      walletId: wallets[2].id,
      tenantId: tenant.id,
      type: 'DEBIT',
      amountCents: 800,
      createdAt: daysAgo(1),
    },
    // REFUND (ex.: cancelou pedido)
    {
      walletId: wallets[1].id,
      tenantId: tenant.id,
      type: 'REFUND',
      amountCents: 500,
      createdAt: daysAgo(3),
    },
  ];

  await prisma.walletTransaction.createMany({ data: txData as any });

  // 7) Pedidos (com itens)
  const paid = ['PAID', 'FULFILLED'] as const;
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  for (const st of alunos) {
    for (let i = 0; i < 5; i++) {
      const status = pick(['CREATED', ...paid, 'CANCELLED'] as const);
      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          studentId: st.id,
          status,
          createdAt: daysAgo(Math.floor(Math.random() * 10)),
        },
      });

      // 1 ou 2 itens
      const chosen = [pick(items.filter((i) => i.isActive)), pick(items.filter((i) => i.isActive))];
      const unique = [...new Set(chosen.map((x) => x?.id))].filter(Boolean);

      for (const itemId of unique) {
        const item = items.find((i) => i.id === itemId)!;
        const qty = Math.random() > 0.7 ? 2 : 1;
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            itemId: item.id,
            qty,
            unitPriceCents: item.priceCents,
          },
        });
      }
    }
  }

  const aluno = await prisma.student.upsert({
    where: {
      tenantId_name_classroom: {
        tenantId: tenant.id,
        name: 'Aluno Demo',
        classroom: '6ºA',
      },
    },
    update: {},
    create: { tenantId: tenant.id, name: 'Aluno Demo', classroom: '6ºA' },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'aluno@demo.com',
      },
    },
    update: {
      role: 'ALUNO',
      studentId: aluno.id,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'aluno@demo.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ALUNO',
      studentId: aluno.id,
    },
  });

  console.log('Seed DEMO OK');
  console.log('TENANT_ID=', tenant.id);
  console.log('Login como: admin@demo.com / admin123');
  console.log('Login como: aluno@demo.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
