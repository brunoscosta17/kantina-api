import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing Bearer token');
    const token = auth.slice(7);

    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      if (!req.tenantId || payload.tid !== req.tenantId) {
        throw new UnauthorizedException('Tenant mismatch');
      }
      req.user = payload; // { sub, tid, role }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
