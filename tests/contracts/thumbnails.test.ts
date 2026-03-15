import { describe, it, expect } from 'vitest';
import type {
  ThumbnailConfig,
  ThumbnailEntry,
  ThumbnailError,
  ThumbnailsModule,
} from '../../src/interfaces/thumbnails.js';

describe('[thumbnails] - Contract', () => {
  const sampleEntry: ThumbnailEntry = {
    id: 'thumb-1',
    clipId: 'clip-1',
    tripId: null,
    path: '/cache/thumb_001.jpg',
    type: 'clip',
    timestampMs: 5000,
    createdAt: new Date(),
  };

  const stub: ThumbnailsModule = {
    async generate(_clipId: string) {
      return sampleEntry;
    },
    async generateScrub(_tripId: string) {
      return [{ ...sampleEntry, type: 'scrub' as const, tripId: 'trip-1', clipId: null }];
    },
    async get(_clipId: string) {
      return sampleEntry;
    },
    async getScrub(_tripId: string) {
      return [];
    },
    async clearCache() {
      return 0;
    },
  };

  it('implements all required methods', () => {
    expect(typeof stub.generate).toBe('function');
    expect(typeof stub.generateScrub).toBe('function');
    expect(typeof stub.get).toBe('function');
    expect(typeof stub.getScrub).toBe('function');
    expect(typeof stub.clearCache).toBe('function');
  });

  it('ThumbnailEntry has all required fields', () => {
    expect(sampleEntry).toHaveProperty('id');
    expect(sampleEntry).toHaveProperty('clipId');
    expect(sampleEntry).toHaveProperty('tripId');
    expect(sampleEntry).toHaveProperty('path');
    expect(sampleEntry).toHaveProperty('type');
    expect(sampleEntry).toHaveProperty('timestampMs');
  });

  it('config shape is valid', () => {
    const config: ThumbnailConfig = { cacheDir: '/tmp/thumbs', width: 320, scrubCount: 30 };
    expect(config).toHaveProperty('cacheDir');
    expect(typeof config.cacheDir).toBe('string');
  });

  it('error types cover expected cases', () => {
    const errors: ThumbnailError[] = [
      'THUMBNAIL_GENERATION_FAILED',
      'THUMBNAIL_NOT_FOUND',
      'THUMBNAIL_CACHE_FULL',
    ];
    expect(errors).toHaveLength(3);
  });
});
