/**
 * 公开用户资料页接口
 *
 * GET /api/profile/public/{userId}
 * - 读取指定用户的公开资料（按隐私配置裁剪字段）
 * - 返回该用户公开文章列表（分页、分类/标签/标题筛选，按时间倒序）
 * - 过滤项 categories/tags 来源于该用户本人创建的数据（owner 维度），而非文章反向聚合
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/config";
import {
  categories,
  comments,
  posts,
  postTags,
  tags,
  userActivities,
  userFavorites,
  userFollows,
  userProfiles,
  users,
} from "@/lib/db/schema";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { ApiResponse, PaginatedResponseData, PostData, ProfileStats, UserActivity } from "@/types/blog";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

type VisibilityValue = "public" | "private" | "friends";

type PrivacySettings = {
  profileVisibility?: VisibilityValue;
  emailVisibility?: VisibilityValue;
  activityVisibility?: VisibilityValue;
  githubVisibility?: VisibilityValue;
  wechatQrVisibility?: VisibilityValue;
  statsVisibility?: VisibilityValue;
  recentActivityVisibility?: VisibilityValue;
};

function asObjectRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

function parseJsonRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return asObjectRecord(JSON.parse(raw));
  } catch {
    return {};
  }
}

function pickVisibility(v: unknown, fallback: VisibilityValue): VisibilityValue {
  if (v === "public" || v === "private" || v === "friends") return v;
  return fallback;
}

function pickSocialString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return undefined;
}

function canReadByVisibility(
  visibility: VisibilityValue,
  ctx: { isSelf: boolean; isFollower: boolean; isSuperAdmin: boolean }
): boolean {
  if (ctx.isSelf || ctx.isSuperAdmin) return true;
  if (visibility === "public") return true;
  if (visibility === "friends") return ctx.isFollower;
  return false;
}

function toPositiveInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: userIdRaw } = await params;
    const targetUserId = Number.parseInt(userIdRaw, 10);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "无效的用户 ID", timestamp: new Date().toISOString() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const viewer = getAuthUserFromRequest(request);
    const isSuperAdmin = Boolean(viewer?.isRoot && viewer?.role === "super_admin");
    const isSelf = viewer?.userId === targetUserId;

    const [userRows, profileRows] = await Promise.all([
      db.select().from(users).where(eq(users.id, targetUserId)).limit(1),
      db.select().from(userProfiles).where(eq(userProfiles.userId, targetUserId)).limit(1),
    ]);

    if (userRows.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "用户不存在", timestamp: new Date().toISOString() },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const userRow = userRows[0];
    const profileRow = profileRows[0];
    const privacyRaw = parseJsonRecord(profileRow?.privacy ?? null);
    const privacy: PrivacySettings = {
      profileVisibility: pickVisibility(privacyRaw.profileVisibility, "public"),
      emailVisibility: pickVisibility(privacyRaw.emailVisibility, "private"),
      activityVisibility: pickVisibility(privacyRaw.activityVisibility, "public"),
      githubVisibility: pickVisibility(privacyRaw.githubVisibility, "public"),
      wechatQrVisibility: pickVisibility(privacyRaw.wechatQrVisibility, "private"),
      statsVisibility: pickVisibility(privacyRaw.statsVisibility, "public"),
      recentActivityVisibility: pickVisibility(privacyRaw.recentActivityVisibility, "public"),
    };

    let isFollower = false;
    let isFollowedByTarget = false;
    if (!isSelf && viewer?.userId) {
      const [followRows, followedByRows] = await Promise.all([
        db
          .select({ id: userFollows.id })
          .from(userFollows)
          .where(and(eq(userFollows.followerId, viewer.userId), eq(userFollows.followingId, targetUserId)))
          .limit(1),
        db
          .select({ id: userFollows.id })
          .from(userFollows)
          .where(and(eq(userFollows.followerId, targetUserId), eq(userFollows.followingId, viewer.userId)))
          .limit(1),
      ]);
      isFollower = followRows.length > 0;
      isFollowedByTarget = followedByRows.length > 0;
    }

    const readCtx = { isSelf, isFollower, isSuperAdmin };
    const canReadProfile = canReadByVisibility(privacy.profileVisibility || "public", readCtx);
    if (!canReadProfile) {
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            blocked: true,
            reason: "该用户设置了仅关注者或仅自己可见",
            user: {
              id: userRow.id,
              username: userRow.username,
              displayName: userRow.displayName || userRow.username,
              avatar: userRow.avatar || undefined,
            },
          },
          message: "资料受限",
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const url = new URL(request.url);
    const page = toPositiveInt(url.searchParams.get("page"), 1);
    const limit = Math.min(20, toPositiveInt(url.searchParams.get("limit"), 6));
    const offset = (page - 1) * limit;
    const search = (url.searchParams.get("search") || "").trim();
    const categoryId = toPositiveInt(url.searchParams.get("categoryId"), 0) || undefined;
    const tagId = toPositiveInt(url.searchParams.get("tagId"), 0) || undefined;

    const postConditions = [
      eq(posts.authorId, targetUserId),
      eq(posts.status, "published"),
      eq(posts.visibility, "public"),
      ...(search
        ? [
            or(
              like(posts.title, `%${search}%`),
              like(posts.excerpt, `%${search}%`),
              like(posts.content, `%${search}%`)
            )!,
          ]
        : []),
      ...(categoryId ? [eq(posts.categoryId, categoryId)] : []),
      ...(tagId
        ? [inArray(posts.id, db.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagId, tagId)))]
        : []),
    ];
    const wherePosts = and(...postConditions)!;

    const [postRows, postTotalRows] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          featuredImage: posts.featuredImage,
          authorId: posts.authorId,
          categoryId: posts.categoryId,
          status: posts.status,
          visibility: posts.visibility,
          allowComments: posts.allowComments,
          viewCount: posts.viewCount,
          likeCount: posts.likeCount,
          favoriteCount: sql<number>`(select count(*) from user_favorites uf where uf.post_id = ${posts.id})`,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          categoryName: categories.name,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(wherePosts)
        .orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.updatedAt}, ${posts.createdAt})`), desc(posts.id))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(posts).where(wherePosts),
    ]);

    const postIds = postRows.map((p) => p.id);
    const tagRows =
      postIds.length === 0
        ? []
        : await db
            .select({
              postId: postTags.postId,
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
              color: tags.color,
            })
            .from(postTags)
            .innerJoin(tags, eq(postTags.tagId, tags.id))
            .where(inArray(postTags.postId, postIds));

    const tagsByPost = new Map<number, Array<{ id: number; name: string; slug: string; color: string | null }>>();
    for (const row of tagRows) {
      const list = tagsByPost.get(row.postId) || [];
      list.push({ id: row.id, name: row.name, slug: row.slug, color: row.color });
      tagsByPost.set(row.postId, list);
    }

    const postsData: PostData[] = postRows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: "",
      contentHtml: null,
      featuredImage: p.featuredImage,
      authorId: p.authorId,
      categoryId: p.categoryId,
      status: (p.status || "published") as PostData["status"],
      visibility: (p.visibility || "public") as PostData["visibility"],
      password: null,
      allowComments: Boolean(p.allowComments),
      viewCount: p.viewCount || 0,
      likeCount: p.likeCount || 0,
      favoriteCount: p.favoriteCount || 0,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        password: "",
        displayName: userRow.displayName || userRow.username,
        avatar: userRow.avatar ?? undefined,
        bio: userRow.bio ?? undefined,
        role: (userRow.role || "user") as "admin" | "author" | "user",
        status: (userRow.status || "active") as "active" | "inactive" | "banned",
        emailVerified: Boolean(userRow.emailVerified),
        lastLoginAt: userRow.lastLoginAt ?? undefined,
        createdAt: userRow.createdAt,
        updatedAt: userRow.updatedAt,
      },
      category:
        p.categoryId && p.categoryName
          ? {
              id: p.categoryId,
              name: p.categoryName,
              slug: "",
              description: undefined,
              parentId: undefined,
              sortOrder: 0,
              isActive: true,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }
          : null,
      tags: (tagsByPost.get(p.id) || []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color || undefined,
        description: undefined,
        isActive: true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      comments: [],
      readTime: Math.max(1, Math.ceil((p.excerpt?.length || 120) / 220)),
    }));

    const totalPosts = postTotalRows[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalPosts / limit));
    const pagedPosts: PaginatedResponseData<PostData> = {
      data: postsData,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    const [categoryFilterRows, tagFilterRows] = await Promise.all([
      db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(and(eq(categories.ownerId, targetUserId), eq(categories.isActive, true)))
        .orderBy(categories.name),
      db
        .select({ id: tags.id, name: tags.name })
        .from(tags)
        .where(and(eq(tags.ownerId, targetUserId), eq(tags.isActive, true)))
        .orderBy(tags.name),
    ]);

    const socialRaw = parseJsonRecord(profileRow?.socialLinks ?? null);
    const canReadEmail = canReadByVisibility(privacy.emailVisibility || "private", readCtx);
    const canReadGithub = canReadByVisibility(privacy.githubVisibility || "public", readCtx);
    const canReadWechat = canReadByVisibility(privacy.wechatQrVisibility || "private", readCtx);
    const canReadStats = canReadByVisibility(privacy.statsVisibility || "public", readCtx);
    const canReadRecentActivities = canReadByVisibility(privacy.recentActivityVisibility || "public", readCtx);

    let stats: ProfileStats | null = null;
    if (canReadStats) {
      const [
        postsCount,
        commentsCount,
        viewsSum,
        likesSum,
        favoritesCount,
        followersCount,
        followingCount,
        lastActivity,
      ] = await Promise.all([
        db.select({ count: count() }).from(posts).where(eq(posts.authorId, targetUserId)),
        db.select({ count: count() }).from(comments).where(eq(comments.authorId, targetUserId)),
        db
          .select({ total: sql<number>`COALESCE(SUM(${posts.viewCount}),0)` })
          .from(posts)
          .where(eq(posts.authorId, targetUserId)),
        db
          .select({ total: sql<number>`COALESCE(SUM(${posts.likeCount}),0)` })
          .from(posts)
          .where(eq(posts.authorId, targetUserId)),
        db
          .select({ count: count() })
          .from(userFavorites)
          .innerJoin(posts, eq(userFavorites.postId, posts.id))
          .where(eq(posts.authorId, targetUserId)),
        db.select({ count: count() }).from(userFollows).where(eq(userFollows.followingId, targetUserId)),
        db.select({ count: count() }).from(userFollows).where(eq(userFollows.followerId, targetUserId)),
        db
          .select({ lastAt: sql<Date>`MAX(${userActivities.createdAt})` })
          .from(userActivities)
          .where(eq(userActivities.userId, targetUserId)),
      ]);

      stats = {
        totalPosts: postsCount[0]?.count || 0,
        totalComments: commentsCount[0]?.count || 0,
        totalViews: viewsSum[0]?.total || 0,
        totalLikes: likesSum[0]?.total || 0,
        totalFavorites: favoritesCount[0]?.count || 0,
        totalFollowers: followersCount[0]?.count || 0,
        totalFollowing: followingCount[0]?.count || 0,
        unreadNotifications: 0,
        lastActivityAt: lastActivity[0]?.lastAt || undefined,
      };
    }

    let recentActivities: UserActivity[] = [];
    if (canReadRecentActivities) {
      const actRows = await db
        .select()
        .from(userActivities)
        .where(eq(userActivities.userId, targetUserId))
        .orderBy(desc(userActivities.createdAt))
        .limit(5);
      recentActivities = actRows.map((activity) => ({
        id: activity.id,
        userId: activity.userId ?? undefined,
        action: activity.action,
        description: activity.description ?? undefined,
        metadata: activity.metadata ? parseJsonRecord(activity.metadata) : undefined,
        ipAddress: undefined,
        userAgent: undefined,
        createdAt: activity.createdAt,
        updatedAt: activity.createdAt,
      }));
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          blocked: false,
          user: {
            id: userRow.id,
            username: userRow.username,
            displayName: userRow.displayName || userRow.username,
            avatar: userRow.avatar || undefined,
            bio: userRow.bio || undefined,
            location: profileRow?.location || undefined,
            website: profileRow?.website || undefined,
            email: canReadEmail ? userRow.email : undefined,
            socialLinks: {
              github: canReadGithub ? pickSocialString(socialRaw, ["github"]) : undefined,
              wechatQr: canReadWechat
                ? pickSocialString(socialRaw, ["wechatQr", "wechat_qr", "wechatQR", "wechat"])
                : undefined,
              douyin: pickSocialString(socialRaw, ["douyin"]),
              bilibili: pickSocialString(socialRaw, ["bilibili"]),
            },
          },
          visibility: {
            ...privacy,
            isSelf,
            isFollower,
            isFollowedByTarget,
          },
          stats,
          recentActivities,
          posts: pagedPosts,
          filters: {
            categories: categoryFilterRows,
            tags: tagFilterRows,
          },
        },
        message: "公开资料获取成功",
        timestamp: new Date().toISOString(),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("获取公开资料失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取公开资料失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
