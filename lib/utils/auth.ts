import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

import { isValidEmailFormat } from "./email-format";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * 密码加密
 * @param password 原始密码
 * @returns 加密后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param password 原始密码
 * @param hashedPassword 加密后的密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成JWT访问令牌
 * @param payload 载荷数据
 * @returns JWT令牌
 */
export function generateAccessToken(payload: {
  userId: number;
  username: string;
  role: string;
  /** 内存态超级管理员等场景；仅在为 true 时写入 JWT，避免多余字段 */
  isRoot?: boolean;
}): string {
  const body: Record<string, unknown> = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  };
  if (payload.isRoot === true) {
    body.isRoot = true;
  }
  return jwt.sign(body, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * 生成JWT刷新令牌
 * @param payload 载荷数据
 * @returns JWT刷新令牌
 */
export function generateRefreshToken(payload: {
  userId: number;
  username: string;
  /** 与 access 对齐，便于刷新时重建内存 Root 会话 */
  role?: string;
  isRoot?: boolean;
}): string {
  const body: Record<string, unknown> = {
    userId: payload.userId,
    username: payload.username,
  };
  if (payload.role != null) {
    body.role = payload.role;
  }
  if (payload.isRoot === true) {
    body.isRoot = true;
  }
  return jwt.sign(body, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * 验证JWT访问令牌
 * @param token JWT令牌
 * @returns 解码后的载荷数据
 */
export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("无效的访问令牌");
  }
}

/**
 * 访问令牌校验（与若干路由中 `verifyToken` 命名一致，等同于 verifyAccessToken）
 */
export function verifyToken(token: string): any {
  return verifyAccessToken(token);
}

/**
 * 验证JWT刷新令牌
 * @param token JWT刷新令牌
 * @returns 解码后的载荷数据
 */
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("无效的刷新令牌");
  }
}

/**
 * 生成随机密码重置令牌
 * @returns 随机令牌
 */
export function generatePasswordResetToken(): string {
  // email_verifications.code 当前长度为 10，因此重置 token 需控制在 10 位内。
  // 使用 crypto 随机字节，避免 Math.random 的可预测性。
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let token = "";
  for (let i = 0; i < 10; i += 1) {
    token += alphabet[bytes[i] % alphabet.length];
  }
  return token;
}

/**
 * 验证邮箱格式（与 {@link isValidEmailFormat} 一致，含 trim）
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  return isValidEmailFormat(email);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("密码长度至少8位");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("密码必须包含至少一个大写字母");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("密码必须包含至少一个小写字母");
  }

  if (!/\d/.test(password)) {
    errors.push("密码必须包含至少一个数字");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("密码必须包含至少一个特殊字符");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
