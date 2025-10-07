import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const raw = req.headers['x-tenant'];
    if (!raw || Array.isArray(raw)) {
      throw new BadRequestException('Missing x-tenant header');
    }
    // anexa o tenantId para uso nos controllers/services
    (req as any).tenantId = raw;
    next();
  }
}
