import { migrate as migratePostgres } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migrateSQLite } from 'drizzle-orm/bun-sqlite/migrator';
import { Pool } from 'pg';
import { Database } from 'bun:sqlite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSQLite } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl?.startsWith('postgresql');

async function runMigrations() {
  console.log('Running migrations...');

  if (isPostgres) {
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzlePostgres(pool, { schema });
    await migratePostgres(db, { migrationsFolder: './drizzle' });
    await pool.end();
  } else {
    const sqlitePath = databaseUrl || './data/devworkflow.db';
    const sqlite = new Database(sqlitePath);
    const db = drizzleSQLite(sqlite, { schema });
    migrateSQLite(db, { migrationsFolder: './drizzle' });
    sqlite.close();
  }

  console.log('Migrations completed successfully.');
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});