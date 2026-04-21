ALTER TABLE `categories` DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `categories` DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `tags` DROP INDEX `tags_name_unique`;--> statement-breakpoint
ALTER TABLE `tags` DROP INDEX `tags_slug_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `owner_name_unique_idx` UNIQUE(`owner_id`,`name`);--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `owner_slug_unique_idx` UNIQUE(`owner_id`,`slug`);--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `owner_tag_name_unique_idx` UNIQUE(`owner_id`,`name`);--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `owner_tag_slug_unique_idx` UNIQUE(`owner_id`,`slug`);