/**
 * 用户活动日志（服务端写入）
 *
 * - 写入 `user_activities`，失败仅打日志，不影响主业务流程。
 * - `userId` 可空：访客订阅、匿名分享等行为见 schema 注释。
 */

import type { NextRequest } from "next/server";

import { db } from "@/lib/db/config";
import { userActivities } from "@/lib/db/schema";

/** 统一打点枚举名（≤100 字符，与 DB `action` 列一致） */
export const UserActivityAction = {
  POST_CREATED: "post_created",
  POST_UPDATED: "post_updated",
  POST_DELETED: "post_deleted",
  POST_LIKED: "post_liked",
  POST_UNLIKED: "post_unliked",
  POST_FAVORITED: "post_favorited",
  POST_UNFAVORITED: "post_unfavorited",
  POST_SHARED: "post_shared",
  COMMENT_CREATED: "comment_created",
  CATEGORY_CREATED: "category_created",
  CATEGORY_UPDATED: "category_updated",
  CATEGORY_DELETED: "category_deleted",
  TAG_CREATED: "tag_created",
  TAG_UPDATED: "tag_updated",
  TAG_DELETED: "tag_deleted",
  PROFILE_UPDATED: "profile_updated",
  NEWSLETTER_SUBSCRIBED: "newsletter_subscribed",
  NEWSLETTER_UNSUBSCRIBED: "newsletter_unsubscribed",
  ADMIN_USER_UPDATED: "admin_user_updated",
} as const;

export type UserActivityActionType = (typeof UserActivityAction)[keyof typeof UserActivityAction];

/** 从请求头解析客户端 IP / UA（与 profile activities POST 语义对齐） */
export function getClientMetaFromRequest(request: NextRequest): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

/** 日志中邮箱脱敏（保留少量前缀与域名，避免明文扩散） */
export function maskEmailForActivityLog(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.indexOf("@");
  if (at < 1) return "***";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const prefix = local.length <= 2 ? local : local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

export interface LogUserActivityParams {
  /** 参与者；访客场景传 null */
  userId: number | null;
  action: UserActivityActionType | string;
  description?: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 异步写入一条活动记录（不 await，由调用方 fire-and-forget）。
 */
export function logUserActivity(params: LogUserActivityParams): void {
  const { userId, action, description, metadata, request } = params;
  let ip = params.ipAddress;
  let ua = params.userAgent;
  if (request) {
    const m = getClientMetaFromRequest(request);
    ip = ip ?? m.ipAddress;
    ua = ua ?? m.userAgent;
  }

  void (async () => {
    try {
      await db.insert(userActivities).values({
        userId,
        action,
        description: description ?? null,
        metadata: metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        ipAddress: ip ?? null,
        userAgent: ua ?? null,
      });
    } catch (e) {
      console.error("[logUserActivity] 写入失败:", action, e);
    }
  })();
}
