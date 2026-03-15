// Patterns module interface

export interface Pattern {
  id: string;
  name: string;
  /** date-fns format string */
  format: string;
  /** Regex for matching filenames */
  regex: string;
  priority: number;
  builtin: boolean;
}

export interface ParseResult {
  date: Date;
  camera: string | null;
  sequence: number | null;
  patternId: string;
}

export type PatternError =
  | 'PATTERN_NOT_FOUND'
  | 'PATTERN_PARSE_FAILED'
  | 'PATTERN_FORMAT_FAILED'
  | 'PATTERN_DUPLICATE';

export interface PatternsModule {
  list(): Pattern[];
  detect(filename: string): Pattern | null;
  parse(filename: string, pattern: Pattern): ParseResult;
  format(date: Date, pattern: Pattern, options?: FormatOptions): string;
  add(pattern: Omit<Pattern, 'id' | 'builtin'>): Pattern;
  remove(id: string): void;
}

export interface FormatOptions {
  camera?: string;
  sequence?: number;
}
