import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ffmpeg
const mockDetect = vi.fn().mockResolvedValue('/usr/bin/ffmpeg');
const mockProbe = vi.fn();
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    detect: (...args: unknown[]) => mockDetect(...args),
    probe: (...args: unknown[]) => mockProbe(...args),
  },
}));

// Mock patterns
const mockList = vi.fn().mockReturnValue([]);
const mockDetectPattern = vi.fn().mockReturnValue(null);
const mockAdd = vi.fn();
vi.mock('../../src/core/modules/patterns/index.js', () => ({
  patterns: {
    list: (...args: unknown[]) => mockList(...args),
    detect: (...args: unknown[]) => mockDetectPattern(...args),
    add: (...args: unknown[]) => mockAdd(...args),
  },
}));

// Mock db
const mockConnect = vi.fn();
const mockMigrate = vi.fn();
const mockClose = vi.fn();
vi.mock('../../src/core/modules/db/index.js', () => {
  const mockAll = vi.fn().mockReturnValue([]);
  const mockGet = vi.fn().mockReturnValue(undefined);
  const mockRun = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({ all: mockAll, get: mockGet, run: mockRun });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, all: mockAll });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockValues = vi.fn().mockReturnValue({ run: mockRun });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  return {
    db: {
      connect: (...args: unknown[]) => mockConnect(...args),
      migrate: (...args: unknown[]) => mockMigrate(...args),
      close: (...args: unknown[]) => mockClose(...args),
    },
    getDb: () => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    }),
    schema: {
      settings: { key: 'key', value: 'value' },
    },
  };
});

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
}));

// Mock trips
const mockTripslist = vi.fn().mockResolvedValue([]);
const mockGetTrip = vi.fn();
const mockGetClips = vi.fn();
vi.mock('../../src/core/modules/trips/index.js', () => ({
  trips: {
    list: (...args: unknown[]) => mockTripslist(...args),
    getTrip: (...args: unknown[]) => mockGetTrip(...args),
    getClips: (...args: unknown[]) => mockGetClips(...args),
  },
}));

import { infoAction } from '../../src/cli/commands/info.js';
import { patternsAction } from '../../src/cli/commands/patterns.js';
import { tripsAction } from '../../src/cli/commands/trips.js';
import { configAction } from '../../src/cli/commands/config.js';

describe('[cli] - info command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('probes files and shows info', async () => {
    mockProbe.mockResolvedValueOnce({
      path: '/a/clip.mp4',
      duration: 120,
      size: 1024 * 1024 * 50,
      video: { codec: 'h264', width: 1920, height: 1080, fps: 30, bitrate: 0 },
      audio: { codec: 'aac', channels: 2, sampleRate: 44100, bitrate: 0 },
      format: 'mp4',
      createdAt: null,
    });
    mockDetectPattern.mockReturnValueOnce({ id: 'garmin', name: 'Garmin' });

    await infoAction(['/a/clip.mp4']);

    expect(mockProbe).toHaveBeenCalledOnce();
    expect(mockDetectPattern).toHaveBeenCalledOnce();
  });

  it('handles ffmpeg not found', async () => {
    mockDetect.mockRejectedValueOnce(new Error('not found'));

    await infoAction(['/a/clip.mp4']);

    expect(mockProbe).not.toHaveBeenCalled();
  });
});

describe('[cli] - patterns command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists all patterns', () => {
    mockList.mockReturnValueOnce([
      { id: 'garmin', name: 'Garmin', format: 'yyyyMMdd_HHmmss', regex: '.*', priority: 0, builtin: true },
    ]);

    patternsAction({});

    expect(mockList).toHaveBeenCalledOnce();
  });

  it('rejects --add without --format', () => {
    patternsAction({ add: 'test' });

    expect(mockAdd).not.toHaveBeenCalled();
  });
});

describe('[cli] - trips command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists all trips', async () => {
    mockTripslist.mockResolvedValueOnce([
      {
        id: 't1', name: 'Trip test', startedAt: new Date(), endedAt: new Date(),
        clipCount: 5, totalDuration: 300, codecCompat: 'compatible', status: 'complete',
        createdAt: new Date(),
      },
    ]);

    await tripsAction();

    expect(mockTripslist).toHaveBeenCalledOnce();
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('shows trip details with clips', async () => {
    mockGetTrip.mockResolvedValueOnce({
      id: 't1', name: 'Trip test', startedAt: new Date(), endedAt: new Date(),
      clipCount: 2, totalDuration: 240, codecCompat: 'compatible', status: 'complete',
    });
    mockGetClips.mockResolvedValueOnce([
      { filename: 'clip1.mp4', codec: 'h264', width: 1920, height: 1080, duration: 120 },
      { filename: 'clip2.mp4', codec: 'h264', width: 1920, height: 1080, duration: 120 },
    ]);

    await tripsAction('t1');

    expect(mockGetTrip).toHaveBeenCalledWith('t1');
    expect(mockGetClips).toHaveBeenCalledWith('t1');
  });
});

describe('[cli] - config command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes DB', () => {
    configAction();

    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockMigrate).toHaveBeenCalledOnce();
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
