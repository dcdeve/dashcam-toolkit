import { describe, it, expect } from 'vitest';
import type {
  Pattern,
  ParseResult,
  PatternError,
  PatternsModule,
} from '../../src/interfaces/patterns.js';

describe('[patterns] - Contract', () => {
  const samplePattern: Pattern = {
    id: 'garmin',
    name: 'Garmin',
    format: 'yyyyMMdd_HHmmss',
    regex: '\\d{8}_\\d{6}',
    priority: 1,
    builtin: true,
  };

  const stub: PatternsModule = {
    list() {
      return [samplePattern];
    },
    detect(_filename: string) {
      return samplePattern;
    },
    parse(_filename: string, _pattern: Pattern): ParseResult {
      return { date: new Date(), camera: 'front', sequence: 1, patternId: 'garmin' };
    },
    format(_date: Date, _pattern: Pattern) {
      return '20260315_120000';
    },
    add(pattern) {
      return { ...pattern, id: 'custom-1', builtin: false };
    },
    remove(_id: string) {},
  };

  it('implements all required methods', () => {
    expect(typeof stub.list).toBe('function');
    expect(typeof stub.detect).toBe('function');
    expect(typeof stub.parse).toBe('function');
    expect(typeof stub.format).toBe('function');
    expect(typeof stub.add).toBe('function');
    expect(typeof stub.remove).toBe('function');
  });

  it('Pattern has all required fields', () => {
    expect(samplePattern).toHaveProperty('id');
    expect(samplePattern).toHaveProperty('name');
    expect(samplePattern).toHaveProperty('format');
    expect(samplePattern).toHaveProperty('regex');
    expect(samplePattern).toHaveProperty('priority');
    expect(samplePattern).toHaveProperty('builtin');
  });

  it('parse returns ParseResult shape', () => {
    const result = stub.parse('20260315_120000.mp4', samplePattern);
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('camera');
    expect(result).toHaveProperty('sequence');
    expect(result).toHaveProperty('patternId');
  });

  it('error types cover expected cases', () => {
    const errors: PatternError[] = [
      'PATTERN_NOT_FOUND',
      'PATTERN_PARSE_FAILED',
      'PATTERN_FORMAT_FAILED',
      'PATTERN_DUPLICATE',
    ];
    expect(errors).toHaveLength(4);
  });
});
