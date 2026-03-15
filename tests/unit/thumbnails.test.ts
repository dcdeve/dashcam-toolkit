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
    const entry = await thumbnails.generate('clip1');
    expect(entry.clipId).toBe('clip1');
    expect(entry.type).toBe('clip');
    expect(entry.path).toContain('clip_clip1.jpg');
  });

  it('generate returns cached thumbnail if exists', async () => {
    const first = await thumbnails.generate('clip1');
    const second = await thumbnails.generate('clip1');
    expect(first.path).toBe(second.path);
  });

  it('generate throws for non-existent clip', async () => {
    await expect(thumbnails.generate('nonexistent')).rejects.toThrow('not found');
  });

  it('get returns null for clip without thumbnail', async () => {
    const result = await thumbnails.get('nonexistent');
    expect(result).toBeNull();
  });

  it('getScrub returns empty for trip without scrub thumbnails', async () => {
    const result = await thumbnails.getScrub('nonexistent');
    expect(result).toEqual([]);
  });

  it('clearCache removes all thumbnails', async () => {
    await thumbnails.generate('clip1');
    const count = await thumbnails.clearCache();
    expect(count).toBeGreaterThan(0);

    const after = await thumbnails.get('clip1');
    expect(after).toBeNull();
  });
});
