export {};

declare global {
  namespace Express {
    interface Request {
      id?: string;
      tenantId?: string;
      user?: {
        sub?: string;
        email?: string;
        role?: string;
        tenantId?: string;
        tid?: string;
        [k: string]: unknown;
      };
    }
  }
}
