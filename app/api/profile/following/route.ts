/**
 * 个人中心关注列表 API
 *
 * GET /api/profile/following - 获取当前登录用户的关注列表（分页）
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
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

async function handleProfileFollowingGET(request: NextRequest) {
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

    const followerRows = mutualOnly
      ? await db
          .select({ followerId: userFollows.followerId })
          .from(userFollows)
          .where(eq(userFollows.followingId, userId))
      : [];
    const followerIds = followerRows.map((row) => row.followerId);
    if (mutualOnly && followerIds.length === 0) {
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
        message: "关注列表获取成功",
        timestamp: new Date().toISOString(),
      });
    }

    const searchFilter = search
      ? or(like(users.username, `%${search}%`), like(users.displayName, `%${search}%`))
      : undefined;

    const baseFilters = [
      eq(userFollows.followerId, userId),
      ...(mutualOnly ? [inArray(userFollows.followingId, followerIds)] : []),
      ...(searchFilter ? [searchFilter] : []),
    ];
    const whereClause = and(...baseFilters)!;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          followingUserId: users.id,
          followingUsername: users.username,
          followingDisplayName: users.displayName,
          followingAvatar: users.avatar,
          followingBio: users.bio,
          followingLastLoginAt: users.lastLoginAt,
          followedAt: userFollows.createdAt,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(whereClause)
        .orderBy(desc(userFollows.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(whereClause),
    ]);

    const followingIds = rows.map((row) => row.followingUserId);
    const mutualRows =
      followingIds.length > 0
        ? await db
            .select({ followerId: userFollows.followerId })
            .from(userFollows)
            .where(and(eq(userFollows.followingId, userId), inArray(userFollows.followerId, followingIds)))
        : [];
    const mutualSet = new Set(mutualRows.map((row) => row.followerId));

    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<ProfileRelationItem> = {
      data: rows.map((row) => ({
        userId: row.followingUserId,
        username: row.followingUsername,
        displayName: row.followingDisplayName ?? undefined,
        avatar: row.followingAvatar ?? undefined,
        bio: row.followingBio ?? undefined,
        followedAt: row.followedAt,
        lastActiveAt: row.followingLastLoginAt ?? undefined,
        isMutual: mutualSet.has(row.followingUserId),
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
      message: "关注列表获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET } = defineApiHandlers({ GET: handleProfileFollowingGET });
