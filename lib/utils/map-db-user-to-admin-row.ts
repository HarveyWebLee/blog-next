import type { InferSelectModel } from "drizzle-orm";

import { users } from "@/lib/db/schema";
import type { AdminManagedUserRow } from "@/types/blog";

type UserRow = InferSelectModel<typeof users>;

/**
 * Drizzle 行中可空字段多为 `T | null`，与 {@link AdminManagedUserRow}（`undefined`）对齐，供管理 API JSON 使用。
 */
export function mapDbUserToAdminManagedUserRow(r: Omit<UserRow, "password">): AdminManagedUserRow {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    displayName: r.displayName ?? undefined,
    avatar: r.avatar ?? undefined,
    bio: r.bio ?? undefined,
    role: (r.role || "user") as AdminManagedUserRow["role"],
    status: r.status as AdminManagedUserRow["status"],
    emailVerified: Boolean(r.emailVerified),
    lastLoginAt: r.lastLoginAt ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
