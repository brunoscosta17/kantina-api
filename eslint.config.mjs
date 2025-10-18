import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'test/**',
      '**/*.spec.ts',
      'eslint.config.*',
      'prisma/**',
      'docker/**',
      '.vercel/**',
      'api/**',
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
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',

      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  {
    files: ['src/prisma/seed.demo.ts'],
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
];
