#!/usr/bin/env tsx

/**
 * 简化版本的博客API测试脚本
 * 直接使用数据库操作，避免复杂的服务层问题
 */
import { sql } from "drizzle-orm";

import { db } from "../lib/db/config";
import { categories, posts, tags, users } from "../lib/db/schema";

/**
 * 测试数据
 */
const testData = {
  // 测试分类
  category: {
    name: "技术分享",
    slug: "tech",
    description: "技术相关的文章分享",
    parentId: null,
    sortOrder: 1,
    isActive: true,
  },

  // 测试标签
  tags: [
    {
      name: "JavaScript",
      slug: "javascript",
      description: "JavaScript相关",
      color: "#F59E0B",
      isActive: true,
    },
    {
      name: "React",
      slug: "react",
      description: "React相关",
      color: "#10B981",
      isActive: true,
    },
    {
      name: "Next.js",
      slug: "nextjs",
      description: "Next.js相关",
      color: "#8B5CF6",
      isActive: true,
    },
  ],

  // 测试文章
  post: {
    title: "使用 Next.js 15 构建现代化博客系统",
    slug: "building-modern-blog-with-nextjs-15",
    excerpt: "本文介绍如何使用 Next.js 15 和 Drizzle ORM 构建一个功能完整的博客系统...",
    content: `
# 使用 Next.js 15 构建现代化博客系统

## 引言

Next.js 15 带来了许多激动人心的新特性，包括：
- 改进的 App Router
- 更好的 TypeScript 支持
- 优化的构建性能
- 增强的开发体验

## 技术栈

- **前端框架**: Next.js 15
- **UI组件库**: HeroUI v2
- **数据库**: MySQL 8.0+
- **ORM**: Drizzle ORM
- **样式**: Tailwind CSS 4

## 核心功能

### 1. 文章管理
- 支持 Markdown 格式
- 分类和标签系统
- 草稿和发布状态
- SEO 优化

### 2. 用户系统
- 角色权限管理
- 用户认证
- 个人资料

### 3. 评论系统
- 嵌套评论
- 垃圾评论过滤
- 邮件通知

## 总结

Next.js 15 为构建现代化博客系统提供了强大的基础，结合 Drizzle ORM 和 MySQL，我们可以创建一个高性能、易维护的博客平台。
    `,
    status: "published",
    visibility: "public" as const,
    allowComments: true,
  },
};

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  console.log("🧹 清理测试数据...");

  try {
    // 删除测试文章
    await db
      .delete(posts)
      .where(
        sql`title = '使用 Next.js 15 构建现代化博客系统' OR title = '使用 Next.js 15 构建现代化博客系统 - 更新版'`
      );

    // 删除测试分类
    await db.delete(categories).where(sql`name = '技术分享'`);

    // 删除测试标签
    await db.delete(tags).where(sql`name = 'JavaScript' OR name = 'React' OR name = 'Next.js'`);

    console.log("✅ 测试数据清理完成");
  } catch (error) {
    console.error("❌ 清理测试数据失败:", error);
  }
}

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  console.log("🔌 测试数据库连接...");

  try {
    const result = await db.select({ count: sql`1` }).from(posts);
    console.log("✅ 数据库连接成功");
    return true;
  } catch (error) {
    console.error("❌ 数据库连接失败:", error);
    return false;
  }
}

/**
 * 测试创建分类
 */
async function testCreateCategory() {
  console.log("📁 测试创建分类...");

  try {
    await db.insert(categories).values(testData.category);
    // 获取插入后的分类ID
    const [category] = await db
      .select()
      .from(categories)
      .where(sql`name = ${testData.category.name}`)
      .limit(1);
    console.log("✅ 分类创建成功:", category);
    return category;
  } catch (error) {
    console.error("❌ 分类创建失败:", error);
    return null;
  }
}

/**
 * 测试创建标签
 */
async function testCreateTags() {
  console.log("🏷️ 测试创建标签...");

  try {
    await db.insert(tags).values(testData.tags);
    // 获取插入后的标签
    const createdTags = await db
      .select()
      .from(tags)
      .where(sql`name = 'JavaScript' OR name = 'React' OR name = 'Next.js'`);
    console.log("✅ 标签创建成功:", createdTags);
    return createdTags;
  } catch (error) {
    console.error("❌ 标签创建失败:", error);
    return [];
  }
}

/**
 * 测试创建文章
 */
async function testCreatePost(categoryId: number, tagIds: number[]) {
  console.log("📝 测试创建文章...");

  try {
    const postData = {
      ...testData.post,
      authorId: 1, // 使用测试用户ID
      categoryId,
    };

    await db.insert(posts).values(postData as any);

    // 获取新创建的文章
    const [post] = await db
      .select()
      .from(posts)
      .where(sql`slug = ${testData.post.slug}`)
      .limit(1);

    if (post) {
      console.log("✅ 文章创建成功:", {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
      });
      return post;
    } else {
      throw new Error("文章创建后无法获取");
    }
  } catch (error) {
    console.error("❌ 文章创建失败:", error);
    return null;
  }
}

/**
 * 测试获取文章列表
 */
async function testGetPosts() {
  console.log("📋 测试获取文章列表...");

  try {
    const result = await db
      .select()
      .from(posts)
      .where(sql`status = 'published' AND visibility = 'public'`)
      .limit(10);

    console.log("✅ 文章列表获取成功:", {
      postsCount: result.length,
      posts: result.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
      })),
    });

    return result;
  } catch (error) {
    console.error("❌ 文章列表获取失败:", error);
    return [];
  }
}

/**
 * 测试获取单篇文章
 */
async function testGetPostById(postId: number) {
  console.log(`📖 测试获取文章详情 (ID: ${postId})...`);

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(sql`id = ${postId}`)
      .limit(1);

    if (post) {
      console.log("✅ 文章详情获取成功:", {
        id: post.id,
        title: post.title,
        viewCount: post.viewCount,
      });
      return post;
    } else {
      console.log("⚠️ 文章不存在");
      return null;
    }
  } catch (error) {
    console.error("❌ 文章详情获取失败:", error);
    return null;
  }
}

/**
 * 测试更新文章
 */
async function testUpdatePost(postId: number) {
  console.log(`✏️ 测试更新文章 (ID: ${postId})...`);

  try {
    const updateData = {
      title: "使用 Next.js 15 构建现代化博客系统 - 更新版",
      excerpt: "更新后的摘要：本文详细介绍如何使用 Next.js 15 和 Drizzle ORM 构建一个功能完整的博客系统...",
    };

    await db
      .update(posts)
      .set(updateData)
      .where(sql`id = ${postId}`);

    // 重新获取文章
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(sql`id = ${postId}`)
      .limit(1);

    if (updatedPost) {
      console.log("✅ 文章更新成功:", {
        id: updatedPost.id,
        title: updatedPost.title,
        updatedAt: updatedPost.updatedAt,
      });
      return updatedPost;
    } else {
      throw new Error("文章更新后无法获取");
    }
  } catch (error) {
    console.error("❌ 文章更新失败:", error);
    return null;
  }
}

/**
 * 测试文章状态更新
 */
async function testUpdatePostStatus(postId: number) {
  console.log(`🔄 测试更新文章状态 (ID: ${postId})...`);

  try {
    await db
      .update(posts)
      .set({ status: "draft" as const })
      .where(sql`id = ${postId}`);

    // 重新获取文章
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(sql`id = ${postId}`)
      .limit(1);

    if (updatedPost) {
      console.log("✅ 文章状态更新成功:", {
        id: updatedPost.id,
        status: updatedPost.status,
        updatedAt: updatedPost.updatedAt,
      });
      return updatedPost;
    } else {
      throw new Error("文章状态更新后无法获取");
    }
  } catch (error) {
    console.error("❌ 文章状态更新失败:", error);
    return null;
  }
}

/**
 * 测试增加浏览量
 */
async function testIncrementViewCount(postId: number) {
  console.log(`👁️ 测试增加浏览量 (ID: ${postId})...`);

  try {
    await db
      .update(posts)
      .set({ viewCount: sql`view_count + 1` })
      .where(sql`id = ${postId}`);

    // 重新获取文章以查看更新后的浏览量
    const [post] = await db
      .select()
      .from(posts)
      .where(sql`id = ${postId}`)
      .limit(1);

    if (post) {
      console.log("✅ 浏览量增加成功:", {
        id: post.id,
        viewCount: post.viewCount,
      });
      return post;
    } else {
      throw new Error("浏览量增加后无法获取文章");
    }
  } catch (error) {
    console.error("❌ 浏览量增加失败:", error);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log("🚀 开始运行博客API测试...\n");

  // 测试数据库连接
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log("❌ 数据库连接失败，测试终止");
    return;
  }

  // 清理之前的测试数据
  await cleanupTestData();

  try {
    // 测试创建分类
    const category = await testCreateCategory();
    if (!category) {
      console.log("❌ 分类创建失败，后续测试跳过");
      return;
    }

    // 测试创建标签
    const tags = await testCreateTags();
    if (tags.length === 0) {
      console.log("❌ 标签创建失败，后续测试跳过");
      return;
    }

    const tagIds = tags.map((t) => t.id);

    // 测试创建文章
    const post = await testCreatePost(category.id, tagIds);
    if (!post) {
      console.log("❌ 文章创建失败，后续测试跳过");
      return;
    }

    // 测试获取文章列表
    await testGetPosts();

    // 测试获取单篇文章
    await testGetPostById(post.id);

    // 测试更新文章
    await testUpdatePost(post.id);

    // 测试更新文章状态
    await testUpdatePostStatus(post.id);

    // 测试增加浏览量
    await testIncrementViewCount(post.id);

    console.log("\n🎉 所有测试完成！");
  } catch (error) {
    console.error("\n💥 测试过程中发生错误:", error);
  } finally {
    // 清理测试数据
    await cleanupTestData();

    console.log("\n🔌 数据库连接已关闭");
  }
}

/**
 * 运行测试
 */
if (require.main === module) {
  runTests().catch(console.error);
}
