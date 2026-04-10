import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * 用户表
 * 存储博客系统的用户信息，包括管理员和普通用户
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // 存储加密后的密码
    displayName: varchar("display_name", { length: 100 }), // 显示名称
    avatar: varchar("avatar", { length: 255 }), // 头像URL
    bio: text("bio"), // 个人简介
    role: mysqlEnum("role", ["admin", "author", "user"]).default("user"), // 用户角色
    status: mysqlEnum("status", ["active", "inactive", "banned"]).default("active"), // 用户状态
    emailVerified: boolean("email_verified").default(false), // 邮箱是否验证
    lastLoginAt: timestamp("last_login_at"), // 最后登录时间
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("username_idx").on(table.username),
    index("email_idx").on(table.email),
    index("role_idx").on(table.role),
    index("status_idx").on(table.status),
  ]
);

/**
 * 分类表
 * 存储博客文章的分类信息
 */
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(), // URL友好的标识符
    description: text("description"), // 分类描述
    parentId: int("parent_id"), // 父分类ID，支持分类层级
    sortOrder: int("sort_order").default(0), // 排序顺序
    isActive: boolean("is_active").default(true), // 是否激活
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("slug_idx").on(table.slug),
    index("parent_idx").on(table.parentId),
    index("active_idx").on(table.isActive),
  ]
);

/**
 * 标签表
 * 存储博客文章的标签信息
 */
export const tags = mysqlTable(
  "tags",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(), // URL友好的标识符
    description: text("description"), // 标签描述
    color: varchar("color", { length: 7 }), // 标签颜色（十六进制）
    isActive: boolean("is_active").default(true), // 是否激活
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("slug_idx").on(table.slug), index("active_idx").on(table.isActive)]
);

/**
 * 文章表
 * 存储博客文章的核心信息
 */
export const posts = mysqlTable(
  "posts",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 200 }).notNull(), // 文章标题
    slug: varchar("slug", { length: 200 }).notNull().unique(), // URL友好的标识符
    excerpt: text("excerpt"), // 文章摘要
    content: text("content").notNull(), // 文章内容（支持Markdown）
    contentHtml: text("content_html"), // 渲染后的HTML内容
    featuredImage: varchar("featured_image", { length: 255 }), // 特色图片URL
    authorId: int("author_id").notNull(), // 作者ID
    categoryId: int("category_id"), // 分类ID
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft"), // 文章状态
    visibility: mysqlEnum("visibility", ["public", "private", "password"]).default("public"), // 可见性
    password: varchar("password", { length: 255 }), // 密码保护（如果visibility为password）
    allowComments: boolean("allow_comments").default(true), // 是否允许评论
    viewCount: int("view_count").default(0), // 浏览次数
    likeCount: int("like_count").default(0), // 点赞次数
    publishedAt: timestamp("published_at"), // 发布时间
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("slug_idx").on(table.slug),
    index("author_idx").on(table.authorId),
    index("category_idx").on(table.categoryId),
    index("status_idx").on(table.status),
    index("visibility_idx").on(table.visibility),
    index("published_idx").on(table.publishedAt),
  ]
);

/**
 * 文章标签关联表
 * 实现文章和标签的多对多关系
 */
export const postTags = mysqlTable(
  "post_tags",
  {
    postId: int("post_id").notNull(),
    tagId: int("tag_id").notNull(),
  },
  (table) => [
    // 复合主键，确保每个文章-标签组合的唯一性
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_idx").on(table.postId),
    index("tag_idx").on(table.tagId),
  ]
);

/**
 * 评论表
 * 存储文章评论信息
 */
export const comments = mysqlTable(
  "comments",
  {
    id: int("id").primaryKey().autoincrement(),
    postId: int("post_id").notNull(), // 文章ID
    authorId: int("author_id"), // 作者ID（可以为空，支持匿名评论）
    parentId: int("parent_id"), // 父评论ID，支持评论嵌套
    authorName: varchar("author_name", { length: 100 }), // 作者名称（匿名评论时使用）
    authorEmail: varchar("author_email", { length: 100 }), // 作者邮箱
    authorWebsite: varchar("author_website", { length: 255 }), // 作者网站
    content: text("content").notNull(), // 评论内容
    status: mysqlEnum("status", ["pending", "approved", "spam"]).default("pending"), // 评论状态
    ipAddress: varchar("ip_address", { length: 45 }), // IP地址（IPv6支持）
    userAgent: text("user_agent"), // 用户代理
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("post_idx").on(table.postId),
    index("author_idx").on(table.authorId),
    index("parent_idx").on(table.parentId),
    index("status_idx").on(table.status),
  ]
);

/**
 * 媒体文件表
 * 存储上传的媒体文件信息
 */
export const media = mysqlTable(
  "media",
  {
    id: int("id").primaryKey().autoincrement(),
    filename: varchar("filename", { length: 255 }).notNull(), // 文件名
    originalName: varchar("original_name", { length: 255 }).notNull(), // 原始文件名
    filePath: varchar("file_path", { length: 500 }).notNull(), // 文件路径
    fileUrl: varchar("file_url", { length: 500 }).notNull(), // 文件URL
    mimeType: varchar("mime_type", { length: 100 }).notNull(), // MIME类型
    fileSize: int("file_size").notNull(), // 文件大小（字节）
    width: int("width"), // 图片宽度
    height: int("height"), // 图片高度
    altText: varchar("alt_text", { length: 255 }), // 替代文本
    caption: text("caption"), // 图片说明
    uploadedBy: int("uploaded_by").notNull(), // 上传者ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("filename_idx").on(table.filename),
    index("mime_idx").on(table.mimeType),
    index("uploader_idx").on(table.uploadedBy),
  ]
);

/**
 * 邮箱验证码表
 * 存储邮箱验证码信息，用于用户注册和密码重置
 */
export const emailVerifications = mysqlTable(
  "email_verifications",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 100 }).notNull(), // 邮箱地址
    code: varchar("code", { length: 10 }).notNull(), // 验证码
    type: mysqlEnum("type", ["register", "reset_password", "change_email"]).notNull(), // 验证码类型
    isUsed: boolean("is_used").default(false), // 是否已使用
    expiresAt: timestamp("expires_at").notNull(), // 过期时间
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("email_idx").on(table.email),
    index("code_idx").on(table.code),
    index("type_idx").on(table.type),
    index("expires_idx").on(table.expiresAt),
  ]
);

/**
 * 系统设置表
 * 存储博客系统的配置信息
 */
export const settings = mysqlTable(
  "settings",
  {
    id: int("id").primaryKey().autoincrement(),
    key: varchar("key", { length: 100 }).notNull().unique(), // 设置键
    value: text("value"), // 设置值
    description: text("description"), // 设置描述
    isPublic: boolean("is_public").default(false), // 是否公开（前端可访问）
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("key_idx").on(table.key), index("public_idx").on(table.isPublic)]
);

/**
 * 用户个人资料表
 * 存储用户的详细个人资料信息
 */
export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(), // 关联用户ID
    firstName: varchar("first_name", { length: 50 }), // 名字
    lastName: varchar("last_name", { length: 50 }), // 姓氏
    phone: varchar("phone", { length: 20 }), // 电话号码
    website: varchar("website", { length: 255 }), // 个人网站
    location: varchar("location", { length: 100 }), // 所在地
    timezone: varchar("timezone", { length: 50 }), // 时区
    language: varchar("language", { length: 10 }).default("zh-CN"), // 语言偏好
    dateFormat: varchar("date_format", { length: 20 }).default("YYYY-MM-DD"), // 日期格式
    timeFormat: varchar("time_format", { length: 10 }).default("24h"), // 时间格式
    theme: varchar("theme", { length: 20 }).default("system"), // 主题偏好
    notifications: text("notifications"), // 通知设置（JSON格式）
    privacy: text("privacy"), // 隐私设置（JSON格式）
    socialLinks: text("social_links"), // 社交媒体链接（JSON格式）
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("language_idx").on(table.language),
    index("theme_idx").on(table.theme),
  ]
);

/**
 * 用户偏好设置表
 * 存储用户的各种偏好设置
 */
export const userPreferences = mysqlTable(
  "user_preferences",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(), // 关联用户ID
    key: varchar("key", { length: 100 }).notNull(), // 设置键
    value: text("value"), // 设置值
    category: varchar("category", { length: 50 }).default("general"), // 设置分类
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("key_idx").on(table.key),
    index("category_idx").on(table.category),
  ]
);

/**
 * 用户活动日志表
 * 记录用户的各种活动
 */
export const userActivities = mysqlTable(
  "user_activities",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(), // 用户ID
    action: varchar("action", { length: 50 }).notNull(), // 活动类型
    description: text("description"), // 活动描述
    metadata: text("metadata"), // 额外数据（JSON格式）
    ipAddress: varchar("ip_address", { length: 45 }), // IP地址
    userAgent: text("user_agent"), // 用户代理
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("action_idx").on(table.action),
    index("created_idx").on(table.createdAt),
  ]
);

/**
 * 用户收藏表
 * 存储用户收藏的文章
 */
export const userFavorites = mysqlTable(
  "user_favorites",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(), // 用户ID
    postId: int("post_id").notNull(), // 文章ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("post_idx").on(table.postId),
    index("created_idx").on(table.createdAt),
  ]
);

/**
 * 用户关注表
 * 存储用户关注关系
 */
export const userFollows = mysqlTable(
  "user_follows",
  {
    id: int("id").primaryKey().autoincrement(),
    followerId: int("follower_id").notNull(), // 关注者ID
    followingId: int("following_id").notNull(), // 被关注者ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("follower_idx").on(table.followerId),
    index("following_idx").on(table.followingId),
    index("created_idx").on(table.createdAt),
  ]
);

/**
 * 用户通知表
 * 存储用户通知信息
 */
export const userNotifications = mysqlTable(
  "user_notifications",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(), // 用户ID
    type: mysqlEnum("type", ["comment", "like", "follow", "mention", "system"]).notNull(), // 通知类型
    title: varchar("title", { length: 200 }).notNull(), // 通知标题
    content: text("content"), // 通知内容
    data: text("data"), // 额外数据（JSON格式）
    isRead: boolean("is_read").default(false), // 是否已读
    readAt: timestamp("read_at"), // 阅读时间
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_idx").on(table.userId),
    index("type_idx").on(table.type),
    index("read_idx").on(table.isRead),
    index("created_idx").on(table.createdAt),
  ]
);

// 导出所有表，供其他地方使用
export const schema = {
  users,
  categories,
  tags,
  posts,
  postTags,
  comments,
  media,
  emailVerifications,
  settings,
  userProfiles,
  userPreferences,
  userActivities,
  userFavorites,
  userFollows,
  userNotifications,
};
