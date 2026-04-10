/**
 * 分类页面
 * 展示所有博客分类，支持搜索、筛选和层级展示
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, CardBody, Chip, Divider, Input, Spinner } from "@heroui/react";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Hash,
  Search,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { useCategories } from "@/lib/hooks/useCategories";
import { Locale } from "@/types";
import { Category } from "@/types/blog";
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
    includeAllLevels: string;
    allCategoryPosts: string;
    activeInUse: string;
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
  }
> = {
  "zh-CN": {
    manageTitle: "分类管理",
    manageDesc: "管理分类的创建、编辑、删除和状态控制",
    enterManage: "进入管理",
    totalCategories: "总分类数",
    totalPosts: "总文章数",
    activeCategories: "活跃分类",
    includeAllLevels: "包含所有层级",
    allCategoryPosts: "所有分类文章",
    activeInUse: "正在使用中",
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
  },
  "en-US": {
    manageTitle: "Category Management",
    manageDesc: "Manage category create, edit, delete, and status",
    enterManage: "Manage",
    totalCategories: "Total Categories",
    totalPosts: "Total Posts",
    activeCategories: "Active Categories",
    includeAllLevels: "Including all levels",
    allCategoryPosts: "Posts in all categories",
    activeInUse: "Currently in use",
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
  },
  "ja-JP": {
    manageTitle: "カテゴリー管理",
    manageDesc: "カテゴリーの作成・編集・削除と状態管理",
    enterManage: "管理へ",
    totalCategories: "カテゴリー総数",
    totalPosts: "記事総数",
    activeCategories: "有効カテゴリー",
    includeAllLevels: "全階層を含む",
    allCategoryPosts: "全カテゴリーの記事",
    activeInUse: "現在利用中",
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
}: {
  category: Category;
  level?: number;
  locale: Locale;
  t: (typeof CATEGORY_PAGE_TEXT)[Locale];
}) {
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
            {category.description && <p className="category-desc">{category.description}</p>}
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
          </div>

          <div className="category-actions">
            <div className="post-count-badge">
              <Hash className="w-4 h-4" />
              <span>{category.postCount || 0}</span>
            </div>
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
          </div>
        </div>

        {/* 卡片内容区域 */}
        <div className="category-card-body">
          <div className="category-stats-grid">
            <div className="stat-item">
              <BookOpen className="w-4 h-4" />
              <span>{t.statPosts}</span>
              <strong>{category.postCount || 0}</strong>
            </div>
            <div className="stat-item">
              <Users className="w-4 h-4" />
              <span>{t.statChildren}</span>
              <strong>{category.children?.length || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 子分类展示 */}
      {hasChildren && isExpanded && (
        <div className="children-section">
          <div className="children-divider"></div>
          <div className="children-grid">
            {category.children?.map((child) => (
              <CategoryCard key={child.id} category={child} level={level + 1} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 分类统计组件
 * 展示分类的总体统计信息
 */
function CategoryStats({ categories, t }: { categories: Category[]; t: (typeof CATEGORY_PAGE_TEXT)[Locale] }) {
  const totalCategories = categories.length;
  const totalPosts = categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0);
  const activeCategories = categories.filter((cat) => cat.isActive).length;

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

      <Card className="stat-card-modern green-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper green">
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

      <Card className="stat-card-modern purple-theme">
        <CardBody className="stat-content-modern">
          <div className="stat-header">
            <div className="stat-icon-wrapper purple">
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
  t,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyActive: boolean;
  onToggleActive: (show: boolean) => void;
  t: (typeof CATEGORY_PAGE_TEXT)[Locale];
}) {
  return (
    <Card className="search-filter-modern">
      <CardBody className="search-content">
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
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const t = CATEGORY_PAGE_TEXT[locale];
  // 使用分类数据管理 Hook
  const {
    categories,
    filteredCategories,
    loading,
    error,
    searchQuery,
    showOnlyActive,
    setSearchQuery,
    setShowOnlyActive,
    refetch,
  } = useCategories({
    autoFetch: true,
    limit: 100,
  });

  // 检查用户权限（这里简化处理，实际应该从认证上下文获取）
  const isAdmin = true; // 假设当前用户是管理员

  // 管理功能处理
  const handleManageCategories = () => {
    window.location.href = "/categories/manage";
  };

  return (
    <div className="categories-page">
      {/* 管理功能入口 */}
      {isAdmin && (
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
            <CardBody className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{t.manageTitle}</h3>
                  <p className="text-sm text-default-600">{t.manageDesc}</p>
                </div>
              </div>
              <Button
                color="primary"
                variant="solid"
                startContent={<Settings className="w-4 h-4" />}
                onPress={handleManageCategories}
                className="ml-4"
              >
                {t.enterManage}
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* 统计信息 */}
      <CategoryStats categories={categories} t={t} />

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onToggleActive={setShowOnlyActive}
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
          <div className="categories-grid">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} t={t} />
            ))}
          </div>
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
    </div>
  );
}
