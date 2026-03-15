import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock ffmpeg before importing thumbnails
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    detect: vi.fn().mockResolvedValue('/usr/bin/ffmpeg'),
    spawn: vi.fn().mockImplementation(async (opts: { args: string[] }) => {
      // Create a fake thumbnail file at the output path
      const outputIdx = opts.args.indexOf('-y');
      if (outputIdx !== -1 && opts.args[outputIdx + 1]) {
        writeFileSync(opts.args[outputIdx + 1], 'fake-jpg-data');
      }
    }),
  },
}));

import { db } from '../../src/core/modules/db/index.js';
import { thumbnails, configureThumbnails } from '../../src/core/modules/thumbnails/index.js';
import { getDb, schema } from '../../src/core/modules/db/index.js';

describe('[thumbnails] - ThumbnailsModule', () => {
  let tmpDir: string;
  let cacheDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'thumb-test-'));
    cacheDir = join(tmpDir, 'thumbnails');
    const dbPath = join(tmpDir, 'test.db');
    db.connect({ path: dbPath });
    db.migrate();
    configureThumbnails({ cacheDir, width: 160, scrubCount: 5 });

    // Seed test data
    const drizzle = getDb();
    drizzle
      .insert(schema.patterns)
      .values({
        id: 'garmin',
        name: 'Garmin',
        format: 'yyyyMMdd_HHmmss',
        regex: '.*',
        builtin: true,
      })
      .run();
    drizzle
      .insert(schema.trips)
      .values({
        id: 'trip1',
        name: 'Test Trip',
        tsStart: 1000000,
        tsEnd: 1200000,
        clipCount: 2,
        codecCompatible: true,
        status: 'pending',
        createdAt: Date.now(),
      })
      .run();
    drizzle
      .insert(schema.clips)
      .values([
        {
          id: 'clip1',
          path: '/fake/clip1.mp4',
          durationMs: 60000,
          codecVideo: 'h264',
          width: 1920,
          height: 1080,
          fps: 30,
          patternId: 'garmin',
          tsSource: 1000000,
          tripId: 'trip1',
          fileSize: 100000,
          createdAt: Date.now(),
        },
        {
          id: 'clip2',
          path: '/fake/clip2.mp4',
          durationMs: 120000,
          codecVideo: 'h264',
          width: 1920,
          height: 1080,
          fps: 30,
          patternId: 'garmin',
          tsSource: 1060000,
          tripId: 'trip1',
          fileSize: 200000,
          createdAt: Date.now(),
        },
      ])
      .run();
  });

  afterEach(() => {
    db.close();
    rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('generate creates thumbnail for clip', async () => {
    // clipId as number — interface uses number but DB uses string IDs
    // We use string 'clip1' stored as id, but interface expects number
    // For now, test with a numeric-like approach
    const drizzle = getDb();
    drizzle
      .insert(schema.clips)
      .values({
        id: '1',
        path: '/fake/numeric.mp4',
        durationMs: 30000,
        codecVideo: 'h264',
        width: 1920,
        height: 1080,
        fps: 30,
        patternId: 'garmin',
        tsSource: 2000000,
        tripId: null,
        fileSize: 50000,
        createdAt: Date.now(),
      })
      .run();

    const entry = await thumbnails.generate(1);
    expect(entry.clipId).toBe(1);
    expect(entry.type).toBe('clip');
    expect(entry.path).toContain('clip_1.jpg');
  });

  it('generate returns cached thumbnail if exists', async () => {
    const drizzle = getDb();
    drizzle
      .insert(schema.clips)
      .values({
        id: '2',
        path: '/fake/cached.mp4',
        durationMs: 30000,
        codecVideo: 'h264',
        width: 1920,
        height: 1080,
        fps: 30,
        patternId: 'garmin',
        tsSource: 3000000,
        tripId: null,
        fileSize: 50000,
        createdAt: Date.now(),
      })
      .run();

    const first = await thumbnails.generate(2);
    const second = await thumbnails.generate(2);
    expect(first.path).toBe(second.path);
  });

  it('generate throws for non-existent clip', async () => {
    await expect(thumbnails.generate(999)).rejects.toThrow('not found');
  });

  it('get returns null for clip without thumbnail', async () => {
    const result = await thumbnails.get(999);
    expect(result).toBeNull();
  });

  it('getScrub returns empty for trip without scrub thumbnails', async () => {
    const result = await thumbnails.getScrub(999);
    expect(result).toEqual([]);
  });

  it('clearCache removes all thumbnails', async () => {
    const drizzle = getDb();
    drizzle
      .insert(schema.clips)
      .values({
        id: '3',
        path: '/fake/clear.mp4',
        durationMs: 30000,
        codecVideo: 'h264',
        width: 1920,
        height: 1080,
        fps: 30,
        patternId: 'garmin',
        tsSource: 4000000,
        tripId: null,
        fileSize: 50000,
        createdAt: Date.now(),
      })
      .run();

    await thumbnails.generate(3);
    const count = await thumbnails.clearCache();
    expect(count).toBeGreaterThan(0);

    const after = await thumbnails.get(3);
    expect(after).toBeNull();
  });
});
