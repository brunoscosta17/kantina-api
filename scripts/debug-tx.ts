import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Ultimas transacoes PIX ---');
  const txs = await prisma.walletTransaction.findMany({
    where: { type: 'PIX' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      wallet: {
        include: { student: true }
      }
    }
  });

  for (const tx of txs) {
    console.log(`[${tx.createdAt.toISOString()}] TxId: ${tx.id} | ReqId: ${tx.requestId} | Status: ${(tx.meta as any)?.status} | Aluno: ${tx.wallet.student.name} | Amount: ${tx.amountCents}`);
  }

  console.log('\n--- Ultimas notificacoes ---');
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });

  for (const n of notifs) {
    console.log(`[${n.createdAt.toISOString()}] User: ${n.userId ? n.user?.email : 'Role: '+n.role} | Title: ${n.title} | Body: ${n.body}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
