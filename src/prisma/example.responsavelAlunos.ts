// Exemplo: Listar alunos de um responsável
// src/prisma/example.responsavelAlunos.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listarAlunosDoResponsavel(responsavelId: string) {
  // Busca todos os alunos vinculados ao responsável
  const alunos = await prisma.student.findMany({
    where: {
      responsaveis: {
        some: { responsavelId },
      },
    },
  });
  return alunos;
}

// Exemplo de uso:
(async () => {
  const responsavel = await prisma.user.findFirst({ where: { role: 'RESPONSAVEL' } });
  if (!responsavel) return console.log('Nenhum responsável encontrado');
  const alunos = await listarAlunosDoResponsavel(responsavel.id);
  console.log('Alunos do responsável', responsavel.email, alunos);
  await prisma.$disconnect();
})();
