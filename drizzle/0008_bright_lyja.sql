-- 兼容历史库差异：索引存在才删除，避免 ER_CANT_DROP_FIELD_OR_KEY
SET @__drop_categories_name_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND INDEX_NAME = 'categories_name_unique'
    ),
    'ALTER TABLE `categories` DROP INDEX `categories_name_unique`',
    'SELECT 1'
  )
);
--> statement-breakpoint
PREPARE __stmt_drop_categories_name_unique FROM @__drop_categories_name_unique;
--> statement-breakpoint
EXECUTE __stmt_drop_categories_name_unique;
--> statement-breakpoint
DEALLOCATE PREPARE __stmt_drop_categories_name_unique;
--> statement-breakpoint

SET @__drop_categories_slug_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND INDEX_NAME = 'categories_slug_unique'
    ),
    'ALTER TABLE `categories` DROP INDEX `categories_slug_unique`',
    'SELECT 1'
  )
);
--> statement-breakpoint
PREPARE __stmt_drop_categories_slug_unique FROM @__drop_categories_slug_unique;
--> statement-breakpoint
EXECUTE __stmt_drop_categories_slug_unique;
--> statement-breakpoint
DEALLOCATE PREPARE __stmt_drop_categories_slug_unique;
--> statement-breakpoint

SET @__drop_tags_name_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND INDEX_NAME = 'tags_name_unique'
    ),
    'ALTER TABLE `tags` DROP INDEX `tags_name_unique`',
    'SELECT 1'
  )
);
--> statement-breakpoint
PREPARE __stmt_drop_tags_name_unique FROM @__drop_tags_name_unique;
--> statement-breakpoint
EXECUTE __stmt_drop_tags_name_unique;
--> statement-breakpoint
DEALLOCATE PREPARE __stmt_drop_tags_name_unique;
--> statement-breakpoint

SET @__drop_tags_slug_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND INDEX_NAME = 'tags_slug_unique'
    ),
    'ALTER TABLE `tags` DROP INDEX `tags_slug_unique`',
    'SELECT 1'
  )
);
--> statement-breakpoint
PREPARE __stmt_drop_tags_slug_unique FROM @__drop_tags_slug_unique;
--> statement-breakpoint
EXECUTE __stmt_drop_tags_slug_unique;
--> statement-breakpoint
DEALLOCATE PREPARE __stmt_drop_tags_slug_unique;
--> statement-breakpoint

ALTER TABLE `categories` ADD CONSTRAINT `owner_name_unique_idx` UNIQUE(`owner_id`,`name`);--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `owner_slug_unique_idx` UNIQUE(`owner_id`,`slug`);--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `owner_tag_name_unique_idx` UNIQUE(`owner_id`,`name`);--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `owner_tag_slug_unique_idx` UNIQUE(`owner_id`,`slug`);
