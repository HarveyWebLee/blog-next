import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "blog_system",
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
    return {
      success: false,
      error: "数据库密码未设置",
      suggestions: ["请检查 .env.local 文件中的 DB_PASSWORD 配置", "确保数据库密码已正确设置"],
    };
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
    const version = (rows as any)[0]?.version;
    console.log(`   数据库版本: ${version}`);

    // 检查数据库是否存在
    console.log("🔍 检查数据库表...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("✅ 数据库表检查成功！");
    const tableCount = (tables as any[]).length;
    console.log(`   表数量: ${tableCount}`);

    const tableNames: string[] = [];
    if (tableCount > 0) {
      console.log("   现有表:");
      (tables as any[]).forEach((table: any) => {
        const tableName = Object.values(table)[0] as string;
        tableNames.push(tableName);
        console.log(`     - ${tableName}`);
      });
    } else {
      console.log("   ⚠️ 数据库中没有表，可能需要运行迁移");
    }

    // 关闭连接
    await connection.end();
    console.log("🔌 数据库连接已关闭");

    return {
      success: true,
      message: "数据库连接测试成功",
      details: {
        version,
        tableCount,
        tableNames,
        config: {
          host: config.host,
          port: config.port,
          user: config.user,
          database: config.database,
          passwordSet: !!config.password,
        },
      },
    };
  } catch (error: any) {
    console.error("❌ 数据库连接失败:", error.message);

    let suggestions = [];

    // 提供具体的错误解决建议
    if (error.code === "ECONNREFUSED") {
      suggestions = ["确保MySQL服务正在运行", "检查端口号是否正确", "检查防火墙设置"];
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      suggestions = ["检查用户名和密码是否正确", "确保用户有访问该数据库的权限"];
    } else if (error.code === "ER_BAD_DB_ERROR") {
      suggestions = [
        "使用 Compose 时检查 MYSQL_DATABASE 与 DB_NAME 是否一致",
        "空库创建后执行 pnpm db:migrate 或 pnpm run docker:migrate（唯一建表方式）",
        "说明见 docs/Docker编排与流水线部署.md",
      ];
    } else {
      suggestions = ["检查数据库配置信息", "确保数据库服务正常运行", "查看详细错误信息进行排查"];
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      suggestions,
    };
  }
}

/**
 * 检查必要的环境变量
 */
function checkEnvironmentVariables() {
  const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  return {
    missing: missingVars,
    present: requiredVars.filter((varName) => process.env[varName]),
  };
}

async function handleTestDbGET(request: NextRequest) {
  try {
    const auth = requireInMemorySuperRoot(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    console.log("🚀 数据库连接测试工具");
    console.log("=".repeat(50));

    // 检查必要的环境变量
    const envCheck = checkEnvironmentVariables();

    if (envCheck.missing.length > 0) {
      console.log("❌ 缺少必要的环境变量:");
      envCheck.missing.forEach((varName) => console.log(`   - ${varName}`));
      console.log("\n💡 请检查 .env.local 文件配置");

      return NextResponse.json(
        {
          success: false,
          message: "缺少必要的环境变量",
          missingVariables: envCheck.missing,
          suggestions: ["请检查 .env.local 文件配置", "确保所有必要的环境变量都已设置"],
        },
        { status: 400 }
      );
    }

    // 测试数据库连接
    const result = await testDatabaseConnection();

    if (result.success) {
      console.log("\n🎉 数据库连接测试成功！");
      console.log("💡 您的博客系统可以正常使用数据库了");
    } else {
      console.log("\n⚠️ 数据库连接测试失败");
      console.log("💡 请按照上述建议解决问题后重试");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("\n💥 程序执行失败:", error);

    return NextResponse.json(
      {
        success: false,
        message: "数据库连接测试执行失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export const { GET } = defineApiHandlers({ GET: handleTestDbGET });
