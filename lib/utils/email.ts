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

export type SendVerificationEmailFailureCode =
  | "RECIPIENT_NOT_FOUND"
  | "RECIPIENT_REJECTED"
  | "SMTP_TIMEOUT"
  | "SMTP_AUTH_FAILED"
  | "SMTP_ERROR";

export type SendVerificationEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; code: SendVerificationEmailFailureCode; detail?: string };

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
  type: "register" | "reset_password" | "change_email" | "subscription" | "subscription_unsubscribe" = "register"
): Promise<boolean> {
  const result = await sendVerificationEmailDetailed(email, code, type);
  return result.ok;
}

/**
 * 发送验证码邮件（带失败原因）
 * @param email 收件人邮箱
 * @param code 验证码
 * @param type 验证码类型
 */
export async function sendVerificationEmailDetailed(
  email: string,
  code: string,
  type: "register" | "reset_password" | "change_email" | "subscription" | "subscription_unsubscribe" = "register"
): Promise<SendVerificationEmailResult> {
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
      case "subscription":
        subject = "【荒野博客】订阅更新验证码";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">确认订阅文章更新</h2>
            <p style="color: #666; font-size: 16px;">您正在使用此邮箱订阅新文章邮件通知，验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">验证码有效期为10分钟，验证通过后订阅才会生效。</p>
            <p style="color: #999; font-size: 14px;">如非本人操作，请忽略本邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `;
        break;
      case "subscription_unsubscribe":
        subject = "【荒野博客】取消订阅验证码";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">确认取消订阅</h2>
            <p style="color: #666; font-size: 16px;">您正在取消该邮箱的文章更新订阅，验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #b45309; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">验证码有效期为10分钟，验证通过后才会完成退订。</p>
            <p style="color: #999; font-size: 14px;">如非本人操作，请忽略本邮件。</p>
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
    return { ok: true, messageId: result.messageId };
  } catch (error) {
    console.error("邮件发送失败:", error);
    const err = error as {
      code?: string;
      command?: string;
      responseCode?: number;
      response?: string;
      message?: string;
    };

    if (err.code === "EENVELOPE" && err.responseCode === 550) {
      const resp = (err.response || err.message || "").toLowerCase();
      if (resp.includes("user not found") || resp.includes("no such user")) {
        return { ok: false, code: "RECIPIENT_NOT_FOUND", detail: err.response || err.message };
      }
      return { ok: false, code: "RECIPIENT_REJECTED", detail: err.response || err.message };
    }

    if (err.code === "ETIMEDOUT") {
      return { ok: false, code: "SMTP_TIMEOUT", detail: err.message };
    }

    if (err.code === "EAUTH") {
      return { ok: false, code: "SMTP_AUTH_FAILED", detail: err.message };
    }

    return { ok: false, code: "SMTP_ERROR", detail: err.message };
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

/**
 * 发送密码重置链接邮件
 * @param email 收件人邮箱
 * @param resetUrl 重置链接（应包含一次性 token）
 */
export async function sendPasswordResetLinkEmail(
  email: string,
  resetUrl: string,
  locale: "zh-CN" | "en-US" | "ja-JP" = "zh-CN"
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const copy =
      locale === "en-US"
        ? {
            subject: "[Wilderness Blog] Password reset link",
            title: "Password reset request",
            desc: "We received a request to reset your account password. Please click the button below within 30 minutes.",
            button: "Reset password",
            fallback: "If the button does not work, copy the following link into your browser:",
            tip: "If this was not you, you can safely ignore this email.",
          }
        : locale === "ja-JP"
          ? {
              subject: "【荒野ブログ】パスワード再設定リンク",
              title: "パスワード再設定リクエスト",
              desc: "パスワード再設定のリクエストを受け付けました。30分以内に下のボタンから再設定してください。",
              button: "パスワードを再設定",
              fallback: "ボタンが使えない場合は、下記リンクをブラウザに貼り付けてください：",
              tip: "心当たりがない場合は、このメールを無視してください。",
            }
          : {
              subject: "【荒野博客】重置密码链接",
              title: "密码重置请求",
              desc: "我们收到了重置您账户密码的请求。请在 30 分钟内点击下方按钮完成重置。",
              button: "立即重置密码",
              fallback: "如果按钮无法点击，请复制下方链接到浏览器打开：",
              tip: "若非本人操作，请忽略此邮件，账号密码不会被修改。",
            };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #111827; margin-bottom: 12px;">${copy.title}</h2>
        <p style="color: #4b5563; line-height: 1.8;">
          ${copy.desc}
        </p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            margin-top: 12px;
            background: #2563eb;
            color: #fff;
            text-decoration: none;
            padding: 10px 16px;
            border-radius: 8px;
          "
        >
          ${copy.button}
        </a>
        <p style="margin-top: 20px; color: #6b7280; line-height: 1.7;">
          ${copy.fallback}<br />
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
        <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
          ${copy.tip}
        </p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: `"荒野博客" <${process.env.SMTP_USER}>`,
      to: email,
      subject: copy.subject,
      html: htmlContent,
    });

    console.log("密码重置链接发送成功:", { to: email, messageId: result.messageId });
    return true;
  } catch (error) {
    console.error("发送密码重置链接失败:", { to: email, error });
    return false;
  }
}

/**
 * 发送文章发布订阅邮件
 */
export async function sendPostPublishedEmail({
  to,
  title,
  excerpt,
  postUrl,
}: {
  to: string;
  title: string;
  excerpt: string;
  postUrl: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const safeExcerpt = excerpt || "暂无摘要，点击下方链接阅读完整内容。";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #111827; margin-bottom: 12px;">你订阅的博客有新文章发布</h2>
        <h3 style="color: #2563eb; margin: 12px 0;">${title}</h3>
        <p style="color: #4b5563; line-height: 1.7;">${safeExcerpt}</p>
        <a
          href="${postUrl}"
          style="
            display: inline-block;
            margin-top: 16px;
            background: #2563eb;
            color: #fff;
            text-decoration: none;
            padding: 10px 16px;
            border-radius: 8px;
          "
        >
          阅读全文
        </a>
        <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    const result = await transporter.sendMail({
      from: `"荒野博客" <${process.env.SMTP_USER}>`,
      to,
      subject: `【荒野博客】新文章：${title}`,
      html,
    });

    console.log("订阅邮件发送成功:", { to, messageId: result.messageId });

    return true;
  } catch (error) {
    console.error("发送文章订阅邮件失败:", { to, error });
    return false;
  }
}
