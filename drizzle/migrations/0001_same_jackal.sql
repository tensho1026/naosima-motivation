CREATE INDEX `idx_action_logs_occurred` ON `action_logs` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_conditions_category` ON `migration_conditions` (`category`);--> statement-breakpoint
CREATE INDEX `idx_missions_schedule` ON `missions` (`type`,`scheduled_date`,`completed`);--> statement-breakpoint
CREATE INDEX `idx_photos_favorite_taken` ON `photos` (`favorite`,`taken_at`);--> statement-breakpoint
CREATE INDEX `idx_savings_date` ON `saving_transactions` (`date`);--> statement-breakpoint
CREATE INDEX `idx_visits_dates` ON `visits` (`start_date`,`end_date`);