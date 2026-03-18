import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSQLite } from 'drizzle-orm/bun-sqlite';
import { Pool } from 'pg';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl?.startsWith('postgresql');

let db: ReturnType<typeof drizzlePostgres> | ReturnType<typeof drizzleSQLite>;

if (isPostgres) {
  const pool = new Pool({ connectionString: databaseUrl });
  db = drizzlePostgres(pool, { schema });
} else {
  const sqlitePath = databaseUrl || './data/devworkflow.db';
  const sqlite = new Database(sqlitePath);
  db = drizzleSQLite(sqlite, { schema });
}

export { db };
export * from './schema';