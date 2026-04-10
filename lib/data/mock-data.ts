/**
 * Mock数据文件
 * 提供分类和标签的模拟数据，用于开发和测试
 */

import { Category, Tag } from "@/types/blog";

/**
 * 分类Mock数据
 * 包含多级分类结构，模拟真实的博客分类体系
 */
export const mockCategories: Category[] = [
  {
    id: 1,
    name: "前端开发",
    slug: "frontend",
    description: "前端技术相关文章，包括React、Vue、Angular等框架",
    parentId: undefined,
    sortOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    postCount: 25,
    children: [
      {
        id: 2,
        name: "React",
        slug: "react",
        description: "React框架相关技术文章",
        parentId: 1,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
        postCount: 12,
      },
      {
        id: 3,
        name: "Vue.js",
        slug: "vue",
        description: "Vue.js框架相关技术文章",
        parentId: 1,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
        postCount: 8,
      },
      {
        id: 4,
        name: "Angular",
        slug: "angular",
        description: "Angular框架相关技术文章",
        parentId: 1,
        sortOrder: 3,
        isActive: true,
        createdAt: new Date("2024-01-04"),
        updatedAt: new Date("2024-01-04"),
        postCount: 5,
      },
    ],
  },
  {
    id: 5,
    name: "后端开发",
    slug: "backend",
    description: "后端技术相关文章，包括Node.js、Python、Java等",
    parentId: undefined,
    sortOrder: 2,
    isActive: true,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    postCount: 18,
    children: [
      {
        id: 6,
        name: "Node.js",
        slug: "nodejs",
        description: "Node.js后端开发技术文章",
        parentId: 5,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date("2024-01-06"),
        updatedAt: new Date("2024-01-06"),
        postCount: 10,
      },
      {
        id: 7,
        name: "Python",
        slug: "python",
        description: "Python后端开发技术文章",
        parentId: 5,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date("2024-01-07"),
        updatedAt: new Date("2024-01-07"),
        postCount: 8,
      },
    ],
  },
  {
    id: 8,
    name: "数据库",
    slug: "database",
    description: "数据库相关技术文章，包括MySQL、MongoDB、Redis等",
    parentId: undefined,
    sortOrder: 3,
    isActive: true,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    postCount: 15,
    children: [
      {
        id: 9,
        name: "MySQL",
        slug: "mysql",
        description: "MySQL数据库相关技术文章",
        parentId: 8,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date("2024-01-09"),
        updatedAt: new Date("2024-01-09"),
        postCount: 8,
      },
      {
        id: 10,
        name: "MongoDB",
        slug: "mongodb",
        description: "MongoDB数据库相关技术文章",
        parentId: 8,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        postCount: 7,
      },
    ],
  },
  {
    id: 11,
    name: "DevOps",
    slug: "devops",
    description: "DevOps相关技术文章，包括Docker、Kubernetes、CI/CD等",
    parentId: undefined,
    sortOrder: 4,
    isActive: true,
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11"),
    postCount: 12,
  },
  {
    id: 12,
    name: "人工智能",
    slug: "ai",
    description: "人工智能相关技术文章，包括机器学习、深度学习等",
    parentId: undefined,
    sortOrder: 5,
    isActive: true,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
    postCount: 9,
  },
  {
    id: 13,
    name: "工具与效率",
    slug: "tools",
    description: "开发工具和效率提升相关文章",
    parentId: undefined,
    sortOrder: 6,
    isActive: true,
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    postCount: 6,
  },
];

/**
 * 标签Mock数据
 * 包含各种技术标签，用于文章分类和搜索
 */
export const mockTags: Tag[] = [
  {
    id: 1,
    name: "JavaScript",
    slug: "javascript",
    description: "JavaScript编程语言相关",
    color: "#f7df1e",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    postCount: 45,
  },
  {
    id: 2,
    name: "TypeScript",
    slug: "typescript",
    description: "TypeScript编程语言相关",
    color: "#3178c6",
    isActive: true,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
    postCount: 32,
  },
  {
    id: 3,
    name: "React",
    slug: "react",
    description: "React框架相关",
    color: "#61dafb",
    isActive: true,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
    postCount: 28,
  },
  {
    id: 4,
    name: "Vue",
    slug: "vue",
    description: "Vue.js框架相关",
    color: "#4fc08d",
    isActive: true,
    createdAt: new Date("2024-01-04"),
    updatedAt: new Date("2024-01-04"),
    postCount: 22,
  },
  {
    id: 5,
    name: "Node.js",
    slug: "nodejs",
    description: "Node.js后端开发相关",
    color: "#339933",
    isActive: true,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    postCount: 25,
  },
  {
    id: 6,
    name: "Python",
    slug: "python",
    description: "Python编程语言相关",
    color: "#3776ab",
    isActive: true,
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-06"),
    postCount: 18,
  },
  {
    id: 7,
    name: "CSS",
    slug: "css",
    description: "CSS样式相关",
    color: "#1572b6",
    isActive: true,
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-07"),
    postCount: 20,
  },
  {
    id: 8,
    name: "HTML",
    slug: "html",
    description: "HTML标记语言相关",
    color: "#e34f26",
    isActive: true,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    postCount: 15,
  },
  {
    id: 9,
    name: "Docker",
    slug: "docker",
    description: "Docker容器化技术相关",
    color: "#2496ed",
    isActive: true,
    createdAt: new Date("2024-01-09"),
    updatedAt: new Date("2024-01-09"),
    postCount: 12,
  },
  {
    id: 10,
    name: "Git",
    slug: "git",
    description: "Git版本控制相关",
    color: "#f05032",
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    postCount: 14,
  },
  {
    id: 11,
    name: "MySQL",
    slug: "mysql",
    description: "MySQL数据库相关",
    color: "#4479a1",
    isActive: true,
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11"),
    postCount: 16,
  },
  {
    id: 12,
    name: "MongoDB",
    slug: "mongodb",
    description: "MongoDB数据库相关",
    color: "#47a248",
    isActive: true,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
    postCount: 13,
  },
  {
    id: 13,
    name: "Redis",
    slug: "redis",
    description: "Redis缓存数据库相关",
    color: "#dc382d",
    isActive: true,
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    postCount: 8,
  },
  {
    id: 14,
    name: "Kubernetes",
    slug: "kubernetes",
    description: "Kubernetes容器编排相关",
    color: "#326ce5",
    isActive: true,
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
    postCount: 6,
  },
  {
    id: 15,
    name: "AWS",
    slug: "aws",
    description: "Amazon Web Services云服务相关",
    color: "#ff9900",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    postCount: 10,
  },
  {
    id: 16,
    name: "机器学习",
    slug: "machine-learning",
    description: "机器学习算法和技术相关",
    color: "#ff6b6b",
    isActive: true,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
    postCount: 7,
  },
  {
    id: 17,
    name: "深度学习",
    slug: "deep-learning",
    description: "深度学习算法和技术相关",
    color: "#4ecdc4",
    isActive: true,
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
    postCount: 5,
  },
  {
    id: 18,
    name: "Webpack",
    slug: "webpack",
    description: "Webpack模块打包工具相关",
    color: "#8dd6f9",
    isActive: true,
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
    postCount: 9,
  },
  {
    id: 19,
    name: "Vite",
    slug: "vite",
    description: "Vite构建工具相关",
    color: "#646cff",
    isActive: true,
    createdAt: new Date("2024-01-19"),
    updatedAt: new Date("2024-01-19"),
    postCount: 11,
  },
  {
    id: 20,
    name: "Next.js",
    slug: "nextjs",
    description: "Next.js React框架相关",
    color: "#000000",
    isActive: true,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    postCount: 17,
  },
];

/**
 * 获取所有分类数据
 * @returns 分类数组
 */
export function getCategories(): Category[] {
  return mockCategories;
}

/**
 * 获取所有标签数据
 * @returns 标签数组
 */
export function getTags(): Tag[] {
  return mockTags;
}

/**
 * 根据ID获取分类
 * @param id 分类ID
 * @returns 分类对象或undefined
 */
export function getCategoryById(id: number): Category | undefined {
  return mockCategories.find((category) => category.id === id);
}

/**
 * 根据ID获取标签
 * @param id 标签ID
 * @returns 标签对象或undefined
 */
export function getTagById(id: number): Tag | undefined {
  return mockTags.find((tag) => tag.id === id);
}

/**
 * 根据slug获取分类
 * @param slug 分类slug
 * @returns 分类对象或undefined
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((category) => category.slug === slug);
}

/**
 * 根据slug获取标签
 * @param slug 标签slug
 * @returns 标签对象或undefined
 */
export function getTagBySlug(slug: string): Tag | undefined {
  return mockTags.find((tag) => tag.slug === slug);
}
