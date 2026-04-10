/**
 * 分类数据管理 Hook
 * 提供分类数据的获取、搜索、筛选等功能
 */

import { useCallback, useEffect, useMemo, useState } from "react";

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
  searchQuery: string;
  showOnlyActive: boolean;
  setSearchQuery: (query: string) => void;
  setShowOnlyActive: (show: boolean) => void;
  refetch: () => Promise<void>;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { autoFetch = true, limit = 100 } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const fetchCategories = useCallback(
    async (params: Partial<CategoryQueryParams> = {}) => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          sortBy: "sortOrder",
          sortOrder: "asc",
          ...(params.search && { search: params.search }),
          ...(params.isActive !== undefined && { isActive: params.isActive.toString() }),
        });

        const response = await fetch(`/api/categories?${queryParams}`);
        const result: ApiResponse<PaginatedResponseData<Category>> = await response.json();

        if (result.success && result.data) {
          setCategories(result.data.data);
        } else {
          setError(result.message || "获取分类数据失败");
        }
      } catch (error) {
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
    await fetchCategories({
      search: searchQuery || undefined,
      isActive: showOnlyActive || undefined,
    });
  }, [fetchCategories, searchQuery, showOnlyActive]);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  useEffect(() => {
    if (autoFetch && !loading) {
      const timeoutId = setTimeout(() => {
        fetchCategories({
          search: searchQuery || undefined,
          isActive: showOnlyActive || undefined,
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [autoFetch, loading, fetchCategories, searchQuery, showOnlyActive]);

  return {
    categories,
    filteredCategories,
    loading,
    error,
    searchQuery,
    showOnlyActive,
    setSearchQuery,
    setShowOnlyActive,
    refetch,
  };
}
