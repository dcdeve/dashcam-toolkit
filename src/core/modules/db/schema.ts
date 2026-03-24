import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const patterns = sqliteTable('patterns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  format: text('format').notNull(),
  regex: text('regex').notNull(),
  priority: integer('priority').notNull().default(0),
  builtin: integer('builtin', { mode: 'boolean' }).notNull().default(false),
});

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tsStart: integer('ts_start').notNull(),
  tsEnd: integer('ts_end').notNull(),
  clipCount: integer('clip_count').notNull().default(0),
  codecCompatible: integer('codec_compatible', { mode: 'boolean' }).notNull().default(true),
  status: text('status', { enum: ['pending', 'exported'] })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const clips = sqliteTable(
  'clips',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    durationMs: integer('duration_ms'),
    codecVideo: text('codec_video'),
    codecAudio: text('codec_audio'),
    width: integer('width'),
    height: integer('height'),
    fps: real('fps'),
    patternId: text('pattern_id').references(() => patterns.id),
    tsSource: integer('ts_source'),
    tripId: text('trip_id').references(() => trips.id),
    fileSize: integer('file_size'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => [uniqueIndex('clips_path_idx').on(table.path)],
);

export const thumbnails = sqliteTable('thumbnails', {
  id: text('id').primaryKey(),
  clipId: text('clip_id').references(() => clips.id),
  tripId: text('trip_id').references(() => trips.id),
  path: text('path').notNull(),
  type: text('type', { enum: ['clip', 'scrub'] })
    .notNull()
    .default('clip'),
  timestampMs: integer('timestamp_ms').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const scannedFolders = sqliteTable(
  'scanned_folders',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    lastScanAt: integer('last_scan_at').notNull(),
    clipCountAtScan: integer('clip_count_at_scan').notNull(),
    filesHashAtScan: text('files_hash_at_scan').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => [uniqueIndex('scanned_folders_path_idx').on(table.path)],
);
