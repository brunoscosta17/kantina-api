import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

// Payload esperado no JWT
interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  tid: string; // tenantId
  [k: string]: unknown;
}

// Request com as props augmentadas
type AuthedRequest = Request & {
  user?: JwtPayload;
  tenantId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();

    const auth = req.headers['authorization'];
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.slice('Bearer '.length);

    let payload: JwtPayload;
    try {
      // Tipamos o retorno do verify para evitar `any`
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // Fonte de verdade: tid do JWT
    req.user = payload;
    req.tenantId = payload.tid;

    // (Opcional) Se o cliente enviar x-tenant e divergir do tid -> recusar
    const headerTid =
      typeof req.headers['x-tenant'] === 'string' ? req.headers['x-tenant'].trim() : undefined;

    if (headerTid && headerTid !== req.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    return true;
  }
}
