import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module before importing trips
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
const mockDeleteWhere = vi.fn().mockReturnValue({ run: mockRun });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

vi.mock('../../src/core/modules/db/index.js', () => ({
  getDb: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }),
  schema: {
    clips: {
      id: 'id',
      tripId: 'trip_id',
    },
    trips: {
      id: 'id',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
  inArray: (col: unknown, vals: unknown) => ({ col, vals, op: 'inArray' }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (_date: Date, fmt: string) => {
    if (fmt === 'yyyy-MM-dd HH:mm') return '2026-03-15 08:00';
    return '2026-03-15';
  },
}));

import { trips, TripsModuleError } from '../../src/core/modules/trips/index.js';

describe('[trips] - groupClips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TRIP_NO_CLIPS when empty array provided', async () => {
    await expect(trips.groupClips([])).rejects.toThrow(TripsModuleError);
    await expect(trips.groupClips([])).rejects.toMatchObject({ code: 'TRIP_NO_CLIPS' });
  });

  it('throws TRIP_NO_CLIPS when no clips found in DB', async () => {
    mockAll.mockReturnValueOnce([]);
    await expect(trips.groupClips(['id-1'])).rejects.toMatchObject({ code: 'TRIP_NO_CLIPS' });
  });

  it('groups consecutive clips into one trip', async () => {
    const baseTime = new Date('2026-03-15T08:00:00Z').getTime();
    mockAll.mockReturnValueOnce([
      { id: 'c1', path: '/a/clip1.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime, tripId: null, fileSize: 100, createdAt: baseTime },
      { id: 'c2', path: '/a/clip2.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime + 60000, tripId: null, fileSize: 100, createdAt: baseTime },
      { id: 'c3', path: '/a/clip3.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime + 120000, tripId: null, fileSize: 100, createdAt: baseTime },
    ]);

    const result = await trips.groupClips(['c1', 'c2', 'c3']);
    expect(result).toHaveLength(1);
    expect(result[0].clipCount).toBe(3);
    expect(result[0].codecCompat).toBe('compatible');
    expect(result[0].name).toContain('Trip');
  });

  it('splits into multiple trips when gap exceeds threshold', async () => {
    const baseTime = new Date('2026-03-15T08:00:00Z').getTime();
    const tenMinutesMs = 10 * 60 * 1000;
    mockAll.mockReturnValueOnce([
      { id: 'c1', path: '/a/clip1.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime, tripId: null, fileSize: 100, createdAt: baseTime },
      { id: 'c2', path: '/a/clip2.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime + 60000, tripId: null, fileSize: 100, createdAt: baseTime },
      { id: 'c3', path: '/a/clip3.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime + 60000 + 60000 + tenMinutesMs, tripId: null, fileSize: 100, createdAt: baseTime },
    ]);

    const result = await trips.groupClips(['c1', 'c2', 'c3'], { gapMinutes: 5 });
    expect(result).toHaveLength(2);
    expect(result[0].clipCount).toBe(2);
    expect(result[1].clipCount).toBe(1);
  });

  it('detects incompatible codecs', async () => {
    const baseTime = new Date('2026-03-15T08:00:00Z').getTime();
    mockAll.mockReturnValueOnce([
      { id: 'c1', path: '/a/clip1.mp4', durationMs: 60000, codecVideo: 'h264', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime, tripId: null, fileSize: 100, createdAt: baseTime },
      { id: 'c2', path: '/a/clip2.mp4', durationMs: 60000, codecVideo: 'h265', width: 1920, height: 1080, fps: 30, patternId: null, tsSource: baseTime + 60000, tripId: null, fileSize: 100, createdAt: baseTime },
    ]);

    const result = await trips.groupClips(['c1', 'c2']);
    expect(result).toHaveLength(1);
    expect(result[0].codecCompat).toBe('incompatible');
  });
});

describe('[trips] - getTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TRIP_NOT_FOUND for non-existent trip', async () => {
    mockGet.mockReturnValueOnce(undefined);
    await expect(trips.getTrip('nonexistent')).rejects.toMatchObject({ code: 'TRIP_NOT_FOUND' });
  });

  it('returns trip with totalDuration computed from clips', async () => {
    mockGet.mockReturnValueOnce({
      id: 't1', name: 'Trip test', tsStart: 1000, tsEnd: 2000, clipCount: 2,
      codecCompatible: true, status: 'complete', createdAt: 1000,
    });
    mockAll.mockReturnValueOnce([
      { durationMs: 30000 },
      { durationMs: 45000 },
    ]);

    const trip = await trips.getTrip('t1');
    expect(trip.totalDuration).toBe(75);
    expect(trip.name).toBe('Trip test');
  });
});

describe('[trips] - remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws TRIP_NOT_FOUND for non-existent trip', async () => {
    mockGet.mockReturnValueOnce(undefined);
    await expect(trips.remove('nonexistent')).rejects.toMatchObject({ code: 'TRIP_NOT_FOUND' });
  });

  it('nullifies tripId on clips and deletes trip', async () => {
    mockGet.mockReturnValueOnce({ id: 't1' });

    await trips.remove('t1');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });
});
