declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: {
        sub: string;
        tid: string;
        role: 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'RESPONSAVEL';
        iat?: number;
        exp?: number;
      };
    }
  }
}
export {};
