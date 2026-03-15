import { describe, it, expect } from 'vitest';
import type {
  ExportOptions,
  ExportProgress,
  ExportTemplate,
  ExporterError,
  ExporterModule,
} from '../../src/interfaces/exporter.js';

describe('[exporter] - Contract', () => {
  const stub: ExporterModule = {
    async export(
      _options: ExportOptions,
      _onProgress?: (p: ExportProgress) => void,
    ) {
      return '/output/trip-2026-03-15.mp4';
    },
    cancel() {},
    listTemplates(): ExportTemplate[] {
      return [{ name: 'default', pattern: '{date}_{trip}_{seq}' }];
    },
  };

  it('implements all required methods', () => {
    expect(typeof stub.export).toBe('function');
    expect(typeof stub.cancel).toBe('function');
    expect(typeof stub.listTemplates).toBe('function');
  });

  it('export returns output path', async () => {
    const result = await stub.export({ tripIds: ['trip-001'] });
    expect(typeof result).toBe('string');
  });

  it('ExportTemplate has required fields', () => {
    const templates = stub.listTemplates();
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('pattern');
  });

  it('progress phases are valid', () => {
    const phases: ExportProgress['phase'][] = [
      'preparing',
      'concatenating',
      'encoding',
      'finalizing',
    ];
    expect(phases).toHaveLength(4);
  });

  it('error types cover expected cases', () => {
    const errors: ExporterError[] = [
      'EXPORTER_NO_INPUT',
      'EXPORTER_OUTPUT_EXISTS',
      'EXPORTER_CODEC_INCOMPATIBLE',
      'EXPORTER_FFMPEG_FAILED',
      'EXPORTER_CANCELLED',
    ];
    expect(errors).toHaveLength(5);
  });
});
