import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── DB mock ─────────────────────────────────────────────────────────────────

const mockRun = vi.fn();
const mockGet = vi.fn().mockReturnValue(undefined);
const mockAll = vi.fn().mockReturnValue([]);
const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
const mockWhere = vi.fn().mockReturnValue({ all: mockAll, get: mockGet, run: mockRun, orderBy: mockOrderBy });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, all: mockAll });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockValues = vi.fn().mockReturnValue({ run: mockRun });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockDeleteWhere = vi.fn().mockReturnValue({ run: mockRun });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
const mockTransaction = vi.fn().mockImplementation((fn: () => void) => fn());

vi.mock('../../src/core/modules/db/index.js', () => ({
  getDb: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    transaction: mockTransaction,
  }),
  schema: {
    scannedFolders: { id: 'id', path: 'path', lastScanAt: 'last_scan_at', clipCountAtScan: 'clip_count_at_scan', filesHashAtScan: 'files_hash_at_scan', createdAt: 'created_at' },
    clips: { id: 'id', path: 'path', tripId: 'trip_id' },
    trips: { id: 'id' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
  desc: (col: unknown) => ({ col, op: 'desc' }),
}));

vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  readdir: vi.fn().mockResolvedValue([]),
  stat: vi.fn(),
  constants: { R_OK: 4 },
}));

import { folders, FoldersModuleError } from '../../src/core/modules/folders/index.js';
import * as fsp from 'node:fs/promises';

const sampleRow = {
  id: 'f-001',
  path: '/mnt/sd/cam',
  lastScanAt: 1700000000000,
  clipCountAtScan: 2,
  filesHashAtScan: 'abcdef1234567890abcdef1234567890',
  createdAt: 1699000000000,
};

describe('[folders] - hash algorithm (determinism)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, all: mockAll });
    mockOrderBy.mockReturnValue({ all: mockAll });
    mockWhere.mockReturnValue({ all: mockAll, get: mockGet, run: mockRun, orderBy: mockOrderBy });
    mockGet.mockReturnValue(undefined);
  });

  it('same file set produces identical hash on repeated calls', () => {
    const files = [{ name: 'clip1.mp4', size: 1024 }, { name: 'clip2.mp4', size: 2048 }];
    const f1 = folders.upsertAfterScan('/path/a', files);
    mockGet.mockReturnValue(undefined);
    const f2 = folders.upsertAfterScan('/path/b', files);
    expect(f1.filesHashAtScan).toBe(f2.filesHashAtScan);
  });

  it('hash is order-independent (sorted before hashing)', () => {
    mockGet.mockReturnValue(undefined);
    const f1 = folders.upsertAfterScan('/path/a', [
      { name: 'z.mp4', size: 300 },
      { name: 'a.mp4', size: 100 },
      { name: 'm.mp4', size: 200 },
    ]);
    mockGet.mockReturnValue(undefined);
    const f2 = folders.upsertAfterScan('/path/b', [
      { name: 'a.mp4', size: 100 },
      { name: 'm.mp4', size: 200 },
      { name: 'z.mp4', size: 300 },
    ]);
    expect(f1.filesHashAtScan).toBe(f2.filesHashAtScan);
  });

  it('different file names produce different hashes', () => {
    mockGet.mockReturnValue(undefined);
    const f1 = folders.upsertAfterScan('/path/a', [{ name: 'clip1.mp4', size: 100 }]);
    mockGet.mockReturnValue(undefined);
    const f2 = folders.upsertAfterScan('/path/b', [{ name: 'clip2.mp4', size: 100 }]);
    expect(f1.filesHashAtScan).not.toBe(f2.filesHashAtScan);
  });

  it('same name but different size produces different hash', () => {
    mockGet.mockReturnValue(undefined);
    const f1 = folders.upsertAfterScan('/path/a', [{ name: 'clip.mp4', size: 100 }]);
    mockGet.mockReturnValue(undefined);
    const f2 = folders.upsertAfterScan('/path/b', [{ name: 'clip.mp4', size: 200 }]);
    expect(f1.filesHashAtScan).not.toBe(f2.filesHashAtScan);
  });

  it('empty file list produces a valid 32-char hash', () => {
    mockGet.mockReturnValue(undefined);
    const f = folders.upsertAfterScan('/path/a', []);
    expect(f.filesHashAtScan).toMatch(/^[0-9a-f]{32}$/);
  });

  it('hash is always exactly 32 lowercase hex characters', () => {
    mockGet.mockReturnValue(undefined);
    const f = folders.upsertAfterScan('/path/a', [
      { name: 'long-filename-clip.mp4', size: 9999999 },
    ]);
    expect(f.filesHashAtScan).toHaveLength(32);
    expect(f.filesHashAtScan).toMatch(/^[0-9a-f]+$/);
  });
});

describe('[folders] - health check state transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, all: mockAll });
    mockOrderBy.mockReturnValue({ all: mockAll });
    mockWhere.mockReturnValue({ all: mockAll, get: mockGet, run: mockRun, orderBy: mockOrderBy });
  });

  it('status is unknown when path is not accessible', async () => {
    mockGet.mockReturnValueOnce(sampleRow);
    vi.mocked(fsp.access).mockRejectedValueOnce(new Error('ENOENT'));
    const result = await folders.healthCheck('f-001');
    expect(result.status).toBe('unknown');
  });

  it('status is ok when disk hash matches stored hash', async () => {
    // Build a row with known hash (empty file list → known hash)
    // We need to know what hash the empty list produces
    // computeHash([]) = sha256('').slice(0,32) = 'e3b0c44298fc1c149afbf4c8996fb924'
    const emptyHashRow = { ...sampleRow, filesHashAtScan: 'e3b0c44298fc1c149afbf4c8996fb924' };
    mockGet.mockReturnValueOnce(emptyHashRow);
    vi.mocked(fsp.access).mockResolvedValueOnce(undefined);
    // readdir returns no video files → empty hash → matches
    vi.mocked(fsp.readdir).mockResolvedValueOnce([]);
    const result = await folders.healthCheck('f-001');
    expect(result.status).toBe('ok');
  });

  it('status is stale when disk hash differs from stored hash', async () => {
    mockGet.mockReturnValueOnce(sampleRow); // stored hash: 'abcdef...'
    vi.mocked(fsp.access).mockResolvedValueOnce(undefined);
    vi.mocked(fsp.readdir).mockResolvedValueOnce([
      { name: 'newfile.mp4', isFile: () => true, isDirectory: () => false } as unknown as import('node:fs').Dirent,
    ]);
    vi.mocked(fsp.stat).mockResolvedValueOnce({ size: 1234 } as import('node:fs').Stats);
    const result = await folders.healthCheck('f-001');
    expect(result.status).toBe('stale');
  });

  it('status is never checking (checking is UI-only)', async () => {
    mockGet.mockReturnValueOnce(sampleRow);
    vi.mocked(fsp.access).mockResolvedValueOnce(undefined);
    vi.mocked(fsp.readdir).mockResolvedValueOnce([]);
    const result = await folders.healthCheck('f-001');
    expect(result.status).not.toBe('checking');
  });

  it('throws FOLDERS_NOT_FOUND error class with correct code', async () => {
    mockGet.mockReturnValueOnce(undefined);
    await expect(folders.healthCheck('missing')).rejects.toBeInstanceOf(FoldersModuleError);
    mockGet.mockReturnValueOnce(undefined);
    await expect(folders.healthCheck('missing')).rejects.toMatchObject({
      code: 'FOLDERS_NOT_FOUND',
    });
  });
});
