import * as fs from "fs";
import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit 配置（generate / migrate / push / studio 均会读取）。
 *
 * - **宿主机**执行 `pnpm db:*`：下面会合并 `.env`、`.env.local` 等与 `process.env`，通常连 `127.0.0.1` + `MYSQL_PUBLISH_PORT`。
 * - **`pnpm docker:migrate`（db-migrate 容器）**：镜像内无上述文件，**仅**使用 Compose 注入的 `process.env`（`env_file: deploy/.env.docker` + `DB_HOST=mysql`），与本地是否拷贝了 `deploy/.env.docker` 无关，由 compose 传入。
 */

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
