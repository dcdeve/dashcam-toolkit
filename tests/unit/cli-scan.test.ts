import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db
const mockConnect = vi.fn();
const mockMigrate = vi.fn();
const mockClose = vi.fn();
vi.mock('../../src/core/modules/db/index.js', () => ({
  db: {
    connect: (...args: unknown[]) => mockConnect(...args),
    migrate: (...args: unknown[]) => mockMigrate(...args),
    close: (...args: unknown[]) => mockClose(...args),
  },
}));

// Mock ffmpeg
const mockDetect = vi.fn().mockResolvedValue('/usr/bin/ffmpeg');
vi.mock('../../src/core/modules/ffmpeg/index.js', () => ({
  ffmpeg: {
    detect: (...args: unknown[]) => mockDetect(...args),
  },
}));

// Mock scanner
const mockScan = vi.fn().mockResolvedValue({
  clipsFound: 10,
  clipsNew: 10,
  clipsRemoved: 0,
  tripsGrouped: 3,
  errors: [],
});
vi.mock('../../src/core/modules/scanner/index.js', () => ({
  scanner: {
    scan: (...args: unknown[]) => mockScan(...args),
  },
}));

import { scanAction } from '../../src/cli/commands/scan.js';

describe('[cli] - scan command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetect.mockResolvedValue('/usr/bin/ffmpeg');
    mockScan.mockResolvedValue({
      clipsFound: 10,
      clipsNew: 10,
      clipsRemoved: 0,
      tripsGrouped: 3,
      errors: [],
    });
  });

  it('initializes DB and calls scanner.scan with correct options', async () => {
    await scanAction('/mnt/sd', { gap: '5' });

    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockMigrate).toHaveBeenCalledOnce();
    expect(mockDetect).toHaveBeenCalledOnce();
    expect(mockScan).toHaveBeenCalledOnce();

    const scanOpts = mockScan.mock.calls[0][0];
    expect(scanOpts.dir).toContain('/mnt/sd');
    expect(scanOpts.gapMinutes).toBe(5);
    expect(scanOpts.rescan).toBeUndefined();
    expect(scanOpts.patternId).toBeUndefined();
  });

  it('passes rescan and pattern options', async () => {
    await scanAction('/mnt/sd', { gap: '10', rescan: true, pattern: 'garmin' });

    const scanOpts = mockScan.mock.calls[0][0];
    expect(scanOpts.rescan).toBe(true);
    expect(scanOpts.patternId).toBe('garmin');
    expect(scanOpts.gapMinutes).toBe(10);
  });

  it('closes DB even on scanner error', async () => {
    mockScan.mockRejectedValueOnce(new Error('scan failed'));

    await scanAction('/mnt/sd', { gap: '5' });

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('closes DB on ffmpeg detect failure', async () => {
    mockDetect.mockRejectedValueOnce(new Error('not found'));

    await scanAction('/mnt/sd', { gap: '5' });

    expect(mockClose).toHaveBeenCalledOnce();
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('rejects invalid gap value', async () => {
    await scanAction('/mnt/sd', { gap: 'abc' });

    expect(mockScan).not.toHaveBeenCalled();
  });
});
