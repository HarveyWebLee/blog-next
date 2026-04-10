/**
 * 文章数据管理Hook
 * 提供文章列表、详情、增删改查等功能
 */

import { useCallback, useEffect, useState } from "react";

import PostsAPI from "@/lib/api/posts";
import { CreatePostRequest, PostData, PostQueryParams, UpdatePostRequest } from "@/types/blog";

export interface UsePostsOptions {
  initialParams?: PostQueryParams;
  autoFetch?: boolean;
}

export function usePosts(options: UsePostsOptions = {}) {
  const { initialParams = {}, autoFetch = true } = options;

  // 状态管理
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [params, setParams] = useState<PostQueryParams>(initialParams);

  // 获取文章列表
  const fetchPosts = useCallback(
    async (queryParams: PostQueryParams = {}) => {
      try {
        setLoading(true);
        setError(null);

        const newParams = { ...params, ...queryParams };
        const response = await PostsAPI.getPosts(newParams);
        console.log("response", response);
        setPosts(response.data?.data ?? []);
        setPagination(response.data?.pagination ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取文章列表失败");
        console.error("获取文章列表失败:", err);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  // 获取文章详情
  const getPost = useCallback(async (id: number): Promise<PostData | null> => {
    try {
      setLoading(true);
      setError(null);

      const post = await PostsAPI.getPostById(id);
      return post;
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取文章详情失败");
      console.error("获取文章详情失败:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 根据slug获取文章
  const getPostBySlug = useCallback(async (slug: string): Promise<PostData | null> => {
    try {
      setLoading(true);
      setError(null);

      const post = await PostsAPI.getPostBySlug(slug);
      return post;
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取文章详情失败");
      console.error("获取文章详情失败:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建文章
  const createPost = useCallback(
    async (data: CreatePostRequest): Promise<PostData | null> => {
      try {
        setLoading(true);
        setError(null);

        const newPost = await PostsAPI.createPost(data);

        // 刷新文章列表
        await fetchPosts();

        return newPost;
      } catch (err) {
        setError(err instanceof Error ? err.message : "创建文章失败");
        console.error("创建文章失败:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPosts]
  );

  // 更新文章
  const updatePost = useCallback(async (id: number, data: UpdatePostRequest): Promise<PostData | null> => {
    try {
      setLoading(true);
      setError(null);

      const updatedPost = await PostsAPI.updatePost(id, data);

      // 更新本地状态
      setPosts((prevPosts) => prevPosts.map((post) => (post.id === id ? updatedPost : post)));

      return updatedPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新文章失败");
      console.error("更新文章失败:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除文章
  const deletePost = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await PostsAPI.deletePost(id);

      if (success) {
        // 从本地状态中移除
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除文章失败");
      console.error("删除文章失败:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新文章状态
  const updatePostStatus = useCallback(async (id: number, status: PostData["status"]): Promise<PostData | null> => {
    try {
      setLoading(true);
      setError(null);

      const updatedPost = await PostsAPI.updatePostStatus(id, status);

      // 更新本地状态
      setPosts((prevPosts) => prevPosts.map((post) => (post.id === id ? updatedPost : post)));

      return updatedPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新文章状态失败");
      console.error("更新文章状态失败:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 增加浏览次数
  const incrementViewCount = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await PostsAPI.incrementViewCount(id);

      if (success) {
        // 更新本地状态
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === id ? { ...post, viewCount: (post.viewCount || 0) + 1 } : post))
        );
      }

      return success;
    } catch (err) {
      console.error("增加浏览次数失败:", err);
      return false;
    }
  }, []);

  // 增加点赞次数
  const incrementLikeCount = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await PostsAPI.incrementLikeCount(id);

      if (success) {
        // 更新本地状态
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === id ? { ...post, likeCount: (post.likeCount || 0) + 1 } : post))
        );
      }

      return success;
    } catch (err) {
      console.error("增加点赞次数失败:", err);
      return false;
    }
  }, []);

  // 搜索和筛选
  const searchPosts = useCallback(
    (searchTerm: string) => {
      fetchPosts({ ...params, search: searchTerm, page: 1 });
    },
    [fetchPosts, params]
  );

  const filterByCategory = useCallback(
    (categoryId: number | null) => {
      fetchPosts({ ...params, categoryId: categoryId || undefined, page: 1 });
    },
    [fetchPosts, params]
  );

  const filterByStatus = useCallback(
    (status: PostData["status"] | null) => {
      fetchPosts({ ...params, status: status || undefined, page: 1 });
    },
    [fetchPosts, params]
  );

  // 分页
  const goToPage = useCallback(
    (page: number) => {
      fetchPosts({ ...params, page });
    },
    [fetchPosts, params]
  );

  const changePageSize = useCallback(
    (limit: number) => {
      fetchPosts({ ...params, limit, page: 1 });
    },
    [fetchPosts, params]
  );

  // 排序
  const sortPosts = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc" = "desc") => {
      fetchPosts({ ...params, sortBy, sortOrder, page: 1 });
    },
    [fetchPosts, params]
  );

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 重置参数
  const resetParams = useCallback(() => {
    const resetParams = { page: 1, limit: 10 };
    setParams(resetParams);
    fetchPosts(resetParams);
  }, [fetchPosts]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchPosts();
    }
  }, [autoFetch, fetchPosts]);

  return {
    // 状态
    posts,
    loading,
    error,
    pagination,
    params,

    // 操作方法
    fetchPosts,
    getPost,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost,
    updatePostStatus,
    incrementViewCount,
    incrementLikeCount,

    // 筛选和搜索
    searchPosts,
    filterByCategory,
    filterByStatus,

    // 分页
    goToPage,
    changePageSize,

    // 排序
    sortPosts,

    // 工具方法
    clearError,
    resetParams,
  };
}
