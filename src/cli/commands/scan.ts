import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../../core/modules/db/index.js';
import { ffmpeg } from '../../core/modules/ffmpeg/index.js';
import { scanner } from '../../core/modules/scanner/index.js';
import type { ScanProgress } from '../../interfaces/scanner.js';

interface ScanCommandOptions {
  rescan?: boolean;
  pattern?: string;
  gap: string;
}

function getDbPath(): string {
  const dir = join(homedir(), '.dashcam-toolkit');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'dashcam.db');
}

function formatProgress(progress: ScanProgress): void {
  switch (progress.phase) {
    case 'listing':
      if (progress.total > 0) {
        process.stdout.write(`\r  Listing files... ${progress.total} found`);
      }
      break;
    case 'probing':
      process.stdout.write(`\r  Probing clips... ${progress.current}/${progress.total}`);
      break;
    case 'importing':
      process.stdout.write(`\r  Importing to database... ${progress.current}/${progress.total}`);
      break;
    case 'grouping':
      process.stdout.write(`\r  Grouping trips... done`);
      break;
  }
}

export async function scanAction(dir: string, opts: ScanCommandOptions): Promise<void> {
  const absDir = resolve(dir);
  const gapMinutes = parseInt(opts.gap, 10);

  if (isNaN(gapMinutes) || gapMinutes <= 0) {
    console.error('Error: --gap must be a positive number');
    process.exitCode = 1;
    return;
  }

  console.log(`Scanning ${absDir}...`);

  // Init DB
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();

  // Detect FFmpeg
  try {
    await ffmpeg.detect();
  } catch {
    console.error('Error: FFmpeg not found. Install ffmpeg or ensure ffmpeg-static is available.');
    process.exitCode = 1;
    db.close();
    return;
  }

  try {
    const result = await scanner.scan(
      {
        dir: absDir,
        rescan: opts.rescan,
        patternId: opts.pattern,
        gapMinutes,
      },
      (progress) => formatProgress(progress),
    );

    // Clear last progress line
    console.log('');
    console.log('');
    console.log('Results:');
    console.log(
      `  Clips found: ${result.clipsFound} (${result.clipsNew} new, ${result.clipsRemoved} removed)`,
    );
    console.log(`  Trips grouped: ${result.tripsGrouped}`);

    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      for (const err of result.errors.slice(0, 5)) {
        console.log(`    - ${err.path}: ${err.reason}`);
      }
      if (result.errors.length > 5) {
        console.log(`    ... and ${result.errors.length - 5} more`);
      }
    } else {
      console.log('  Errors: 0');
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
