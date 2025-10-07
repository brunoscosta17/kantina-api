declare namespace Express {
  interface UserPayload {
    sub: string;
    tid: string;
    role: 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'RESPONSAVEL';
    [k: string]: any;
  }

  interface Request {
    tenantId?: string;
    user?: UserPayload;
  }
}
