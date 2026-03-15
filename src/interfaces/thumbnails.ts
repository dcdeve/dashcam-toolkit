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
  id: number;
  clipId: number | null;
  tripId: number | null;
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
  generate(clipId: number): Promise<ThumbnailEntry>;
  generateScrub(tripId: number): Promise<ThumbnailEntry[]>;
  get(clipId: number): Promise<ThumbnailEntry | null>;
  getScrub(tripId: number): Promise<ThumbnailEntry[]>;
  clearCache(): Promise<number>;
}
