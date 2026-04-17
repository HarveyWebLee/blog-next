CREATE TABLE `user_post_likes` (
	`user_id` int NOT NULL,
	`post_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_post_likes_user_id_post_id_pk` PRIMARY KEY(`user_id`,`post_id`)
);
--> statement-breakpoint
CREATE INDEX `user_like_user_idx` ON `user_post_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_like_post_idx` ON `user_post_likes` (`post_id`);--> statement-breakpoint
CREATE INDEX `user_like_created_idx` ON `user_post_likes` (`created_at`);