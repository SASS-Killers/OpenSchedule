CREATE TABLE `event_types` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`duration` integer NOT NULL,
	`buffer_before` integer DEFAULT 0 NOT NULL,
	`buffer_after` integer DEFAULT 0 NOT NULL,
	`minimum_notice` integer DEFAULT 4 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_slug_unique` ON `users` (`slug`);