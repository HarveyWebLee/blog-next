#!/bin/bash

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

# 配置
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="blog_system"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${DB_NAME}_backup_${TIMESTAMP}.sql"

# 执行备份
mysqldump \
  --host=$DB_HOST \
  --user=$DB_USER \
  --password=$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-table \
  --add-locks \
  --disable-keys \
  --extended-insert \
  --quick \
  --lock-tables=false \
  $DB_NAME > $BACKUP_DIR/$BACKUP_FILE

# 压缩备份
gzip $BACKUP_DIR/$BACKUP_FILE

# 验证备份
gunzip -t $BACKUP_DIR/${BACKUP_FILE}.gz

echo "✅ 备份完成: $BACKUP_DIR/${BACKUP_FILE}.gz"
