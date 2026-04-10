CREATE TABLE `email_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(100) NOT NULL,
	`user_id` int,
	`is_active` boolean DEFAULT true,
	`subscribed_at` timestamp NOT NULL DEFAULT (now()),
	`unsubscribed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_subscriptions_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `email_subscriptions` (`email`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `email_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `email_subscriptions` (`is_active`);