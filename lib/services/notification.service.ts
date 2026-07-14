import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userNotifications, userProfiles } from "@/lib/db/schema";
import { DEFAULT_LOCALE, resolveLocale } from "@/lib/i18n/locale";
import { tApi, type ApiMessageKey } from "@/lib/i18n/messages";
import { logger } from "@/lib/server/logger";
import type { Locale } from "@/types/common";

export type NotificationType = "comment" | "like" | "follow" | "mention" | "system";

export type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  content?: string;
  data?: Record<string, unknown>;
};

/**
 * 写入单条站内通知；失败仅打日志，不抛出（与关注通知一致）。
 */
export async function createUserNotification(input: CreateNotificationInput): Promise<boolean> {
  if (!Number.isInteger(input.userId) || input.userId <= 0) {
    return false;
  }
  try {
    await db.insert(userNotifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 200),
      content: input.content ?? null,
      data: input.data ? JSON.stringify(input.data) : null,
      isRead: false,
    });
    return true;
  } catch (error) {
    logger.warn("notification.service", "创建通知失败", {
      userId: input.userId,
      type: input.type,
      err: String(error),
    });
    return false;
  }
}

/** 去重并排除无效 ID / 自身，保持插入顺序。 */
export function uniqueRecipientIds(ids: Array<number | null | undefined>, excludeUserId?: number | null): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const raw of ids) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (excludeUserId != null && id === excludeUserId) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

async function resolveUserLocale(userId: number): Promise<Locale> {
  try {
    const [row] = await db
      .select({ language: userProfiles.language })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return resolveLocale(row?.language);
  } catch {
    return DEFAULT_LOCALE;
  }
}

function clipPreview(content: string, max = 80): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}

export type CommentSubmitNotifyInput = {
  commentId: number;
  postId: number;
  postSlug: string;
  postTitle: string;
  postAuthorId: number;
  parentAuthorId?: number | null;
  actorUserId?: number | null;
  actorName: string;
  content: string;
  /** 是否为回复（有 parentId） */
  isReply: boolean;
  /** spam 不发通知，避免噪声 */
  status: "pending" | "approved" | "spam";
};

/**
 * 评论提交后的站内通知：
 * - 回复：通知被回复者与文章作者（去重、排除自身）
 * - 根评论：仅通知文章作者（排除自身）
 * - spam 不通知
 */
export async function notifyOnCommentSubmit(input: CommentSubmitNotifyInput): Promise<void> {
  if (input.status === "spam") return;

  const recipients = uniqueRecipientIds(
    input.isReply ? [input.parentAuthorId, input.postAuthorId] : [input.postAuthorId],
    input.actorUserId
  );
  if (recipients.length === 0) return;

  const preview = clipPreview(input.content);
  const data = {
    commentId: input.commentId,
    postId: input.postId,
    postSlug: input.postSlug,
    parentAuthorId: input.parentAuthorId ?? null,
    kind: input.isReply ? "comment_reply" : "comment_new",
  };

  await Promise.all(
    recipients.map(async (userId) => {
      const locale = await resolveUserLocale(userId);
      const isParent = input.isReply && userId === input.parentAuthorId;
      const titleKey: ApiMessageKey = isParent ? "notification.comment.replyTitle" : "notification.comment.newTitle";
      const contentKey: ApiMessageKey = isParent
        ? "notification.comment.replyContent"
        : "notification.comment.newContent";
      await createUserNotification({
        userId,
        type: "comment",
        title: tApi(locale, titleKey),
        content: tApi(locale, contentKey, {
          actorName: input.actorName || "Someone",
          postTitle: input.postTitle || `#${input.postId}`,
          preview,
        }),
        data,
      });
    })
  );
}

export type CommentModerationNotifyInput = {
  commentId: number;
  postId: number;
  postSlug: string;
  postTitle: string;
  commentAuthorId: number | null | undefined;
  nextStatus: "pending" | "approved" | "spam";
  previousStatus?: "pending" | "approved" | "spam" | null;
  reason?: string;
};

/**
 * 审核结果通知评论作者（仅 registered authorId；pending 不发；状态未变不发）。
 * approved → comment 类型；spam（拒绝）→ system 类型。
 */
export async function notifyOnCommentModeration(input: CommentModerationNotifyInput): Promise<void> {
  const authorId = Number(input.commentAuthorId);
  if (!Number.isInteger(authorId) || authorId <= 0) return;
  if (input.nextStatus === "pending") return;
  if (input.previousStatus && input.previousStatus === input.nextStatus) return;

  const locale = await resolveUserLocale(authorId);
  const data = {
    commentId: input.commentId,
    postId: input.postId,
    postSlug: input.postSlug,
    status: input.nextStatus,
    kind: input.nextStatus === "approved" ? "comment_approved" : "comment_rejected",
    reason: input.reason || undefined,
  };

  if (input.nextStatus === "approved") {
    await createUserNotification({
      userId: authorId,
      type: "comment",
      title: tApi(locale, "notification.comment.approvedTitle"),
      content: tApi(locale, "notification.comment.approvedContent", {
        postTitle: input.postTitle || `#${input.postId}`,
      }),
      data,
    });
    return;
  }

  await createUserNotification({
    userId: authorId,
    type: "system",
    title: tApi(locale, "notification.comment.rejectedTitle"),
    content: tApi(locale, "notification.comment.rejectedContent", {
      postTitle: input.postTitle || `#${input.postId}`,
      reason: input.reason?.trim() || tApi(locale, "notification.comment.rejectedDefaultReason"),
    }),
    data,
  });
}
