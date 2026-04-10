import * as fs from "fs";
import { drizzle } from "drizzle-orm/mysql2";
import mysql, { PoolOptions } from "mysql2/promise";

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

/**
 * 数据库连接配置
 * 使用环境变量来配置数据库连接信息，确保安全性
 */
const dbConfig: PoolOptions = {
  host: env.DB_HOST || "localhost",
  port: parseInt(env.DB_PORT || "3306"),
  user: env.DB_USER || "root",
  password: env.DB_PASSWORD || "",
  database: env.DB_NAME || "blog_system",
  // 连接池配置，提高性能和稳定性
  pool: {
    min: 2, // 最小连接数
    max: 10, // 最大连接数
    acquireTimeoutMillis: 30000, // 获取连接超时时间
    createTimeoutMillis: 30000, // 创建连接超时时间
    destroyTimeoutMillis: 5000, // 销毁连接超时时间
    idleTimeoutMillis: 30000, // 空闲连接超时时间
    reapIntervalMillis: 1000, // 清理间隔
    createRetryIntervalMillis: 200, // 重试间隔
  },
  // 字符集配置
  charset: "utf8mb4",
  // 时区配置
  timezone: "+08:00",
};

/**
 * 创建MySQL连接池
 * 使用连接池可以提高数据库操作的性能和稳定性
 */
const connection = mysql.createPool(dbConfig);

/**
 * 创建Drizzle ORM实例
 * Drizzle是一个类型安全的SQL ORM，提供优秀的TypeScript支持
 */
export const db = drizzle(connection, {
  // 日志配置，开发环境下可以启用SQL查询日志
  logger: process.env.NODE_ENV === "development",
  // 模式配置，用于数据库迁移和同步
  mode: "default",
});

/**
 * 测试数据库连接
 * 用于验证数据库配置是否正确
 */
export async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    });

    console.log("✅ 数据库连接成功");
    await connection.end();
    return true;
  } catch (error) {
    console.error("❌ 数据库连接失败:", error);
    return false;
  }
}

/**
 * 关闭数据库连接池
 * 在应用关闭时调用，确保资源正确释放
 */
export async function closeConnection() {
  try {
    await connection.end();
    console.log("✅ 数据库连接池已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接池失败:", error);
  }
}
