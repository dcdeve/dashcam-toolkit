import { format as fnsFormat } from 'date-fns';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { schema } from '../db/index.js';
import { BUILTIN_PATTERNS } from './builtin.js';
import type {
  Pattern,
  ParseResult,
  PatternsModule,
  FormatOptions,
  PatternError,
} from '../../../interfaces/patterns.js';

export class PatternModuleError extends Error {
  constructor(
    public readonly code: PatternError,
    message: string,
  ) {
    super(message);
    this.name = 'PatternModuleError';
  }
}

function dbRowToPattern(row: typeof schema.patterns.$inferSelect): Pattern {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    regex: row.regex,
    priority: row.priority,
    builtin: row.builtin,
  };
}

function parseGroups(
  filename: string,
  pattern: Pattern,
): { groups: Record<string, string>; date: Date } {
  const re = new RegExp(pattern.regex, 'i');
  const match = re.exec(filename);
  if (!match?.groups) {
    throw new PatternModuleError(
      'PATTERN_PARSE_FAILED',
      `Filename "${filename}" does not match pattern "${pattern.name}"`,
    );
  }

  const g = match.groups;

  if (!g['Y'] || !g['M'] || !g['D'] || !g['h'] || !g['m'] || !g['s']) {
    throw new PatternModuleError(
      'PATTERN_PARSE_FAILED',
      `Pattern "${pattern.name}" matched but missing date groups in "${filename}"`,
    );
  }

  let year = parseInt(g['Y'], 10);
  if (year < 100) year += 2000;

  const date = new Date(
    year,
    parseInt(g['M'], 10) - 1,
    parseInt(g['D'], 10),
    parseInt(g['h'], 10),
    parseInt(g['m'], 10),
    parseInt(g['s'], 10),
  );

  if (isNaN(date.getTime())) {
    throw new PatternModuleError(
      'PATTERN_PARSE_FAILED',
      `Invalid date extracted from "${filename}"`,
    );
  }

  return { groups: g, date };
}

export const patterns: PatternsModule = {
  list(): Pattern[] {
    try {
      const db = getDb();
      const rows = db.select().from(schema.patterns).orderBy(schema.patterns.priority).all();
      return rows.map(dbRowToPattern);
    } catch {
      // DB not connected — return builtin only
      return [...BUILTIN_PATTERNS].sort((a, b) => b.priority - a.priority);
    }
  },

  detect(filename: string): Pattern | null {
    const all = patterns.list().sort((a, b) => b.priority - a.priority);
    for (const p of all) {
      const re = new RegExp(p.regex, 'i');
      if (re.test(filename)) {
        return p;
      }
    }
    return null;
  },

  parse(filename: string, pattern: Pattern): ParseResult {
    const { groups, date } = parseGroups(filename, pattern);

    const camera = groups['cam'] ?? null;
    const seq = groups['seq'] ? parseInt(groups['seq'], 10) : null;

    return {
      date,
      camera,
      sequence: seq,
      patternId: pattern.id,
    };
  },

  format(date: Date, pattern: Pattern, options?: FormatOptions): string {
    if (!pattern.format) {
      throw new PatternModuleError(
        'PATTERN_FORMAT_FAILED',
        `Pattern "${pattern.name}" does not support formatting (no format string)`,
      );
    }

    let result = fnsFormat(date, pattern.format);

    if (options?.camera) {
      result += `_${options.camera}`;
    }
    if (options?.sequence != null) {
      result += `_${String(options.sequence).padStart(3, '0')}`;
    }

    result += '.mp4';
    return result;
  },

  add(input: Omit<Pattern, 'id' | 'builtin'>): Pattern {
    const db = getDb();

    // Check duplicate regex
    const existing = db
      .select()
      .from(schema.patterns)
      .where(eq(schema.patterns.regex, input.regex))
      .get();

    if (existing) {
      throw new PatternModuleError(
        'PATTERN_DUPLICATE',
        `Pattern with same regex already exists: ${existing.name}`,
      );
    }

    const id = crypto.randomUUID();
    const newPattern: Pattern = { ...input, id, builtin: false };

    db.insert(schema.patterns)
      .values({
        id: newPattern.id,
        name: newPattern.name,
        format: newPattern.format,
        regex: newPattern.regex,
        priority: newPattern.priority,
        builtin: false,
      })
      .run();

    return newPattern;
  },

  remove(id: string): void {
    const db = getDb();

    const existing = db.select().from(schema.patterns).where(eq(schema.patterns.id, id)).get();

    if (!existing) {
      throw new PatternModuleError('PATTERN_NOT_FOUND', `Pattern "${id}" not found`);
    }

    if (existing.builtin) {
      throw new PatternModuleError('PATTERN_NOT_FOUND', `Cannot remove builtin pattern "${id}"`);
    }

    db.delete(schema.patterns).where(eq(schema.patterns.id, id)).run();
  },
};

export { BUILTIN_PATTERNS } from './builtin.js';
