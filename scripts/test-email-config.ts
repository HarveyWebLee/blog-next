import { sendVerificationEmail, verifyEmailConfig } from "../lib/utils/email";

async function testEmailConfig() {
  console.log("🔍 开始测试邮件配置...");

  // 测试邮件配置
  const isConfigValid = await verifyEmailConfig();

  if (isConfigValid) {
    console.log("✅ 邮件配置验证成功");

    // 测试发送邮件
    console.log("📧 测试发送验证码邮件...");
    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    const success = await sendVerificationEmail(testEmail, "123456", "register");

    if (success) {
      console.log("✅ 邮件发送成功");
    } else {
      console.log("❌ 邮件发送失败");
    }
  } else {
    console.log("❌ 邮件配置验证失败");
    console.log("请检查以下配置：");
    console.log("1. SMTP_HOST 是否正确");
    console.log("2. SMTP_PORT 是否正确");
    console.log("3. SMTP_USER 是否正确");
    console.log("4. SMTP_PASS 是否为授权码/应用密码");
  }
}

testEmailConfig().catch(console.error);
