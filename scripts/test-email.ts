#!/usr/bin/env tsx

/**
 * 邮箱功能测试脚本
 * 用于测试邮箱配置和发送功能
 */
import { sendVerificationEmail, verifyEmailConfig } from "../lib/utils/email";

async function testEmailConfig() {
  console.log("🔍 测试邮箱配置...");

  try {
    const isValid = await verifyEmailConfig();
    if (isValid) {
      console.log("✅ 邮箱配置验证成功");
      return true;
    } else {
      console.log("❌ 邮箱配置验证失败");
      return false;
    }
  } catch (error) {
    console.error("❌ 邮箱配置验证出错:", error);
    return false;
  }
}

async function testSendEmail() {
  console.log("📧 测试发送验证码邮件...");

  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  try {
    const success = await sendVerificationEmail(testEmail, "123456", "register");
    if (success) {
      console.log("✅ 验证码邮件发送成功");
      return true;
    } else {
      console.log("❌ 验证码邮件发送失败");
      return false;
    }
  } catch (error) {
    console.error("❌ 发送邮件出错:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 开始邮箱功能测试...\n");

  // 检查环境变量
  const requiredEnvVars = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log("❌ 缺少必要的环境变量:");
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    console.log("\n请检查 .env 文件中的邮件配置");
    return;
  }

  console.log("✅ 环境变量检查通过\n");

  // 测试邮箱配置
  const configValid = await testEmailConfig();
  if (!configValid) {
    console.log("\n❌ 邮箱配置测试失败，请检查SMTP设置");
    return;
  }

  console.log("");

  // 测试发送邮件
  const emailSent = await testSendEmail();
  if (!emailSent) {
    console.log("\n❌ 邮件发送测试失败");
    return;
  }

  console.log("\n🎉 所有测试通过！邮箱功能配置正确");
}

// 运行测试
main().catch(console.error);
