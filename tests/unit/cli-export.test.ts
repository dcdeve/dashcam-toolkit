import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db
const mockConnect = vi.fn();
const mockMigrate = vi.fn();
const mockClose = vi.fn();
vi.mock('../../src/core/modules/db/index.js', () => ({
  db: {
    connect: (...args: unknown[]) => mockConnect(...args),
    migrate: (...args: unknown[]) => mockMigrate(...args),
    close: (...args: unknown[]) => mockClose(...args),
  },
}));

// Mock ffmpeg
const mockDetect = vi.fn().mockResolvedValue('/usr/bin/ffmpeg');
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    detect: (...args: unknown[]) => mockDetect(...args),
  },
}));

// Mock exporter
const mockExport = vi.fn().mockResolvedValue('/out/result.mp4');
vi.mock('../../src/core/modules/exporter/index.js', () => ({
  exporter: {
    export: (...args: unknown[]) => mockExport(...args),
  },
}));

import { exportAction } from '../../src/cli/commands/export.js';

describe('[cli] - export command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetect.mockResolvedValue('/usr/bin/ffmpeg');
    mockExport.mockResolvedValue('/out/result.mp4');
  });

  it('exports trip by UUID', async () => {
    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], { output: '/out/r.mp4' });

    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockExport).toHaveBeenCalledOnce();

    const opts = mockExport.mock.calls[0][0];
    expect(opts.tripIds).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    expect(opts.output).toContain('/out/r.mp4');
  });

  it('exports file path directly', async () => {
    await exportAction(['/mnt/sd/clip.mp4'], { output: '/out/r.mp4' });

    const opts = mockExport.mock.calls[0][0];
    expect(opts.filePaths).toBeDefined();
    expect(opts.tripIds).toBeUndefined();
  });

  it('passes reencode and preset options', async () => {
    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], {
      output: '/out/r.mp4',
      reencode: true,
      preset: 'alta',
    });

    const opts = mockExport.mock.calls[0][0];
    expect(opts.reencode).toBe(true);
    expect(opts.preset).toBe('high');
  });

  it('parses range option', async () => {
    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], {
      output: '/out/r.mp4',
      range: '00:05:00-00:15:00',
    });

    const opts = mockExport.mock.calls[0][0];
    expect(opts.range).toEqual({ startMs: 300000, endMs: 900000 });
  });

  it('rejects invalid range format', async () => {
    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], {
      range: 'invalid',
    });

    expect(mockExport).not.toHaveBeenCalled();
  });

  it('rejects invalid preset', async () => {
    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], {
      preset: 'ultra',
    });

    expect(mockExport).not.toHaveBeenCalled();
  });

  it('requires targets or --dir', async () => {
    await exportAction([], {});

    expect(mockExport).not.toHaveBeenCalled();
  });

  it('closes DB even on export error', async () => {
    mockExport.mockRejectedValueOnce(new Error('export failed'));

    await exportAction(['550e8400-e29b-41d4-a716-446655440000'], { output: '/out/r.mp4' });

    expect(mockClose).toHaveBeenCalledOnce();
  });
});
