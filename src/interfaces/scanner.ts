// Scanner module interface

import type { Clip } from './trips.js';

export interface ScanOptions {
  dir: string;
  /** Force a specific pattern (skip auto-detect) */
  patternId?: string;
  /** Re-scan: update new/removed clips */
  rescan?: boolean;
  /** Gap in minutes for trip grouping (default: 5) */
  gapMinutes?: number;
}

export interface ScanResult {
  clipsFound: number;
  clipsNew: number;
  clipsRemoved: number;
  tripsGrouped: number;
  errors: ScanFileError[];
}

export interface ScanFileError {
  path: string;
  reason: string;
}

export interface ScanProgress {
  phase: 'listing' | 'probing' | 'importing' | 'grouping';
  current: number;
  total: number;
}

export type ScannerError =
  | 'SCANNER_DIR_NOT_FOUND'
  | 'SCANNER_DIR_NOT_READABLE'
  | 'SCANNER_PROBE_FAILED'
  | 'SCANNER_IMPORT_FAILED';

export interface ScannerModule {
  scan(options: ScanOptions, onProgress?: (progress: ScanProgress) => void): Promise<ScanResult>;
  listClips(dir: string): Promise<Clip[]>;
}
