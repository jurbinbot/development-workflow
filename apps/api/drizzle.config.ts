import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: process.env.DATABASE_URL?.startsWith('postgresql') ? 'postgresql' : 'sqlite',
  dbCredentials: process.env.DATABASE_URL?.startsWith('postgresql')
    ? { url: process.env.DATABASE_URL }
    : { url: process.env.DATABASE_URL || './data/devworkflow.db' },
});