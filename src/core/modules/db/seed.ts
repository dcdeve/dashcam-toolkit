import type Database from 'better-sqlite3';
import { BUILTIN_PATTERNS } from '../patterns/builtin.js';

export function seedBuiltinPatterns(db: Database.Database): number {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO patterns (id, name, format, regex, priority, builtin)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  let inserted = 0;
  const runAll = db.transaction(() => {
    for (const p of BUILTIN_PATTERNS) {
      const result = stmt.run(p.id, p.name, p.format, p.regex, p.priority);
      if (result.changes > 0) inserted++;
    }
  });
  runAll();

  return inserted;
}
