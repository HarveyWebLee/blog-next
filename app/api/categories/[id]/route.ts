/**
 * 单个分类API路由
 * 提供单个分类的增删改查接口
 *
 * 鉴权要求：所有接口均需 Authorization: Bearer。
 * 数据范围：仅允许访问与操作当前登录用户 ownerId 下的分类数据。
 *
 * GET /api/categories/[id] - 获取单个分类（返回分类信息与文章数量）
 * PUT /api/categories/[id] - 更新分类（校验名称/slug 在 owner 范围内唯一）
 * DELETE /api/categories/[id] - 删除分类（若存在子分类或关联文章则拒绝）
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories, posts } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, Category, UpdateCategoryRequest } from "@/types/blog";

/**
 * GET /api/categories/[id]
 * 获取单个分类
 */
async function handleCategoryByIdGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.reason === "missing" ? "请先登录后查看分类" : "登录状态无效，请重新登录",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const { id } = await params;
    const categoryId = parseInt(id);
    const isRoot = isJwtInMemorySuperRoot(auth.user);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的分类ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 查询分类
    const [category] = await db
      .select()
      .from(categories)
      .where(
        isRoot
          ? eq(categories.id, categoryId)
          : and(eq(categories.id, categoryId), eq(categories.ownerId, auth.user.userId))
      )
      .limit(1);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "分类不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 获取分类关联的文章数量
    const [postCountResult] = await db.select({ count: count() }).from(posts).where(eq(posts.categoryId, categoryId));

    const categoryWithCount = {
      ...category,
      postCount: postCountResult.count,
    };

    return NextResponse.json({
      success: true,
      data: categoryWithCount,
      message: "分类获取成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<Category & { postCount: number }>);
  } catch (error) {
    throw error;
  }
}

/**
 * PUT /api/categories/[id]
 * 更新分类
 */
async function handleCategoryByIdPUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.reason === "missing" ? "请先登录后更新分类" : "登录状态无效，请重新登录",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const { id } = await params;
    const categoryId = parseInt(id);
    const body: UpdateCategoryRequest = await request.json();
    const isRoot = isJwtInMemorySuperRoot(auth.user);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的分类ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        isRoot
          ? eq(categories.id, categoryId)
          : and(eq(categories.id, categoryId), eq(categories.ownerId, auth.user.userId))
      )
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "分类不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 检查名称是否重复（如果提供了新名称）
    if (body.name && body.name !== existingCategory.name) {
      const [duplicateName] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.name, body.name),
            ne(categories.id, categoryId),
            eq(categories.ownerId, existingCategory.ownerId)
          )
        )
        .limit(1);

      if (duplicateName) {
        return NextResponse.json(
          {
            success: false,
            message: "分类名称已存在",
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // 检查slug是否重复（如果提供了新slug）
    if (body.slug && body.slug !== existingCategory.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.slug, body.slug),
            ne(categories.id, categoryId),
            eq(categories.ownerId, existingCategory.ownerId)
          )
        )
        .limit(1);

      if (duplicateSlug) {
        return NextResponse.json(
          {
            success: false,
            message: "分类slug已存在",
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // 更新分类
    await db
      .update(categories)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId));

    // 重新查询更新后的分类
    const [updatedCategory] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

    logUserActivity({
      userId: auth.user.userId,
      action: UserActivityAction.CATEGORY_UPDATED,
      description: updatedCategory?.name,
      metadata: { categoryId, slug: updatedCategory?.slug },
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCategory,
        description: updatedCategory.description || undefined,
        parentId: updatedCategory.parentId || undefined,
        isActive: updatedCategory.isActive ?? true,
      },
      message: "分类更新成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<Category>);
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE /api/categories/[id]
 * 删除分类
 */
async function handleCategoryByIdDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.reason === "missing" ? "请先登录后删除分类" : "登录状态无效，请重新登录",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const { id } = await params;
    const categoryId = parseInt(id);
    const isRoot = isJwtInMemorySuperRoot(auth.user);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的分类ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        isRoot
          ? eq(categories.id, categoryId)
          : and(eq(categories.id, categoryId), eq(categories.ownerId, auth.user.userId))
      )
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "分类不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 检查是否有文章使用该分类
    const [postCountResult] = await db.select({ count: count() }).from(posts).where(eq(posts.categoryId, categoryId));

    if (postCountResult.count > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "无法删除分类，该分类下还有文章",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 检查是否有子分类
    const [childCountResult] = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (childCountResult.count > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "无法删除分类，该分类下还有子分类",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    logUserActivity({
      userId: auth.user.userId,
      action: UserActivityAction.CATEGORY_DELETED,
      description: existingCategory.name,
      metadata: { categoryId, slug: existingCategory.slug },
      request,
    });

    // 删除分类
    await db.delete(categories).where(eq(categories.id, categoryId));

    return NextResponse.json({
      success: true,
      data: null,
      message: "分类删除成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  } catch (error) {
    throw error;
  }
}

export const { GET, PUT, DELETE } = defineApiHandlers({
  GET: handleCategoryByIdGET,
  PUT: handleCategoryByIdPUT,
  DELETE: handleCategoryByIdDELETE,
});
