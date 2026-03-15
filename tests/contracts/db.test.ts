import { describe, it, expect } from 'vitest';
import type {
  DatabaseConfig,
  MigrationResult,
  DbError,
  DbModule,
} from '../../src/interfaces/db.js';

describe('[db] - Contract', () => {
  const stub: DbModule = {
    connect(_config: DatabaseConfig) {},
    close() {},
    migrate(): MigrationResult {
      return { applied: ['001_initial'], current: 1 };
    },
  };

  it('implements all required methods', () => {
    expect(typeof stub.connect).toBe('function');
    expect(typeof stub.close).toBe('function');
    expect(typeof stub.migrate).toBe('function');
  });

  it('migrate returns MigrationResult shape', () => {
    const result = stub.migrate();
    expect(result).toHaveProperty('applied');
    expect(result).toHaveProperty('current');
    expect(Array.isArray(result.applied)).toBe(true);
    expect(typeof result.current).toBe('number');
  });

  it('error types cover expected cases', () => {
    const errors: DbError[] = [
      'DB_CONNECTION_FAILED',
      'DB_MIGRATION_FAILED',
      'DB_QUERY_FAILED',
      'DB_NOT_FOUND',
    ];
    expect(errors).toHaveLength(4);
  });
});
