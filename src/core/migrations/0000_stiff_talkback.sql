CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`duration_ms` integer,
	`codec_video` text,
	`codec_audio` text,
	`width` integer,
	`height` integer,
	`fps` real,
	`pattern_id` text,
	`ts_source` integer,
	`trip_id` text,
	`file_size` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pattern_id`) REFERENCES `patterns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clips_path_idx` ON `clips` (`path`);--> statement-breakpoint
CREATE TABLE `patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`format` text NOT NULL,
	`regex` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`builtin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thumbnails` (
	`id` text PRIMARY KEY NOT NULL,
	`clip_id` text NOT NULL,
	`path` text NOT NULL,
	`timestamp_ms` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ts_start` integer NOT NULL,
	`ts_end` integer NOT NULL,
	`clip_count` integer DEFAULT 0 NOT NULL,
	`codec_compatible` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
