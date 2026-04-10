#!/usr/bin/env tsx

/**
 * 数据库备份脚本
 * 使用 Node.js 和 Drizzle ORM 进行数据库备份
 */
import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm";

import { db } from "../lib/db/config";
import { categories, comments, media, posts, settings, tags, users } from "../lib/db/schema";

/**
 * 读取环境变量文件
 */
function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join("=");
      }
    }
  });

  return env;
}

/**
 * 加载环境变量
 */
const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.development"),
  ...process.env,
};

const dbConfig = {
  host: env.DB_HOST || "localhost",
  port: parseInt(env.DB_PORT || "3306"),
  user: env.DB_USER || "root",
  password: env.DB_PASSWORD || "",
  database: env.DB_NAME || "blog_system",
};

/**
 * 创建备份目录
 */
function createBackupDir() {
  const backupDir = path.join(process.cwd(), ".backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

/**
 * 备份数据库数据
 */
async function backupDatabase() {
  console.log("💾 开始备份数据库...");

  const backupDir = createBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `blog_system_backup_${timestamp}.json`);

  try {
    // 备份所有表的数据
    const backupData = {
      timestamp: new Date().toISOString(),
      database: dbConfig.database,
      tables: {
        users: await db.select().from(users),
        categories: await db.select().from(categories),
        tags: await db.select().from(tags),
        posts: await db.select().from(posts),
        comments: await db.select().from(comments),
        media: await db.select().from(media),
        settings: await db.select().from(settings),
      },
    };

    // 写入备份文件
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf-8");

    console.log(`✅ 数据库备份完成: ${backupFile}`);
    console.log(`📊 备份统计:`);
    console.log(`   用户: ${backupData.tables.users.length} 条记录`);
    console.log(`   分类: ${backupData.tables.categories.length} 条记录`);
    console.log(`   标签: ${backupData.tables.tags.length} 条记录`);
    console.log(`   文章: ${backupData.tables.posts.length} 条记录`);
    console.log(`   评论: ${backupData.tables.comments.length} 条记录`);
    console.log(`   媒体: ${backupData.tables.media.length} 条记录`);
    console.log(`   设置: ${backupData.tables.settings.length} 条记录`);

    return backupFile;
  } catch (error) {
    console.error("❌ 数据库备份失败:", error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🔄 开始数据库备份流程...");
  console.log("=".repeat(50));

  try {
    await backupDatabase();

    console.log("\n🎉 数据库备份完成！");
    console.log("📁 备份文件已保存在 ./.backups/ 目录中");
  } catch (error) {
    console.error("\n💥 数据库备份失败:", error);
    process.exit(1);
  }
}

/**
 * 运行备份脚本
 */
if (require.main === module) {
  main().catch((error) => {
    console.error("\n💥 程序执行失败:", error);
    process.exit(1);
  });
}
