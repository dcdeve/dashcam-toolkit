CREATE TABLE `scanned_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`last_scan_at` integer NOT NULL,
	`clip_count_at_scan` integer NOT NULL,
	`files_hash_at_scan` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scanned_folders_path_idx` ON `scanned_folders` (`path`);
