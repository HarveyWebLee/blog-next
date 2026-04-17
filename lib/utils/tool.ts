/**
 * 通用工具函数库
 * 提供博客系统中常用的工具方法和辅助函数
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名
 * 使用 clsx 和 tailwind-merge 来智能合并 Tailwind CSS 类
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成文章别名 (slug)
 * 将中文标题转换为英文别名
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/\s+/g, "-") // 空格替换为连字符
    .replace(/-+/g, "-") // 多个连字符替换为单个
    .trim();
}

/** 用于文章 URL 别名的字符集：大小写字母 + 数字 */
const URL_ALIAS_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * 生成随机 URL 别名（默认 8 位），供新建文章时作为默认 slug；用户可在表单中手动修改。
 * 使用 crypto.getRandomValues，避免 Math.random 在敏感场景下可预测。
 */
export function generateRandomUrlAlias(length = 8): string {
  const n = Math.max(4, Math.min(32, Math.floor(length)));
  const bytes = new Uint8Array(n);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < n; i++) {
    out += URL_ALIAS_ALPHABET[bytes[i]! % URL_ALIAS_ALPHABET.length];
  }
  return out;
}

/**
 * 截断文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * 计算阅读时间
 * @param content 文章内容
 * @param wordsPerMinute 每分钟阅读字数
 * @returns 阅读时间（分钟）
 */
export function calculateReadTime(content: string, wordsPerMinute: number = 200): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * 将数据库驱动可能返回的整型（含 bigint、数字字符串）规范为可 JSON 序列化的 number。
 * mysql2 对部分聚合/整型在特定配置下会返回 bigint，直接放入 NextResponse.json 会触发
 * 「Do not know how to serialize a BigInt」。
 */
export function toJsonSafeInt(value: unknown, fallback = 0): number {
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message: message || "操作成功",
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: {
      message,
      code: code || "UNKNOWN_ERROR",
    },
  };
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * 计算分页信息
 */
export function calculatePagination(total: number, page: number = 1, limit: number = 10) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const offset = (currentPage - 1) * limit;

  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 生成随机 ID
 */
export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  message: string;
} {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      strength: "weak",
      message: `密码长度至少 ${minLength} 位`,
    };
  }

  const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (score < 2) {
    return {
      isValid: false,
      strength: "weak",
      message: "密码强度太弱，请包含大小写字母、数字或特殊字符",
    };
  }

  if (score < 4) {
    return {
      isValid: true,
      strength: "medium",
      message: "密码强度中等",
    };
  }

  return {
    isValid: true,
    strength: "strong",
    message: "密码强度很强",
  };
}
