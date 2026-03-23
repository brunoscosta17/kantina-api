import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import ms from 'ms';
import { PrismaService } from '../prisma.service';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService, // access token
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private sha256(token: string) {
    if (!token) throw new BadRequestException('refreshToken is required');
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiresAt() {
    const expr = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    return new Date(Date.now() + ms(expr));
  }

  private async issueTokens(params: { userId: string; tenantId: string; role: string }) {
    const payload = { sub: params.userId, tid: params.tenantId, role: params.role };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '900s',
    });

    // refresh token opaco
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.sha256(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: params.userId,
        tenantId: params.tenantId,
        expiresAt: this.refreshExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 min (mantém compatível com seu retorno atual)
      role: params.role,
    };
  }

  async login(email: string, password: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email },
      select: { id: true, password: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens({ userId: user.id, tenantId, role: user.role });
  }

  async studentLogin(accessCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { accessCode },
      select: { id: true, tenantId: true },
    });

    if (!student) throw new UnauthorizedException('Código de acesso inválido');

    return this.issueTokens({
      userId: student.id,
      tenantId: student.tenantId,
      role: 'ALUNO',
    });
  }

  async register(email: string, password: string, tenantId: string) {
    const exists = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (exists) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { tenantId, email, password: hash, role: 'RESPONSAVEL' },
      select: { id: true, email: true, role: true },
    });

    // se você quiser que register já devolva tokens, troque o return abaixo por issueTokens(...)
    return user;
  }

  async forgotPassword(email: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (!user) {
      // Retornar sucesso genérico por segurança (não vazar quais e-mails existem)
      return { ok: true, message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetLink = `https://kantina.app.br/reset-password?token=${resetToken}&tid=${tenantId}`;

    // Envio real via Resend
    try {
      await this.resend.emails.send({
        from: 'Kantina <noreply@kantina.app.br>',
        to: [email],
        subject: 'Recuperação de Senha — Kantina',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha no Kantina.</p>
            <p>Clique no botão abaixo para prosseguir:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #80B990; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Link direto: ${resetLink}</p>
          </div>
        `
      });
      console.log(`[EMAIL] Link enviado para ${email}`);
    } catch (err) {
      console.error('Erro ao enviar e-mail de recuperação:', err);
    }

    return { ok: true, message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
  }

  async refresh(tenantId: string, refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('refreshToken is required');
    const tokenHash = this.sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { role: true, isActive: true } } },
    });

    if (!stored || stored.revokedAt) throw new UnauthorizedException('Invalid refresh token');
    if (stored.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException('Expired refresh token');
    if (stored.tenantId !== tenantId) throw new UnauthorizedException('Tenant mismatch');
    if (!stored.user.isActive) throw new UnauthorizedException('User inactive');

    // rotação: revoga o atual
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      userId: stored.userId,
      tenantId: stored.tenantId,
      role: stored.user.role,
    });
  }

  async logout(tenantId: string, refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('refreshToken is required');
    const tokenHash = this.sha256(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }

  async getAlunosDoResponsavel(responsavelId: string) {
    return this.prisma.studentOnResponsavel.findMany({
      where: { responsavelId },
      include: {
        student: {
          include: {
            Wallet: true,
            tenant: true,
          },
        },
      },
    }).then(list => list.map(l => {
      const s = l.student;
      return {
        id: s.id,
        name: s.name,
        classroom: s.classroom,
        accessCode: s.accessCode,
        tenant: s.tenant ? { name: s.tenant.name, id: s.tenant.id } : undefined,
        wallet: s.Wallet ? { balanceCents: s.Wallet.balanceCents, id: s.Wallet.id } : undefined,
      };
    }));
  }
  async getWalletsOfResponsible(responsavelId: string) {
    // Busca os alunos vinculados a esse responsável, com info de tenant
    const alunos = await this.prisma.studentOnResponsavel.findMany({
      where: { responsavelId },
      include: {
        student: {
          include: {
            tenant: true,
          },
        },
      },
    });

    const studentIds = alunos.map((a) => a.student.id);

    if (studentIds.length === 0) {
      return [];
    }

    // Busca as carteiras e já inclui o histórico recente de transações
    const wallets = await this.prisma.wallet.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // Adiciona tenant (escola) ao objeto student de cada wallet e formata as transações
    return wallets.map((w) => {
      const aluno = alunos.find((a) => a.student.id === w.studentId)?.student;

      const transactions = w.transactions
        .filter((t) => {
          if (t.type === 'PIX') {
            const meta = t.meta as any;
            return meta?.status === 'paid' || meta?.status === 'approved';
          }
          return true;
        })
        .map((t) => {
          const isCredit = t.type === 'TOPUP' || t.type === 'PIX' || t.type === 'REFUND';
        let label = t.type;
        if (t.type === 'TOPUP') label = 'Recarga manual';
        else if (t.type === 'PIX') label = 'Recarga Pix';
        else if (t.type === 'DEBIT') label = 'Débito de consumo';
        else if (t.type === 'REFUND') label = 'Estorno';

        return {
          id: t.id,
          type: t.type,
          label,
          direction: isCredit ? 'CREDIT' : 'DEBIT',
          amountCents: t.amountCents,
          createdAt: t.createdAt,
          requestId: t.requestId,
          meta: t.meta ?? undefined,
        };
      });

      return {
        id: w.id,
        tenantId: w.tenantId,
        studentId: w.studentId,
        balanceCents: w.balanceCents,
        student: {
          ...w.student,
          tenant: aluno?.tenant ? { name: aluno.tenant.name, id: aluno.tenant.id } : undefined,
        },
        transactions,
      };
    });
  }
}
