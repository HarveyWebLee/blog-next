ALTER TABLE `categories` ADD `owner_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `owner_id` int NOT NULL;--> statement-breakpoint
CREATE INDEX `owner_idx` ON `categories` (`owner_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `tags` (`owner_id`);