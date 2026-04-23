/**
 * 标签API路由
 * 提供标签的增删改查接口
 *
 * 鉴权要求：所有接口均需 Authorization: Bearer。
 * 数据范围：仅允许访问与操作当前登录用户 ownerId 下的标签数据。
 *
 * GET /api/tags - 获取标签列表（支持分页、搜索、状态过滤；返回每个标签的 postCount）
 * POST /api/tags - 创建新标签（ownerId 由服务端按登录态写入）
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { postTags, tags } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, CreateTagRequest, PaginatedResponseData, Tag, TagQueryParams } from "@/types/blog";

/**
 * GET /api/tags
 * 获取标签列表
 * 支持分页、搜索、状态过滤等
 */
async function handleTagsGET(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.reason === "missing" ? "请先登录后查看标签" : "登录状态无效，请重新登录",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined;
    const ownerIdQuery = searchParams.get("ownerId");
    const ownerIdFromQuery = ownerIdQuery ? parseInt(ownerIdQuery, 10) : NaN;
    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const ownerScopeId =
      isRoot && Number.isFinite(ownerIdFromQuery) && ownerIdFromQuery > 0 ? ownerIdFromQuery : auth.user.userId;

    // 构建查询条件
    const conditions = [];

    if (search) {
      conditions.push(like(tags.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(tags.isActive, isActive));
    }
    conditions.push(eq(tags.ownerId, ownerScopeId));

    // 构建排序 - 使用安全的字段映射
    const postCountExpr = sql<number>`count(${postTags.postId})`;
    const sortFieldMap: Record<string, any> = {
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      isActive: tags.isActive,
      postCount: postCountExpr,
    };

    const sortField = sortFieldMap[sortBy] || tags.createdAt;
    const orderBy = sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 执行查询
    const [tagsList, totalCount] = await Promise.all([
      db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          color: tags.color,
          isActive: tags.isActive,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
          postCount: postCountExpr,
        })
        .from(tags)
        .leftJoin(postTags, eq(tags.id, postTags.tagId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(tags.id)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(tags)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then((result) => result[0].count),
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const responseData: PaginatedResponseData<Tag> = {
      data: tagsList.map((tag) => ({
        ...tag,
        description: tag.description || undefined,
        color: tag.color || undefined,
        isActive: tag.isActive ?? true,
        postCount: Number(tag.postCount || 0),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: "标签列表获取成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<PaginatedResponseData<Tag>>);
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/tags
 * 创建新标签
 */
async function handleTagsPOST(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.reason === "missing" ? "请先登录后再创建标签" : "登录状态无效，请重新登录",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateTagRequest & { ownerId?: number };
    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const targetOwnerId =
      isRoot && Number.isFinite(body.ownerId) && Number(body.ownerId) > 0 ? Number(body.ownerId) : auth.user.userId;

    // 验证必填字段
    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          success: false,
          message: "标签名称和slug不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查标签名称是否已存在
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(eq(tags.name, body.name), eq(tags.ownerId, targetOwnerId)))
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "标签名称已存在",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 检查slug是否已存在
    const existingSlug = await db
      .select()
      .from(tags)
      .where(and(eq(tags.slug, body.slug), eq(tags.ownerId, targetOwnerId)))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "标签slug已存在",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 创建新标签
    await db.insert(tags).values({
      ownerId: targetOwnerId,
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      color: body.color || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // 重新查询创建的标签
    const [newTag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.name, body.name), eq(tags.ownerId, targetOwnerId)))
      .limit(1);

    if (newTag) {
      logUserActivity({
        userId: auth.user.userId,
        action: UserActivityAction.TAG_CREATED,
        description: newTag.name,
        metadata: { tagId: newTag.id, slug: newTag.slug },
        request,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newTag,
        description: newTag.description || undefined,
        color: newTag.color || undefined,
        isActive: newTag.isActive ?? true,
      },
      message: "标签创建成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<Tag>);
  } catch (error) {
    throw error;
  }
}

export const { GET, POST } = defineApiHandlers({
  GET: handleTagsGET,
  POST: handleTagsPOST,
});
