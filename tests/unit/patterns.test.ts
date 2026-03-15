import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BUILTIN_PATTERNS } from '../../src/core/modules/patterns/builtin.js';
import { patterns, PatternModuleError } from '../../src/core/modules/patterns/index.js';
import { db } from '../../src/core/modules/db/index.js';
import type { Pattern } from '../../src/interfaces/patterns.js';

// Test cases: [patternId, filename, expectedYear, expectedMonth, expectedDay, expectedHour, expectedMin, expectedSec, expectedCam, expectedSeq]
const DETECT_CASES: [string, string, number, number, number, number, number, number, string | null, number | null][] = [
  ['viofo', '20240315_143022_F.mp4', 2024, 3, 15, 14, 30, 22, 'F', null],
  ['viofo', '20231201_083015_R.mp4', 2023, 12, 1, 8, 30, 15, 'R', null],
  ['blackvue', '20250722_110221_NF.mp4', 2025, 7, 22, 11, 2, 21, 'F', null],
  ['blackvue', '20240101_235959_PR.mp4', 2024, 1, 1, 23, 59, 59, 'R', null],
  ['blackvue', '20240315_143022_EF.mp4', 2024, 3, 15, 14, 30, 22, 'F', null],
  ['nextbase', '240915_143027_001_FH.MP4', 2024, 9, 15, 14, 30, 27, 'F', 1],
  ['nextbase', '250101_000000_042_RL.mp4', 2025, 1, 1, 0, 0, 0, 'R', 42],
  ['thinkware', '2024_0315_143022_NOR.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['thinkware', '2024_0315_143022_EVT.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['thinkware', '2024_0315_143022_MAN_F.mp4', 2024, 3, 15, 14, 30, 22, 'F', null],
  ['70mai', 'NO20240315-143022.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['70mai', 'EV20240315-143022.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['70mai', 'PA20240315-143022_0001.mp4', 2024, 3, 15, 14, 30, 22, null, 1],
  ['xiaomi-mijia', '2024_0315_143022.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['ddpai', '20240315143022_0001.mp4', 2024, 3, 15, 14, 30, 22, null, 1],
  ['generic-ts', '2024-03-15_14-30-22.mp4', 2024, 3, 15, 14, 30, 22, null, null],
  ['generic-ts', '2024-03-15_14-30-22_front.AVI', 2024, 3, 15, 14, 30, 22, 'front', null],
];

describe('[patterns] - detect', () => {
  it.each(DETECT_CASES)(
    'detects %s pattern from "%s"',
    (expectedId, filename) => {
      const result = patterns.detect(filename);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(expectedId);
    },
  );

  it('detects Xiaomi Yi sequential pattern', () => {
    const result = patterns.detect('YDXJ0001.mp4');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('xiaomi-yi');
  });

  it('returns null for unknown filenames', () => {
    expect(patterns.detect('random_file.mp4')).toBeNull();
    expect(patterns.detect('document.pdf')).toBeNull();
    expect(patterns.detect('')).toBeNull();
  });
});

describe('[patterns] - parse', () => {
  it.each(DETECT_CASES)(
    'parses %s from "%s" correctly',
    (patternId, filename, year, month, day, hour, min, sec, cam, seq) => {
      const pattern = BUILTIN_PATTERNS.find((p) => p.id === patternId)!;
      const result = patterns.parse(filename, pattern);

      expect(result.date.getFullYear()).toBe(year);
      expect(result.date.getMonth() + 1).toBe(month);
      expect(result.date.getDate()).toBe(day);
      expect(result.date.getHours()).toBe(hour);
      expect(result.date.getMinutes()).toBe(min);
      expect(result.date.getSeconds()).toBe(sec);
      expect(result.camera).toBe(cam);
      expect(result.sequence).toBe(seq);
      expect(result.patternId).toBe(patternId);
    },
  );

  it('throws PATTERN_PARSE_FAILED for non-matching filename', () => {
    const pattern = BUILTIN_PATTERNS[0];
    expect(() => patterns.parse('random.mp4', pattern)).toThrow(PatternModuleError);
  });

  it('throws PATTERN_PARSE_FAILED for Yi (no date groups)', () => {
    const yi = BUILTIN_PATTERNS.find((p) => p.id === 'xiaomi-yi')!;
    expect(() => patterns.parse('YDXJ0001.mp4', yi)).toThrow(PatternModuleError);
  });
});

describe('[patterns] - format', () => {
  const date = new Date(2024, 2, 15, 14, 30, 22); // 2024-03-15 14:30:22

  it('formats VIOFO pattern', () => {
    const viofo = BUILTIN_PATTERNS.find((p) => p.id === 'viofo')!;
    const result = patterns.format(date, viofo, { camera: 'F' });
    expect(result).toBe('20240315_143022_F.mp4');
  });

  it('formats with sequence', () => {
    const ddpai = BUILTIN_PATTERNS.find((p) => p.id === 'ddpai')!;
    const result = patterns.format(date, ddpai, { sequence: 1 });
    expect(result).toBe('20240315143022_001.mp4');
  });

  it('formats without options', () => {
    const mijia = BUILTIN_PATTERNS.find((p) => p.id === 'xiaomi-mijia')!;
    const result = patterns.format(date, mijia);
    expect(result).toBe('2024_0315_143022.mp4');
  });

  it('throws for Yi pattern (no format string)', () => {
    const yi = BUILTIN_PATTERNS.find((p) => p.id === 'xiaomi-yi')!;
    expect(() => patterns.format(date, yi)).toThrow(PatternModuleError);
  });
});

describe('[patterns] - list (with DB)', () => {
  beforeEach(() => {
    db.connect({ path: ':memory:' });
    db.migrate();
  });

  afterEach(() => {
    db.close();
  });

  it('returns all builtin patterns from DB', () => {
    const result = patterns.list();
    expect(result.length).toBe(BUILTIN_PATTERNS.length);
  });

  it('includes custom patterns after add', () => {
    const custom = patterns.add({
      name: 'Custom',
      format: 'yyyyMMdd',
      regex: '^CUSTOM_\\d{8}\\.mp4$',
      priority: 5,
    });
    const result = patterns.list();
    expect(result.length).toBe(BUILTIN_PATTERNS.length + 1);
    expect(result.find((p) => p.id === custom.id)).toBeDefined();
  });
});

describe('[patterns] - add/remove (with DB)', () => {
  beforeEach(() => {
    db.connect({ path: ':memory:' });
    db.migrate();
  });

  afterEach(() => {
    db.close();
  });

  it('adds a custom pattern', () => {
    const result = patterns.add({
      name: 'MyDashcam',
      format: 'yyyyMMdd',
      regex: '^MY_\\d{8}\\.mp4$',
      priority: 5,
    });
    expect(result.id).toBeDefined();
    expect(result.builtin).toBe(false);
    expect(result.name).toBe('MyDashcam');
  });

  it('throws PATTERN_DUPLICATE for same regex', () => {
    patterns.add({
      name: 'First',
      format: 'yyyyMMdd',
      regex: '^DUP_\\d{8}\\.mp4$',
      priority: 5,
    });
    expect(() =>
      patterns.add({
        name: 'Second',
        format: 'yyyyMMdd',
        regex: '^DUP_\\d{8}\\.mp4$',
        priority: 5,
      }),
    ).toThrow(PatternModuleError);
  });

  it('removes a custom pattern', () => {
    const custom = patterns.add({
      name: 'ToRemove',
      format: 'yyyyMMdd',
      regex: '^REM_\\d{8}\\.mp4$',
      priority: 5,
    });
    expect(() => patterns.remove(custom.id)).not.toThrow();
    expect(patterns.list().find((p) => p.id === custom.id)).toBeUndefined();
  });

  it('throws PATTERN_NOT_FOUND for nonexistent id', () => {
    expect(() => patterns.remove('nonexistent')).toThrow(PatternModuleError);
  });

  it('throws when trying to remove builtin pattern', () => {
    expect(() => patterns.remove('viofo')).toThrow(PatternModuleError);
  });
});
