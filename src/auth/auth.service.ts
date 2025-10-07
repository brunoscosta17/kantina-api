import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email },
      select: { id: true, password: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, tid: tenantId, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, tokenType: 'Bearer', expiresIn: 900 };
  }

  async register(email: string, password: string, tenantId: string) {
    const exists = await this.prisma.user.findFirst({ where: { tenantId, email } });
    if (exists) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { tenantId, email, password: hash, role: 'GESTOR' },
      select: { id: true, email: true, role: true },
    });
    return user;
  }
}
