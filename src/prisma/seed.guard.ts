export function assertSeedIsAllowed(mode: 'default' | 'demo') {
  const url = process.env.DATABASE_URL ?? '';
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  // 1) Bloqueia seed em produção por padrão
  if (nodeEnv === 'production' && process.env.ALLOW_SEED_PROD !== 'YES') {
    throw new Error(
      'Seed bloqueado em NODE_ENV=production. Para permitir, defina ALLOW_SEED_PROD=YES explicitamente.',
    );
  }

  // 2) Bloqueia seed se DATABASE_URL estiver vazio
  if (!url) throw new Error('DATABASE_URL não definido.');

  // 3) Se quiser ser ainda mais “paranoico”, bloqueie se tiver cara de PROD
  // (ex.: forçar confirmação extra quando for neon)
  const isNeon = url.includes('neon.tech');
  if (isNeon && process.env.CONFIRM_NEON_SEED !== 'YES') {
    throw new Error(
      'Seed em Neon bloqueado por segurança. Para permitir, defina CONFIRM_NEON_SEED=YES.',
    );
  }

  // 4) Permite diferenciar seed mode
  if (mode === 'demo' && process.env.SEED_MODE !== 'DEMO') {
    throw new Error('Seed demo bloqueado. Para rodar, defina SEED_MODE=DEMO.');
  }
}
