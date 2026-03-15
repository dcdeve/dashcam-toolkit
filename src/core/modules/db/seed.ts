import type Database from 'better-sqlite3';

/** Builtin pattern stubs — real patterns defined in step 2.3 */
const BUILTIN_PATTERNS = [
  {
    id: 'viofo',
    name: 'VIOFO',
    format: "yyyyMMdd_HHmmss_'F'",
    regex: '^\\d{8}_\\d{6}_[FR]\\.mp4$',
    priority: 10,
  },
  {
    id: 'blackvue',
    name: 'BlackVue',
    format: "yyyyMMdd_HHmmss_'NF'",
    regex: '^\\d{8}_\\d{6}_[NR]F\\.mp4$',
    priority: 10,
  },
  {
    id: 'nextbase',
    name: 'Nextbase',
    format: "yyyy-MM-dd_HH'h'mm'_'ss",
    regex: '^\\d{4}-\\d{2}-\\d{2}_\\d{2}h\\d{2}_\\d{2}\\.mp4$',
    priority: 10,
  },
  {
    id: 'garmin',
    name: 'Garmin',
    format: "yyyyMMdd_HHmmss_'ABCD'",
    regex: '^\\d{8}_\\d{6}_[A-Z]{4}\\.MP4$',
    priority: 10,
  },
  {
    id: 'thinkware',
    name: 'Thinkware',
    format: "yyyy_MMdd_HHmmss_'NOR'",
    regex: '^\\d{4}_\\d{4}_\\d{6}_(?:NOR|EVT|MAN|PAR)\\.mp4$',
    priority: 10,
  },
] as const;

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
