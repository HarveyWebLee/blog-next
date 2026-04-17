/**
 * 分类数据管理 Hook
 * 提供分类数据的获取、搜索、筛选等功能
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { ApiResponse, Category, CategoryQueryParams, PaginatedResponseData } from "@/types/blog";

interface UseCategoriesOptions {
  autoFetch?: boolean;
  limit?: number;
}

interface UseCategoriesReturn {
  categories: Category[];
  filteredCategories: Category[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  searchQuery: string;
  showOnlyActive: boolean;
  setSearchQuery: (query: string) => void;
  setShowOnlyActive: (show: boolean) => void;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { autoFetch = true, limit = 100 } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCategoriesReturn["pagination"]>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const hasFetchedInitially = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestKeyRef = useRef<string>("");

  const fetchCategories = useCallback(
    async (params: Partial<CategoryQueryParams> = {}, options?: { force?: boolean; append?: boolean }) => {
      try {
        const currentPage = params.page && Number.isFinite(params.page) ? Math.max(1, Math.floor(params.page)) : 1;
        const normalizedSearch = params.search?.trim() ?? "";
        const requestKey = JSON.stringify({
          page: currentPage,
          limit,
          sortBy: "sortOrder",
          sortOrder: "asc",
          search: normalizedSearch,
          isActive: params.isActive,
        });

        if (!options?.force && requestKey === lastRequestKeyRef.current) return;
        lastRequestKeyRef.current = requestKey;

        setLoading(true);
        setError(null);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const queryParams = new URLSearchParams({
          page: String(currentPage),
          limit: limit.toString(),
          sortBy: "sortOrder",
          sortOrder: "asc",
          ...(normalizedSearch && { search: normalizedSearch }),
          ...(params.isActive !== undefined && { isActive: params.isActive.toString() }),
        });

        const response = await fetch(`/api/categories?${queryParams}`, {
          headers: { ...clientBearerHeaders() },
          signal: abortController.signal,
        });
        const result: ApiResponse<PaginatedResponseData<Category>> = await response.json();

        if (result.success && result.data) {
          if (options?.append) {
            setCategories((prev) => {
              const next = [...prev];
              for (const category of result.data!.data) {
                if (!next.some((item) => item.id === category.id)) next.push(category);
              }
              return next;
            });
          } else {
            setCategories(result.data.data);
          }
          setPagination(result.data.pagination);
        } else {
          setError(result.message || "获取分类数据失败");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("获取分类数据失败:", error);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // 构建层级结构
  const buildCategoryTree = useCallback((categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // 创建分类映射
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建层级关系
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)!;

      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }, []);

  // 筛选后的分类（构建层级结构）
  const filteredCategories = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories, buildCategoryTree]);

  const refetch = useCallback(async () => {
    await fetchCategories(
      {
        page: 1,
        search: searchQuery || undefined,
        isActive: showOnlyActive || undefined,
      },
      { force: true }
    );
  }, [fetchCategories, searchQuery, showOnlyActive]);

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext) return;
    await fetchCategories(
      {
        page: pagination.page + 1,
        search: searchQuery || undefined,
        isActive: showOnlyActive || undefined,
      },
      { append: true, force: true }
    );
  }, [fetchCategories, pagination, searchQuery, showOnlyActive]);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories({ page: 1 }, { force: true });
      hasFetchedInitially.current = true;
    }
  }, [autoFetch, fetchCategories]);

  useEffect(() => {
    // 首次加载由上面的 useEffect 负责，避免初始化阶段重复请求
    if (!autoFetch || !hasFetchedInitially.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchCategories({
        page: 1,
        search: searchQuery || undefined,
        isActive: showOnlyActive || undefined,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [autoFetch, fetchCategories, searchQuery, showOnlyActive]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    categories,
    filteredCategories,
    loading,
    error,
    pagination,
    searchQuery,
    showOnlyActive,
    setSearchQuery,
    setShowOnlyActive,
    refetch,
    loadMore,
  };
}
