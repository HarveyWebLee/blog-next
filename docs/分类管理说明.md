# 分类管理功能

本文档介绍了博客系统中分类管理功能的实现和使用方法。

## 功能概述

分类管理功能提供了完整的分类增删改查操作，包括：

- **分类列表**：查看所有分类，支持搜索、筛选和分页
- **创建分类**：创建新的分类，支持层级结构
- **编辑分类**：修改现有分类的信息
- **删除分类**：删除不需要的分类（有安全检查）
- **状态管理**：激活/停用分类

## 文件结构

### API 接口

- `app/api/categories/route.ts` - 分类列表和创建接口
- `app/api/categories/[id]/route.ts` - 单个分类的增删改查接口

### 管理页面

- `app/[lang]/categories/manage/page.tsx` - 分类管理主页面
- `app/[lang]/categories/manage/layout.tsx` - 管理页面布局
- `app/[lang]/categories/manage/create/page.tsx` - 创建分类页面
- `app/[lang]/categories/manage/edit/[id]/page.tsx` - 编辑分类页面

### 类型定义

- `types/blog.ts` - 包含分类相关的类型定义

## API 接口说明

### 获取分类列表

```
GET /api/categories
```

**查询参数：**

- `page` - 页码（默认：1）
- `limit` - 每页数量（默认：10）
- `search` - 搜索关键词
- `isActive` - 是否激活（true/false）
- `parentId` - 父分类ID
- `sortBy` - 排序字段
- `sortOrder` - 排序方向（asc/desc）

**响应示例：**

```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "name": "技术分享",
        "slug": "tech",
        "description": "技术相关的文章分享",
        "parentId": null,
        "sortOrder": 1,
        "isActive": true,
        "createdAt": "2025-09-21T05:51:31.000Z",
        "updatedAt": "2025-09-21T05:51:31.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "分类列表获取成功",
  "success": true,
  "timestamp": "2025-09-26T12:31:11.417Z"
}
```

### 创建分类

```
POST /api/categories
```

**请求体：**

```json
{
  "description": "分类描述",
  "isActive": true,
  "name": "分类名称",
  "parentId": 1,
  "slug": "category-slug",
  "sortOrder": 0
}
```

### 获取单个分类

```
GET /api/categories/[id]
```

### 更新分类

```
PUT /api/categories/[id]
```

### 删除分类

```
DELETE /api/categories/[id]
```

## 使用说明

### 1. 访问分类管理

在分类页面（`/categories`）中，管理员可以看到"分类管理"卡片，点击"进入管理"按钮即可进入管理界面。

### 2. 创建分类

1. 点击"创建分类"按钮
2. 填写分类信息：
   - **分类名称**：必填，分类的显示名称
   - **分类标识**：可选，URL友好的标识符，留空会自动生成
   - **分类描述**：可选，分类的详细描述
   - **父分类**：可选，选择父分类创建层级结构
   - **排序顺序**：数字越小排序越靠前
   - **状态**：激活或停用
3. 点击"创建分类"按钮

### 3. 编辑分类

1. 在分类列表中找到要编辑的分类
2. 点击操作菜单中的"编辑"按钮
3. 修改分类信息
4. 点击"保存更改"按钮

### 4. 删除分类

1. 在分类列表中找到要删除的分类
2. 点击操作菜单中的"删除"按钮
3. 确认删除操作

**注意：** 如果分类下还有文章或子分类，将无法删除。

### 5. 状态管理

可以通过开关快速切换分类的激活/停用状态。

## 特性

### 层级结构支持

- 支持创建多级分类结构
- 父分类和子分类的层级关系
- 避免循环引用的安全检查

### 搜索和筛选

- 按分类名称、描述、slug搜索
- 按激活状态筛选
- 支持分页显示

### 数据验证

- 分类名称和slug的唯一性检查
- 必填字段验证
- 删除前的安全检查

### 用户体验

- 响应式设计，支持移动端
- 实时预览功能
- 友好的错误提示
- 加载状态指示

## 权限控制

目前实现中，分类管理功能对所有用户开放。在实际部署时，应该：

1. 集成认证系统
2. 检查用户角色权限
3. 只允许管理员或作者访问管理功能

## 数据库结构

分类表（categories）包含以下字段：

- `id` - 主键
- `name` - 分类名称
- `slug` - URL标识符
- `description` - 描述
- `parentId` - 父分类ID
- `sortOrder` - 排序顺序
- `isActive` - 是否激活
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

## 扩展功能

未来可以考虑添加的功能：

- 分类图标上传
- 分类颜色主题
- 批量操作
- 分类导入/导出
- 分类使用统计
- 分类模板功能
