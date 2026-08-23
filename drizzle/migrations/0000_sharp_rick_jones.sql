CREATE TABLE `achievement_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`kind` text NOT NULL,
	`threshold` real NOT NULL,
	`icon` text DEFAULT 'Trophy' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_definitions_code_unique` ON `achievement_definitions` (`code`);--> statement-breakpoint
CREATE TABLE `action_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`amount` real,
	`source_id` text,
	`occurred_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `album_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `album_photo_unique` ON `album_photos` (`album_id`,`photo_id`);--> statement-breakpoint
CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`visit_id` text,
	`cover_photo_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `anniversaries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `anti_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`reason` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`migration_target_date` text,
	`journey_started_at` text NOT NULL,
	`birth_date` text,
	`virtual_journey_distance` integer DEFAULT 1000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audio_records` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`audio_url` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`duration_seconds` integer,
	`recorded_at` integer NOT NULL,
	`latitude` real,
	`longitude` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audio_records_storage_key_unique` ON `audio_records` (`storage_key`);--> statement-breakpoint
CREATE TABLE `bingo_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bucket_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'BUCKET' NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `career_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`target_value` real,
	`current_value` real,
	`unit` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`photo_id` text,
	`place_id` text,
	`discovered_at` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`place_id`) REFERENCES `favorite_places`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `decision_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`reason` text NOT NULL,
	`decided_at` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorite_places` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`visited` integer DEFAULT false NOT NULL,
	`rank` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`current_savings` integer DEFAULT 0 NOT NULL,
	`target_savings` integer DEFAULT 2000000 NOT NULL,
	`monthly_saving_target` integer DEFAULT 50000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fixed_cost_reductions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`monthly_amount` integer NOT NULL,
	`effective_date` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `focus_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`note` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `future_diaries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`future_date` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `future_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`open_on` text NOT NULL,
	`opened_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `future_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`target_year` integer NOT NULL,
	`residence` text NOT NULL,
	`work_style` text NOT NULL,
	`work_days_per_week` real NOT NULL,
	`monthly_income` integer NOT NULL,
	`hobbies` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `future_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ideal_day_items` (
	`id` text PRIMARY KEY NOT NULL,
	`time` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ideal_week_items` (
	`id` text PRIMARY KEY NOT NULL,
	`weekday` integer NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `income_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`monthly_amount` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `island_quests` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`random_eligible` integer DEFAULT true NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `life_simulations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '基本プラン' NOT NULL,
	`salary` integer DEFAULT 0 NOT NULL,
	`side_income` integer DEFAULT 0 NOT NULL,
	`rent` integer DEFAULT 0 NOT NULL,
	`food` integer DEFAULT 0 NOT NULL,
	`utilities` integer DEFAULT 0 NOT NULL,
	`internet` integer DEFAULT 0 NOT NULL,
	`transport` integer DEFAULT 0 NOT NULL,
	`entertainment` integer DEFAULT 0 NOT NULL,
	`other` integer DEFAULT 0 NOT NULL,
	`planned_saving` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lifestyle_comparisons` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`current_value` text NOT NULL,
	`naoshima_value` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`photo_id` text,
	`visit_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `migration_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	`target_value` real,
	`current_value` real,
	`unit` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `migration_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `migration_scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`monthly_income` integer NOT NULL,
	`monthly_expenses` integer NOT NULL,
	`monthly_saving` integer NOT NULL,
	`current_savings` integer NOT NULL,
	`target_savings` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `milestone_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`category` text,
	`automatic` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`impact_score` integer DEFAULT 3 NOT NULL,
	`estimated_minutes` integer DEFAULT 30 NOT NULL,
	`minimum_title` text,
	`minimum_minutes` integer,
	`weekly_priority` integer DEFAULT false NOT NULL,
	`skill_id` text,
	`scheduled_date` text,
	`month` integer,
	`year` integer,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `money_investment_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`good_things` text DEFAULT '' NOT NULL,
	`next_month` text DEFAULT '' NOT NULL,
	`closer_to_naoshima` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_review_month_unique` ON `monthly_reviews` (`month`);--> statement-breakpoint
CREATE TABLE `monthly_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`readiness` real NOT NULL,
	`savings` integer NOT NULL,
	`total_xp` integer NOT NULL,
	`completed_missions` integer NOT NULL,
	`skill_levels` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_snapshot_month_unique` ON `monthly_snapshots` (`month`);--> statement-breakpoint
CREATE TABLE `mood_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`desire_level` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mood_log_date_unique` ON `mood_logs` (`date`);--> statement-breakpoint
CREATE TABLE `naoshima_reasons` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `next_visit_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`priority` integer DEFAULT 3 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `origin_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`first_visit_date` text,
	`decided_at` text,
	`title` text NOT NULL,
	`story` text NOT NULL,
	`photo_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `photo_comparison_items` (
	`id` text PRIMARY KEY NOT NULL,
	`comparison_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`year` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`comparison_id`) REFERENCES `photo_comparisons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_comparison_item_unique` ON `photo_comparison_items` (`comparison_id`,`photo_id`);--> statement-breakpoint
CREATE TABLE `photo_comparisons` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`place_id` text,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `favorite_places`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`image_url` text NOT NULL,
	`caption` text,
	`taken_at` text,
	`favorite` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_storage_key_unique` ON `photos` (`storage_key`);--> statement-breakpoint
CREATE TABLE `reason_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`reason_id` text,
	`content` text NOT NULL,
	`recorded_at` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reason_id`) REFERENCES `naoshima_reasons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `roadmap_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saving_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `season_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seasonal_experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`season` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`experienced` integer DEFAULT false NOT NULL,
	`experienced_at` text,
	`photo_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `self_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`reveal_at` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `side_income_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`level` integer NOT NULL,
	`monthly_amount` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_id` text NOT NULL,
	`depends_on_skill_id` text NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depends_on_skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_dependency_unique` ON `skill_dependencies` (`skill_id`,`depends_on_skill_id`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`target_level` integer DEFAULT 1 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`parent_skill_id` text,
	`status` text DEFAULT 'LEARNING' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_capsules` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`reveal_at` text NOT NULL,
	`media_type` text DEFAULT 'NONE' NOT NULL,
	`storage_key` text,
	`media_url` text,
	`opened_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_investment_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`minutes` integer NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievement_unique` ON `user_achievements` (`achievement_id`);--> statement-breakpoint
CREATE TABLE `visit_places` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`place_name` text NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visit_place_unique` ON `visit_places` (`visit_id`,`place_name`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`rating` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`description` text NOT NULL,
	`reversed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_source_unique` ON `xp_transactions` (`source_type`,`source_id`);