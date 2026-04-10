/**
 * 分类API路由
 * 提供分类的增删改查接口
 *
 * GET /api/categories - 获取分类列表（支持分页、搜索、过滤）
 * POST /api/categories - 创建新分类
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, like } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories } from "@/lib/db/schema";
import { ApiResponse, Category, CategoryQueryParams, CreateCategoryRequest, PaginatedResponseData } from "@/types/blog";

/**
 * GET /api/categories
 * 获取分类列表
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
    const parentId = searchParams.get("parentId") ? parseInt(searchParams.get("parentId")!) : undefined;

    // 构建查询条件
    const conditions = [];

    if (search) {
      conditions.push(like(categories.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive));
    }

    if (parentId !== undefined) {
      conditions.push(eq(categories.parentId, parentId));
    }

    // 构建排序 - 使用安全的字段映射
    const sortFieldMap: Record<string, any> = {
      name: categories.name,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      isActive: categories.isActive,
    };

    const sortField = sortFieldMap[sortBy] || categories.createdAt;
    const orderBy = sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 执行查询
    const [categoriesList, totalCount] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(categories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then((result) => result[0].count),
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const responseData: PaginatedResponseData<Category> = {
      data: categoriesList.map((category) => ({
        ...category,
        description: category.description || undefined,
        parentId: category.parentId || undefined,
        isActive: category.isActive ?? true,
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
      message: "分类列表获取成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<PaginatedResponseData<Category>>);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取分类列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * 创建新分类
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateCategoryRequest = await request.json();

    // 验证必填字段
    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          success: false,
          message: "分类名称和slug不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查分类名称是否已存在
    const existingCategory = await db.select().from(categories).where(eq(categories.name, body.name)).limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "分类名称已存在",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 检查slug是否已存在
    const existingSlug = await db.select().from(categories).where(eq(categories.slug, body.slug)).limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "分类slug已存在",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 创建新分类
    await db.insert(categories).values({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      parentId: body.parentId || null,
      sortOrder: body.sortOrder || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // 重新查询创建的分类
    const [newCategory] = await db.select().from(categories).where(eq(categories.name, body.name)).limit(1);

    return NextResponse.json({
      success: true,
      data: {
        ...newCategory,
        description: newCategory.description || undefined,
        parentId: newCategory.parentId || undefined,
        isActive: newCategory.isActive ?? true,
      },
      message: "分类创建成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<Category>);
  } catch (error) {
    console.error("创建分类失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "创建分类失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
