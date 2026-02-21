import { BadRequestException, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from './prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private isTenantCode(value: string): boolean {
    return /^(\d{6}|\d{8})$/.test(value);
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const path = req.originalUrl.split('?')[0] || '';
    const needsTenant = path.startsWith('/auth/');

    if (!needsTenant) return next();

    const raw = (req.headers['x-tenant'] as string | undefined)?.trim();
    if (!raw) throw new BadRequestException('Missing x-tenant header');

    const isCode = this.isTenantCode(raw);
    const isId = this.isUuid(raw);

    if (!isCode && !isId) {
      throw new BadRequestException(
        'Invalid x-tenant header. Use tenant code (6 or 8 digits) or tenant UUID.',
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: isCode ? { code: raw } : { id: raw },
      select: { id: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    req.tenantId = tenant.id;

    return next();
  }
}
