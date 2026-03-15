// Thumbnails module interface

export type ThumbnailType = 'clip' | 'scrub';

export interface ThumbnailConfig {
  /** Output directory for cached thumbnails */
  cacheDir: string;
  /** Width in pixels (default: 320) */
  width?: number;
  /** Number of scrub thumbnails per trip (default: 30) */
  scrubCount?: number;
}

export interface ThumbnailEntry {
  id: string;
  clipId: string | null;
  tripId: string | null;
  path: string;
  type: ThumbnailType;
  timestampMs: number;
  createdAt: Date;
}

export type ThumbnailError =
  | 'THUMBNAIL_GENERATION_FAILED'
  | 'THUMBNAIL_NOT_FOUND'
  | 'THUMBNAIL_CACHE_FULL';

export interface ThumbnailsModule {
  generate(clipId: string): Promise<ThumbnailEntry>;
  generateScrub(tripId: string): Promise<ThumbnailEntry[]>;
  get(clipId: string): Promise<ThumbnailEntry | null>;
  getScrub(tripId: string): Promise<ThumbnailEntry[]>;
  clearCache(): Promise<number>;
}
