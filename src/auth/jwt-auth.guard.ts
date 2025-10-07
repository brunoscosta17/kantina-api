import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.substring('Bearer '.length);
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // Fonte de verdade: tid do JWT
    req.user = payload;
    req.tenantId = payload.tid;

    // (Opcional) Se o cliente enviar x-tenant e divergir do tid -> recusar
    const headerTid = (req.headers['x-tenant'] as string | undefined)?.trim();
    if (headerTid && headerTid !== req.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }
    return true;
  }
}
