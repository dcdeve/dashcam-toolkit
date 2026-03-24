import { readdir, stat, access, constants } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { cpus } from 'node:os';
import { ffmpeg } from '../ffmpeg/index.js';
import { patterns as patternsModule } from '../patterns/index.js';
import { getDb } from '../db/index.js';
import { schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { trips as tripsModule } from '../trips/index.js';
import type {
  ScannerModule,
  ScanOptions,
  ScanResult,
  ScanProgress,
  ScanFileError,
  ScannerError,
} from '../../../interfaces/scanner.js';
import type { Clip } from '../../../interfaces/trips.js';
import { folders as foldersModule } from '../folders/index.js';

export class ScannerModuleError extends Error {
  constructor(
    public readonly code: ScannerError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'ScannerModuleError';
    if (cause) this.cause = cause;
  }
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.mkv', '.ts']);
const MAX_DEPTH = 6;

async function promisePool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function listVideoFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) return;

    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(dir, 0);
  return results;
}

function probeResultToClip(
  filePath: string,
  probe: Awaited<ReturnType<typeof ffmpeg.probe>>,
  patternId: string | null,
  tsSource: Date,
): Clip {
  return {
    id: '',
    path: filePath,
    filename: basename(filePath),
    size: probe.size,
    duration: probe.duration,
    codec: probe.video?.codec ?? 'unknown',
    width: probe.video?.width ?? 0,
    height: probe.video?.height ?? 0,
    fps: probe.video?.fps ?? 0,
    patternId,
    timestampSource: tsSource,
    tripId: null,
    status: 'available',
    createdAt: new Date(),
  };
}

export const scanner: ScannerModule = {
  async listClips(dir: string): Promise<Clip[]> {
    try {
      await access(dir, constants.R_OK);
    } catch (err) {
      throw new ScannerModuleError(
        'SCANNER_DIR_NOT_FOUND',
        `Directory not found or not readable: ${dir}`,
        err,
      );
    }

    const files = await listVideoFiles(dir);
    const clips: Clip[] = [];
    const concurrency = Math.max(1, Math.floor(cpus().length / 2));

    await promisePool(files, concurrency, async (filePath) => {
      try {
        const probeResult = await ffmpeg.probe(filePath);
        const filename = basename(filePath);
        const detected = patternsModule.detect(filename);

        let tsSource: Date;
        if (detected) {
          try {
            const parsed = patternsModule.parse(filename, detected);
            tsSource = parsed.date;
          } catch {
            tsSource = probeResult.createdAt ?? new Date((await stat(filePath)).mtimeMs);
          }
        } else {
          tsSource = probeResult.createdAt ?? new Date((await stat(filePath)).mtimeMs);
        }

        clips.push(probeResultToClip(filePath, probeResult, detected?.id ?? null, tsSource));
      } catch {
        // Skip files that can't be probed
      }
    });

    return clips.sort((a, b) => a.timestampSource.getTime() - b.timestampSource.getTime());
  },

  async scan(
    options: ScanOptions,
    onProgress?: (progress: ScanProgress) => void,
  ): Promise<ScanResult> {
    const { dir, patternId, rescan } = options;
    const errors: ScanFileError[] = [];

    // Validate directory
    try {
      await access(dir, constants.R_OK);
    } catch (err) {
      const s = await stat(dir).catch(() => null);
      if (!s) {
        throw new ScannerModuleError('SCANNER_DIR_NOT_FOUND', `Directory not found: ${dir}`, err);
      }
      throw new ScannerModuleError(
        'SCANNER_DIR_NOT_READABLE',
        `Directory not readable: ${dir}`,
        err,
      );
    }

    // Phase: listing
    onProgress?.({ phase: 'listing', current: 0, total: 0 });
    const files = await listVideoFiles(dir);
    onProgress?.({ phase: 'listing', current: files.length, total: files.length });

    // Phase: probing
    const clips: Clip[] = [];
    const concurrency = Math.max(1, Math.floor(cpus().length / 2));
    let probed = 0;

    await promisePool(files, concurrency, async (filePath) => {
      try {
        const probeResult = await ffmpeg.probe(filePath);
        const filename = basename(filePath);

        let detected;
        if (patternId) {
          const allPatterns = patternsModule.list();
          detected = allPatterns.find((p) => p.id === patternId) ?? null;
        } else {
          detected = patternsModule.detect(filename);
        }

        let tsSource: Date;
        if (detected) {
          try {
            const parsed = patternsModule.parse(filename, detected);
            tsSource = parsed.date;
          } catch {
            tsSource = probeResult.createdAt ?? new Date((await stat(filePath)).mtimeMs);
          }
        } else {
          tsSource = probeResult.createdAt ?? new Date((await stat(filePath)).mtimeMs);
        }

        clips.push(probeResultToClip(filePath, probeResult, detected?.id ?? null, tsSource));
      } catch (err) {
        errors.push({ path: filePath, reason: String(err) });
      }

      probed++;
      onProgress?.({ phase: 'probing', current: probed, total: files.length });
    });

    // Phase: importing to DB
    onProgress?.({ phase: 'importing', current: 0, total: clips.length });
    const db = getDb();
    let clipsNew = 0;
    let clipsRemoved = 0;

    if (rescan) {
      // Find existing clips for this directory
      const existingClips = db
        .select()
        .from(schema.clips)
        .all()
        .filter((c) => c.path.startsWith(dir));

      const existingPaths = new Set(existingClips.map((c) => c.path));
      const newPaths = new Set(clips.map((c) => c.path));

      // Remove clips no longer on disk
      for (const existing of existingClips) {
        if (!newPaths.has(existing.path)) {
          db.delete(schema.clips).where(eq(schema.clips.path, existing.path)).run();
          clipsRemoved++;
        }
      }

      // Insert only new clips
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (!existingPaths.has(clip.path)) {
          db.insert(schema.clips)
            .values({
              id: crypto.randomUUID(),
              path: clip.path,
              durationMs: Math.round(clip.duration * 1000),
              codecVideo: clip.codec,
              width: clip.width,
              height: clip.height,
              fps: clip.fps,
              patternId: clip.patternId,
              tsSource: clip.timestampSource.getTime(),
              fileSize: clip.size,
              createdAt: Date.now(),
            })
            .run();
          clipsNew++;
        }
        onProgress?.({ phase: 'importing', current: i + 1, total: clips.length });
      }
    } else {
      // Fresh import — skip clips that already exist (path is unique)
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const result = db
          .insert(schema.clips)
          .values({
            id: crypto.randomUUID(),
            path: clip.path,
            durationMs: Math.round(clip.duration * 1000),
            codecVideo: clip.codec,
            width: clip.width,
            height: clip.height,
            fps: clip.fps,
            patternId: clip.patternId,
            tsSource: clip.timestampSource.getTime(),
            fileSize: clip.size,
            createdAt: Date.now(),
          })
          .onConflictDoNothing()
          .run();
        if (result.changes > 0) clipsNew++;
        onProgress?.({ phase: 'importing', current: i + 1, total: clips.length });
      }
    }

    // Upsert folder record after importing (before grouping)
    try {
      const filesForFolder = clips.map((c) => ({
        name: basename(c.path),
        size: c.size,
      }));
      foldersModule.upsertAfterScan(dir, filesForFolder);
    } catch {
      // Non-fatal: folder record upsert failure should not abort the scan
    }

    // Phase: grouping
    onProgress?.({ phase: 'grouping', current: 0, total: 0 });
    const insertedPaths = new Set(clips.map((c) => c.path));
    const insertedClipIds = db
      .select({ id: schema.clips.id, path: schema.clips.path })
      .from(schema.clips)
      .all()
      .filter((c) => insertedPaths.has(c.path))
      .map((c) => c.id);

    let tripsGrouped = 0;
    if (insertedClipIds.length > 0) {
      const gapMinutes = options.gapMinutes;
      const grouped = await tripsModule.groupClips(
        insertedClipIds,
        gapMinutes ? { gapMinutes } : undefined,
      );
      tripsGrouped = grouped.length;
    }
    onProgress?.({ phase: 'grouping', current: 1, total: 1 });

    return {
      clipsFound: clips.length,
      clipsNew,
      clipsRemoved,
      tripsGrouped,
      errors,
    };
  },
};
