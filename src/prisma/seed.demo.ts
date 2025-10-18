import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1) Cria um novo tenant de demo (ou reaproveita se já existir)
  const tenant = await prisma.tenant.create({
    data: { name: 'Escola Kantina Demo' },
  });

  // 2) Usuários (roles variados)
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.createMany({
    data: [
      { tenantId: tenant.id, email: 'admin@demo.com', password, role: 'ADMIN' },
      { tenantId: tenant.id, email: 'gestor@demo.com', password, role: 'GESTOR' },
      { tenantId: tenant.id, email: 'operador@demo.com', password, role: 'OPERADOR' },
      { tenantId: tenant.id, email: 'resp1@demo.com', password, role: 'RESPONSAVEL' },
      { tenantId: tenant.id, email: 'resp2@demo.com', password, role: 'RESPONSAVEL' },
    ],
    skipDuplicates: true,
  });

  // 3) Categorias
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
  const alunos = await prisma.$transaction([
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Ana Souza', classroom: '6ºA' } }),
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Bruno Lima', classroom: '6ºB' } }),
    prisma.student.create({
      data: { tenantId: tenant.id, name: 'Carlos Nunes', classroom: '7ºA' },
    }),
    prisma.student.create({ data: { tenantId: tenant.id, name: 'Duda Castro', classroom: '7ºB' } }),
  ]);

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

  console.log('Seed DEMO OK');
  console.log('TENANT_ID=', tenant.id);
  console.log('Login como: admin@demo.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
