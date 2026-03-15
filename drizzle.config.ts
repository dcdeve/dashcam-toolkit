import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/core/modules/db/schema.ts',
  out: './resources/migrations',
  dialect: 'sqlite',
});
