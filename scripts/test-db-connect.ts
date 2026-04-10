#!/usr/bin/env tsx

/**
 * 简单的数据库连接测试脚本
 * 直接读取环境变量并测试数据库连接
 */
import * as fs from "fs";
import mysql from "mysql2/promise";

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
 * 测试数据库连接
 */
async function testDatabaseConnection(env: Record<string, string>) {
  const config = {
    host: env.DB_HOST || "localhost",
    port: parseInt(env.DB_PORT || "3306"),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "blog_system",
  };

  console.log("🔌 数据库连接配置:");
  console.log("=".repeat(40));
  console.log(`主机: ${config.host}`);
  console.log(`端口: ${config.port}`);
  console.log(`用户: ${config.user}`);
  console.log(`数据库: ${config.database}`);
  console.log(`密码: ${config.password ? "***已设置***" : "❌ 未设置"}`);
  console.log("=".repeat(40));
  console.log("");

  if (!config.password) {
    console.log("❌ 数据库密码未设置，无法继续测试");
    return false;
  }

  try {
    console.log("📡 正在连接数据库...");

    // 创建连接
    const connection = await mysql.createConnection(config);
    console.log("✅ 数据库连接成功！");

    // 测试查询
    console.log("📊 测试数据库查询...");
    const [rows] = await connection.execute("SELECT VERSION() as version");
    console.log("✅ 查询测试成功！");
    console.log(`   数据库版本: ${(rows as any)[0]?.version}`);

    // 检查数据库是否存在
    console.log("🔍 检查数据库表...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("✅ 数据库表检查成功！");
    console.log(`   表数量: ${(tables as any[]).length}`);

    if ((tables as any[]).length > 0) {
      console.log("   现有表:");
      (tables as any[]).forEach((table: any) => {
        const tableName = Object.values(table)[0];
        console.log(`     - ${tableName}`);
      });
    } else {
      console.log("   ⚠️ 数据库中没有表，可能需要运行迁移");
    }

    // 关闭连接
    await connection.end();
    console.log("🔌 数据库连接已关闭");

    return true;
  } catch (error: any) {
    console.error("❌ 数据库连接失败:", error.message);

    // 提供具体的错误解决建议
    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 解决建议:");
      console.log("   1. 确保MySQL服务正在运行");
      console.log("   2. 检查端口号是否正确");
      console.log("   3. 检查防火墙设置");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 解决建议:");
      console.log("   1. 检查用户名和密码是否正确");
      console.log("   2. 确保用户有访问该数据库的权限");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 解决建议:");
      console.log("   1. 数据库不存在，请先创建数据库");
      console.log("   2. 运行: CREATE DATABASE blog_system;");
    }

    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 数据库连接测试工具");
  console.log("=".repeat(50));

  // 加载环境变量
  const env = {
    ...loadEnvFile(".env"),
    ...loadEnvFile(".env.local"),
    ...loadEnvFile(".env.development"),
    ...process.env,
  };

  // 检查必要的环境变量
  const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingVars = requiredVars.filter((varName) => !env[varName]);

  if (missingVars.length > 0) {
    console.log("❌ 缺少必要的环境变量:");
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    console.log("\n💡 请检查 .env.local 文件配置");
    process.exit(1);
  }

  // 测试数据库连接
  const success = await testDatabaseConnection(env as Record<string, string>);

  if (success) {
    console.log("\n🎉 数据库连接测试成功！");
    console.log("💡 您的博客系统可以正常使用数据库了");
  } else {
    console.log("\n⚠️ 数据库连接测试失败");
    console.log("💡 请按照上述建议解决问题后重试");
    process.exit(1);
  }
}

/**
 * 运行测试
 */
if (require.main === module) {
  main().catch((error) => {
    console.error("\n💥 程序执行失败:", error);
    process.exit(1);
  });
}
