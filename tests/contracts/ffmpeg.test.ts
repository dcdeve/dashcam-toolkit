import { describe, it, expect } from 'vitest';
import type {
  ProbeResult,
  SpawnOptions,
  FfmpegProgress,
  FfmpegError,
  FfmpegModule,
} from '../../src/interfaces/ffmpeg.js';

describe('[ffmpeg] - Contract', () => {
  const stub: FfmpegModule = {
    async detect() {
      return '/usr/bin/ffmpeg';
    },
    async probe(_filePath: string): Promise<ProbeResult> {
      return {
        path: '/test.mp4',
        duration: 120,
        size: 1024000,
        video: { codec: 'h264', width: 1920, height: 1080, fps: 30, bitrate: 5000000 },
        audio: { codec: 'aac', channels: 2, sampleRate: 44100, bitrate: 128000 },
        format: 'mp4',
        createdAt: new Date(),
      };
    },
    async spawn(_options: SpawnOptions) {},
  };

  it('implements all required methods', () => {
    expect(typeof stub.detect).toBe('function');
    expect(typeof stub.probe).toBe('function');
    expect(typeof stub.spawn).toBe('function');
  });

  it('probe returns ProbeResult shape', async () => {
    const result = await stub.probe('/test.mp4');
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('video');
    expect(result).toHaveProperty('audio');
    expect(result).toHaveProperty('format');
    expect(result).toHaveProperty('createdAt');
  });

  it('progress callback shape is valid', () => {
    const progress: FfmpegProgress = { percent: 50, timeMs: 5000, speed: 2.0 };
    expect(typeof progress.percent).toBe('number');
    expect(typeof progress.timeMs).toBe('number');
    expect(typeof progress.speed).toBe('number');
  });

  it('error types cover expected cases', () => {
    const errors: FfmpegError[] = [
      'FFMPEG_NOT_FOUND',
      'FFMPEG_PROBE_FAILED',
      'FFMPEG_SPAWN_FAILED',
      'FFMPEG_TIMEOUT',
      'FFMPEG_EXIT_ERROR',
    ];
    expect(errors).toHaveLength(5);
  });
});
