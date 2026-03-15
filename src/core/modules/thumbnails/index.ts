import { join } from 'path';
import { mkdir, rm, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
import { ffmpeg } from '../ffmpeg/index.js';
import type {
  ThumbnailsModule,
  ThumbnailEntry,
  ThumbnailConfig,
  ThumbnailError,
} from '../../../interfaces/thumbnails.js';

export class ThumbnailsModuleError extends Error {
  constructor(
    public readonly code: ThumbnailError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'ThumbnailsModuleError';
    if (cause) this.cause = cause;
  }
}

let config: ThumbnailConfig = {
  cacheDir: '',
  width: 320,
  scrubCount: 30,
};

export function configureThumbnails(cfg: ThumbnailConfig): void {
  config = { ...config, ...cfg };
}

async function ensureCacheDir(): Promise<void> {
  if (!config.cacheDir) {
    throw new ThumbnailsModuleError(
      'THUMBNAIL_GENERATION_FAILED',
      'Cache directory not configured',
    );
  }
  await mkdir(config.cacheDir, { recursive: true });
}

function dbRowToEntry(row: typeof schema.thumbnails.$inferSelect): ThumbnailEntry {
  return {
    id: row.id,
    clipId: row.clipId,
    tripId: row.tripId,
    path: row.path,
    type: row.type as 'clip' | 'scrub',
    timestampMs: row.timestampMs,
    createdAt: new Date(row.createdAt),
  };
}

export const thumbnails: ThumbnailsModule = {
  async generate(clipId: string): Promise<ThumbnailEntry> {
    await ensureCacheDir();
    const db = getDb();
    const clipIdStr = clipId;

    // Check if already exists
    const existing = db
      .select()
      .from(schema.thumbnails)
      .where(and(eq(schema.thumbnails.clipId, clipIdStr), eq(schema.thumbnails.type, 'clip')))
      .get();
    if (existing && existsSync(existing.path)) {
      return dbRowToEntry(existing);
    }

    // Get clip info
    const clip = db.select().from(schema.clips).where(eq(schema.clips.id, clipIdStr)).get();
    if (!clip) {
      throw new ThumbnailsModuleError('THUMBNAIL_NOT_FOUND', `Clip ${clipId} not found`);
    }

    // Extract frame at 10% of duration
    const durationSec = (clip.durationMs ?? 0) / 1000;
    const seekSec = Math.max(0.1, durationSec * 0.1);
    const outPath = join(config.cacheDir, `clip_${clipIdStr}.jpg`);
    const width = config.width ?? 320;

    await ffmpeg.detect();
    await ffmpeg.spawn({
      args: [
        '-ss',
        String(seekSec),
        '-i',
        clip.path,
        '-vframes',
        '1',
        '-vf',
        `scale=${width}:-1`,
        '-y',
        outPath,
      ],
    });

    const id = randomUUID();
    db.insert(schema.thumbnails)
      .values({
        id,
        clipId: clipIdStr,
        tripId: null,
        path: outPath,
        type: 'clip',
        timestampMs: Math.round(seekSec * 1000),
        width,
        height: 0,
        createdAt: Date.now(),
      })
      .run();

    const inserted = db.select().from(schema.thumbnails).where(eq(schema.thumbnails.id, id)).get();
    if (!inserted) {
      throw new ThumbnailsModuleError('THUMBNAIL_GENERATION_FAILED', 'Failed to save thumbnail');
    }
    return dbRowToEntry(inserted);
  },

  async generateScrub(tripId: string): Promise<ThumbnailEntry[]> {
    await ensureCacheDir();
    const db = getDb();
    const tripIdStr = tripId;
    const scrubCount = config.scrubCount ?? 30;
    const width = config.width ?? 320;

    // Get trip clips ordered by timestamp
    const clips = db
      .select()
      .from(schema.clips)
      .where(eq(schema.clips.tripId, tripIdStr))
      .orderBy(schema.clips.tsSource)
      .all();

    if (clips.length === 0) {
      throw new ThumbnailsModuleError('THUMBNAIL_NOT_FOUND', `No clips found for trip ${tripId}`);
    }

    // Calculate total duration and distribute frames proportionally
    const totalDurationMs = clips.reduce((sum, c) => sum + (c.durationMs ?? 0), 0);
    if (totalDurationMs === 0) return [];

    await ffmpeg.detect();
    const entries: ThumbnailEntry[] = [];
    let frameIndex = 0;

    for (const clip of clips) {
      const clipDurationMs = clip.durationMs ?? 0;
      const clipFrames = Math.max(1, Math.round((clipDurationMs / totalDurationMs) * scrubCount));

      for (let i = 0; i < clipFrames && frameIndex < scrubCount; i++) {
        const seekMs = Math.round((clipDurationMs / (clipFrames + 1)) * (i + 1));
        const seekSec = seekMs / 1000;
        const outPath = join(
          config.cacheDir,
          `scrub_${tripIdStr}_${String(frameIndex).padStart(3, '0')}.jpg`,
        );

        try {
          await ffmpeg.spawn({
            args: [
              '-ss',
              String(seekSec),
              '-i',
              clip.path,
              '-vframes',
              '1',
              '-vf',
              `scale=${width}:-1`,
              '-y',
              outPath,
            ],
          });

          const id = randomUUID();
          db.insert(schema.thumbnails)
            .values({
              id,
              clipId: clip.id,
              tripId: tripIdStr,
              path: outPath,
              type: 'scrub',
              timestampMs: seekMs,
              width,
              height: 0,
              createdAt: Date.now(),
            })
            .run();

          const inserted = db
            .select()
            .from(schema.thumbnails)
            .where(eq(schema.thumbnails.id, id))
            .get();
          if (inserted) entries.push(dbRowToEntry(inserted));
        } catch {
          // Skip frames that fail to extract
        }

        frameIndex++;
      }
    }

    return entries;
  },

  async get(clipId: string): Promise<ThumbnailEntry | null> {
    const db = getDb();
    const row = db
      .select()
      .from(schema.thumbnails)
      .where(and(eq(schema.thumbnails.clipId, clipId), eq(schema.thumbnails.type, 'clip')))
      .get();

    if (!row) return null;
    if (!existsSync(row.path)) {
      // Stale entry — file deleted
      db.delete(schema.thumbnails).where(eq(schema.thumbnails.id, row.id)).run();
      return null;
    }
    return dbRowToEntry(row);
  },

  async getScrub(tripId: string): Promise<ThumbnailEntry[]> {
    const db = getDb();
    const rows = db
      .select()
      .from(schema.thumbnails)
      .where(and(eq(schema.thumbnails.tripId, tripId), eq(schema.thumbnails.type, 'scrub')))
      .orderBy(schema.thumbnails.timestampMs)
      .all();

    return rows.filter((r) => existsSync(r.path)).map(dbRowToEntry);
  },

  async clearCache(): Promise<number> {
    const db = getDb();
    const rows = db.select().from(schema.thumbnails).all();
    const count = rows.length;

    // Delete DB entries
    db.delete(schema.thumbnails).run();

    // Delete files
    if (config.cacheDir && existsSync(config.cacheDir)) {
      const files = await readdir(config.cacheDir);
      for (const file of files) {
        if (file.endsWith('.jpg')) {
          await rm(join(config.cacheDir, file), { force: true });
        }
      }
    }

    return count;
  },
};
