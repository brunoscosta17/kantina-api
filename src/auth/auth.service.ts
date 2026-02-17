import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import ms from 'ms';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService, // access token
  ) {}

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
      secret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
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

  async register(email: string, password: string, tenantId: string) {
    const exists = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (exists) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { tenantId, email, password: hash, role: 'GESTOR' },
      select: { id: true, email: true, role: true },
    });

    // se você quiser que register já devolva tokens, troque o return abaixo por issueTokens(...)
    return user;
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
}
