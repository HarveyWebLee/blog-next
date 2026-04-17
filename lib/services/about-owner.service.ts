import { eq } from "drizzle-orm";

import {
  getSuperAdminProfileUserId,
  isSuperAdminEnabled,
  mergeSuperAdminProfileFromRow,
} from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { userProfiles } from "@/lib/db/schema";
import type { ProfileSocialLinks } from "@/types/blog";

/**
 * 关于页面向访客展示的站长信息（来源：超级管理员资料行）。
 * 各字段为 null 时表示不在此渠道展示该项，调用方应回退到 i18n 词典中的占位文案。
 */
export type AboutOwnerPublic = {
  email: string | null;
  location: string | null;
  githubUrl: string | null;
  website: string | null;
};

function isPlaceholderSuperAdminEmail(email: string): boolean {
  return email.endsWith("@superadmin.local");
}

/**
 * 读取关于页用站长公开资料。
 * - 未启用 SUPER_ADMIN 时返回 null（页面仅使用词典静态文案）。
 * - 启用时合并 DB 行与默认资料；占位邮箱不向公开展示。
 */
export async function getAboutOwnerPublic(): Promise<AboutOwnerPublic | null> {
  if (!isSuperAdminEnabled()) {
    return null;
  }
  const username = (process.env.SUPER_ADMIN_USERNAME ?? "").trim();
  if (!username) {
    return null;
  }

  const profileUserId = await getSuperAdminProfileUserId();
  if (profileUserId == null) {
    return null;
  }
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, profileUserId)).limit(1);
  const profile = mergeSuperAdminProfileFromRow(rows[0], username);
  const rawEmail = profile.email?.trim() ?? "";
  const email = rawEmail && !isPlaceholderSuperAdminEmail(rawEmail) ? rawEmail : null;
  const location = profile.location?.trim() || null;
  const social = profile.socialLinks as ProfileSocialLinks | undefined;
  const gh = social?.github;
  const githubUrl = typeof gh === "string" && gh.trim().length > 0 ? gh.trim() : null;
  const website = profile.website?.trim() || null;

  return { email, location, githubUrl, website };
}
