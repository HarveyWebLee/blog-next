#!/usr/bin/env tsx

/**
 * 系统验证脚本
 * 验证博客系统的各个功能模块
 */
import { sql } from "drizzle-orm";

import { db } from "../lib/db/config";
import { categories, posts, tags, users } from "../lib/db/schema";

/**
 * 验证数据库连接
 */
async function verifyDatabaseConnection() {
  console.log("🔌 验证数据库连接...");

  try {
    const [result] = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ 数据库连接正常");
    return true;
  } catch (error) {
    console.error("❌ 数据库连接失败:", error);
    return false;
  }
}

/**
 * 验证数据完整性
 */
async function verifyDataIntegrity() {
  console.log("📊 验证数据完整性...");

  try {
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [categoryCount] = await db.select({ count: sql`count(*)` }).from(categories);
    const [tagCount] = await db.select({ count: sql`count(*)` }).from(tags);
    const [postCount] = await db.select({ count: sql`count(*)` }).from(posts);

    console.log(`   用户: ${userCount.count} 条记录`);
    console.log(`   分类: ${categoryCount.count} 条记录`);
    console.log(`   标签: ${tagCount.count} 条记录`);
    console.log(`   文章: ${postCount.count} 条记录`);

    if (
      Number(userCount.count) > 0 &&
      Number(categoryCount.count) > 0 &&
      Number(tagCount.count) > 0 &&
      Number(postCount.count) > 0
    ) {
      console.log("✅ 数据完整性验证通过");
      return true;
    } else {
      console.log("⚠️  数据不完整，请运行 pnpm db:seed 填充数据");
      return false;
    }
  } catch (error) {
    console.error("❌ 数据完整性验证失败:", error);
    return false;
  }
}

/**
 * 验证 API 端点
 */
async function verifyAPIEndpoints() {
  console.log("🌐 验证 API 端点...");

  const baseUrl = "http://localhost:3000";
  const endpoints = ["/api/posts", "/api/tags", "/api/test-db"];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (response.ok) {
        console.log(`   ✅ ${endpoint} - 状态: ${response.status}`);
        successCount++;
      } else {
        console.log(`   ❌ ${endpoint} - 状态: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${endpoint} - 错误: ${error.message}`);
    }
  }

  if (successCount === endpoints.length) {
    console.log("✅ API 端点验证通过");
    return true;
  } else {
    console.log(`⚠️  ${successCount}/${endpoints.length} API 端点正常`);
    return false;
  }
}

/**
 * 验证前端页面
 */
async function verifyFrontendPages() {
  console.log("🎨 验证前端页面...");

  const baseUrl = "http://localhost:3000";
  const pages = [
    "/zh-CN",
    "/en-US",
    "/ja-JP",
    "/zh-CN/blog",
    "/zh-CN/categories",
    "/zh-CN/tags",
    "/zh-CN/auth/login",
    "/zh-CN/auth/register",
  ];

  let successCount = 0;

  for (const page of pages) {
    try {
      const response = await fetch(`${baseUrl}${page}`);
      if (response.ok) {
        console.log(`   ✅ ${page} - 状态: ${response.status}`);
        successCount++;
      } else {
        console.log(`   ❌ ${page} - 状态: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${page} - 错误: ${error.message}`);
    }
  }

  if (successCount === pages.length) {
    console.log("✅ 前端页面验证通过");
    return true;
  } else {
    console.log(`⚠️  ${successCount}/${pages.length} 前端页面正常`);
    return false;
  }
}

/**
 * 主验证函数
 */
async function main() {
  console.log("🔍 开始系统验证...");
  console.log("=".repeat(60));

  const results = {
    database: false,
    data: false,
    api: false,
    frontend: false,
  };

  // 验证数据库连接
  results.database = await verifyDatabaseConnection();

  if (results.database) {
    // 验证数据完整性
    results.data = await verifyDataIntegrity();

    // 验证 API 端点
    results.api = await verifyAPIEndpoints();

    // 验证前端页面
    results.frontend = await verifyFrontendPages();
  }

  // 输出验证结果
  console.log("\n📋 验证结果汇总:");
  console.log("=".repeat(40));
  console.log(`数据库连接: ${results.database ? "✅" : "❌"}`);
  console.log(`数据完整性: ${results.data ? "✅" : "❌"}`);
  console.log(`API 端点: ${results.api ? "✅" : "❌"}`);
  console.log(`前端页面: ${results.frontend ? "✅" : "❌"}`);

  const allPassed = Object.values(results).every((result) => result);

  if (allPassed) {
    console.log("\n🎉 系统验证完成！所有功能正常");
    console.log("💡 您的博客系统已准备就绪");
  } else {
    console.log("\n⚠️  系统验证完成，部分功能需要检查");
    console.log("💡 请根据上述结果进行相应的修复");
  }

  return allPassed;
}

/**
 * 运行验证脚本
 */
if (require.main === module) {
  main().catch((error) => {
    console.error("\n💥 验证过程失败:", error);
    process.exit(1);
  });
}
