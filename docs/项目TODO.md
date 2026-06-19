# 项目 TODO（未完项与优化 backlog）

本文档集中记录**当前代码尚未完成**或**已知需后续优化**的事项，以仓库实现为准。已实现能力见 [功能清单与路线图.md](./功能清单与路线图.md)；文档对齐工作见 [变更记录.md](./变更记录.md)。

> **维护约定**：完成某项后从对应章节勾选或删除，并在 [变更记录.md](./变更记录.md) 顶部简要记录；新增 backlog 时注明来源（产品需求 / 技术债 / 文档审计）。

---

## 一、内容与编辑

- [ ] 草稿**自动保存**（前端定时/失焦提交）与冲突处理
- [ ] 将 MinIO 上传与 **`media` 表**打通，形成通用媒体库、引用关系与清理策略
- [ ] 文章版本历史、导入导出、批量操作（按需）

## 二、互动与审核

- [ ] 博客详情**评论列表 / 嵌套回复**产品化（当前仅有 `POST /api/comments` 提交与发帖后重拉文章）
- [ ] 评论嵌套展示与通知联动、更细垃圾过滤策略
- [ ] **评论审核管理 UI**（`/{lang}/blog/manage/comments` 或等价入口；后端 `/api/admin/comments*` 已就绪）
- [ ] 阅读进度、分享分析等运营指标产品化

## 三、发现与运营

- [ ] 更强搜索（全文索引、独立搜索服务或 MySQL FULLTEXT 等）
- [ ] RSS、站点地图
- [ ] 管理端「仪表盘」聚合统计

## 四、性能与可靠

- [ ] 文章列表标签**批量加载**，消除 N+1 查询；热点列表缓存可按 Redis 配置逐步接入
- [ ] 图片压缩、懒加载策略统一
- [ ] 监控、审计日志、备份恢复演练

## 五、安全

- [ ] 生产启动时强校验 `JWT_SECRET` / `JWT_REFRESH_SECRET`，避免 fallback 默认值
- [ ] 评估 refresh token **HttpOnly Cookie** 化，降低 XSS 场景下 localStorage token 暴露影响
- [ ] 继续收紧高敏运维接口与超级管理员操作审计

## 六、个人中心与 API 收敛

- [ ] **合并双通知 API**：前台主路径为 `/api/notifications`；`/api/profile/notifications` 为并行遗留接口，待评估废弃或统一封装
- [ ] **`/api/profile/likes` 分页 UI**：前端 `profile-likes.tsx` 当前固定 `page=1&limit=100`，大量点赞时需加载更多或分页
- [ ] 个人中心社交通知相关文案收敛到 **`dictionaries/*.json`**，减少组件内硬编码三语对象
- [ ] 处理 **`middleware/profile.ts`**：当前未被 `middleware.ts` 引用；实际门禁在 `ProfileLayout` 客户端跳转，待接入 i18n 服务端重定向或删除冗余文件

## 七、权限与 RBAC

- [ ] 分类/标签**管理页角色级 RBAC**（当前写 API 仅需登录 + `ownerId` 隔离，无 `admin`/`author` 路由级校验）
- [ ] 分类列表页「进入管理」入口的权限描述与代码校验对齐（见 [分类管理说明.md](./分类管理说明.md)）

## 八、部署与环境变量

- [ ] **`CORS_ORIGIN`**：已在 `deploy/env.docker.example` 与 Docker 文档中出现，**应用代码尚未读取**；需实现 CORS 中间件或从部署模板/文档标注为预留项
- [ ] **`RATE_LIMIT_WINDOW` / `RATE_LIMIT_MAX_REQUESTS`**：部署模板中存在，**代码未读取**；限流实际走 `lib/utils/distributed-rate-limit.ts`（硬编码窗口 + `REDIS_URL`）
- [ ] **`CACHE_TTL` / `UPLOAD_DIR`** 等：仅出现在部署模板，业务未接入

## 九、技术债（非穷尽）

- [ ] 服务层与页面中仍有较多 `any`，建议从 API 响应类型、`PostService` join 结果和 profile 组件逐步收紧
- [ ] 复杂查询配合索引与分页策略复查
- [ ] 新增界面语言需同步 `middleware.ts`、`generateStaticParams` 与三语词典

---

_最后更新：2026 年 6 月（文档与代码对齐审计）_
