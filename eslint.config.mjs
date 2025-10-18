import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'test/**',
      '**/*.spec.ts',
      // ⬇️ ignore arquivos de config/infra
      'eslint.config.*',
      'prisma/**',
      'docker/**',
      '.vercel/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.build.json'],
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // já tinha
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',

      // ⬇️ desligue o ruído com "any" em pontos pragmáticos (Nest/Express)
      '@typescript-eslint/no-explicit-any': 'off',

      // mantém o ajuste para handlers express
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // ⬇️ override pontual para a seed demo (onde há um forEach/async ou similar)
  {
    files: ['src/prisma/seed.demo.ts'],
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
];
