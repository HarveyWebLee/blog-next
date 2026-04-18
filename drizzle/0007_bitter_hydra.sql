ALTER TABLE `user_activities` MODIFY COLUMN `user_id` int;--> statement-breakpoint
ALTER TABLE `user_activities` MODIFY COLUMN `action` varchar(100) NOT NULL;--> statement-breakpoint
CREATE INDEX `user_created_idx` ON `user_activities` (`user_id`,`created_at`);