import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories, posts, tags, users } from "@/lib/db/schema";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";

const DEFAULT_OWNER_ID = 1;

/**
 * 种子数据
 */
const seedData = {
  // 用户数据
  users: [
    {
      username: "admin",
      email: "admin@example.com",
      password: "$2b$10$example.hash", // 实际使用时需要加密
      role: "admin",
      isActive: true,
    },
    {
      username: "author",
      email: "author@example.com",
      password: "$2b$10$example.hash",
      role: "author",
      isActive: true,
    },
  ],

  // 分类数据
  categories: [
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "技术分享",
      slug: "tech",
      description: "技术相关的文章分享",
      parentId: null,
      sortOrder: 1,
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "生活随笔",
      slug: "life",
      description: "生活感悟和随笔",
      parentId: null,
      sortOrder: 2,
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "前端开发",
      slug: "frontend",
      description: "前端开发技术",
      parentId: 1, // 技术分享的子分类
      sortOrder: 1,
      isActive: true,
    },
  ],

  // 标签数据
  tags: [
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "JavaScript",
      slug: "javascript",
      description: "JavaScript相关",
      color: "#F59E0B",
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "React",
      slug: "react",
      description: "React相关",
      color: "#10B981",
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "Next.js",
      slug: "nextjs",
      description: "Next.js相关",
      color: "#8B5CF6",
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "TypeScript",
      slug: "typescript",
      description: "TypeScript相关",
      color: "#3B82F6",
      isActive: true,
    },
    {
      ownerId: DEFAULT_OWNER_ID,
      name: "生活",
      slug: "life",
      description: "生活相关",
      color: "#EF4444",
      isActive: true,
    },
  ],

  // 文章数据
  posts: [
    {
      title: "使用 Next.js 15 构建现代化博客系统",
      slug: "building-modern-blog-with-nextjs-15",
      excerpt: "本文介绍如何使用 Next.js 15 和 Drizzle ORM 构建一个功能完整的博客系统...",
      content: `# 使用 Next.js 15 构建现代化博客系统

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

Next.js 15 为构建现代化博客系统提供了强大的基础，结合 Drizzle ORM 和 MySQL，我们可以创建一个高性能、易维护的博客平台。`,
      status: "published",
      visibility: "public",
      allowComments: true,
      authorId: 1,
      categoryId: 1,
    },
    {
      title: "TypeScript 最佳实践指南",
      slug: "typescript-best-practices-guide",
      excerpt: "分享一些在大型项目中使用的 TypeScript 最佳实践...",
      content: `# TypeScript 最佳实践指南

## 类型定义

### 接口 vs 类型别名
\`\`\`typescript
// 推荐：使用接口定义对象结构
interface User {
  id: number;
  name: string;
  email: string;
}

// 推荐：使用类型别名定义联合类型
type Status = 'pending' | 'approved' | 'rejected';
\`\`\`

## 泛型使用

\`\`\`typescript
// 泛型约束
interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T | null>;
  save(entity: T): Promise<T>;
}
\`\`\`

## 总结

TypeScript 的正确使用可以大大提高代码质量和开发效率。`,
      status: "published",
      visibility: "public",
      allowComments: true,
      authorId: 1,
      categoryId: 3,
    },
  ],
};

/**
 * 清理现有数据
 */
async function cleanupData() {
  console.log("🧹 清理现有数据...");

  try {
    // 按依赖关系顺序删除
    await db.delete(posts);
    await db.delete(tags);
    await db.delete(categories);
    await db.delete(users);

    console.log("✅ 数据清理完成");
  } catch (error) {
    console.error("❌ 数据清理失败:", error);
    throw error;
  }
}

/**
 * 插入用户数据
 */
async function seedUsers() {
  console.log("👥 插入用户数据...");

  try {
    await db.insert(users).values(seedData.users as any);
    console.log("✅ 用户数据插入完成");
  } catch (error) {
    console.error("❌ 用户数据插入失败:", error);
    throw error;
  }
}

/**
 * 插入分类数据
 */
async function seedCategories() {
  console.log("📁 插入分类数据...");

  try {
    await db.insert(categories).values(seedData.categories);
    console.log("✅ 分类数据插入完成");
  } catch (error) {
    console.error("❌ 分类数据插入失败:", error);
    throw error;
  }
}

/**
 * 插入标签数据
 */
async function seedTags() {
  console.log("🏷️ 插入标签数据...");

  try {
    await db.insert(tags).values(seedData.tags);
    console.log("✅ 标签数据插入完成");
  } catch (error) {
    console.error("❌ 标签数据插入失败:", error);
    throw error;
  }
}

/**
 * 插入文章数据
 */
async function seedPosts() {
  console.log("📝 插入文章数据...");

  try {
    await db.insert(posts).values(seedData.posts as any);
    console.log("✅ 文章数据插入完成");
  } catch (error) {
    console.error("❌ 文章数据插入失败:", error);
    throw error;
  }
}

/**
 * 验证数据插入结果
 */
async function verifyData() {
  console.log("🔍 验证数据插入结果...");

  try {
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [categoryCount] = await db.select({ count: sql`count(*)` }).from(categories);
    const [tagCount] = await db.select({ count: sql`count(*)` }).from(tags);
    const [postCount] = await db.select({ count: sql`count(*)` }).from(posts);

    console.log("📊 数据统计:");
    console.log(`   用户: ${userCount.count}`);
    console.log(`   分类: ${categoryCount.count}`);
    console.log(`   标签: ${tagCount.count}`);
    console.log(`   文章: ${postCount.count}`);

    console.log("✅ 数据验证完成");

    return {
      users: userCount.count,
      categories: categoryCount.count,
      tags: tagCount.count,
      posts: postCount.count,
    };
  } catch (error) {
    console.error("❌ 数据验证失败:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireInMemorySuperRoot(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    console.log("🌱 开始数据库种子数据初始化...");
    console.log("=".repeat(50));

    // 清理现有数据
    await cleanupData();

    // 按依赖关系顺序插入数据
    await seedUsers();
    await seedCategories();
    await seedTags();
    await seedPosts();

    // 验证数据
    const stats = await verifyData();

    console.log("\n🎉 数据库种子数据初始化完成！");
    console.log("💡 您现在可以启动应用程序并查看示例数据");

    return NextResponse.json({
      success: true,
      message: "数据库种子数据初始化完成",
      stats,
    });
  } catch (error) {
    console.error("\n💥 种子数据初始化失败:", error);

    return NextResponse.json(
      {
        success: false,
        message: "种子数据初始化失败",
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
