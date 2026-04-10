#!/usr/bin/env tsx

/**
 * 清空数据库数据脚本
 */
import { sql } from "drizzle-orm";

import { db } from "../lib/db/config";

async function clearData() {
  console.log("🧹 开始清空数据库数据...");

  try {
    // 禁用外键检查
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    // 按依赖关系顺序清空表
    const tables = ["posts", "comments", "media", "post_tags", "tags", "categories", "users", "settings"];

    for (const tableName of tables) {
      await db.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)}`);
      console.log(`   ✅ 清空表: ${tableName}`);
    }

    // 重新启用外键检查
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

    console.log("✅ 数据库数据清空完成");
  } catch (error) {
    console.error("❌ 数据库数据清空失败:", error);
    throw error;
  }
}

async function main() {
  try {
    await clearData();
    console.log("\n🎉 数据清空完成！");
  } catch (error) {
    console.error("\n💥 数据清空失败:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
