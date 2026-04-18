/**
 * 分类页面
 * 展示所有博客分类，支持搜索、筛选和层级展示
 */

"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  Textarea,
} from "@heroui/react";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Edit3,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

import { CategoryTreeSelect } from "@/components/ui/category-tree-select";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { generateRandomUrlAlias, message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { Locale } from "@/types";
import { ApiResponse, Category } from "@/types/blog";
import { shadowManager } from "./shadow-effects";
// 导入样式
import "./categories.scss";

const CATEGORY_PAGE_TEXT: Record<
  Locale,
  {
    manageTitle: string;
    manageDesc: string;
    enterManage: string;
    totalCategories: string;
    totalPosts: string;
    activeCategories: string;
    inactiveCategories: string;
    includeAllLevels: string;
    allCategoryPosts: string;
    activeInUse: string;
    currentlyDisabled: string;
    searchPlaceholder: string;
    onlyActive: string;
    loading: string;
    loadFailed: string;
    retry: string;
    emptyTitle: string;
    emptyNoData: string;
    emptySearchPrefix: string;
    levelPrefix: string;
    metaActive: string;
    metaInactive: string;
    statPosts: string;
    statChildren: string;
    createCategory: string;
    editCategory: string;
    deleteCategory: string;
    save: string;
    create: string;
    cancel: string;
    formName: string;
    formSlug: string;
    formDescription: string;
    formParent: string;
    formStatus: string;
    active: string;
    inactive: string;
    formNamePlaceholder: string;
    formSlugPlaceholder: string;
    formDescriptionPlaceholder: string;
    formParentPlaceholder: string;
    formParentNone: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: (name: string) => string;
    deleteWarning: string;
    deleteSuccess: string;
    createSuccess: string;
    saveSuccess: string;
    operationFailed: string;
    deleting: string;
    viewMore: string;
    loadingMore: string;
  }
> = {
  "zh-CN": {
    manageTitle: "分类管理",
    manageDesc: "管理分类的创建、编辑、删除和状态控制",
    enterManage: "进入管理",
    totalCategories: "总分类数",
    totalPosts: "总文章数",
    activeCategories: "活跃分类",
    inactiveCategories: "停用分类",
    includeAllLevels: "包含所有层级",
    allCategoryPosts: "所有分类文章",
    activeInUse: "正在使用中",
    currentlyDisabled: "当前已停用",
    searchPlaceholder: "搜索分类名称、描述...",
    onlyActive: "仅显示活跃",
    loading: "加载分类中...",
    loadFailed: "加载失败",
    retry: "重试",
    emptyTitle: "未找到分类",
    emptyNoData: "暂无分类数据",
    emptySearchPrefix: "没有找到包含",
    levelPrefix: "L",
    metaActive: "活跃",
    metaInactive: "非活跃",
    statPosts: "文章",
    statChildren: "子分类",
    createCategory: "新建分类",
    editCategory: "编辑分类",
    deleteCategory: "删除分类",
    save: "保存",
    create: "创建",
    cancel: "取消",
    formName: "分类名称",
    formSlug: "分类标识",
    formDescription: "分类描述",
    formParent: "父分类",
    formStatus: "分类状态",
    active: "活跃",
    inactive: "停用",
    formNamePlaceholder: "请输入分类名称",
    formSlugPlaceholder: "默认自动生成 8 位随机码",
    formDescriptionPlaceholder: "可选，介绍该分类用途",
    formParentPlaceholder: "选择父分类（可选）",
    formParentNone: "无父分类",
    deleteConfirmTitle: "删除分类",
    deleteConfirmDesc: (name) => `确定要删除分类「${name}」吗？`,
    deleteWarning: "若该分类下有文章或子分类，将无法删除。",
    deleteSuccess: "分类删除成功",
    createSuccess: "分类创建成功",
    saveSuccess: "分类更新成功",
    operationFailed: "分类操作失败",
    deleting: "删除中...",
    viewMore: "查看更多",
    loadingMore: "加载中...",
  },
  "en-US": {
    manageTitle: "Category Management",
    manageDesc: "Manage category create, edit, delete, and status",
    enterManage: "Manage",
    totalCategories: "Total Categories",
    totalPosts: "Total Posts",
    activeCategories: "Active Categories",
    inactiveCategories: "Inactive Categories",
    includeAllLevels: "Including all levels",
    allCategoryPosts: "Posts in all categories",
    activeInUse: "Currently in use",
    currentlyDisabled: "Currently disabled",
    searchPlaceholder: "Search category name or description...",
    onlyActive: "Only active",
    loading: "Loading categories...",
    loadFailed: "Load Failed",
    retry: "Retry",
    emptyTitle: "No Categories Found",
    emptyNoData: "No category data yet",
    emptySearchPrefix: "No category found for",
    levelPrefix: "L",
    metaActive: "Active",
    metaInactive: "Inactive",
    statPosts: "Posts",
    statChildren: "Children",
    createCategory: "Create Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    save: "Save",
    create: "Create",
    cancel: "Cancel",
    formName: "Name",
    formSlug: "Slug",
    formDescription: "Description",
    formParent: "Parent",
    formStatus: "Status",
    active: "Active",
    inactive: "Inactive",
    formNamePlaceholder: "Enter category name",
    formSlugPlaceholder: "Auto-generated 8-char random slug",
    formDescriptionPlaceholder: "Optional description",
    formParentPlaceholder: "Select parent category (optional)",
    formParentNone: "No parent",
    deleteConfirmTitle: "Delete Category",
    deleteConfirmDesc: (name) => `Delete category "${name}"?`,
    deleteWarning: "If this category has posts or children, deletion will fail.",
    deleteSuccess: "Category deleted",
    createSuccess: "Category created",
    saveSuccess: "Category updated",
    operationFailed: "Category operation failed",
    deleting: "Deleting...",
    viewMore: "Load more",
    loadingMore: "Loading...",
  },
  "ja-JP": {
    manageTitle: "カテゴリー管理",
    manageDesc: "カテゴリーの作成・編集・削除と状態管理",
    enterManage: "管理へ",
    totalCategories: "カテゴリー総数",
    totalPosts: "記事総数",
    activeCategories: "有効カテゴリー",
    inactiveCategories: "無効カテゴリー",
    includeAllLevels: "全階層を含む",
    allCategoryPosts: "全カテゴリーの記事",
    activeInUse: "現在利用中",
    currentlyDisabled: "現在無効",
    searchPlaceholder: "カテゴリー名・説明を検索...",
    onlyActive: "有効のみ表示",
    loading: "カテゴリーを読み込み中...",
    loadFailed: "読み込み失敗",
    retry: "再試行",
    emptyTitle: "カテゴリーが見つかりません",
    emptyNoData: "カテゴリーのデータがありません",
    emptySearchPrefix: "次に一致するカテゴリーはありません：",
    levelPrefix: "L",
    metaActive: "有効",
    metaInactive: "無効",
    statPosts: "記事",
    statChildren: "子カテゴリー",
    createCategory: "カテゴリー作成",
    editCategory: "カテゴリー編集",
    deleteCategory: "カテゴリー削除",
    save: "保存",
    create: "作成",
    cancel: "キャンセル",
    formName: "カテゴリー名",
    formSlug: "スラッグ",
    formDescription: "説明",
    formParent: "親カテゴリー",
    formStatus: "状態",
    active: "有効",
    inactive: "無効",
    formNamePlaceholder: "カテゴリー名を入力",
    formSlugPlaceholder: "既定で8文字ランダム生成",
    formDescriptionPlaceholder: "任意の説明",
    formParentPlaceholder: "親カテゴリーを選択（任意）",
    formParentNone: "親なし",
    deleteConfirmTitle: "カテゴリー削除",
    deleteConfirmDesc: (name) => `カテゴリー「${name}」を削除しますか？`,
    deleteWarning: "記事や子カテゴリーがある場合は削除できません。",
    deleteSuccess: "カテゴリーを削除しました",
    createSuccess: "カテゴリーを作成しました",
    saveSuccess: "カテゴリーを更新しました",
    operationFailed: "カテゴリー操作に失敗しました",
    deleting: "削除中...",
    viewMore: "さらに表示",
    loadingMore: "読み込み中...",
  },
};

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

/**
 * 分类卡片组件 - 全新设计 + 动态阴影
 * 展示单个分类的信息和统计
 */
function CategoryCard({
  category,
  level = 0,
  locale,
  t,
  onEdit,
  onDelete,
}: {
  category: Category;
  level?: number;
  locale: Locale;
  t: (typeof CATEGORY_PAGE_TEXT)[Locale];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasChildren = category.children && category.children.length > 0;

  // 应用动态阴影效果
  useEffect(() => {
    if (cardRef.current) {
      // 根据层级应用不同的阴影效果
      shadowManager.applyLevelShadow(cardRef.current, level);

      // 应用悬停和点击效果
      shadowManager.applyHoverShadow(cardRef.current, {
        intensity: 0.15,
        color:
          level === 0 ? "rgba(59, 130, 246, 0.3)" : level === 1 ? "rgba(16, 185, 129, 0.3)" : "rgba(139, 92, 246, 0.3)",
        blur: 25,
      });

      shadowManager.applyClickShadow(cardRef.current, {
        intensity: 0.1,
        color:
          level === 0 ? "rgba(59, 130, 246, 0.2)" : level === 1 ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)",
        blur: 15,
      });
    }
  }, [level]);

  // 处理卡片点击
  const handleCardClick = () => {
    setIsSelected(!isSelected);
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  /** 跳转到博客列表并按当前分类过滤文章 */
  const handleOpenCategoryPosts = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    router.push(`/${locale}/blog?categoryId=${category.id}`);
  };

  return (
    <div
      ref={cardRef}
      className={`category-card-modern ${level > 0 ? `level-${level}` : ""} ${isSelected ? "selected" : ""} ${isExpanded ? "expanded" : ""}`}
      onClick={handleCardClick}
    >
      <div className="category-card-content">
        {/* 卡片头部 */}
        <div className="category-card-header">
          <div className="category-icon-section">
            <div className="category-icon-wrapper">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-6 h-6" />
                ) : (
                  <Folder className="w-6 h-6" />
                )
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
            <div className="category-badge">
              <span className="category-level">
                {t.levelPrefix}
                {level + 1}
              </span>
            </div>
          </div>

          <div className="category-info-section">
            <h3 className="category-title">{category.name}</h3>
            <div className="category-meta-info">
              <div className="meta-item">
                <Calendar className="w-4 h-4" />
                <span>{new Date(category.createdAt).toLocaleDateString(locale)}</span>
              </div>
              <div className="meta-item">
                <TrendingUp className="w-4 h-4" />
                <span>{category.isActive ? t.metaActive : t.metaInactive}</span>
              </div>
            </div>
            {category.description && <p className="category-desc">{category.description}</p>}
          </div>

          <div className="category-actions">
            {hasChildren && (
              <button
                className={`expand-btn ${isExpanded ? "expanded" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {onEdit && (
              <button
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
                aria-label={t.editCategory}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                aria-label={t.deleteCategory}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 卡片内容区域 */}
        <div className="category-card-body mt-auto">
          <div className="category-stats-grid">
            <button type="button" className="stat-item" onClick={handleOpenCategoryPosts}>
              <BookOpen className="w-4 h-4" />
              <span>{t.statPosts}</span>
              <strong>{category.postCount || 0}</strong>
            </button>
            <div className="stat-item">
              <Users className="w-4 h-4" />
              <span>{t.statChildren}</span>
              <strong>{category.children?.length || 0}</strong>
            </div>
          </div>
        </div>

        {/* 子分类展示：放到内容区内部，避免受卡片外层布局裁切 */}
        {hasChildren && isExpanded
          ? category.children?.map((child) => (
              <CategoryCard
                key={child.id}
                category={child}
                level={level + 1}
                locale={locale}
                t={t}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          : null}
      </div>
    </div>
  );
}

/**
 * 分类统计组件
 * 展示分类的总体统计信息
 */
function CategoryStats({
  categories,
  t,
  summary,
}: {
  categories: Category[];
  t: (typeof CATEGORY_PAGE_TEXT)[Locale];
  summary?: { totalCategories: number; totalPosts: number; activeCategories: number; inactiveCategories: number };
}) {
  const totalCategories = summary?.totalCategories ?? categories.length;
  const totalPosts = summary?.totalPosts ?? categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0);
  const activeCategories = summary?.activeCategories ?? categories.filter((cat) => cat.isActive).length;
  const inactiveCategories = summary?.inactiveCategories ?? Math.max(totalCategories - activeCategories, 0);

  return (
    <div className="stats-grid-modern">
      <Card className="stat-card-modern blue-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper blue">
              <Folder className="w-8 h-8" />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{t.totalCategories}</h3>
              <p className="stat-value">{totalCategories}</p>
              <p className="stat-desc">{t.includeAllLevels}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="stat-card-modern teal-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper teal">
              <FileText className="w-8 h-8" />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{t.totalPosts}</h3>
              <p className="stat-value">{totalPosts}</p>
              <p className="stat-desc">{t.allCategoryPosts}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="stat-card-modern green-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper green">
              <Filter className="w-8 h-8" />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{t.activeCategories}</h3>
              <p className="stat-value">{activeCategories}</p>
              <p className="stat-desc">{t.activeInUse}</p>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="stat-card-modern rose-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper rose">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="stat-info">
              <h3 className="stat-title">{t.inactiveCategories}</h3>
              <p className="stat-value">{inactiveCategories}</p>
              <p className="stat-desc">{t.currentlyDisabled}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * 搜索和筛选组件
 */
function SearchAndFilter({
  searchQuery,
  onSearchChange,
  showOnlyActive,
  onToggleActive,
  onCreateCategory,
  t,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyActive: boolean;
  onToggleActive: (show: boolean) => void;
  onCreateCategory: () => void;
  t: (typeof CATEGORY_PAGE_TEXT)[Locale];
}) {
  return (
    <Card
      className="search-filter-modern"
      classNames={{
        // 与 categories.scss 一致：外层不铺 content1，由 .search-content 承担与分类卡片相同的表面样式
        base: "!rounded-none !border-none !bg-transparent !shadow-none overflow-visible",
      }}
    >
      <CardBody className="search-content !bg-transparent">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onValueChange={onSearchChange}
              className="search-input-field"
              variant="bordered"
            />
          </div>
          <div className="filter-section">
            <Button
              size="sm"
              variant={showOnlyActive ? "solid" : "bordered"}
              color={showOnlyActive ? "primary" : "default"}
              onPress={() => onToggleActive(!showOnlyActive)}
              startContent={<Filter className="w-4 h-4" />}
              className="filter-btn"
            >
              {t.onlyActive}
            </Button>
            <Button size="sm" color="primary" startContent={<Plus className="w-4 h-4" />} onPress={onCreateCategory}>
              {t.createCategory}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * 主分类页面组件
 */
export default function CategoriesPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const { isAuthenticated } = useAuth();
  const t = CATEGORY_PAGE_TEXT[locale];
  // 使用分类数据管理 Hook
  const {
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
  } = useCategories({
    autoFetch: true,
    limit: 12,
  });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statsSummary, setStatsSummary] = useState<{
    totalCategories: number;
    totalPosts: number;
    activeCategories: number;
    inactiveCategories: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: undefined as number | undefined,
    isActive: true,
  });

  // 编辑时排除自身及其所有后代，避免形成循环层级
  const disabledParentIds = useMemo(() => {
    if (!editingCategory) return [];
    const blockedIds = new Set<number>([editingCategory.id]);
    const childrenMap = new Map<number, number[]>();
    for (const category of categories) {
      if (category.parentId == null) continue;
      const siblings = childrenMap.get(category.parentId) || [];
      siblings.push(category.id);
      childrenMap.set(category.parentId, siblings);
    }
    const stack = [editingCategory.id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = childrenMap.get(current) || [];
      for (const childId of children) {
        if (blockedIds.has(childId)) continue;
        blockedIds.add(childId);
        stack.push(childId);
      }
    }
    return Array.from(blockedIds);
  }, [categories, editingCategory]);

  const fetchStatsSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?limit=1000&sortBy=createdAt&sortOrder=desc", {
        headers: { ...clientBearerHeaders() },
      });
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<{ data: Category[]; pagination: { total: number } }>;
      const rows = result.data?.data || [];
      const totalCategories = result.data?.pagination?.total ?? rows.length;
      const totalPosts = rows.reduce((sum, cat) => sum + (cat.postCount || 0), 0);
      const activeCategories = rows.filter((cat) => cat.isActive).length;
      const inactiveCategories = Math.max(totalCategories - activeCategories, 0);
      setStatsSummary({ totalCategories, totalPosts, activeCategories, inactiveCategories });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchStatsSummary();
  }, [fetchStatsSummary]);

  const openCreateModal = () => {
    if (!isAuthenticated) return void router.push(`/${locale}/auth/login`);
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: generateRandomUrlAlias(8),
      description: "",
      parentId: undefined,
      isActive: true,
    });
    setIsEditorOpen(true);
  };
  const openEditModal = (category: Category) => {
    if (!isAuthenticated) return void router.push(`/${locale}/auth/login`);
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      parentId: category.parentId,
      isActive: Boolean(category.isActive),
    });
    setIsEditorOpen(true);
  };
  const openDeleteModal = (category: Category) => {
    if (!isAuthenticated) return void router.push(`/${locale}/auth/login`);
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const handleSubmitCategory = async () => {
    if (!formData.name.trim()) return message.warning(t.formNamePlaceholder);
    try {
      setSubmitting(true);
      const isEdit = Boolean(editingCategory);
      const endpoint = isEdit ? `/api/categories/${editingCategory?.id}` : "/api/categories";
      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...clientBearerHeaders() },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateRandomUrlAlias(8),
          description: formData.description.trim(),
          parentId: formData.parentId,
          isActive: formData.isActive,
        }),
      });
      if (response.status === 401) return void router.push(`/${locale}/auth/login`);
      const result = (await response.json()) as ApiResponse<Category>;
      if (!result.success) return message.error(result.message || t.operationFailed);
      message.success(isEdit ? t.saveSuccess : t.createSuccess);
      setIsEditorOpen(false);
      await refetch();
      await fetchStatsSummary();
    } catch {
      message.error(t.operationFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setDeleteSubmitting(true);
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: { ...clientBearerHeaders() },
      });
      if (response.status === 401) return void router.push(`/${locale}/auth/login`);
      const result = (await response.json()) as ApiResponse<null>;
      if (!result.success) return message.error(result.message || t.operationFailed);
      message.success(t.deleteSuccess);
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      await refetch();
      await fetchStatsSummary();
    } catch {
      message.error(t.operationFailed);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="categories-page">
      {/* 统计信息 */}
      <CategoryStats categories={categories} t={t} summary={statsSummary ?? undefined} />

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onToggleActive={setShowOnlyActive}
        onCreateCategory={openCreateModal}
        t={t}
      />

      {/* 分类列表 - 全新设计 + 动态阴影 */}
      <div className="categories-section">
        {loading ? (
          <div className="loading-state">
            <Spinner size="lg" color="primary" />
            <p>{t.loading}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="empty-icon">
              <Folder className="w-16 h-16 text-danger" />
            </div>
            <h3 className="empty-title">{t.loadFailed}</h3>
            <p className="empty-description">{error}</p>
            <Button color="primary" onPress={refetch} className="mt-4">
              {t.retry}
            </Button>
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            <div className="categories-grid">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  locale={locale}
                  t={t}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>
            {pagination?.hasNext ? (
              <div className="mt-6 flex justify-center">
                <Button color="primary" variant="flat" onPress={() => void loadMore()} isLoading={loading}>
                  {loading ? t.loadingMore : t.viewMore}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Folder className="w-16 h-16" />
            </div>
            <h3 className="empty-title">{t.emptyTitle}</h3>
            <p className="empty-description">
              {searchQuery ? `${t.emptySearchPrefix} "${searchQuery}"` : t.emptyNoData}
            </p>
          </div>
        )}
      </div>
      <Modal isOpen={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <ModalContent>
          <ModalHeader>{editingCategory ? t.editCategory : t.createCategory}</ModalHeader>
          <ModalBody>
            <Input
              label={t.formName}
              placeholder={t.formNamePlaceholder}
              value={formData.name}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              isRequired
            />
            <Input
              label={t.formSlug}
              placeholder={t.formSlugPlaceholder}
              value={formData.slug}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, slug: value }))}
            />
            <Textarea
              label={t.formDescription}
              placeholder={t.formDescriptionPlaceholder}
              value={formData.description}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              minRows={3}
            />
            <CategoryTreeSelect
              label={t.formParent}
              placeholder={t.formParentPlaceholder}
              noneLabel={t.formParentNone}
              categories={categories}
              value={formData.parentId}
              disabledIds={disabledParentIds}
              onChange={(parentId) => {
                setFormData((prev) => ({ ...prev, parentId }));
              }}
            />
            <div className="flex items-center justify-between rounded-lg border border-default-200 p-3">
              <span className="text-sm">{t.formStatus}</span>
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={formData.isActive}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                />
                <span className="text-sm">{formData.isActive ? t.active : t.inactive}</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditorOpen(false)}>
              {t.cancel}
            </Button>
            <Button color="primary" isLoading={submitting} onPress={handleSubmitCategory}>
              {editingCategory ? t.save : t.create}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} size="sm">
        <ModalContent>
          <ModalHeader>{t.deleteConfirmTitle}</ModalHeader>
          <ModalBody>
            <p>{t.deleteConfirmDesc(deletingCategory?.name || "")}</p>
            <p className="text-sm text-warning">{t.deleteWarning}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteOpen(false)}>
              {t.cancel}
            </Button>
            <Button color="danger" isLoading={deleteSubmitting} onPress={handleDeleteCategory}>
              {deleteSubmitting ? t.deleting : t.deleteCategory}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
