import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";
import { mapDbUserToAdminManagedUserRow } from "@/lib/utils/map-db-user-to-admin-row";
import type { AdminUserDetail, AdminUserPatchBody, ApiResponse } from "@/types/blog";

type RouteContext = { params: Promise<{ id: string }> };

function applyRootRoleSemantic(detail: AdminUserDetail, rootUserId: number): AdminUserDetail {
  if (detail.id !== rootUserId) return detail;
  return { ...detail, role: "super_admin" };
}

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/**
 * GET /api/admin/users/:id
 * 用户详情 + user_profiles 摘要（不含密码）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const id = parseId((await context.params).id);
  if (id == null) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的用户 ID", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const urows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (urows.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "用户不存在", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    const u = urows[0];
    const { password: _p, ...rest } = u;

    const pros = await db.select().from(userProfiles).where(eq(userProfiles.userId, id)).limit(1);
    const pr = pros[0];

    const detailRaw: AdminUserDetail = {
      ...mapDbUserToAdminManagedUserRow(rest),
      profile: pr
        ? {
            firstName: pr.firstName ?? undefined,
            lastName: pr.lastName ?? undefined,
            phone: pr.phone ?? undefined,
            website: pr.website ?? undefined,
            location: pr.location ?? undefined,
            timezone: pr.timezone ?? undefined,
            language: pr.language ?? undefined,
          }
        : null,
    };

    const detail = applyRootRoleSemantic(detailRaw, gate.user.userId);
    return NextResponse.json<ApiResponse<AdminUserDetail>>({
      success: true,
      data: detail,
      message: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/admin/users/[id]] GET", e);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取用户失败",
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/:id
 * 更新角色、启用状态（非 active 时无法登录；与登录/刷新令牌校验一致）。
 * 目标用户 id 与当前令牌中的根账户 userId 相同时拒绝修改（根账户在管理端展示为 super_admin）。
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const id = parseId((await context.params).id);
  if (id == null) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的用户 ID", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  let body: AdminUserPatchBody;
  try {
    body = (await request.json()) as AdminUserPatchBody;
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "请求体无效", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  const roles = new Set(["admin", "author", "user"]);
  const statuses = new Set(["active", "inactive", "banned"]);
  if (body.role !== undefined && !roles.has(body.role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的角色", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }
  if (body.status !== undefined && !statuses.has(body.status)) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的状态", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }
  if (body.role === undefined && body.status === undefined) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "请至少提供 role 或 status", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (exists.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "用户不存在", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // 禁止通过本接口修改当前登录的根账户（内存 JWT 中的 super_admin / DB 行可能为 admin）
    if (id === gate.user.userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "不可修改根账户（超级管理员本人）的角色与状态",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    await db
      .update(users)
      .set({
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const urows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const u = urows[0];
    const { password: _p, ...rest } = u;

    const pros = await db.select().from(userProfiles).where(eq(userProfiles.userId, id)).limit(1);
    const pr = pros[0];

    const detailRaw: AdminUserDetail = {
      ...mapDbUserToAdminManagedUserRow(rest),
      profile: pr
        ? {
            firstName: pr.firstName ?? undefined,
            lastName: pr.lastName ?? undefined,
            phone: pr.phone ?? undefined,
            website: pr.website ?? undefined,
            location: pr.location ?? undefined,
            timezone: pr.timezone ?? undefined,
            language: pr.language ?? undefined,
          }
        : null,
    };

    const detail = applyRootRoleSemantic(detailRaw, gate.user.userId);

    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.ADMIN_USER_UPDATED,
      description: `管理端更新用户 #${id}`,
      metadata: {
        targetUserId: id,
        patch: { role: body.role, status: body.status },
      },
      request,
    });

    return NextResponse.json<ApiResponse<AdminUserDetail>>({
      success: true,
      data: detail,
      message: "已更新",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/admin/users/[id]] PATCH", e);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "更新用户失败",
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
