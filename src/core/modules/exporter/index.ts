import { writeFile, unlink, access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { format } from 'date-fns';
import { ffmpeg } from '../ffmpeg/index.js';
import { trips as tripsModule } from '../trips/index.js';
import type {
  ExporterModule,
  ExportOptions,
  ExportProgress,
  ExportTemplate,
  ExporterError,
  ExportPreset,
  ExportSpeed,
} from '../../../interfaces/exporter.js';
import type { Clip } from '../../../interfaces/trips.js';

export class ExporterModuleError extends Error {
  constructor(
    public readonly code: ExporterError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'ExporterModuleError';
    if (cause) this.cause = cause;
  }
}

const PRESET_CRF: Record<ExportPreset, number> = {
  high: 18,
  medium: 23,
  low: 28,
};

const SPEED_PRESET: Record<ExportSpeed, string> = {
  fast: 'veryfast',
  balanced: 'medium',
  max: 'slow',
};

const DEFAULT_TEMPLATES: ExportTemplate[] = [{ name: 'default', pattern: '{date}_{trip}_{seq}' }];

let cancelFn: (() => void) | null = null;

function generateOutputPath(clips: Clip[], template: string): string {
  const firstClip = clips[0];
  const dateStr = format(firstClip.timestampSource, 'yyyy-MM-dd_HH-mm');
  const tripId = firstClip.tripId ?? 'direct';
  const seq = '001';

  return (
    template.replace('{date}', dateStr).replace('{trip}', tripId).replace('{seq}', seq) + '.mp4'
  );
}

function buildConcatFileContent(paths: string[]): string {
  return paths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
}

function buildFfmpegArgs(
  fileListPath: string,
  outputPath: string,
  options: ExportOptions,
  totalDurationMs: number,
): string[] {
  const args = ['-y', '-f', 'concat', '-safe', '0', '-i', fileListPath];

  if (options.range) {
    args.push('-ss', String(options.range.startMs / 1000));
    args.push('-to', String(options.range.endMs / 1000));
  }

  if (options.reencode) {
    const crf = PRESET_CRF[options.preset ?? 'medium'];
    const ffmpegPreset = SPEED_PRESET[options.speed ?? 'balanced'];
    args.push('-c:v', 'libx264', '-preset', ffmpegPreset, '-crf', String(crf));
    args.push('-c:a', 'aac');
  } else {
    args.push('-c', 'copy');
  }

  // Pass total duration for progress calculation
  args.push('-progress', 'pipe:2', '-t', String(totalDurationMs / 1000));

  return [...args, outputPath];
}

async function resolveClips(options: ExportOptions): Promise<Clip[]> {
  const clips: Clip[] = [];

  if (options.tripIds && options.tripIds.length > 0) {
    for (const tripId of options.tripIds) {
      const tripClips = await tripsModule.getClips(tripId);
      clips.push(...tripClips);
    }
  }

  if (options.filePaths && options.filePaths.length > 0) {
    for (const filePath of options.filePaths) {
      const probeResult = await ffmpeg.probe(filePath);
      clips.push({
        id: '',
        path: filePath,
        filename: filePath.split('/').pop() ?? filePath,
        size: probeResult.size,
        duration: probeResult.duration,
        codec: probeResult.video?.codec ?? 'unknown',
        width: probeResult.video?.width ?? 0,
        height: probeResult.video?.height ?? 0,
        fps: probeResult.video?.fps ?? 0,
        patternId: null,
        timestampSource: probeResult.createdAt ?? new Date(),
        tripId: null,
        status: 'available',
        createdAt: new Date(),
      });
    }
  }

  return clips;
}

function checkLosslessCompatibility(clips: Clip[]): void {
  if (clips.length <= 1) return;
  const first = clips[0];

  for (let i = 1; i < clips.length; i++) {
    const c = clips[i];
    if (c.codec !== first.codec || c.width !== first.width || c.height !== first.height) {
      throw new ExporterModuleError(
        'EXPORTER_CODEC_INCOMPATIBLE',
        `Clip ${c.filename} has incompatible codec/resolution (${c.codec} ${c.width}x${c.height}) vs first clip (${first.codec} ${first.width}x${first.height}). Use --reencode to force re-encoding.`,
      );
    }
  }
}

export const exporter: ExporterModule = {
  async export(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<string> {
    if (
      (!options.tripIds || options.tripIds.length === 0) &&
      (!options.filePaths || options.filePaths.length === 0)
    ) {
      throw new ExporterModuleError('EXPORTER_NO_INPUT', 'No trip IDs or file paths provided');
    }

    // Phase: preparing
    onProgress?.({
      phase: 'preparing',
      percent: 0,
      currentFile: '',
      speed: 0,
    });

    const clips = await resolveClips(options);

    if (clips.length === 0) {
      throw new ExporterModuleError('EXPORTER_NO_INPUT', 'No clips found for export');
    }

    // Check codec compatibility for lossless
    if (!options.reencode) {
      checkLosslessCompatibility(clips);
    }

    // Ensure ffmpeg is available
    await ffmpeg.detect();

    // Generate output path
    const outputPath = options.output ?? generateOutputPath(clips, DEFAULT_TEMPLATES[0].pattern);

    // Check output doesn't exist
    try {
      await access(outputPath, constants.F_OK);
      throw new ExporterModuleError(
        'EXPORTER_OUTPUT_EXISTS',
        `Output file already exists: ${outputPath}`,
      );
    } catch (err) {
      if (err instanceof ExporterModuleError) throw err;
      // File doesn't exist — good
    }

    // Write concat file list
    const fileListPath = join(tmpdir(), `dashcam-concat-${Date.now()}.txt`);
    const fileListContent = buildConcatFileContent(clips.map((c) => c.path));
    await writeFile(fileListPath, fileListContent, 'utf-8');

    const totalDurationMs = clips.reduce((sum, c) => sum + c.duration * 1000, 0);
    const phase: ExportProgress['phase'] = options.reencode ? 'encoding' : 'concatenating';

    onProgress?.({
      phase,
      percent: 0,
      currentFile: clips[0].filename,
      speed: 0,
    });

    // Build and run FFmpeg
    const args = buildFfmpegArgs(fileListPath, outputPath, options, totalDurationMs);

    // Set up cancellation
    let cancelled = false;
    cancelFn = () => {
      cancelled = true;
    };

    try {
      await ffmpeg.spawn({
        args,
        onProgress: (p) => {
          if (cancelled) return;
          onProgress?.({
            phase,
            percent: Math.min(p.percent, 100),
            currentFile:
              clips[Math.floor((p.percent / 100) * clips.length)]?.filename ??
              clips[clips.length - 1].filename,
            speed: p.speed,
          });
        },
      });
    } catch (err) {
      if (cancelled) {
        throw new ExporterModuleError('EXPORTER_CANCELLED', 'Export was cancelled');
      }
      throw new ExporterModuleError('EXPORTER_FFMPEG_FAILED', `FFmpeg failed during export`, err);
    } finally {
      cancelFn = null;
      // Cleanup temp file
      await unlink(fileListPath).catch(() => {});
    }

    // Phase: finalizing
    onProgress?.({
      phase: 'finalizing',
      percent: 100,
      currentFile: outputPath,
      speed: 0,
    });

    return outputPath;
  },

  cancel(): void {
    if (cancelFn) {
      cancelFn();
    }
  },

  listTemplates(): ExportTemplate[] {
    return [...DEFAULT_TEMPLATES];
  },
};
