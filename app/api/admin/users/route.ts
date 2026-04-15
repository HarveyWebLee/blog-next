import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, like, or } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";
import { mapDbUserToAdminManagedUserRow } from "@/lib/utils/map-db-user-to-admin-row";
import type { AdminManagedUserRow, ApiResponse, PaginatedResponseData } from "@/types/blog";

/**
 * GET /api/admin/users?page=&limit=&q=
 * 分页列出数据库注册用户（不含内存超级管理员）。仅内存超级管理员可调用。
 */
export async function GET(request: NextRequest) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;
    let q = (searchParams.get("q") || "").trim();
    if (q.length > 120) q = q.slice(0, 120);
    // LIKE 通配符简单剥离，避免用户输入破坏模式
    const safe = q.replace(/[%_\\]/g, "");

    let whereExpr = undefined as ReturnType<typeof or> | undefined;
    if (safe.length > 0) {
      const pattern = `%${safe}%`;
      whereExpr = or(like(users.username, pattern), like(users.email, pattern), like(users.displayName, pattern));
    }

    const totalRow = await db.select({ n: count() }).from(users).where(whereExpr);
    const total = Number(totalRow[0]?.n ?? 0);

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        bio: users.bio,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereExpr)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const data: AdminManagedUserRow[] = rows.map((r) => mapDbUserToAdminManagedUserRow(r));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const payload: PaginatedResponseData<AdminManagedUserRow> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponseData<AdminManagedUserRow>>>({
      success: true,
      data: payload,
      message: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/admin/users] GET", e);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取用户列表失败",
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
