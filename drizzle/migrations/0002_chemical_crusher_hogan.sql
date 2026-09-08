CREATE TABLE `media_cleanup_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_cleanup_jobs_storage_key_unique` ON `media_cleanup_jobs` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_media_cleanup_pending` ON `media_cleanup_jobs` (`completed_at`,`created_at`);--> statement-breakpoint
ALTER TABLE `photos` ADD `thumbnail_storage_key` text;--> statement-breakpoint
ALTER TABLE `photos` ADD `thumbnail_url` text;--> statement-breakpoint
ALTER TABLE `photos` ADD `width` integer;--> statement-breakpoint
ALTER TABLE `photos` ADD `height` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `photos_thumbnail_storage_key_unique` ON `photos` (`thumbnail_storage_key`);