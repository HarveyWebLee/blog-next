CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`parent_id` int,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`author_id` int,
	`parent_id` int,
	`author_name` varchar(100),
	`author_email` varchar(100),
	`author_website` varchar(255),
	`content` text NOT NULL,
	`status` enum('pending','approved','spam') DEFAULT 'pending',
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(100) NOT NULL,
	`code` varchar(10) NOT NULL,
	`type` enum('register','reset_password','change_email') NOT NULL,
	`is_used` boolean DEFAULT false,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`width` int,
	`height` int,
	`alt_text` varchar(255),
	`caption` text,
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` int NOT NULL,
	`tag_id` int NOT NULL,
	CONSTRAINT `post_tags_post_id_tag_id_pk` PRIMARY KEY(`post_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`content_html` text,
	`featured_image` varchar(255),
	`author_id` int NOT NULL,
	`category_id` int,
	`status` enum('draft','published','archived') DEFAULT 'draft',
	`visibility` enum('public','private','password') DEFAULT 'public',
	`password` varchar(255),
	`allow_comments` boolean DEFAULT true,
	`view_count` int DEFAULT 0,
	`like_count` int DEFAULT 0,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`description` text,
	`is_public` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`description` text,
	`metadata` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`post_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`follower_id` int NOT NULL,
	`following_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('comment','like','follow','mention','system') NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text,
	`data` text,
	`is_read` boolean DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`category` varchar(50) DEFAULT 'general',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`first_name` varchar(50),
	`last_name` varchar(50),
	`phone` varchar(20),
	`website` varchar(255),
	`location` varchar(100),
	`timezone` varchar(50),
	`language` varchar(10) DEFAULT 'zh-CN',
	`date_format` varchar(20) DEFAULT 'YYYY-MM-DD',
	`time_format` varchar(10) DEFAULT '24h',
	`theme` varchar(20) DEFAULT 'system',
	`notifications` text,
	`privacy` text,
	`social_links` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`display_name` varchar(100),
	`avatar` varchar(255),
	`bio` text,
	`role` enum('admin','author','user') DEFAULT 'user',
	`status` enum('active','inactive','banned') DEFAULT 'active',
	`email_verified` boolean DEFAULT false,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `categories` (`is_active`);--> statement-breakpoint
CREATE INDEX `post_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `comments` (`author_id`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `email_verifications` (`email`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `email_verifications` (`code`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `email_verifications` (`type`);--> statement-breakpoint
CREATE INDEX `expires_idx` ON `email_verifications` (`expires_at`);--> statement-breakpoint
CREATE INDEX `filename_idx` ON `media` (`filename`);--> statement-breakpoint
CREATE INDEX `mime_idx` ON `media` (`mime_type`);--> statement-breakpoint
CREATE INDEX `uploader_idx` ON `media` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `post_idx` ON `post_tags` (`post_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `post_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `posts` (`category_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `posts` (`status`);--> statement-breakpoint
CREATE INDEX `visibility_idx` ON `posts` (`visibility`);--> statement-breakpoint
CREATE INDEX `published_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `key_idx` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `public_idx` ON `settings` (`is_public`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `tags` (`is_active`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `user_activities` (`action`);--> statement-breakpoint
CREATE INDEX `created_idx` ON `user_activities` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `post_idx` ON `user_favorites` (`post_id`);--> statement-breakpoint
CREATE INDEX `created_idx` ON `user_favorites` (`created_at`);--> statement-breakpoint
CREATE INDEX `follower_idx` ON `user_follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `following_idx` ON `user_follows` (`following_id`);--> statement-breakpoint
CREATE INDEX `created_idx` ON `user_follows` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `user_notifications` (`type`);--> statement-breakpoint
CREATE INDEX `read_idx` ON `user_notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `created_idx` ON `user_notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `key_idx` ON `user_preferences` (`key`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `user_preferences` (`category`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `language_idx` ON `user_profiles` (`language`);--> statement-breakpoint
CREATE INDEX `theme_idx` ON `user_profiles` (`theme`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `users` (`status`);