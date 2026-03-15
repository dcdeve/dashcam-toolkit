PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_thumbnails` (
	`id` text PRIMARY KEY NOT NULL,
	`clip_id` text,
	`trip_id` text,
	`path` text NOT NULL,
	`type` text DEFAULT 'clip' NOT NULL,
	`timestamp_ms` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_thumbnails`("id", "clip_id", "trip_id", "path", "type", "timestamp_ms", "width", "height", "created_at") SELECT "id", "clip_id", NULL, "path", 'clip', "timestamp_ms", "width", "height", 0 FROM `thumbnails`;--> statement-breakpoint
DROP TABLE `thumbnails`;--> statement-breakpoint
ALTER TABLE `__new_thumbnails` RENAME TO `thumbnails`;--> statement-breakpoint
PRAGMA foreign_keys=ON;