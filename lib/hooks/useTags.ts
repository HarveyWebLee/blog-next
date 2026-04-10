/**
 * 标签数据管理 Hook
 * 提供标签的增删改查功能
 */

import { useCallback, useEffect, useState } from "react";

import {
  ApiResponse,
  CreateTagRequest,
  PaginatedResponseData,
  Tag,
  TagQueryParams,
  UpdateTagRequest,
} from "@/types/blog";

interface UseTagsOptions {
  initialPage?: number;
  initialLimit?: number;
  autoFetch?: boolean;
}

interface UseTagsReturn {
  // 数据状态
  tags: Tag[];
  loading: boolean;
  error: string | null;

  // 分页信息
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;

  // 操作方法
  fetchTags: (params?: Partial<TagQueryParams>) => Promise<void>;
  createTag: (data: CreateTagRequest) => Promise<Tag | null>;
  updateTag: (id: number, data: UpdateTagRequest) => Promise<Tag | null>;
  deleteTag: (id: number) => Promise<boolean>;
  refreshTags: () => Promise<void>;

  // 状态管理
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchQuery: (query: string) => void;
  setShowOnlyActive: (show: boolean) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;
}

export function useTags(options: UseTagsOptions = {}): UseTagsReturn {
  const { initialPage = 1, initialLimit = 20, autoFetch = true } = options;

  // 状态管理
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseTagsReturn["pagination"]>(null);

  // 查询参数状态
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  /**
   * 获取标签列表
   */
  const fetchTags = useCallback(
    async (params?: Partial<TagQueryParams>) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();

        // 使用传入的参数或当前状态
        const currentPage = params?.page ?? page;
        const currentLimit = params?.limit ?? limit;
        const currentSearch = params?.search ?? searchQuery;
        const currentIsActive = params?.isActive ?? (showOnlyActive ? true : undefined);
        const currentSortBy = params?.sortBy ?? sortBy;
        const currentSortOrder = params?.sortOrder ?? sortOrder;

        queryParams.set("page", currentPage.toString());
        queryParams.set("limit", currentLimit.toString());
        queryParams.set("sortBy", currentSortBy);
        queryParams.set("sortOrder", currentSortOrder);

        if (currentSearch) {
          queryParams.set("search", currentSearch);
        }
        if (currentIsActive !== undefined) {
          queryParams.set("isActive", currentIsActive.toString());
        }

        const response = await fetch(`/api/tags?${queryParams.toString()}`);
        const result: ApiResponse<PaginatedResponseData<Tag>> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "获取标签列表失败");
        }

        setTags(result.data?.data || []);
        setPagination(result.data?.pagination || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "获取标签列表失败";
        setError(errorMessage);
        console.error("获取标签列表失败:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, searchQuery, showOnlyActive, sortBy, sortOrder]
  );

  /**
   * 创建标签
   */
  const createTag = useCallback(
    async (data: CreateTagRequest): Promise<Tag | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/tags", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<Tag> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "创建标签失败");
        }

        // 创建成功后刷新列表
        await fetchTags();
        return result.data || null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "创建标签失败";
        setError(errorMessage);
        console.error("创建标签失败:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchTags]
  );

  /**
   * 更新标签
   */
  const updateTag = useCallback(
    async (id: number, data: UpdateTagRequest): Promise<Tag | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<Tag> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "更新标签失败");
        }

        // 更新成功后刷新列表
        await fetchTags();
        return result.data || null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "更新标签失败";
        setError(errorMessage);
        console.error("更新标签失败:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchTags]
  );

  /**
   * 删除标签
   */
  const deleteTag = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: "DELETE",
        });

        const result: ApiResponse<null> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "删除标签失败");
        }

        // 删除成功后刷新列表
        await fetchTags();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "删除标签失败";
        setError(errorMessage);
        console.error("删除标签失败:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchTags]
  );

  /**
   * 刷新标签列表
   */
  const refreshTags = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchTags();
    }
  }, [autoFetch, fetchTags]);

  return {
    // 数据状态
    tags,
    loading,
    error,
    pagination,

    // 操作方法
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    refreshTags,

    // 状态管理
    setPage,
    setLimit,
    setSearchQuery,
    setShowOnlyActive,
    setSortBy,
    setSortOrder,
  };
}
