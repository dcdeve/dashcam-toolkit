import { spawn as cpSpawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, constants } from 'node:fs/promises';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic: string | null = require('ffmpeg-static');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeStatic: { path: string } = require('ffprobe-static');
import type {
  FfmpegModule,
  FfmpegError,
  ProbeResult,
  SpawnOptions,
  VideoStream,
  AudioStream,
} from '../../../interfaces/ffmpeg.js';
import { parseProgressLine } from './parse-progress.js';

const execFileAsync = promisify(execFile);

export class FfmpegModuleError extends Error {
  constructor(
    public readonly code: FfmpegError,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'FfmpegModuleError';
    if (cause) this.cause = cause;
  }
}

let cachedPath: string | null = null;

async function findFfmpeg(): Promise<string> {
  // 1. Try ffmpeg-static
  if (ffmpegStatic) {
    try {
      await access(ffmpegStatic, constants.X_OK);
      return ffmpegStatic;
    } catch {
      // not executable, fall through
    }
  }

  // 2. Fallback: system ffmpeg
  try {
    const { stdout } = await execFileAsync('which', ['ffmpeg']);
    const path = stdout.trim();
    if (path) return path;
  } catch {
    // not in PATH
  }

  throw new FfmpegModuleError(
    'FFMPEG_NOT_FOUND',
    'FFmpeg not found. Install ffmpeg or use ffmpeg-static.',
  );
}

function getFfprobePath(): string {
  return ffprobeStatic.path;
}

interface FfprobeFormat {
  duration?: string;
  size?: string;
  format_name?: string;
  tags?: { creation_time?: string };
}

interface FfprobeStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  bit_rate?: string;
  channels?: number;
  sample_rate?: string;
}

interface FfprobeOutput {
  format?: FfprobeFormat;
  streams?: FfprobeStream[];
}

function parseFrameRate(rFrameRate: string | undefined): number {
  if (!rFrameRate) return 0;
  const parts = rFrameRate.split('/');
  if (parts.length === 2) {
    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);
    return den > 0 ? num / den : 0;
  }
  return parseFloat(rFrameRate) || 0;
}

function extractVideoStream(streams: FfprobeStream[]): VideoStream | null {
  const s = streams.find((s) => s.codec_type === 'video');
  if (!s) return null;
  return {
    codec: s.codec_name ?? 'unknown',
    width: s.width ?? 0,
    height: s.height ?? 0,
    fps: parseFrameRate(s.r_frame_rate),
    bitrate: parseInt(s.bit_rate ?? '0', 10) || 0,
  };
}

function extractAudioStream(streams: FfprobeStream[]): AudioStream | null {
  const s = streams.find((s) => s.codec_type === 'audio');
  if (!s) return null;
  return {
    codec: s.codec_name ?? 'unknown',
    channels: s.channels ?? 0,
    sampleRate: parseInt(s.sample_rate ?? '0', 10) || 0,
    bitrate: parseInt(s.bit_rate ?? '0', 10) || 0,
  };
}

export const ffmpeg: FfmpegModule = {
  async detect(): Promise<string> {
    if (cachedPath) return cachedPath;

    const path = await findFfmpeg();

    // Verify it works
    try {
      await execFileAsync(path, ['-version']);
    } catch (err) {
      throw new FfmpegModuleError('FFMPEG_NOT_FOUND', `FFmpeg at ${path} is not functional`, err);
    }

    cachedPath = path;
    return path;
  },

  async probe(filePath: string): Promise<ProbeResult> {
    const ffprobePath = getFfprobePath();

    try {
      const { stdout } = await execFileAsync(ffprobePath, [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      const data: FfprobeOutput = JSON.parse(stdout);
      const format = data.format;
      const streams = data.streams ?? [];

      return {
        path: filePath,
        duration: parseFloat(format?.duration ?? '0'),
        size: parseInt(format?.size ?? '0', 10),
        video: extractVideoStream(streams),
        audio: extractAudioStream(streams),
        format: format?.format_name ?? 'unknown',
        createdAt: format?.tags?.creation_time ? new Date(format.tags.creation_time) : null,
      };
    } catch (err) {
      throw new FfmpegModuleError('FFMPEG_PROBE_FAILED', `Failed to probe ${filePath}`, err);
    }
  },

  async spawn(options: SpawnOptions): Promise<void> {
    const ffmpegPath = cachedPath ?? (await ffmpeg.detect());

    return new Promise<void>((resolve, reject) => {
      const ac = options.timeout ? new AbortController() : null;
      const timer =
        options.timeout && ac
          ? setTimeout(() => {
              ac.abort();
              reject(
                new FfmpegModuleError(
                  'FFMPEG_TIMEOUT',
                  `FFmpeg timed out after ${options.timeout}ms`,
                ),
              );
            }, options.timeout)
          : undefined;

      const proc = cpSpawn(ffmpegPath, options.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        ...(ac ? { signal: ac.signal } : {}),
      });

      let stderr = '';

      proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderr += text;

        if (options.onProgress) {
          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            const progress = parseProgressLine(line);
            if (progress) {
              options.onProgress(progress);
            }
          }
        }
      });

      proc.on('error', (err) => {
        if (timer) clearTimeout(timer);
        if ((err as NodeJS.ErrnoException).code === 'ABORT_ERR') return; // handled by timeout
        reject(new FfmpegModuleError('FFMPEG_SPAWN_FAILED', 'Failed to spawn FFmpeg', err));
      });

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(
            new FfmpegModuleError(
              'FFMPEG_EXIT_ERROR',
              `FFmpeg exited with code ${code}: ${stderr.slice(-500)}`,
            ),
          );
        }
      });
    });
  },
};

export { parseProgressLine } from './parse-progress.js';
