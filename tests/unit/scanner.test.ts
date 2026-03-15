import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { db } from '../../src/core/modules/db/index.js';
import { scanner, ScannerModuleError } from '../../src/core/modules/scanner/index.js';
import type { ScanProgress } from '../../src/interfaces/scanner.js';

// Mock ffmpeg.probe to avoid needing real video files
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    probe: vi.fn(async (filePath: string) => ({
      path: filePath,
      duration: 60.0,
      size: 50_000_000,
      video: { codec: 'h264', width: 1920, height: 1080, fps: 30, bitrate: 5_000_000 },
      audio: { codec: 'aac', channels: 2, sampleRate: 44100, bitrate: 128000 },
      format: 'mp4',
      createdAt: null,
    })),
  },
}));

let tempDir: string;

async function createTempFiles(files: string[]): Promise<void> {
  for (const file of files) {
    const dir = join(tempDir, file.substring(0, file.lastIndexOf('/')));
    if (file.includes('/')) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(join(tempDir, file), Buffer.alloc(100));
  }
}

describe('[scanner] - listClips', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'scanner-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('finds video files in directory', async () => {
    await createTempFiles([
      '20240315_143022_F.mp4',
      '20240315_143122_R.mp4',
    ]);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(2);
  });

  it('finds files recursively in subdirectories', async () => {
    await createTempFiles([
      'front/20240315_143022_F.mp4',
      'rear/20240315_143122_R.mp4',
      'sub1/sub2/20240315_143222_F.mp4',
    ]);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(3);
  });

  it('filters by video extensions only', async () => {
    await createTempFiles([
      '20240315_143022_F.mp4',
      'readme.txt',
      'photo.jpg',
      'data.json',
    ]);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(1);
  });

  it('supports multiple video extensions', async () => {
    await createTempFiles([
      'clip1.mp4',
      'clip2.AVI',
      'clip3.mov',
      'clip4.MKV',
    ]);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(4);
  });

  it('respects max depth of 6', async () => {
    // Depth 6 — should be found
    await createTempFiles(['1/2/3/4/5/6/deep.mp4']);
    // Depth 7 — should NOT be found
    await createTempFiles(['1/2/3/4/5/6/7/too_deep.mp4']);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(1);
  });

  it('throws SCANNER_DIR_NOT_FOUND for nonexistent dir', async () => {
    await expect(scanner.listClips('/nonexistent/path')).rejects.toThrow(ScannerModuleError);
  });

  it('returns clips sorted by timestamp', async () => {
    await createTempFiles([
      '20240315_150000_F.mp4',
      '20240315_140000_F.mp4',
      '20240315_145000_F.mp4',
    ]);
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(3);
    // All get same fallback timestamp (mtime) since probe returns null createdAt,
    // but pattern detection extracts dates from filenames
    for (let i = 1; i < clips.length; i++) {
      expect(clips[i].timestampSource.getTime()).toBeGreaterThanOrEqual(
        clips[i - 1].timestampSource.getTime(),
      );
    }
  });

  it('returns empty array for empty directory', async () => {
    const clips = await scanner.listClips(tempDir);
    expect(clips).toHaveLength(0);
  });
});

describe('[scanner] - scan', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'scanner-test-'));
    db.connect({ path: ':memory:' });
    db.migrate();
  });

  afterEach(async () => {
    db.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('scans and imports clips to DB', async () => {
    await createTempFiles([
      '20240315_143022_F.mp4',
      '20240315_143122_R.mp4',
    ]);
    const result = await scanner.scan({ dir: tempDir });
    expect(result.clipsFound).toBe(2);
    expect(result.clipsNew).toBe(2);
    expect(result.clipsRemoved).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('rescan detects new clips', async () => {
    await createTempFiles(['20240315_143022_F.mp4']);
    await scanner.scan({ dir: tempDir });

    // Add another file
    await createTempFiles(['20240315_143122_R.mp4']);
    const result = await scanner.scan({ dir: tempDir, rescan: true });
    expect(result.clipsNew).toBe(1);
  });

  it('rescan detects removed clips', async () => {
    await createTempFiles([
      '20240315_143022_F.mp4',
      '20240315_143122_R.mp4',
    ]);
    await scanner.scan({ dir: tempDir });

    // Remove one file
    await rm(join(tempDir, '20240315_143122_R.mp4'));
    const result = await scanner.scan({ dir: tempDir, rescan: true });
    expect(result.clipsRemoved).toBe(1);
  });

  it('calls onProgress with all 4 phases', async () => {
    await createTempFiles(['20240315_143022_F.mp4']);
    const phases = new Set<ScanProgress['phase']>();
    await scanner.scan({ dir: tempDir }, (progress) => {
      phases.add(progress.phase);
    });
    expect(phases.has('listing')).toBe(true);
    expect(phases.has('probing')).toBe(true);
    expect(phases.has('importing')).toBe(true);
    expect(phases.has('grouping')).toBe(true);
  });

  it('throws SCANNER_DIR_NOT_FOUND for nonexistent dir', async () => {
    await expect(scanner.scan({ dir: '/nonexistent' })).rejects.toThrow(ScannerModuleError);
  });
});
