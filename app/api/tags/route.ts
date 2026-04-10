/**
 * 标签API路由
 * 提供标签的增删改查接口
 *
 * GET /api/tags - 获取标签列表（支持分页、搜索、过滤）
 * POST /api/tags - 创建新标签
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, like } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { tags } from "@/lib/db/schema";
import { ApiResponse, CreateTagRequest, PaginatedResponseData, Tag, TagQueryParams } from "@/types/blog";

/**
 * GET /api/tags
 * 获取标签列表
 * 支持分页、搜索、状态过滤等
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined;

    // 构建查询条件
    const conditions = [];

    if (search) {
      conditions.push(like(tags.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(tags.isActive, isActive));
    }

    // 构建排序 - 使用安全的字段映射
    const sortFieldMap: Record<string, any> = {
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      isActive: tags.isActive,
    };

    const sortField = sortFieldMap[sortBy] || tags.createdAt;
    const orderBy = sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 执行查询
    const [tagsList, totalCount] = await Promise.all([
      db
        .select()
        .from(tags)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
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
    console.error("获取标签列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取标签列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * 创建新标签
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTagRequest = await request.json();

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
    const existingTag = await db.select().from(tags).where(eq(tags.name, body.name)).limit(1);

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
    const existingSlug = await db.select().from(tags).where(eq(tags.slug, body.slug)).limit(1);

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
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      color: body.color || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // 重新查询创建的标签
    const [newTag] = await db.select().from(tags).where(eq(tags.name, body.name)).limit(1);

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
    console.error("创建标签失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "创建标签失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
