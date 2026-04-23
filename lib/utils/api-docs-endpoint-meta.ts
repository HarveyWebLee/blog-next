/**
 * API 文档站专用元数据：补充扫描器无法从代码可靠推断的说明与鉴权提示。
 * 路径格式须与 {@link ApiScanner#getApiPath} 输出一致（动态段为 `{param}`）。
 */

/** 分组副标题（与 app/api 下目录名对应） */
export const API_DOCS_GROUP_DESCRIPTIONS: Record<string, string> = {
  auth: "用户认证、验证码、令牌刷新与密码找回",
  admin: "超级管理员专用：数据库用户列表与单用户详情/部分更新（非站点 admin 角色；见各接口）",
  profile: "当前登录用户个人资料、统计、动态、收藏与通知",
  posts: "文章 CRUD、按 slug 查询、浏览量",
  comments: "前台博客评论提交（匿名或登录）",
  categories: "分类 CRUD",
  tags: "标签 CRUD",
  subscriptions: "邮件订阅查询、订阅、退订（访客须验证码）",
  notifications: "通知列表与单条维护",
  media: "媒体相关（若存在子路由）",
  uploads: "上传接口",
  about: "关于页站长信息",
  music: "音乐相关第三方代理数据",
  "api-docs": "文档元数据（仅超级管理员）",
  seed: "种子/演示数据（生产慎用）",
  "test-db": "数据库连通性自检",
  "test-env": "环境变量自检",
  proxy: "服务端代理转发",
};

/** 端点简述：method -> 中文一句 */
export const API_DOCS_ENDPOINT_DESCRIPTIONS: Record<string, Partial<Record<string, string>>> = {
  "/api/api-docs": {
    GET: "获取扫描后的全站 API 分组与端点元数据；支持 format=openapi 导出",
  },
  "/api/auth/login": {
    POST: "用户登录（含超级管理员应急通道），返回 access / refresh token",
  },
  "/api/auth/register": {
    POST: "用户注册（通常需先收邮箱验证码）",
  },
  "/api/auth/refresh": {
    POST: "使用 refreshToken 换取新的 accessToken",
  },
  "/api/auth/send-verification-code": {
    POST: "发送邮箱验证码（register / reset_password / change_email / subscription / subscription_unsubscribe）",
  },
  "/api/auth/verify-code": {
    POST: "校验邮箱验证码是否有效（消费一次）",
  },
  "/api/auth/forgot-password": {
    POST: "忘记密码：发起重置流程并发送一次性链接（按用户语言发送邮件）",
  },
  "/api/auth/reset-password": {
    POST: "使用一次性 token 重置密码并失效 token",
  },
  "/api/auth/password-transport-params": {
    GET: "获取密码传输封装参数（RSA 公钥、keyId、时钟偏差窗口）",
  },
  "/api/subscriptions": {
    GET: "按邮箱查询是否处于订阅中。异常：503+code=DB_SCHEMA_OUTDATED（未迁移）或 DB_UNAVAILABLE（库不可达）；500+code=INTERNAL_ERROR（开发环境可带 debug）",
    POST: "订阅：已登录带 JWT；访客须带 subscription 验证码。异常码同 GET",
    DELETE: "退订：已登录带 JWT；访客须带 subscription_unsubscribe 验证码。异常码同 GET",
  },
  "/api/profile": {
    GET: "获取当前用户资料（Bearer）",
    POST: "创建/补全资料（Bearer）",
    PUT: "更新资料（Bearer；含邮箱变更等业务规则）",
  },
  "/api/profile/stats": {
    GET: "个人数据统计（Bearer）",
  },
  "/api/profile/activities": {
    GET: "个人活动日志分页列表（Bearer）",
    POST: "记录一条用户活动（Bearer）",
  },
  "/api/profile/followers": {
    GET: "粉丝列表（分页，可按用户名/显示名搜索；支持 mutualOnly=true 仅互关）",
  },
  "/api/profile/following": {
    GET: "关注列表（分页，可按用户名/显示名搜索；支持 mutualOnly=true 仅互关）",
  },
  "/api/profile/follow": {
    POST: "关注指定用户（创建关注关系，并尝试给目标用户写入 follow 通知）",
  },
  "/api/profile/follow/{targetUserId}": {
    DELETE: "取消关注指定用户",
  },
  "/api/profile/favorites": {
    GET: "收藏列表（Bearer）",
    POST: "添加收藏（Bearer）",
    DELETE: "取消收藏（Bearer）",
  },
  "/api/profile/notifications": {
    GET: "通知列表（Bearer）",
    PUT: "更新通知状态等（Bearer，以路由实现为准）",
    DELETE: "删除通知（Bearer）",
  },
  "/api/profile/public/{userId}": {
    GET: "公开用户资料页数据（按用户隐私配置裁剪字段，含公开文章分页/筛选；筛选项来自目标用户 owner 分类/标签）",
  },
  "/api/admin/users": {
    GET: "超级管理员：分页用户列表",
  },
  "/api/admin/users/{id}": {
    GET: "超级管理员：用户详情（含 user_profiles 摘要）",
    PATCH: "超级管理员：更新角色与账号状态等（不可修改当前登录根账户本人）",
  },
  "/api/admin/comments": {
    GET: "超级管理员：评论审核列表（支持状态、关键词、authorId、postId、时间区间筛选）",
    PATCH: "超级管理员：批量更新评论审核状态（pending/approved/spam，支持审核理由）",
    DELETE: "超级管理员：批量删除评论",
  },
  "/api/admin/comments/{id}": {
    PATCH: "超级管理员：更新评论审核状态（pending/approved/spam，支持审核理由）",
    DELETE: "超级管理员：删除单条评论",
  },
  "/api/posts": {
    GET: "文章列表（默认仅公开文章，列表不返回 content 字段）",
    POST: "创建文章（通常需作者或管理员）",
  },
  "/api/posts/{id}": {
    GET: "文章详情",
    PUT: "更新文章",
    DELETE: "删除文章",
    PATCH: "部分更新文章",
  },
  "/api/posts/{id}/view": {
    POST: "记录一次浏览（仅已发布且非 private 文章，含频率限制）",
  },
  "/api/posts/{id}/favorite": {
    GET: "是否已收藏该文（匿名返回未收藏；不可互动文章会拒绝）",
    POST: "切换收藏（需 Bearer；仅已发布且可互动文章）",
  },
  "/api/posts/{id}/like": {
    GET: "当前用户是否已赞与点赞总数（匿名仅返回总数；不可互动文章会拒绝）",
    POST: "切换点赞（需 Bearer；仅已发布且可互动文章）",
  },
  "/api/posts/{id}/share": {
    POST: "记录分享打点（匿名或 Bearer；含频率限制，仅已发布且非 private 文章）",
  },
  "/api/comments": {
    POST: "提交博客评论（匿名或登录；按文章/IP 限流防刷）",
  },
  "/api/posts/engagement": {
    GET: "批量查询多篇文章的点赞/收藏状态（Query: ids）；登录用户返回真实状态",
  },
  "/api/posts/slug/{slug}": {
    GET: "按 slug 获取文章详情（密码保护文章未校验时仅返回摘要）",
    PATCH: "校验密码保护文章密码，成功后返回可阅读数据",
  },
  "/api/categories": {
    GET: "分类列表（分页/搜索/状态/父分类过滤；超级管理员可按 ownerId 指定租户）",
    POST: "创建分类（普通用户写入本人 ownerId；超级管理员可指定 ownerId）",
  },
  "/api/categories/{id}": {
    GET: "分类详情（附带该分类文章数量；本人可见，超级管理员可跨 ownerId 查看）",
    PUT: "更新分类（名称/slug 在所属 ownerId 内去重；超级管理员可跨 ownerId）",
    DELETE: "删除分类（若仍被文章或子分类引用则拒绝；超级管理员可跨 ownerId）",
  },
  "/api/tags": {
    GET: "标签列表（分页/搜索/状态过滤，含 postCount；超级管理员可按 ownerId 指定租户）",
    POST: "创建标签（普通用户写入本人 ownerId；超级管理员可指定 ownerId）",
  },
  "/api/tags/{id}": {
    GET: "标签详情（附带标签被文章使用次数；本人可见，超级管理员可跨 ownerId 查看）",
    PUT: "更新标签（名称/slug 在所属 ownerId 内去重；超级管理员可跨 ownerId）",
    DELETE: "删除标签（若仍有关联文章则拒绝；超级管理员可跨 ownerId）",
  },
  "/api/notifications": {
    GET: "通知列表（本人可读；超级管理员可按 userId 查询）",
    PUT: "批量标记通知已读（本人；超级管理员可按 userId 跨用户）",
    DELETE: "批量删除通知（支持 clearRead=true 清理全部已读）",
    POST: "创建通知（本人可给自己创建；超级管理员可给任意用户创建）",
  },
  "/api/notifications/{id}": {
    GET: "通知详情（本人可读；超级管理员可跨用户读取）",
    PUT: "更新通知（本人可改；超级管理员可跨用户修改）",
    DELETE: "删除通知（本人可删；超级管理员可跨用户删除）",
  },
  "/api/about/owner": {
    GET: "关于页展示的站长公开信息（无写接口；更新走管理流程或服务层）",
  },
  "/api/uploads/image": {
    POST: "上传图片（multipart：file、scope、previousKey）",
    DELETE: "按对象键删除本人命名空间下的已上传对象（JSON: key）",
  },
  "/api/music/netease/free-tracks": {
    GET: "网易云免费曲目代理数据",
  },
  "/api/proxy/{...path}": {
    GET: "服务端代理到目标路径",
  },
  "/api/seed": {
    GET: "种子/演示数据接口（会清空并重建 users/categories/tags/posts，高危）",
  },
  "/api/test-db": {
    GET: "检测数据库连接",
  },
  "/api/test-env": {
    GET: "检测环境变量并输出 passwordTransport 就绪状态（required/configured/ready/reason）",
  },
};

/** 鉴权与调用注意（展示在文档卡片上） */
export const API_DOCS_AUTH_HINTS: Record<string, Partial<Record<string, string>>> = {
  "/api/api-docs": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（JWT：role=super_admin、isRoot=true）。支持 query: refresh=true 强制重扫、version=<x>|none 版本过滤、format=openapi 返回 OpenAPI 3.0 JSON、download=true 触发下载头。",
  },
  "/api/auth/login": {
    POST: "无需 Bearer。Body：{ username, password } 或 { username, passwordTransport }（优先；生产环境默认强制后者，可由 PASSWORD_TRANSPORT_REQUIRED 覆盖）。",
  },
  "/api/auth/register": {
    POST: "无需 Bearer。Body 支持 password 或 passwordTransport；常配合先发验证码。",
  },
  "/api/auth/refresh": {
    POST: "无需 Bearer。Body：{ refreshToken }。",
  },
  "/api/auth/send-verification-code": {
    POST: "无需 Bearer。Body：{ email, type }。",
  },
  "/api/auth/verify-code": {
    POST: "无需 Bearer。Body：{ email, code, type }。",
  },
  "/api/auth/forgot-password": {
    POST: "无需 Bearer。Body：{ email }，会失效旧 reset_password token 并发送 30 分钟有效链接；限流策略为 Redis 优先、数据库回退。",
  },
  "/api/auth/reset-password": {
    POST: "无需 Bearer。Body：{ token, newPassword } 或 { token, passwordTransport }，token 必须未使用且未过期。",
  },
  "/api/auth/password-transport-params": {
    GET: "无需 Bearer。客户端先取公钥参数，再将 password/newPassword 封装到 passwordTransport 提交。",
  },
  "/api/subscriptions": {
    GET: "无需 Bearer（公开查询某邮箱是否订阅）。",
    POST: "二选一：① Authorization: Bearer 且 email 与登录用户一致；② 无 Bearer 时 body 须含 verificationCode（subscription 类型）。",
    DELETE: "二选一：① Bearer + 邮箱一致；② 无 Bearer 时 body 须含 verificationCode（subscription_unsubscribe）。",
  },
  "/api/profile": {
    GET: "必须：Authorization: Bearer",
    POST: "必须：Authorization: Bearer",
    PUT: "必须：Authorization: Bearer",
  },
  "/api/profile/stats": {
    GET: "必须：Authorization: Bearer",
  },
  "/api/profile/activities": {
    GET: "必须：Authorization: Bearer",
    POST: "必须：Authorization: Bearer",
  },
  "/api/profile/followers": {
    GET: "必须：Authorization: Bearer。支持 page/limit/search/mutualOnly；结果含 isMutual、followedAt、lastActiveAt。",
  },
  "/api/profile/following": {
    GET: "必须：Authorization: Bearer。支持 page/limit/search/mutualOnly；结果含 isMutual、followedAt、lastActiveAt。",
  },
  "/api/profile/follow": {
    POST: "必须：Authorization: Bearer。Body：{ followingId }；不允许关注自己，重复关注返回 409。",
  },
  "/api/profile/follow/{targetUserId}": {
    DELETE: "必须：Authorization: Bearer。Path：targetUserId；未关注返回 404。",
  },
  "/api/profile/favorites": {
    GET: "必须：Authorization: Bearer",
    POST: "必须：Authorization: Bearer",
    DELETE: "必须：Authorization: Bearer",
  },
  "/api/profile/notifications": {
    GET: "必须：Authorization: Bearer",
    PUT: "必须：Authorization: Bearer",
    DELETE: "必须：Authorization: Bearer",
  },
  "/api/profile/public/{userId}": {
    GET: "可匿名访问；携带 Bearer 时可用于判定“仅关注者可见”范围。支持 page/limit/search/categoryId/tagId，文章按时间倒序；filters.categories / filters.tags 返回目标用户 owner 下启用项。",
  },
  "/api/admin/users": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（requireInMemorySuperRoot）。",
  },
  "/api/admin/users/{id}": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken。",
    PATCH:
      "必须：Authorization: Bearer + 超级管理员 accessToken。路径 id 为当前登录根账户 userId 时 **403**（不可改本人角色/状态）。",
  },
  "/api/admin/comments": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken。支持 page/limit/status/q/authorId/postId/dateFrom/dateTo。",
    PATCH:
      "必须：Authorization: Bearer + 超级管理员 accessToken。Body：{ ids: number[], status: pending|approved|spam, reason? }。",
    DELETE: "必须：Authorization: Bearer + 超级管理员 accessToken。Body：{ ids: number[] }。",
  },
  "/api/admin/comments/{id}": {
    PATCH: "必须：Authorization: Bearer + 超级管理员 accessToken。Body：{ status, reason? }。",
    DELETE: "必须：Authorization: Bearer + 超级管理员 accessToken。",
  },
  "/api/posts": {
    GET: "公开列表通常无需 Bearer。默认仅返回 public 可见性且不含 content 字段。",
    POST: "必须：Authorization: Bearer（作者/管理员）。当 visibility=password 时，body.password 可替换为 passwordTransport。",
  },
  "/api/posts/{id}": {
    GET: "公开只读通常无需；草稿等见代码。",
    PUT: "必须：Authorization: Bearer。若更新访问密码，支持 password 或 passwordTransport。",
    DELETE: "必须：Authorization: Bearer",
    PATCH: "必须：Authorization: Bearer。若更新访问密码，支持 password 或 passwordTransport。",
  },
  "/api/posts/{id}/view": {
    POST: "无需 Bearer；按 IP + 文章限流，且仅已发布且非 private 文章可计数。",
  },
  "/api/posts/{id}/favorite": {
    GET: "无需 Bearer 可查未收藏；仅可互动文章可查询。",
    POST: "必须：Authorization: Bearer。仅可互动文章可收藏/取消收藏。",
  },
  "/api/posts/{id}/like": {
    GET: "无需 Bearer 可返回总数；仅可互动文章可查询。",
    POST: "必须：Authorization: Bearer。仅可互动文章可点赞/取消点赞。",
  },
  "/api/posts/engagement": {
    GET: "Query: ids。未登录：匿名占位；已登录：真实状态。",
  },
  "/api/posts/slug/{slug}": {
    GET: "无需 Bearer。密码保护文章可携带短期 query.unlock 票据进行只读校验。",
    PATCH: "无需 Bearer。Body：{ password } 或 { passwordTransport }，用于密码保护文章解锁验证。",
  },
  "/api/comments": {
    POST: "可选 Bearer（匿名亦可）。Body：postId、content；匿名可带 authorName/authorEmail；登录写入 authorId。含限流防刷（429 + Retry-After）。",
  },
  "/api/posts/{id}/share": {
    POST: "可选 Bearer。匿名亦可调用；按 IP/用户+文章限流，且仅已发布非 private 文章允许打点。",
  },
  "/api/categories": {
    GET: "必须：Authorization: Bearer。支持 page/limit/sortBy/sortOrder/search/isActive/parentId。超级管理员可用 ownerId 指定租户，否则仅本人 ownerId。",
    POST: "必须：Authorization: Bearer。Body 至少包含 name、slug；普通用户固定本人 ownerId，超级管理员可传 ownerId。",
  },
  "/api/categories/{id}": {
    GET: "必须：Authorization: Bearer。普通用户仅可访问本人 ownerId；超级管理员可跨 ownerId。",
    PUT: "必须：Authorization: Bearer。普通用户仅可改本人 ownerId；超级管理员可跨 ownerId，name/slug 在所属 ownerId 内校验 409。",
    DELETE:
      "必须：Authorization: Bearer。普通用户仅可删本人 ownerId；超级管理员可跨 ownerId；若存在子分类或关联文章返回 409。",
  },
  "/api/tags": {
    GET: "必须：Authorization: Bearer。支持 page/limit/sortBy/sortOrder/search/isActive。超级管理员可用 ownerId 指定租户，否则仅本人 ownerId。",
    POST: "必须：Authorization: Bearer。Body 至少包含 name、slug；普通用户固定本人 ownerId，超级管理员可传 ownerId。",
  },
  "/api/tags/{id}": {
    GET: "必须：Authorization: Bearer。普通用户仅可访问本人 ownerId；超级管理员可跨 ownerId。",
    PUT: "必须：Authorization: Bearer。普通用户仅可改本人 ownerId；超级管理员可跨 ownerId，name/slug 在所属 ownerId 内校验 409。",
    DELETE: "必须：Authorization: Bearer。普通用户仅可删本人 ownerId；超级管理员可跨 ownerId；若存在关联文章返回 409。",
  },
  "/api/notifications": {
    GET: "必须：Authorization: Bearer。普通用户仅可读本人通知；超级管理员可用 query.userId 跨用户查询。",
    PUT: "必须：Authorization: Bearer。Body：{ notificationIds[] } 或 { markAllAsRead: true }；普通用户仅可标记本人通知。",
    DELETE:
      "必须：Authorization: Bearer。Body：{ notificationIds[] } 或 { clearRead: true }；普通用户仅可删除本人通知。",
    POST: "必须：Authorization: Bearer。普通用户仅可创建自己的通知；超级管理员可为任意 userId 创建。",
  },
  "/api/notifications/{id}": {
    GET: "必须：Authorization: Bearer。普通用户仅可访问本人通知；超级管理员可跨用户。",
    PUT: "必须：Authorization: Bearer。普通用户仅可修改本人通知；超级管理员可跨用户。",
    DELETE: "必须：Authorization: Bearer。普通用户仅可删除本人通知；超级管理员可跨用户。",
  },
  "/api/about/owner": {
    GET: "公开，无需 Bearer。",
  },
  "/api/uploads/image": {
    POST: "必须：Authorization: Bearer；multipart 上传。",
    DELETE: "必须：Authorization: Bearer；Body JSON 含 key，且仅能删除本人命名空间对象。",
  },
  "/api/music/netease/free-tracks": {
    GET: "通常公开。",
  },
  "/api/proxy/{...path}": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（requireInMemorySuperRoot）。",
  },
  "/api/seed": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken；会先删除再写入示例 users/categories/tags/posts。",
  },
  "/api/test-db": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（运维自检）。",
  },
  "/api/test-env": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（运维自检；返回 details.passwordTransport 就绪状态）。",
  },
};

export function pickEndpointDescription(method: string, apiPath: string): string | undefined {
  return API_DOCS_ENDPOINT_DESCRIPTIONS[apiPath]?.[method];
}

export function pickAuthHint(method: string, apiPath: string): string | undefined {
  return API_DOCS_AUTH_HINTS[apiPath]?.[method];
}

export function pickGroupDescription(groupName: string): string | undefined {
  return API_DOCS_GROUP_DESCRIPTIONS[groupName];
}
