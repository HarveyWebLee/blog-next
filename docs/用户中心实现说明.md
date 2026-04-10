# 个人中心功能实现文档

## 概述

本文档描述了个人中心功能的完整实现，包括数据库设计、API接口、UI组件和国际化支持。

## 功能特性

### 核心功能

- ✅ 个人资料管理
- ✅ 数据统计展示
- ✅ 文章管理
- ✅ 收藏管理
- ✅ 通知中心
- ✅ 活动日志
- ✅ 账户设置
- ✅ 权限控制
- ✅ 国际化支持

### 技术特性

- 🎨 美观的UI设计
- 📱 响应式布局
- 🌙 明暗主题支持
- 🔐 JWT认证保护
- 🌍 多语言支持
- ⚡ 高性能API设计

## 数据库设计

### 新增表结构

#### 1. 用户个人资料表 (user_profiles)

```sql
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  website VARCHAR(255),
  location VARCHAR(100),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'zh-CN',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(10) DEFAULT '24h',
  theme VARCHAR(20) DEFAULT 'system',
  notifications TEXT,
  privacy TEXT,
  social_links TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. 用户偏好设置表 (user_preferences)

```sql
CREATE TABLE user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. 用户活动日志表 (user_activities)

```sql
CREATE TABLE user_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  metadata TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. 用户收藏表 (user_favorites)

```sql
CREATE TABLE user_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. 用户关注表 (user_follows)

```sql
CREATE TABLE user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. 用户通知表 (user_notifications)

```sql
CREATE TABLE user_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('comment', 'like', 'follow', 'mention', 'system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  data TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API接口设计

### 个人资料API

#### GET /api/profile

获取当前用户个人资料

**响应示例:**

```json
{
  "data": {
    "id": 1,
    "userId": 1,
    "firstName": "张",
    "lastName": "三",
    "phone": "+86 138 0013 8000",
    "website": "https://example.com",
    "location": "北京市",
    "timezone": "Asia/Shanghai",
    "language": "zh-CN",
    "dateFormat": "YYYY-MM-DD",
    "timeFormat": "24h",
    "theme": "system",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "profileVisibility": "public",
      "emailVisibility": "private"
    },
    "socialLinks": {
      "github": "https://github.com/username",
      "twitter": "https://twitter.com/username"
    }
  },
  "message": "个人资料获取成功",
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/profile

更新个人资料

**请求体:**

```json
{
  "dateFormat": "YYYY-MM-DD",
  "firstName": "张",
  "language": "zh-CN",
  "lastName": "三",
  "location": "北京市",
  "phone": "+86 138 0013 8000",
  "theme": "system",
  "timeFormat": "24h",
  "timezone": "Asia/Shanghai",
  "website": "https://example.com"
}
```

### 统计信息API

#### GET /api/profile/stats

获取用户统计信息

**响应示例:**

```json
{
  "data": {
    "totalPosts": 12,
    "totalComments": 45,
    "totalViews": 1250,
    "totalLikes": 89,
    "totalFavorites": 23,
    "totalFollowers": 156,
    "totalFollowing": 78,
    "unreadNotifications": 3,
    "lastActivityAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "统计信息获取成功",
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 收藏管理API

#### GET /api/profile/favorites

获取用户收藏列表

**查询参数:**

- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)

#### POST /api/profile/favorites

收藏文章

**请求体:**

```json
{
  "postId": 123
}
```

#### DELETE /api/profile/favorites?postId=123

取消收藏

### 通知管理API

#### GET /api/profile/notifications

获取用户通知列表

**查询参数:**

- `page`: 页码
- `limit`: 每页数量
- `type`: 通知类型 (comment, like, follow, mention, system)
- `isRead`: 是否已读 (true/false)

#### PUT /api/profile/notifications

标记通知为已读

**请求体:**

```json
{
  "markAllAsRead": false,
  "notificationIds": [1, 2, 3]
}
```

#### DELETE /api/profile/notifications?id=123

删除通知

### 活动日志API

#### GET /api/profile/activities

获取用户活动日志

**查询参数:**

- `page`: 页码
- `limit`: 每页数量
- `action`: 活动类型

#### POST /api/profile/activities

记录用户活动

**请求体:**

```json
{
  "action": "post_created",
  "description": "创建了文章《如何学习React》",
  "metadata": {
    "postId": 123,
    "postTitle": "如何学习React"
  }
}
```

## UI组件设计

### 页面结构

```
/[lang]/profile/
├── page.tsx                    # 个人中心首页
├── posts/
│   └── page.tsx               # 我的文章页面
├── favorites/
│   └── page.tsx               # 我的收藏页面
├── notifications/
│   └── page.tsx               # 通知中心页面
└── settings/
    └── page.tsx               # 账户设置页面
```

### 组件架构

```
components/profile/
├── profile-layout.tsx          # 个人中心布局
├── profile-sidebar.tsx        # 侧边栏导航
├── profile-navigation.tsx      # 顶部导航
├── profile-overview.tsx       # 个人资料概览
├── profile-stats.tsx          # 统计信息
├── profile-activities.tsx     # 活动日志
├── profile-posts.tsx          # 文章管理
├── profile-favorites.tsx      # 收藏管理
├── profile-notifications.tsx  # 通知中心
├── profile-settings.tsx       # 账户设置
└── profile-loading.tsx        # 加载组件
```

### 设计特点

1. **响应式设计**: 支持桌面端和移动端
2. **主题支持**: 明暗主题切换
3. **加载状态**: 优雅的加载动画
4. **空状态**: 友好的空状态提示
5. **交互反馈**: 丰富的用户交互反馈

## 权限控制

### 认证要求

- 所有个人中心页面都需要用户登录
- 使用JWT token进行身份验证
- 未登录用户自动重定向到登录页面

### 权限检查

```typescript
// 中间件示例
export async function profileAuthMiddleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}
```

## 国际化支持

### 支持的语言

- 中文 (zh-CN) - 默认
- 英文 (en-US)
- 日文 (ja-JP)

### 字典结构

```json
{
  "profile": {
    "title": "个人中心",
    "subtitle": "管理您的账户和内容",
    "overview": "概览",
    "posts": "我的文章",
    "favorites": "我的收藏",
    "notifications": "通知中心",
    "settings": "账户设置",
    "stats": {
      "title": "数据统计",
      "totalPosts": "我的文章",
      "totalViews": "总浏览量"
    }
  }
}
```

## 使用指南

### 1. 数据库迁移

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate
```

### 2. 启动开发服务器

```bash
pnpm dev
```

### 3. 访问个人中心

```
http://localhost:3000/zh-CN/profile
```

### 4. API测试

```bash
# 获取个人资料
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/profile

# 获取统计信息
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/profile/stats
```

## 部署注意事项

### 1. 环境变量

确保以下环境变量已正确配置：

- `JWT_SECRET`: JWT密钥
- `DATABASE_URL`: 数据库连接字符串
- `NEXTAUTH_SECRET`: NextAuth密钥

### 2. 数据库权限

确保数据库用户具有以下权限：

- SELECT, INSERT, UPDATE, DELETE
- CREATE, ALTER (用于迁移)

### 3. 文件上传

如果支持头像上传，需要配置：

- 文件存储服务 (如AWS S3, Cloudinary)
- 文件大小限制
- 文件类型验证

## 性能优化

### 1. 数据库优化

- 为常用查询字段添加索引
- 使用分页查询避免大量数据加载
- 合理使用数据库连接池

### 2. 前端优化

- 使用React.memo避免不必要的重渲染
- 实现虚拟滚动处理大量数据
- 使用图片懒加载优化页面性能

### 3. 缓存策略

- API响应缓存
- 静态资源缓存
- 用户会话缓存

## 安全考虑

### 1. 输入验证

- 所有用户输入都需要验证和清理
- 防止SQL注入攻击
- 防止XSS攻击

### 2. 权限控制

- 用户只能访问自己的数据
- API接口需要身份验证
- 敏感操作需要额外验证

### 3. 数据保护

- 敏感信息加密存储
- 定期备份用户数据
- 遵循GDPR等隐私法规

## 故障排除

### 常见问题

1. **认证失败**
   - 检查JWT token是否有效
   - 确认token未过期
   - 验证请求头格式

2. **数据库连接错误**
   - 检查数据库连接字符串
   - 确认数据库服务运行状态
   - 验证用户权限

3. **页面加载缓慢**
   - 检查数据库查询性能
   - 优化图片资源
   - 使用CDN加速

### 调试工具

- 浏览器开发者工具
- 数据库查询分析器
- API测试工具 (Postman, Insomnia)

## 未来扩展

### 计划功能

- [ ] 用户头像上传
- [ ] 社交功能 (关注/粉丝)
- [ ] 消息系统
- [ ] 数据导出
- [ ] 高级搜索
- [ ] 主题定制

### 技术改进

- [ ] 微服务架构
- [ ] GraphQL API
- [ ] 实时通知
- [ ] 移动端APP
- [ ] 离线支持

## 贡献指南

### 开发流程

1. Fork项目
2. 创建功能分支
3. 编写测试用例
4. 提交代码
5. 创建Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 编写清晰的注释
- 保持代码简洁

---

**注意**: 本文档会随着功能更新而持续维护，请定期查看最新版本。
