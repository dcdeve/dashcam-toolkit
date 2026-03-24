import { readdir, stat, access, constants } from 'node:fs/promises';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
import type {
  FoldersModule,
  ScannedFolder,
  FolderHealthResult,
  FoldersError,
} from '../../../interfaces/folders.js';

export class FoldersModuleError extends Error {
  constructor(
    public readonly code: FoldersError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'FoldersModuleError';
    if (cause) this.cause = cause;
  }
}

function computeHash(files: Array<{ name: string; size: number }>): string {
  const entries = files
    .map((f) => `${f.name}:${f.size}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(entries).digest('hex').slice(0, 32);
}

function rowToScannedFolder(row: {
  id: string;
  path: string;
  lastScanAt: number;
  clipCountAtScan: number;
  filesHashAtScan: string;
  createdAt: number;
}): ScannedFolder {
  return {
    id: row.id,
    path: row.path,
    displayName: basename(row.path),
    lastScanAt: new Date(row.lastScanAt),
    clipCountAtScan: row.clipCountAtScan,
    filesHashAtScan: row.filesHashAtScan,
    createdAt: new Date(row.createdAt),
  };
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.mkv', '.ts']);

async function listVideoFilesInDir(dir: string): Promise<Array<{ name: string; size: number }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: Array<{ name: string; size: number }> = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (!VIDEO_EXTENSIONS.has(lower.slice(lower.lastIndexOf('.')))) continue;
    const s = await stat(`${dir}/${entry.name}`);
    results.push({ name: entry.name, size: s.size });
  }
  return results;
}

export const folders: FoldersModule = {
  list(): ScannedFolder[] {
    const db = getDb();
    const rows = db
      .select()
      .from(schema.scannedFolders)
      .orderBy(desc(schema.scannedFolders.lastScanAt))
      .all();
    return rows.map(rowToScannedFolder);
  },

  upsertAfterScan(dir: string, files: Array<{ name: string; size: number }>): ScannedFolder {
    const db = getDb();
    const filesHashAtScan = computeHash(files);
    const now = Date.now();

    const existing = db
      .select()
      .from(schema.scannedFolders)
      .where(eq(schema.scannedFolders.path, dir))
      .get();

    if (existing) {
      db.update(schema.scannedFolders)
        .set({
          lastScanAt: now,
          clipCountAtScan: files.length,
          filesHashAtScan,
        })
        .where(eq(schema.scannedFolders.path, dir))
        .run();

      return rowToScannedFolder({
        ...existing,
        lastScanAt: now,
        clipCountAtScan: files.length,
        filesHashAtScan,
      });
    }

    const id = crypto.randomUUID();
    db.insert(schema.scannedFolders)
      .values({
        id,
        path: dir,
        lastScanAt: now,
        clipCountAtScan: files.length,
        filesHashAtScan,
        createdAt: now,
      })
      .run();

    return rowToScannedFolder({
      id,
      path: dir,
      lastScanAt: now,
      clipCountAtScan: files.length,
      filesHashAtScan,
      createdAt: now,
    });
  },

  async healthCheck(folderId: string): Promise<FolderHealthResult> {
    const db = getDb();
    const row = db
      .select()
      .from(schema.scannedFolders)
      .where(eq(schema.scannedFolders.id, folderId))
      .get();

    if (!row) {
      throw new FoldersModuleError('FOLDERS_NOT_FOUND', `Folder not found: ${folderId}`);
    }

    try {
      await access(row.path, constants.R_OK);
    } catch {
      return { folderId, status: 'unknown' };
    }

    let diskFiles: Array<{ name: string; size: number }>;
    try {
      diskFiles = await listVideoFilesInDir(row.path);
    } catch {
      return { folderId, status: 'unknown' };
    }

    const diskHash = computeHash(diskFiles);
    const status = diskHash === row.filesHashAtScan ? 'ok' : 'stale';
    return { folderId, status };
  },

  remove(folderId: string): void {
    const db = getDb();
    const row = db
      .select()
      .from(schema.scannedFolders)
      .where(eq(schema.scannedFolders.id, folderId))
      .get();

    if (!row) {
      throw new FoldersModuleError('FOLDERS_NOT_FOUND', `Folder not found: ${folderId}`);
    }

    // Atomic transaction: remove clips + trips + folder record
    db.transaction(() => {
      // Find trips that belong exclusively to this folder (first clip path starts with folder path)
      const allClips = db.select().from(schema.clips).all();
      const folderClips = allClips.filter((c) => c.path.startsWith(row.path));
      const folderClipIds = new Set(folderClips.map((c) => c.id));

      // Find trip IDs that have at least one clip in this folder
      const tripIds = new Set(folderClips.map((c) => c.tripId).filter(Boolean) as string[]);

      // Only delete trips where ALL clips are in this folder
      const tripsToDelete: string[] = [];
      for (const tripId of tripIds) {
        const tripClips = allClips.filter((c) => c.tripId === tripId);
        if (tripClips.every((c) => folderClipIds.has(c.id))) {
          tripsToDelete.push(tripId);
        }
      }

      // Delete clips that belong to this folder
      for (const clip of folderClips) {
        db.delete(schema.clips).where(eq(schema.clips.id, clip.id)).run();
      }

      // Delete trips that are now empty
      for (const tripId of tripsToDelete) {
        db.delete(schema.trips).where(eq(schema.trips.id, tripId)).run();
      }

      // Delete the folder record
      db.delete(schema.scannedFolders).where(eq(schema.scannedFolders.id, folderId)).run();
    });
  },
};
