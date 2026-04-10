# 📚 博客API使用指南

## 🎯 概述

本项目提供了完整的博客文章管理API，包括文章的增删改查、状态管理、标签关联等核心功能。本文档将详细介绍如何在项目中使用这些API接口。

## 🏗️ 架构设计

### 分层架构

```
前端页面 (Pages)
    ↓
自定义Hook (usePosts)
    ↓
API客户端 (PostsAPI)
    ↓
后端服务 (PostService)
    ↓
数据库 (Drizzle ORM)
```

### 核心组件

- **`PostService`**: 后端业务逻辑层，处理数据库操作
- **`PostsAPI`**: 前端API客户端，封装HTTP请求
- **`usePosts`**: React Hook，管理前端状态和数据
- **页面组件**: 使用Hook展示和操作数据

## 🔌 API接口列表

### 1. 文章查询接口

#### 获取文章列表

```typescript
// 基本用法
const { posts, loading, error, pagination } = usePosts();

// 带参数查询
const { posts } = usePosts({
  initialParams: {
    status: "published",
    visibility: "public",
    limit: 10,
    page: 1,
    search: "关键词",
    categoryId: 1,
    sortBy: "publishedAt",
    sortOrder: "desc",
  },
});
```

#### 获取文章详情

```typescript
const { getPost, getPostBySlug } = usePosts();

// 根据ID获取
const post = await getPost(123);

// 根据slug获取
const post = await getPostBySlug("article-slug");
```

### 2. 文章管理接口

#### 创建文章

```typescript
const { createPost } = usePosts();

const newPost = await createPost({
  title: "文章标题",
  content: "文章内容",
  excerpt: "文章摘要",
  categoryId: 1,
  status: "draft",
  visibility: "public",
  tagIds: [1, 2, 3],
});
```

#### 更新文章

```typescript
const { updatePost } = usePosts();

const updatedPost = await updatePost(123, {
  title: "新标题",
  content: "新内容",
  status: "published",
});
```

#### 删除文章

```typescript
const { deletePost } = usePosts();

const success = await deletePost(123);
```

#### 更新文章状态

```typescript
const { updatePostStatus } = usePosts();

const updatedPost = await updatePostStatus(123, "published");
```

### 3. 文章交互接口

#### 增加浏览次数

```typescript
const { incrementViewCount } = usePosts();

const success = await incrementViewCount(123);
```

#### 增加点赞次数

```typescript
const { incrementLikeCount } = usePosts();

const success = await incrementLikeCount(123);
```

## 🎣 使用usePosts Hook

### 基本用法

```typescript
import { usePosts } from "@/lib/hooks/usePosts";

function BlogPage() {
  const {
    posts, // 文章列表
    loading, // 加载状态
    error, // 错误信息
    pagination, // 分页信息
    fetchPosts, // 获取文章列表
    searchPosts, // 搜索文章
    filterByCategory, // 按分类筛选
    sortPosts, // 排序文章
    goToPage, // 跳转页面
    createPost, // 创建文章
    updatePost, // 更新文章
    deletePost, // 删除文章
  } = usePosts({
    initialParams: { status: "published" },
    autoFetch: true,
  });

  // 使用这些方法和状态...
}
```

### 高级用法

```typescript
// 自定义初始参数
const { posts } = usePosts({
  initialParams: {
    status: "published",
    visibility: "public",
    limit: 20,
    sortBy: "viewCount",
    sortOrder: "desc",
  },
  autoFetch: false, // 手动控制数据获取
});

// 手动获取数据
useEffect(() => {
  fetchPosts();
}, []);

// 动态筛选
const handleSearch = (term: string) => {
  searchPosts(term);
};

const handleCategoryChange = (categoryId: number) => {
  filterByCategory(categoryId);
};

const handleSort = (field: string) => {
  sortPosts(field, "desc");
};
```

## 📱 页面集成示例

### 1. 博客列表页面

```typescript
// app/blog/page.tsx
export default function BlogPage() {
  const {
    posts,
    loading,
    error,
    pagination,
    searchPosts,
    filterByCategory,
    goToPage
  } = usePosts({
    initialParams: {
      status: 'published',
      visibility: 'public',
      limit: 12
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <SearchBar onSearch={searchPosts} />
      <CategoryFilter onFilter={filterByCategory} />
      <PostGrid posts={posts} />
      <Pagination
        {...pagination}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

### 2. 文章管理页面

```typescript
// app/blog/manage/page.tsx
export default function ManagePage() {
  const {
    posts,
    loading,
    deletePost,
    updatePostStatus,
    filterByStatus
  } = usePosts({
    initialParams: { limit: 20 }
  });

  const handleDelete = async (post: PostData) => {
    if (confirm('确定要删除这篇文章吗？')) {
      await deletePost(post.id);
    }
  };

  const handleStatusChange = async (post: PostData, status: PostStatus) => {
    await updatePostStatus(post.id, status);
  };

  return (
    <div>
      <StatusFilter onFilter={filterByStatus} />
      <PostTable
        posts={posts}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
```

### 3. 文章详情页面

```typescript
// app/blog/[slug]/page.tsx
export default function PostDetailPage({ params }: { params: { slug: string } }) {
  const { getPostBySlug, incrementViewCount } = usePosts({ autoFetch: false });
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      const postData = await getPostBySlug(params.slug);
      setPost(postData);
      setLoading(false);

      // 增加浏览次数
      if (postData) {
        await incrementViewCount(postData.id);
      }
    };

    loadPost();
  }, [params.slug]);

  if (loading) return <LoadingSpinner />;
  if (!post) return <NotFound />;

  return <PostDetail post={post} />;
}
```

## 🔧 自定义Hook扩展

### 创建专用Hook

```typescript
// lib/hooks/usePostManagement.ts
export function usePostManagement() {
  const { createPost, updatePost, deletePost } = usePosts({ autoFetch: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreate = async (data: CreatePostRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createPost(data);
      return result;
    } catch (error) {
      setSubmitError(error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createPost: handleCreate,
    updatePost,
    deletePost,
    isSubmitting,
    submitError,
  };
}
```

### 组合多个Hook

```typescript
function BlogDashboard() {
  const { posts, loading } = usePosts();
  const { createPost } = usePostManagement();
  const { categories } = useCategories();
  const { tags } = useTags();

  // 组合使用多个Hook...
}
```

## 📊 数据流管理

### 状态更新流程

1. **用户操作** → 触发Hook方法
2. **Hook方法** → 调用API客户端
3. **API客户端** → 发送HTTP请求
4. **后端服务** → 处理业务逻辑
5. **数据库操作** → 更新数据
6. **响应返回** → 更新前端状态
7. **UI更新** → 重新渲染组件

### 错误处理

```typescript
const { error, clearError } = usePosts();

// 显示错误信息
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
    <Button onClick={clearError}>关闭</Button>
  </Alert>
)}

// 自动清除错误
useEffect(() => {
  if (error) {
    const timer = setTimeout(clearError, 5000);
    return () => clearTimeout(timer);
  }
}, [error, clearError]);
```

## 🚀 性能优化

### 1. 分页加载

```typescript
const { posts, pagination, goToPage } = usePosts({
  initialParams: { limit: 20 },
});

// 只加载当前页的数据
const handlePageChange = (page: number) => {
  goToPage(page);
  // 滚动到顶部
  window.scrollTo(0, 0);
};
```

### 2. 搜索防抖

```typescript
import { useDebounce } from '@/lib/hooks/useDebounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { searchPosts } = usePosts();

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchPosts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchPosts]);

  return (
    <Input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索文章..."
    />
  );
}
```

### 3. 缓存策略

```typescript
// 使用React Query或SWR进行缓存
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePostsWithCache() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => PostsAPI.getPosts(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  const createMutation = useMutation({
    mutationFn: PostsAPI.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return { posts, isLoading, createPost: createMutation.mutate };
}
```

## 🧪 测试和调试

### 1. 开发环境调试

```typescript
// 启用详细日志
const { posts, loading, error } = usePosts({
  initialParams: { limit: 5 }, // 限制数量便于调试
});

// 监听状态变化
useEffect(() => {
  console.log("Posts updated:", posts);
}, [posts]);

useEffect(() => {
  console.log("Loading state:", loading);
}, [loading]);

useEffect(() => {
  console.log("Error state:", error);
}, [error]);
```

### 2. 错误边界处理

```typescript
class PostErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PostData error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <PostErrorFallback />;
    }

    return this.props.children;
  }
}
```

## 📝 最佳实践

### 1. 错误处理

- 始终检查API响应状态
- 提供用户友好的错误信息
- 实现重试机制
- 记录错误日志

### 2. 加载状态

- 显示加载指示器
- 禁用交互按钮
- 提供进度反馈
- 实现骨架屏

### 3. 数据验证

- 验证用户输入
- 检查数据类型
- 处理边界情况
- 提供默认值

### 4. 性能考虑

- 实现分页加载
- 使用防抖搜索
- 缓存常用数据
- 优化重渲染

## 🔗 相关资源

- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks 文档](https://react.dev/reference/react/hooks)
- [TypeScript 类型定义](https://www.typescriptlang.org/docs/)

## 🤝 贡献指南

如果您在使用过程中发现问题或有改进建议：

1. 检查现有issues
2. 创建新的issue描述问题
3. 提交pull request修复问题
4. 确保所有测试通过

---

**祝您使用愉快！** 🚀
