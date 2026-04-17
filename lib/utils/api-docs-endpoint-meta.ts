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
  categories: "分类 CRUD",
  tags: "标签 CRUD",
  subscriptions: "邮件订阅查询、订阅、退订（访客须验证码）",
  notifications: "通知列表与单条维护",
  media: "媒体相关（若存在子路由）",
  uploads: "上传接口",
  about: "关于页站长信息",
  music: "音乐相关第三方代理数据",
  users: "用户列表/创建（示例或过渡接口，以代码为准）",
  "api-docs": "文档元数据（仅超级管理员）",
  seed: "种子/演示数据（生产慎用）",
  "test-db": "数据库连通性自检",
  "test-env": "环境变量自检",
  proxy: "服务端代理转发",
};

/** 端点简述：method -> 中文一句 */
export const API_DOCS_ENDPOINT_DESCRIPTIONS: Record<string, Partial<Record<string, string>>> = {
  "/api/api-docs": {
    GET: "获取扫描后的全站 API 分组与端点元数据（需超级管理员 JWT）",
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
    POST: "忘记密码：发起重置流程",
  },
  "/api/auth/reset-password": {
    POST: "使用验证码重置密码",
  },
  "/api/subscriptions": {
    GET: "按邮箱查询是否处于订阅中",
    POST: "订阅：已登录带 JWT；访客须带 subscription 验证码",
    DELETE: "退订：已登录带 JWT；访客须带 subscription_unsubscribe 验证码",
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
  "/api/admin/users": {
    GET: "超级管理员：分页用户列表",
  },
  "/api/admin/users/{id}": {
    GET: "超级管理员：用户详情（含 user_profiles 摘要）",
    PATCH: "超级管理员：更新角色与账号状态等（不可修改当前登录根账户本人）",
  },
  "/api/posts": {
    GET: "文章列表（公开/管理筛选由查询参数决定）",
    POST: "创建文章（通常需作者或管理员）",
  },
  "/api/posts/{id}": {
    GET: "文章详情",
    PUT: "更新文章",
    DELETE: "删除文章",
    PATCH: "部分更新文章",
  },
  "/api/posts/{id}/view": {
    POST: "记录一次浏览",
  },
  "/api/posts/{id}/favorite": {
    GET: "是否已收藏该文（匿名返回未收藏）",
    POST: "切换收藏（需 Bearer）",
  },
  "/api/posts/{id}/like": {
    GET: "当前用户是否已赞与点赞总数（匿名仅返回总数）",
    POST: "切换点赞（需 Bearer）",
  },
  "/api/posts/engagement": {
    GET: "批量查询多篇文章的点赞/收藏状态（Query: ids）；登录用户返回真实状态",
  },
  "/api/posts/slug/{slug}": {
    GET: "按 slug 获取已发布文章",
  },
  "/api/categories": {
    GET: "分类列表",
    POST: "创建分类（管理）",
  },
  "/api/categories/{id}": {
    GET: "分类详情",
    PUT: "更新分类",
    DELETE: "删除分类",
  },
  "/api/tags": {
    GET: "标签列表",
    POST: "创建标签（管理）",
  },
  "/api/tags/{id}": {
    GET: "标签详情",
    PUT: "更新标签",
    DELETE: "删除标签",
  },
  "/api/notifications": {
    GET: "通知列表（以路由鉴权为准）",
    POST: "创建通知",
  },
  "/api/notifications/{id}": {
    GET: "通知详情",
    PUT: "更新通知",
    DELETE: "删除通知",
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
  "/api/users": {
    GET: "用户列表（占位/过渡实现）",
    POST: "创建用户（占位/过渡实现）",
  },
  "/api/users/{id}": {
    GET: "用户详情",
    PUT: "更新用户",
    DELETE: "删除用户",
  },
  "/api/proxy/{...path}": {
    GET: "服务端代理到目标路径",
  },
  "/api/seed": {
    GET: "种子/演示数据接口（高危，生产勿暴露；以 route 实现为准）",
  },
  "/api/test-db": {
    GET: "检测数据库连接",
  },
  "/api/test-env": {
    GET: "检测关键环境变量是否配置",
  },
};

/** 鉴权与调用注意（展示在文档卡片上） */
export const API_DOCS_AUTH_HINTS: Record<string, Partial<Record<string, string>>> = {
  "/api/api-docs": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（JWT：role=super_admin、isRoot=true）。",
  },
  "/api/auth/login": {
    POST: "无需 Bearer。Body：{ username, password }。",
  },
  "/api/auth/register": {
    POST: "无需 Bearer。常配合先发验证码。",
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
    POST: "无需 Bearer。",
  },
  "/api/auth/reset-password": {
    POST: "无需 Bearer。",
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
  "/api/admin/users": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken（requireInMemorySuperRoot）。",
  },
  "/api/admin/users/{id}": {
    GET: "必须：Authorization: Bearer + 超级管理员 accessToken。",
    PATCH:
      "必须：Authorization: Bearer + 超级管理员 accessToken。路径 id 为当前登录根账户 userId 时 **403**（不可改本人角色/状态）。",
  },
  "/api/posts": {
    GET: "公开列表通常无需 Bearer；管理筛选见代码。",
    POST: "必须：Authorization: Bearer（作者/管理员）",
  },
  "/api/posts/{id}": {
    GET: "公开只读通常无需；草稿等见代码。",
    PUT: "必须：Authorization: Bearer",
    DELETE: "必须：Authorization: Bearer",
    PATCH: "必须：Authorization: Bearer",
  },
  "/api/posts/{id}/view": {
    POST: "通常无需 Bearer（匿名计数）。",
  },
  "/api/posts/{id}/favorite": {
    GET: "无需 Bearer 可查未收藏；已登录返回真实状态。",
    POST: "必须：Authorization: Bearer。",
  },
  "/api/posts/{id}/like": {
    GET: "无需 Bearer 可返回总数；登录时返回是否已赞。",
    POST: "必须：Authorization: Bearer。",
  },
  "/api/posts/engagement": {
    GET: "Query: ids。未登录：匿名占位；已登录：真实状态。",
  },
  "/api/posts/slug/{slug}": {
    GET: "无需 Bearer（公开已发布）。",
  },
  "/api/categories": {
    GET: "无需 Bearer。",
    POST: "须管理权限（Bearer），以路由实现为准。",
  },
  "/api/categories/{id}": {
    GET: "无需 Bearer。",
    PUT: "须管理权限（Bearer）。",
    DELETE: "须管理权限（Bearer）。",
  },
  "/api/tags": {
    GET: "无需 Bearer。",
    POST: "须管理权限（Bearer）。",
  },
  "/api/tags/{id}": {
    GET: "无需 Bearer。",
    PUT: "须管理权限（Bearer）。",
    DELETE: "须管理权限（Bearer）。",
  },
  "/api/notifications": {
    GET: "以路由为准，常需 Bearer。",
    POST: "以路由为准。",
  },
  "/api/notifications/{id}": {
    GET: "以路由为准。",
    PUT: "以路由为准。",
    DELETE: "以路由为准。",
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
  "/api/users": {
    GET: "以路由实现为准。",
    POST: "以路由实现为准。",
  },
  "/api/users/{id}": {
    GET: "以路由实现为准。",
    PUT: "以路由实现为准。",
    DELETE: "以路由实现为准。",
  },
  "/api/proxy/{...path}": {
    GET: "可能需内网或密钥，以路由实现为准。",
  },
  "/api/seed": {
    GET: "高危；常限管理员或禁用生产。",
  },
  "/api/test-db": {
    GET: "开发与运维自检，生产建议关闭或保护。",
  },
  "/api/test-env": {
    GET: "开发与运维自检，生产建议关闭或保护。",
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
