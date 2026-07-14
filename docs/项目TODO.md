# 项目 TODO（未完项与优化 backlog）

本文档集中记录**当前代码尚未完成**或**已知需后续优化**的事项，以仓库实现为准。已实现能力见 [功能清单与路线图.md](./功能清单与路线图.md)；文档对齐工作见 [变更记录.md](./变更记录.md)。

> **维护约定**：完成某项后从对应章节勾选或删除，并在 [变更记录.md](./变更记录.md) 顶部简要记录；新增 backlog 时注明来源（产品需求 / 技术债 / 文档审计）。

---

## 一、内容与编辑

- [ ] 草稿**自动保存**（前端定时/失焦提交）与冲突处理
- [ ] 将 MinIO 上传与 **`media` 表**打通，形成通用媒体库、引用关系与清理策略
- [ ] 文章版本历史、导入导出、批量操作（按需）

## 二、互动与审核

- [x] 博客详情**评论列表 / 嵌套回复**产品化（`GET /api/comments` + 前台最多两层；提交支持 `parentId`）
- [x] 评论回复 / 审核**站内通知联动**（`user_notifications`；根评论/回复通知作者与被回复者；审核通过/拒绝通知评论作者）
- [x] 评论更细垃圾过滤策略；删除父评论时「原评论已删除」占位（`status=deleted` + 前台占位）
- [x] 评论审核管理页的角色、筛选、批量操作与审计日志预发布联调（删除审计、软删、`clientApiFetch`、`deleted` 筛选）
- [ ] 阅读进度、分享分析等运营指标产品化

## 三、发现与运营

- [ ] 更强搜索（全文索引、独立搜索服务或 MySQL FULLTEXT 等）
- [ ] RSS、站点地图
- [ ] 管理端「仪表盘」聚合统计

## 四、性能与可靠

- [ ] 热点列表缓存可按 Redis 配置逐步接入
- [ ] 图片压缩、懒加载策略统一
- [ ] 监控、审计日志、备份恢复演练

## 五、安全

- [x] 移除 Body `refreshToken` 兼容路径，统一仅 Cookie 刷新（登录/刷新 JSON 亦不再返回 refreshToken）
- [ ] 继续收紧高敏运维接口与超级管理员操作审计
- [x] accessToken 与统一客户端请求层收口（减少组件直接读 `localStorage`）

## 六、个人中心与 API 收敛

- [ ] **合并双通知 API**：前台主路径为 `/api/notifications`；`/api/profile/notifications` 为并行遗留接口，待评估废弃或统一封装
- [ ] **`/api/profile/likes` 分页 UI**：前端 `profile-likes.tsx` 当前固定 `page=1&limit=100`，大量点赞时需加载更多或分页
- [ ] 个人中心社交通知相关文案收敛到 **`dictionaries/*.json`**，减少组件内硬编码三语对象
- [ ] 处理 **`middleware/profile.ts`**：当前未被 `middleware.ts` 引用；实际门禁在 `ProfileLayout` 客户端跳转，待接入 i18n 服务端重定向或删除冗余文件

## 七、权限与 RBAC

- [x] 分类/标签**管理页角色级 RBAC**（写 API 须 `author`/`admin`/`super_admin`；读 API 仍登录 + `ownerId` 隔离）
- [x] 分类/标签列表管理入口与 manage 布局权限描述与代码校验对齐

## 八、技术债（非穷尽）

- [ ] 服务层与页面中仍有较多 `any`，建议从 API 响应类型、`PostService` join 结果和 profile 组件逐步收紧
- [ ] 复杂查询配合索引与分页策略复查
- [ ] 新增界面语言需同步 `middleware.ts`、`generateStaticParams` 与三语词典

## 九、已完成（2026-07）

- [x] 生产环境强校验 `JWT_SECRET` / `JWT_REFRESH_SECRET`，拒绝缺失或默认值。
- [x] `PostService.getPosts` 按当前页文章 ID 一次性读取标签，消除列表标签的 N+1 查询。
- [x] 评论审核管理页已接入 `/{lang}/blog/manage/comments`，支持筛选、分页、单条/批量审核和删除；待预发布联调验收。
- [x] `CORS_ORIGIN` 已接入 API CORS 白名单与预检处理；独立前端仅可使用配置的完整 Origin 访问 API。
- [x] `RATE_LIMIT_WINDOW` / `RATE_LIMIT_MAX_REQUESTS` 已接入统一 API 包装器；未读取的 `CACHE_TTL`、`UPLOAD_DIR`、`MAX_FILE_SIZE`、`ALLOWED_FILE_TYPES` 已从部署模板移除。
- [x] refresh token 已迁移至 HttpOnly Cookie（`blog_refresh_token`）；前台不再把 refresh 写入 `localStorage`；新增 `/api/auth/logout` 与 Cookie 路径 Origin 防护。
- [x] 分类/标签写接口与管理入口已收紧为 author/admin/super_admin 角色校验。
- [x] 已移除 Body `refreshToken` 兼容；刷新仅 Cookie，登录/刷新响应体不再含 refreshToken。
- [x] accessToken 经 `client-bearer-auth` / `clientApiFetch` 收口；组件不再直接读 `localStorage`；401 先 Cookie 刷新重试。
- [x] 评论读取接口与前台两层嵌套列表/回复（R2 第一切片）。
- [x] 评论回复 / 审核站内通知联动（R2 第二切片）。
- [x] 审核页预发布联调、父评论软删占位、反垃圾增强（R2 第三切片）。

---

_最后更新：2026 年 7 月（详见 [后续需求与功能开发计划.md](./后续需求与功能开发计划.md)）_
