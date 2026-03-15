import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/core/modules/db/schema.ts',
  out: './src/core/migrations',
  dialect: 'sqlite',
});
