// Database module interface

export interface DatabaseConfig {
  /** Path to SQLite database file */
  path: string;
  /** Enable WAL mode (default: true) */
  wal?: boolean;
}

export interface MigrationResult {
  applied: string[];
  current: number;
}

export type DbError =
  | 'DB_CONNECTION_FAILED'
  | 'DB_MIGRATION_FAILED'
  | 'DB_QUERY_FAILED'
  | 'DB_NOT_FOUND';

export interface DbModule {
  connect(config: DatabaseConfig): void;
  close(): void;
  migrate(): MigrationResult;
}
