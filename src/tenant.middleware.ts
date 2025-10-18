import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const path = req.originalUrl.split('?')[0] || '';

    const needsTenant = path.startsWith('/auth/');
    if (needsTenant) {
      const tid = (req.headers['x-tenant'] as string | undefined)?.trim();
      if (!tid) throw new BadRequestException('Missing x-tenant header');
      req.tenantId = tid; // <- isso vai compilar após a augmentation correta no .d.ts
    }

    next();
  }
}
