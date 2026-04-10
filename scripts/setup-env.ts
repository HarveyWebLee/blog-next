#!/usr/bin/env tsx

/**
 * 环境变量设置和验证脚本
 * 帮助用户正确配置数据库连接
 */
import * as fs from "fs";

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
    return;
  }

  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ 已创建 .env.local 文件");
    console.log("💡 请编辑此文件，填入正确的数据库配置信息");
  } catch (error) {
    console.error("❌ 创建环境文件失败:", error);
  }
}

/**
 * 显示环境变量配置指南
 */
function showConfigurationGuide() {
  console.log("\n📋 数据库配置指南");
  console.log("=".repeat(50));
  console.log("1. 确保MySQL服务正在运行");
  console.log("2. 创建数据库: CREATE DATABASE blog_system;");
  console.log("3. 创建用户并授权:");
  console.log("   CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'your_password';");
  console.log("   GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'localhost';");
  console.log("   FLUSH PRIVILEGES;");
  console.log("4. 编辑 .env.local 文件，填入正确的配置信息");
  console.log("5. 运行数据库迁移: npm run db:push");
  console.log("6. 测试连接: npm run test:db");
  console.log("");
}

/**
 * 主函数
 */
function main() {
  console.log("🚀 环境配置助手");
  console.log("=".repeat(50));

  // 检查环境文件
  const { existingFiles, missingFiles } = checkEnvFiles();

  if (missingFiles.includes(".env.local")) {
    console.log("💡 建议创建 .env.local 文件来存储本地配置");
    createEnvFile();
  }

  // 显示配置指南
  showConfigurationGuide();

  // 检查是否有环境文件
  if (existingFiles.length === 0) {
    console.log("⚠️ 没有找到任何环境配置文件");
    console.log("💡 请按照上述指南创建配置文件");
  } else {
    console.log("✅ 找到以下环境配置文件:");
    existingFiles.forEach((file) => console.log(`   - ${file}`));
    console.log("\n💡 请确保这些文件包含正确的数据库配置信息");
  }
}

/**
 * 运行脚本
 */
if (require.main === module) {
  main();
}
