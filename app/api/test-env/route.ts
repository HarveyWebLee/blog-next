import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";

import { requireInMemorySuperRoot } from "@/lib/utils/authz";

/**
 * 检查环境文件是否存在
 */
function checkEnvFiles() {
  const envFiles = [".env.local", ".env", ".env.development", ".env.production"];

  console.log("🔍 检查环境配置文件...");
  console.log("=".repeat(50));

  const existingFiles = [];
  const missingFiles = [];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      existingFiles.push(file);
      console.log(`✅ ${file} - 已存在`);
    } else {
      missingFiles.push(file);
      console.log(`❌ ${file} - 不存在`);
    }
  }

  return { existingFiles, missingFiles };
}

/**
 * 创建示例环境文件
 */
function createEnvFile() {
  const envContent = `# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=blog_system

# 应用配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 其他配置...
`;

  const envPath = ".env.local";

  if (fs.existsSync(envPath)) {
    console.log("⚠️ .env.local 文件已存在，跳过创建");
    return false;
  }

  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ 已创建 .env.local 文件");
    console.log("💡 请编辑此文件，填入正确的数据库配置信息");
    return true;
  } catch (error) {
    console.error("❌ 创建环境文件失败:", error);
    return false;
  }
}

/**
 * 显示环境变量配置指南
 */
function showConfigurationGuide() {
  console.log("\n📋 数据库与环境配置指南（建表仅用 Drizzle）");
  console.log("=".repeat(50));
  console.log("1. 统一部署与编排：docs/Docker编排与流水线部署.md");
  console.log(
    "2. Compose：deploy/.env.docker → mysql/redis → pnpm run docker:migrate（或 bash scripts/deploy-from-scratch.sh）"
  );
  console.log("3. .env.local 中 DB_* 指向宿主机映射端口（默认见 deploy/env.docker.example）");
  console.log("4. 空库建表：pnpm db:migrate 或 pnpm db:push；勿用手写 SQL 批量建表脚本");
  console.log("5. 验证：pnpm test:db:connect");
  console.log("");
}

/**
 * 检查环境变量
 */
function checkEnvironmentVariables() {
  console.log("🔍 检查环境变量...");

  const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingVars = [];
  const presentVars = [];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      presentVars.push(varName);
      console.log(`✅ ${varName} - 已设置`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName} - 未设置`);
    }
  }

  return { missingVars, presentVars };
}

export async function GET(request: NextRequest) {
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

    console.log("🚀 环境配置助手");
    console.log("=".repeat(50));

    // 检查环境文件
    const { existingFiles, missingFiles } = checkEnvFiles();

    // 检查环境变量
    const { missingVars, presentVars } = checkEnvironmentVariables();

    // 创建环境文件（如果需要）
    let envFileCreated = false;
    if (missingFiles.includes(".env.local")) {
      console.log("💡 建议创建 .env.local 文件来存储本地配置");
      envFileCreated = createEnvFile();
    }

    // 显示配置指南
    showConfigurationGuide();

    const result = {
      success: missingVars.length === 0,
      message: missingVars.length === 0 ? "环境配置检查通过" : `缺少 ${missingVars.length} 个必要的环境变量`,
      details: {
        envFiles: {
          existing: existingFiles,
          missing: missingFiles,
          created: envFileCreated,
        },
        environmentVariables: {
          present: presentVars,
          missing: missingVars,
        },
        recommendations:
          missingVars.length > 0
            ? ["请检查 .env.local 文件配置", "确保所有必要的环境变量都已设置", "参考上述配置指南进行设置"]
            : ["环境配置完整，可以继续下一步操作"],
      },
    };

    // 检查是否有环境文件
    if (existingFiles.length === 0) {
      console.log("⚠️ 没有找到任何环境配置文件");
      console.log("💡 请按照上述指南创建配置文件");
    } else {
      console.log("✅ 找到以下环境配置文件:");
      existingFiles.forEach((file) => console.log(`   - ${file}`));
      console.log("\n💡 请确保这些文件包含正确的数据库配置信息");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ 环境配置检查失败:", error);

    return NextResponse.json(
      {
        success: false,
        message: "环境配置检查失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
