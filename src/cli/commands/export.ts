import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { db } from '../../core/modules/db/index.js';
import { ffmpeg } from '../../core/modules/ffmpeg/index.js';
import { exporter } from '../../core/modules/exporter/index.js';
import { getDbPath } from '../utils.js';
import type { ExportOptions, ExportPreset, TimeRange } from '../../interfaces/exporter.js';

interface ExportCommandOptions {
  dir?: string;
  range?: string;
  output?: string;
  reencode?: boolean;
  preset?: string;
}

const PRESET_MAP: Record<string, ExportPreset> = {
  alta: 'high',
  high: 'high',
  media: 'medium',
  medium: 'medium',
  baja: 'low',
  low: 'low',
};

function parseRange(range: string): TimeRange | null {
  const match = range.match(/^(\d{1,2}):(\d{2}):(\d{2})-(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;

  const startMs =
    (parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10)) * 1000;
  const endMs =
    (parseInt(match[4], 10) * 3600 + parseInt(match[5], 10) * 60 + parseInt(match[6], 10)) * 1000;

  if (endMs <= startMs) return null;
  return { startMs, endMs };
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function resolveTargets(targets: string[]): { tripIds: string[]; filePaths: string[] } {
  const tripIds: string[] = [];
  const filePaths: string[] = [];

  for (const t of targets) {
    if (isUuid(t)) {
      tripIds.push(t);
    } else {
      filePaths.push(resolve(t));
    }
  }

  return { tripIds, filePaths };
}

export async function exportAction(targets: string[], opts: ExportCommandOptions): Promise<void> {
  if (targets.length === 0 && !opts.dir) {
    console.error('Error: Provide trip IDs, file paths, or --dir');
    process.exitCode = 1;
    return;
  }

  // Validate range
  let range: TimeRange | undefined;
  if (opts.range) {
    const parsed = parseRange(opts.range);
    if (!parsed) {
      console.error('Error: Invalid range format. Use HH:MM:SS-HH:MM:SS');
      process.exitCode = 1;
      return;
    }
    range = parsed;
  }

  // Validate preset
  let preset: ExportPreset | undefined;
  if (opts.preset) {
    preset = PRESET_MAP[opts.preset.toLowerCase()];
    if (!preset) {
      console.error(`Error: Invalid preset "${opts.preset}". Use: high, medium, low`);
      process.exitCode = 1;
      return;
    }
  }

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
    // Build export options
    const exportOpts: ExportOptions = {
      output: opts.output ? resolve(opts.output) : undefined,
      reencode: opts.reencode,
      preset,
      range,
    };

    if (opts.dir) {
      // --dir mode: export all files in directory
      const dirFiles: string[] = [];
      const absDir = resolve(opts.dir);
      if (!existsSync(absDir)) {
        console.error(`Error: Directory not found: ${absDir}`);
        process.exitCode = 1;
        return;
      }
      dirFiles.push(absDir);
      exportOpts.filePaths = dirFiles;
    } else {
      const { tripIds, filePaths } = resolveTargets(targets);
      if (tripIds.length > 0) exportOpts.tripIds = tripIds;
      if (filePaths.length > 0) exportOpts.filePaths = filePaths;
    }

    console.log(`Exporting${opts.reencode ? ' (re-encode)' : ' (lossless)'}...`);

    const outputPath = await exporter.export(exportOpts, (progress) => {
      const pct = Math.round(progress.percent);
      process.stdout.write(
        `\r  ${progress.phase}... ${pct}%${progress.speed > 0 ? ` (${progress.speed.toFixed(1)}x)` : ''}`,
      );
    });

    console.log('');
    console.log('');
    console.log(`Done: ${outputPath}`);
  } catch (err) {
    console.log('');
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
