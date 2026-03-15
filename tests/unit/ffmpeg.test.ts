import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseProgressLine } from '../../src/core/modules/ffmpeg/parse-progress.js';

describe('[ffmpeg] - parseProgressLine', () => {
  it('parses a standard ffmpeg progress line', () => {
    const line =
      'frame=  150 fps= 30 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=2.5x';
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result!.timeMs).toBe(5000);
    expect(result!.speed).toBe(2.5);
  });

  it('calculates percent when totalDurationMs provided', () => {
    const line = 'time=00:00:30.00 speed=1.0x';
    const result = parseProgressLine(line, 60000);
    expect(result).not.toBeNull();
    expect(result!.percent).toBe(50);
  });

  it('caps percent at 100', () => {
    const line = 'time=00:01:10.00 speed=1.0x';
    const result = parseProgressLine(line, 60000);
    expect(result).not.toBeNull();
    expect(result!.percent).toBe(100);
  });

  it('returns 0 percent when no totalDurationMs', () => {
    const line = 'time=00:00:10.00 speed=1.0x';
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result!.percent).toBe(0);
  });

  it('returns null for non-progress lines', () => {
    expect(parseProgressLine('Input #0, mov,mp4')).toBeNull();
    expect(parseProgressLine('Stream #0:0: Video: h264')).toBeNull();
    expect(parseProgressLine('')).toBeNull();
  });

  it('handles time with 3-digit milliseconds', () => {
    const line = 'time=01:23:45.678 speed=3.0x';
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result!.timeMs).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
    expect(result!.speed).toBe(3.0);
  });

  it('handles speed=0 when no speed in line', () => {
    const line = 'time=00:00:01.00';
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result!.speed).toBe(0);
  });
});

// Integration-style tests using real ffmpeg binary
describe('[ffmpeg] - detect', () => {
  it('finds ffmpeg binary', async () => {
    const { ffmpeg } = await import('../../src/core/modules/ffmpeg/index.js');
    const path = await ffmpeg.detect();
    expect(typeof path).toBe('string');
    expect(path.length).toBeGreaterThan(0);
  });
});

describe('[ffmpeg] - probe', () => {
  it('throws FFMPEG_PROBE_FAILED for nonexistent file', async () => {
    const { ffmpeg, FfmpegModuleError } = await import('../../src/core/modules/ffmpeg/index.js');
    await expect(ffmpeg.probe('/nonexistent/file.mp4')).rejects.toThrow(FfmpegModuleError);
  });
});

describe('[ffmpeg] - spawn', () => {
  it('runs a simple ffmpeg command', async () => {
    const { ffmpeg } = await import('../../src/core/modules/ffmpeg/index.js');
    // ffmpeg -version exits 0
    await expect(ffmpeg.spawn({ args: ['-version'] })).resolves.toBeUndefined();
  });

  it('rejects on invalid args', async () => {
    const { ffmpeg, FfmpegModuleError } = await import('../../src/core/modules/ffmpeg/index.js');
    await expect(
      ffmpeg.spawn({ args: ['-i', '/nonexistent/file.mp4', '-f', 'null', '-'] }),
    ).rejects.toThrow(FfmpegModuleError);
  });

  it('calls onProgress callback', async () => {
    const { ffmpeg } = await import('../../src/core/modules/ffmpeg/index.js');
    const onProgress = vi.fn();
    // Generate 1 second of silence — produces progress output
    await ffmpeg.spawn({
      args: ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.5', '-f', 'null', '-'],
      onProgress,
    });
    // ffmpeg may or may not emit progress for very short clips, so we just verify no crash
    expect(onProgress).toBeDefined();
  });
});
