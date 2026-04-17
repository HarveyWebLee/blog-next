#!/usr/bin/env tsx
/**
 * 在 Docker db-migrate 容器内执行迁移：仅用 `process.env`（由 compose 注入），与 drizzle.config 中库名/表名一致。
 * `drizzle-kit migrate` 在部分终端下失败时不打印 SQL/驱动错误，故用本脚本作为镜像入口以便排障。
 */
import * as path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "blog_system";

  console.log(`[migrate] ${user}@${host}:${port}/${database}`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  const db = drizzle(connection);

  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
      migrationsTable: "drizzle_migrations",
    });
    console.log("[migrate] 成功：迁移已应用。");
  } finally {
    await connection.end();
  }
}

main().catch((err: unknown) => {
  console.error("[migrate] 失败：");
  console.error(err);
  process.exit(1);
});
