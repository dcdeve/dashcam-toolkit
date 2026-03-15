import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock trips module
const mockGetClips = vi.fn();
vi.mock('../../src/core/modules/trips/index.js', () => ({
  trips: {
    getClips: (...args: unknown[]) => mockGetClips(...args),
  },
}));

// Mock ffmpeg module
const mockDetect = vi.fn().mockResolvedValue('/usr/bin/ffmpeg');
const mockProbe = vi.fn();
const mockSpawn = vi.fn().mockResolvedValue(undefined);
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    detect: (...args: unknown[]) => mockDetect(...args),
    probe: (...args: unknown[]) => mockProbe(...args),
    spawn: (...args: unknown[]) => mockSpawn(...args),
  },
}));

// Mock fs/promises
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockAccess = vi.fn().mockRejectedValue(new Error('ENOENT'));
vi.mock('node:fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  unlink: (...args: unknown[]) => mockUnlink(...args),
  access: (...args: unknown[]) => mockAccess(...args),
  constants: { F_OK: 0 },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: () => '2026-03-15_08-00',
}));

import { exporter, ExporterModuleError } from '../../src/core/modules/exporter/index.js';
import type { Clip } from '../../src/interfaces/trips.js';

function makeClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'c1',
    path: '/mnt/sd/clip001.mp4',
    filename: 'clip001.mp4',
    size: 512000,
    duration: 120,
    codec: 'h264',
    width: 1920,
    height: 1080,
    fps: 30,
    patternId: null,
    timestampSource: new Date('2026-03-15T08:00:00Z'),
    tripId: 't1',
    status: 'available',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('[exporter] - export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetect.mockResolvedValue('/usr/bin/ffmpeg');
    mockSpawn.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockAccess.mockRejectedValue(new Error('ENOENT'));
  });

  it('throws EXPORTER_NO_INPUT when no tripIds or filePaths', async () => {
    await expect(exporter.export({})).rejects.toMatchObject({
      code: 'EXPORTER_NO_INPUT',
    });
  });

  it('throws EXPORTER_NO_INPUT with empty arrays', async () => {
    await expect(exporter.export({ tripIds: [], filePaths: [] })).rejects.toMatchObject({
      code: 'EXPORTER_NO_INPUT',
    });
  });

  it('exports trip clips via lossless concat', async () => {
    const clips = [
      makeClip({ id: 'c1', path: '/a/clip1.mp4' }),
      makeClip({ id: 'c2', path: '/a/clip2.mp4' }),
    ];
    mockGetClips.mockResolvedValueOnce(clips);

    const result = await exporter.export({
      tripIds: ['t1'],
      output: '/out/result.mp4',
    });

    expect(result).toBe('/out/result.mp4');
    expect(mockSpawn).toHaveBeenCalledOnce();
    const spawnArgs = mockSpawn.mock.calls[0][0].args;
    expect(spawnArgs).toContain('-c');
    expect(spawnArgs).toContain('copy');
    expect(spawnArgs).not.toContain('libx264');
  });

  it('exports with re-encode and preset', async () => {
    const clips = [
      makeClip({ id: 'c1', path: '/a/clip1.mp4', codec: 'h264' }),
      makeClip({ id: 'c2', path: '/a/clip2.mp4', codec: 'h265' }),
    ];
    mockGetClips.mockResolvedValueOnce(clips);

    await exporter.export({
      tripIds: ['t1'],
      output: '/out/result.mp4',
      reencode: true,
      preset: 'high',
    });

    const spawnArgs = mockSpawn.mock.calls[0][0].args;
    expect(spawnArgs).toContain('libx264');
    expect(spawnArgs).toContain('18'); // high preset CRF
  });

  it('throws EXPORTER_CODEC_INCOMPATIBLE for lossless with mixed codecs', async () => {
    const clips = [
      makeClip({ id: 'c1', codec: 'h264' }),
      makeClip({ id: 'c2', codec: 'h265' }),
    ];
    mockGetClips.mockResolvedValueOnce(clips);

    await expect(
      exporter.export({ tripIds: ['t1'], output: '/out/result.mp4' }),
    ).rejects.toMatchObject({ code: 'EXPORTER_CODEC_INCOMPATIBLE' });
  });

  it('throws EXPORTER_OUTPUT_EXISTS if output file exists', async () => {
    mockGetClips.mockResolvedValueOnce([makeClip()]);
    mockAccess.mockResolvedValueOnce(undefined); // file exists

    await expect(
      exporter.export({ tripIds: ['t1'], output: '/out/exists.mp4' }),
    ).rejects.toMatchObject({ code: 'EXPORTER_OUTPUT_EXISTS' });
  });

  it('throws EXPORTER_FFMPEG_FAILED when spawn fails', async () => {
    mockGetClips.mockResolvedValueOnce([makeClip()]);
    mockSpawn.mockRejectedValueOnce(new Error('ffmpeg crash'));

    await expect(
      exporter.export({ tripIds: ['t1'], output: '/out/result.mp4' }),
    ).rejects.toMatchObject({ code: 'EXPORTER_FFMPEG_FAILED' });
  });

  it('cleans up temp file even on failure', async () => {
    mockGetClips.mockResolvedValueOnce([makeClip()]);
    mockSpawn.mockRejectedValueOnce(new Error('ffmpeg crash'));

    await exporter.export({ tripIds: ['t1'], output: '/out/r.mp4' }).catch(() => {});
    expect(mockUnlink).toHaveBeenCalledOnce();
  });

  it('exports direct file paths without trips', async () => {
    mockProbe.mockResolvedValueOnce({
      path: '/direct/clip.mp4',
      duration: 60,
      size: 100000,
      video: { codec: 'h264', width: 1920, height: 1080, fps: 30, bitrate: 0 },
      audio: null,
      format: 'mp4',
      createdAt: new Date('2026-03-15T08:00:00Z'),
    });

    const result = await exporter.export({
      filePaths: ['/direct/clip.mp4'],
      output: '/out/direct.mp4',
    });

    expect(result).toBe('/out/direct.mp4');
    expect(mockGetClips).not.toHaveBeenCalled();
    expect(mockProbe).toHaveBeenCalledWith('/direct/clip.mp4');
  });
});

describe('[exporter] - listTemplates', () => {
  it('returns at least one template', () => {
    const templates = exporter.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(1);
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('pattern');
  });
});

describe('[exporter] - cancel', () => {
  it('does not throw when called without active export', () => {
    expect(() => exporter.cancel()).not.toThrow();
  });
});
