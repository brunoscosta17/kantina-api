import 'express-serve-static-core';

declare global {
  namespace Express {
    interface UserPayload {
      sub: string;
      tid: string;
      role: 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'RESPONSAVEL';
      [k: string]: unknown;
    }

    interface Request {
      id: string;
      tenantId?: string;
      user?: UserPayload;
    }
  }
}

export {};
