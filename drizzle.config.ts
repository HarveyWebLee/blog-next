import * as fs from "fs";
import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

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
 * Drizzle ORM 配置文件
 * 用于数据库迁移、同步和代码生成
 */
export default defineConfig({
  // 数据库连接配置
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",

  // 数据库连接信息
  dbCredentials: {
    host: env.DB_HOST || "localhost",
    port: parseInt(env.DB_PORT || "3306"),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "blog_system",
  },

  // 迁移配置
  migrations: {
    table: "drizzle_migrations",
    schema: "./drizzle",
  },

  // 代码生成配置
  verbose: true,
  strict: true,

  // Studio 配置
  // ⚠️ drizzle.config.ts 的配置对象不支持 "studio" 字段，已移除该配置。
} satisfies Config);
