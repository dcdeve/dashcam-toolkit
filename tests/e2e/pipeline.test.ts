import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require('ffmpeg-static');

import { db } from '../../src/core/modules/db/index.js';
import { ffmpeg } from '../../src/core/modules/ffmpeg/index.js';
import { scanner } from '../../src/core/modules/scanner/index.js';
import { trips as tripsModule } from '../../src/core/modules/trips/index.js';
import { exporter } from '../../src/core/modules/exporter/index.js';
import { patterns } from '../../src/core/modules/patterns/index.js';

const TEST_DIR = join(tmpdir(), `dashcam-e2e-${Date.now()}`);
const CLIPS_DIR = join(TEST_DIR, 'DCIM');
const DB_PATH = join(TEST_DIR, 'test.db');
const OUTPUT_PATH = join(TEST_DIR, 'output.mp4');

// Generate a short test clip with ffmpeg
function generateClip(filename: string, durationSecs: number): void {
  const outputPath = join(CLIPS_DIR, filename);
  execFileSync(ffmpegPath, [
    '-f',
    'lavfi',
    '-i',
    `color=c=blue:s=320x240:d=${durationSecs}:r=15`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=440:duration=${durationSecs}:sample_rate=22050`,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-crf',
    '51',
    '-c:a',
    'aac',
    '-b:a',
    '32k',
    '-y',
    outputPath,
  ]);
}

describe('[e2e] - Pipeline scan → trips → export', () => {
  beforeAll(() => {
    mkdirSync(CLIPS_DIR, { recursive: true });

    // Generate 4 clips with generic-ts naming (YYYY-MM-DD_HH-mm-ss.MP4)
    // Trip 1: 3 consecutive clips (2 min gap between them)
    generateClip('2026-03-15_08-00-00.MP4', 2);
    generateClip('2026-03-15_08-02-02.MP4', 2);
    generateClip('2026-03-15_08-04-04.MP4', 2);

    // Trip 2: 1 clip with 30 min gap from trip 1
    generateClip('2026-03-15_08-30-00.MP4', 2);

    // Init DB
    db.connect({ path: DB_PATH });
    db.migrate();
  });

  afterAll(() => {
    db.close();
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('detects ffmpeg', async () => {
    const path = await ffmpeg.detect();
    expect(path).toBeTruthy();
  });

  it('lists patterns', () => {
    const all = patterns.list();
    expect(all.length).toBeGreaterThan(0);
  });

  it('scans directory and finds clips', async () => {
    const result = await scanner.scan({ dir: CLIPS_DIR, gapMinutes: 5 });

    expect(result.clipsFound).toBe(4);
    expect(result.clipsNew).toBe(4);
    expect(result.errors).toHaveLength(0);
    expect(result.tripsGrouped).toBeGreaterThanOrEqual(1);
  });

  it('created trips with correct grouping', async () => {
    const all = await tripsModule.list();
    expect(all.length).toBe(2);

    // Trip 1 should have 3 clips
    const trip1 = all.find((t) => t.clipCount === 3);
    expect(trip1).toBeDefined();
    expect(trip1!.codecCompat).toBe('compatible');

    // Trip 2 should have 1 clip
    const trip2 = all.find((t) => t.clipCount === 1);
    expect(trip2).toBeDefined();
  });

  it('retrieves clips for a trip', async () => {
    const all = await tripsModule.list();
    const trip1 = all.find((t) => t.clipCount === 3)!;
    const clips = await tripsModule.getClips(trip1.id);

    expect(clips).toHaveLength(3);
    expect(clips[0].codec).toBe('h264');
    expect(clips[0].width).toBe(320);
    expect(clips[0].height).toBe(240);
  });

  it('exports trip lossless', async () => {
    const all = await tripsModule.list();
    const trip1 = all.find((t) => t.clipCount === 3)!;

    const outputPath = await exporter.export({
      tripIds: [trip1.id],
      output: OUTPUT_PATH,
    });

    expect(outputPath).toBe(OUTPUT_PATH);
    expect(existsSync(OUTPUT_PATH)).toBe(true);
  });

  it('exported file is valid video', async () => {
    const probe = await ffmpeg.probe(OUTPUT_PATH);

    expect(probe.duration).toBeGreaterThan(0);
    expect(probe.video?.codec).toBe('h264');
    expect(probe.video?.width).toBe(320);
    expect(probe.video?.height).toBe(240);
  });
});
