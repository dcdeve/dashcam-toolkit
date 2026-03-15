import { describe, it, expect } from 'vitest';
import type {
  ScanOptions,
  ScanResult,
  ScanProgress,
  ScannerError,
  ScannerModule,
} from '../../src/interfaces/scanner.js';

describe('[scanner] - Contract', () => {
  const stub: ScannerModule = {
    async scan(_options: ScanOptions, _onProgress?: (p: ScanProgress) => void): Promise<ScanResult> {
      return {
        clipsFound: 10,
        clipsNew: 8,
        clipsRemoved: 0,
        tripsGrouped: 2,
        errors: [],
      };
    },
    async listClips(_dir: string) {
      return [];
    },
  };

  it('implements all required methods', () => {
    expect(typeof stub.scan).toBe('function');
    expect(typeof stub.listClips).toBe('function');
  });

  it('scan returns ScanResult shape', async () => {
    const result = await stub.scan({ dir: '/mnt/sd' });
    expect(result).toHaveProperty('clipsFound');
    expect(result).toHaveProperty('clipsNew');
    expect(result).toHaveProperty('clipsRemoved');
    expect(result).toHaveProperty('tripsGrouped');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('progress phases are valid', () => {
    const phases: ScanProgress['phase'][] = ['listing', 'probing', 'importing', 'grouping'];
    expect(phases).toHaveLength(4);
  });

  it('error types cover expected cases', () => {
    const errors: ScannerError[] = [
      'SCANNER_DIR_NOT_FOUND',
      'SCANNER_DIR_NOT_READABLE',
      'SCANNER_PROBE_FAILED',
      'SCANNER_IMPORT_FAILED',
    ];
    expect(errors).toHaveLength(4);
  });
});
