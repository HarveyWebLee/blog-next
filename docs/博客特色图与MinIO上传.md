# 博客特色图与 MinIO 上传

## 需求摘要

- 登录用户在**创建/编辑博客**页**仅能通过上传**设置特色图到 MinIO（S3 兼容 API），展示预览，可替换或移除（不提供手输图片 URL）。
- 对象键按业务划分：`{MINIO_BUCKET}` 下 **`article/{userId}/{uuid}.ext`**（文章）；预留 **`profile/{userId}/...`** 供后续头像等使用。
- 数据库中已存的**历史外链 URL**仍可展示；新设/修改特色图请走上传。

## 环境变量

| 变量                                    | 说明                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `MINIO_ENDPOINT`                        | 服务端访问 S3 API（本机 Docker 常见 `http://127.0.0.1:19000`，Compose 内 `http://minio:9000`） |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | 可与 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 相同                                            |
| `MINIO_BUCKET`                          | 桶名（如 `blog-resource`），须与 `minio-init` 已建桶一致                                       |
| `MINIO_PUBLIC_BASE_URL`                 | 无尾斜杠；用于拼接浏览器可打开的 URL                                                           |
| `MINIO_REGION`                          | 可选，默认 `us-east-1`                                                                         |
| `NEXT_PUBLIC_MINIO_BUCKET`              | 与 `MINIO_BUCKET` 一致，供前端解析对象键（替换时删旧文件）                                     |
| `NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL`     | 与公开访问基址一致；**Docker 镜像构建**经 `Dockerfile` ARG 注入                                |

模板见 **`deploy/env.docker.example`**、本地见 **`env.example`** 注释。

## 关键代码路径

- **存储抽象**：`lib/services/object-storage.service.ts`、`lib/storage/resource-scopes.ts`
- **上传/删除 API**：`app/api/uploads/image/route.ts`（`POST` multipart、`DELETE` JSON `{ key }`）
- **鉴权**：`lib/utils/request-auth.ts`（`Authorization: Bearer`）
- **前端组件**：`components/blog/featured-image-upload.tsx`（`scope` 默认 `article`；与管理页一致的渐变/圆角面板，空态支持点击与拖拽上传，`labels.emptyDropHint` 等为三语文案）
- **接入页面**：`app/[lang]/blog/manage/create/page.tsx`、`app/[lang]/blog/manage/edit/[id]/page.tsx`
- **数据库**：`posts.featured_image` 长度 **512**（迁移 **`drizzle/0002_*.sql`**）

## Docker 构建说明

`docker-compose.yml` 中 `blog-web.build.args` 将 `NEXT_PUBLIC_*` 传入 **`Dockerfile` builder**，以便 `next build` 内联客户端变量。变更桶名或公开域名后需**重新 build** 应用镜像。

## 扩展 profile 等业务

1. 在表单中 `<FeaturedImageUpload scope="profile" ... />`。
2. 若需新 scope，在 **`lib/storage/resource-scopes.ts`** 的 `OBJECT_STORAGE_SCOPES` 中增加，并在 **`object-storage.service.ts`** 的 `assertUserOwnsObjectKey` 中放行对应前缀。
