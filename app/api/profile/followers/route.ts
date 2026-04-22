/**
 * 个人中心粉丝列表 API
 *
 * GET /api/profile/followers - 获取当前登录用户的粉丝列表（分页）
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows, users } from "@/lib/db/schema";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, PaginatedResponseData, ProfileRelationItem } from "@/types/blog";

function parsePage(v: string | null): number {
  const n = Number.parseInt(v || "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function parseLimit(v: string | null): number {
  const n = Number.parseInt(v || "20", 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(n, 100);
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams.get("page"));
    const limit = parseLimit(searchParams.get("limit"));
    const search = (searchParams.get("search") || "").trim();
    const mutualOnly = searchParams.get("mutualOnly") === "true";
    const offset = (page - 1) * limit;
    const userId = auth.user.userId;

    const followingRows = mutualOnly
      ? await db
          .select({ followingId: userFollows.followingId })
          .from(userFollows)
          .where(eq(userFollows.followerId, userId))
      : [];
    const followingIds = followingRows.map((row) => row.followingId);
    if (mutualOnly && followingIds.length === 0) {
      const emptyData: PaginatedResponseData<ProfileRelationItem> = {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
      return NextResponse.json<ApiResponse<PaginatedResponseData<ProfileRelationItem>>>({
        success: true,
        data: emptyData,
        message: "粉丝列表获取成功",
        timestamp: new Date().toISOString(),
      });
    }

    const searchFilter = search
      ? or(like(users.username, `%${search}%`), like(users.displayName, `%${search}%`))
      : undefined;

    const baseFilters = [
      eq(userFollows.followingId, userId),
      ...(mutualOnly ? [inArray(userFollows.followerId, followingIds)] : []),
      ...(searchFilter ? [searchFilter] : []),
    ];
    const whereClause = and(...baseFilters)!;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          followerUserId: users.id,
          followerUsername: users.username,
          followerDisplayName: users.displayName,
          followerAvatar: users.avatar,
          followerBio: users.bio,
          followerLastLoginAt: users.lastLoginAt,
          followedAt: userFollows.createdAt,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(whereClause)
        .orderBy(desc(userFollows.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(whereClause),
    ]);

    const followerIds = rows.map((row) => row.followerUserId);
    const mutualRows =
      followerIds.length > 0
        ? await db
            .select({ followingId: userFollows.followingId })
            .from(userFollows)
            .where(and(eq(userFollows.followerId, userId), inArray(userFollows.followingId, followerIds)))
        : [];
    const mutualSet = new Set(mutualRows.map((row) => row.followingId));

    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<ProfileRelationItem> = {
      data: rows.map((row) => ({
        userId: row.followerUserId,
        username: row.followerUsername,
        displayName: row.followerDisplayName ?? undefined,
        avatar: row.followerAvatar ?? undefined,
        bio: row.followerBio ?? undefined,
        followedAt: row.followedAt,
        lastActiveAt: row.followerLastLoginAt ?? undefined,
        isMutual: mutualSet.has(row.followerUserId),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponseData<ProfileRelationItem>>>({
      success: true,
      data: responseData,
      message: "粉丝列表获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取粉丝列表失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取粉丝列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
