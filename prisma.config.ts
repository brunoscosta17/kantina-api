import { defineConfig } from '@prisma/config';
export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  seeds: { type: 'ts-node', files: [] },
});
