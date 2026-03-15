import { describe, it, expect } from 'vitest';
import type {
  ThumbnailConfig,
  ThumbnailEntry,
  ThumbnailError,
  ThumbnailsModule,
} from '../../src/interfaces/thumbnails.js';

describe('[thumbnails] - Contract', () => {
  const sampleEntry: ThumbnailEntry = {
    id: 1,
    clipId: 1,
    tripId: null,
    path: '/cache/thumb_001.jpg',
    type: 'clip',
    timestampMs: 5000,
    createdAt: new Date(),
  };

  const stub: ThumbnailsModule = {
    async generate(_clipId: number) {
      return sampleEntry;
    },
    async generateScrub(_tripId: number) {
      return [{ ...sampleEntry, type: 'scrub' as const, tripId: 1, clipId: null }];
    },
    async get(_clipId: number) {
      return sampleEntry;
    },
    async getScrub(_tripId: number) {
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
