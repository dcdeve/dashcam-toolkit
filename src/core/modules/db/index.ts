import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';
import { seedBuiltinPatterns } from './seed.js';
import type { DatabaseConfig, DbModule, MigrationResult, DbError } from '../../../interfaces/db.js';

export class DbModuleError extends Error {
  constructor(
    public readonly code: DbError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'DbModuleError';
    if (cause) this.cause = cause;
  }
}

interface DbState {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
}

let state: DbState | null = null;

function getState(): DbState {
  if (!state) {
    throw new DbModuleError('DB_CONNECTION_FAILED', 'Database not connected');
  }
  return state;
}

const migrationsFolder = new URL('../../migrations', import.meta.url).pathname;

export const db: DbModule = {
  connect(config: DatabaseConfig): void {
    if (state) {
      db.close();
    }

    try {
      const sqlite = new Database(config.path);

      if (config.wal !== false) {
        sqlite.pragma('journal_mode = WAL');
      }

      sqlite.pragma('foreign_keys = ON');

      const drizzleDb = drizzle(sqlite, { schema });
      state = { sqlite, db: drizzleDb };
    } catch (err) {
      throw new DbModuleError('DB_CONNECTION_FAILED', `Failed to connect to ${config.path}`, err);
    }
  },

  close(): void {
    if (state) {
      state.sqlite.close();
      state = null;
    }
  },

  migrate(): MigrationResult {
    const { db: drizzleDb } = getState();

    try {
      migrate(drizzleDb, { migrationsFolder });

      // Seed builtin patterns after migration
      const { sqlite } = getState();
      seedBuiltinPatterns(sqlite);

      // Get current migration version
      const result = drizzleDb.get<{ id: number }>(
        sql`SELECT MAX(id) as id FROM __drizzle_migrations`,
      );
      const current = result?.id ?? 0;

      // Get all applied migrations
      const rows = drizzleDb.all<{ hash: string }>(
        sql`SELECT hash FROM __drizzle_migrations ORDER BY id`,
      );
      const applied = rows.map((r) => r.hash);

      return { applied, current };
    } catch (err) {
      throw new DbModuleError('DB_MIGRATION_FAILED', 'Failed to run migrations', err);
    }
  },
};

/** Get the Drizzle instance for queries (used by other modules) */
export function getDb() {
  return getState().db;
}

/** Get the raw better-sqlite3 instance (for advanced use) */
export function getSqlite(): Database.Database {
  return getState().sqlite;
}

export { schema };
