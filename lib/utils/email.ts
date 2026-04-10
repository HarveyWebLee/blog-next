import nodemailer from "nodemailer";

/**
 * 邮箱配置接口
 */
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 创建邮件传输器
 */
function createTransporter() {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  return nodemailer.createTransport(config);
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送验证码邮件
 * @param email 收件人邮箱
 * @param code 验证码
 * @param type 验证码类型
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: "register" | "reset_password" | "change_email" = "register"
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    // 根据类型设置邮件主题和内容
    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "register":
        subject = "【荒野博客】注册验证码";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">欢迎注册荒野博客</h2>
            <p style="color: #666; font-size: 16px;">您的注册验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">验证码有效期为10分钟，请及时使用。</p>
            <p style="color: #999; font-size: 14px;">如果这不是您的操作，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `;
        break;
      case "reset_password":
        subject = "【荒野博客】密码重置验证码";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">密码重置验证</h2>
            <p style="color: #666; font-size: 16px;">您正在重置密码，验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">验证码有效期为10分钟，请及时使用。</p>
            <p style="color: #999; font-size: 14px;">如果这不是您的操作，请立即修改密码。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `;
        break;
      case "change_email":
        subject = "【荒野博客】邮箱变更验证码";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">邮箱变更验证</h2>
            <p style="color: #666; font-size: 16px;">您正在变更邮箱，验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">验证码有效期为10分钟，请及时使用。</p>
            <p style="color: #999; font-size: 14px;">如果这不是您的操作，请立即联系客服。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `;
        break;
    }

    const mailOptions = {
      from: `"荒野博客" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("邮件发送成功:", result.messageId);
    return true;
  } catch (error) {
    console.error("邮件发送失败:", error);
    return false;
  }
}

/**
 * 验证邮箱配置
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("邮箱配置验证成功");
    return true;
  } catch (error) {
    console.error("邮箱配置验证失败:", error);
    return false;
  }
}
