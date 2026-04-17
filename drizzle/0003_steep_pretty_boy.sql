-- 幂等：若列已存在（db:push / 手工），则跳过 ADD，避免 ER_DUP_FIELDNAME
SET @__add_email = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_profiles'
       AND COLUMN_NAME = 'email') > 0,
    'SELECT 1',
    'ALTER TABLE `user_profiles` ADD `email` varchar(100)'
  )
);
--> statement-breakpoint
PREPARE __stmt FROM @__add_email;
--> statement-breakpoint
EXECUTE __stmt;
--> statement-breakpoint
DEALLOCATE PREPARE __stmt;
