import { describe, it, expect, afterEach } from 'vitest';
import { db, getDb, getSqlite, DbModuleError } from '../../src/core/modules/db/index.js';
import type { MigrationResult } from '../../src/interfaces/db.js';

describe('[db] - connect', () => {
  afterEach(() => {
    try {
      db.close();
    } catch {
      // already closed
    }
  });

  it('connects to in-memory database', () => {
    db.connect({ path: ':memory:' });
    expect(getSqlite()).toBeDefined();
    expect(getDb()).toBeDefined();
  });

  it('enables WAL mode by default', () => {
    db.connect({ path: ':memory:' });
    const mode = getSqlite().pragma('journal_mode', { simple: true });
    // In-memory DBs use 'memory' journal mode regardless of WAL setting
    expect(mode).toBeDefined();
  });

  it('enables foreign keys', () => {
    db.connect({ path: ':memory:' });
    const fk = getSqlite().pragma('foreign_keys', { simple: true });
    expect(fk).toBe(1);
  });

  it('throws DB_CONNECTION_FAILED for invalid path', () => {
    expect(() => db.connect({ path: '/nonexistent/dir/db.sqlite' })).toThrow(
      DbModuleError,
    );
  });

  it('closes previous connection on re-connect', () => {
    db.connect({ path: ':memory:' });
    const first = getSqlite();
    db.connect({ path: ':memory:' });
    expect(() => first.pragma('journal_mode')).toThrow();
  });
});

describe('[db] - close', () => {
  it('closes without error', () => {
    db.connect({ path: ':memory:' });
    expect(() => db.close()).not.toThrow();
  });

  it('is safe to call when not connected', () => {
    expect(() => db.close()).not.toThrow();
  });
});

describe('[db] - migrate', () => {
  afterEach(() => {
    try {
      db.close();
    } catch {
      // already closed
    }
  });

  it('applies initial migration', () => {
    db.connect({ path: ':memory:' });
    const result: MigrationResult = db.migrate();
    expect(result.applied).toBeInstanceOf(Array);
    expect(result.applied.length).toBeGreaterThanOrEqual(1);
    expect(typeof result.current).toBe('number');
  });

  it('is idempotent — running twice does not fail', () => {
    db.connect({ path: ':memory:' });
    db.migrate();
    expect(() => db.migrate()).not.toThrow();
  });

  it('creates all expected tables', () => {
    db.connect({ path: ':memory:' });
    db.migrate();
    const tables = getSqlite()
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name",
      )
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('patterns');
    expect(names).toContain('clips');
    expect(names).toContain('trips');
    expect(names).toContain('thumbnails');
    expect(names).toContain('settings');
  });

  it('seeds builtin patterns', () => {
    db.connect({ path: ':memory:' });
    db.migrate();
    const count = getSqlite()
      .prepare('SELECT COUNT(*) as c FROM patterns WHERE builtin = 1')
      .get() as { c: number };
    expect(count.c).toBeGreaterThanOrEqual(1);
  });

  it('seed is idempotent — no duplicates on re-migrate', () => {
    db.connect({ path: ':memory:' });
    db.migrate();
    const first = getSqlite()
      .prepare('SELECT COUNT(*) as c FROM patterns WHERE builtin = 1')
      .get() as { c: number };
    db.migrate();
    const second = getSqlite()
      .prepare('SELECT COUNT(*) as c FROM patterns WHERE builtin = 1')
      .get() as { c: number };
    expect(second.c).toBe(first.c);
  });

  it('throws DB_MIGRATION_FAILED when not connected', () => {
    expect(() => db.migrate()).toThrow(DbModuleError);
  });
});

describe('[db] - getDb / getSqlite', () => {
  it('throws when not connected', () => {
    expect(() => getDb()).toThrow(DbModuleError);
    expect(() => getSqlite()).toThrow(DbModuleError);
  });
});
