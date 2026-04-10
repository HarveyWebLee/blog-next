/**
 * 分类页面
 * 展示所有博客分类，支持搜索、筛选和层级展示
 */

"use client";

import { useEffect, useRef, useState } from "react";
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
import { Category } from "@/types/blog";
import { shadowManager } from "./shadow-effects";
// 导入样式
import "./categories.scss";

/**
 * 分类卡片组件 - 全新设计 + 动态阴影
 * 展示单个分类的信息和统计
 */
function CategoryCard({ category, level = 0 }: { category: Category; level?: number }) {
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
              <span className="category-level">L{level + 1}</span>
            </div>
          </div>

          <div className="category-info-section">
            <h3 className="category-title">{category.name}</h3>
            {category.description && <p className="category-desc">{category.description}</p>}
            <div className="category-meta-info">
              <div className="meta-item">
                <Calendar className="w-4 h-4" />
                <span>{new Date(category.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="meta-item">
                <TrendingUp className="w-4 h-4" />
                <span>{category.isActive ? "活跃" : "非活跃"}</span>
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
              <span>文章</span>
              <strong>{category.postCount || 0}</strong>
            </div>
            <div className="stat-item">
              <Users className="w-4 h-4" />
              <span>子分类</span>
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
              <CategoryCard key={child.id} category={child} level={level + 1} />
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
function CategoryStats({ categories }: { categories: Category[] }) {
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
              <h3 className="stat-title">总分类数</h3>
              <p className="stat-value">{totalCategories}</p>
              <p className="stat-desc">包含所有层级</p>
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
              <h3 className="stat-title">总文章数</h3>
              <p className="stat-value">{totalPosts}</p>
              <p className="stat-desc">所有分类文章</p>
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
              <h3 className="stat-title">活跃分类</h3>
              <p className="stat-value">{activeCategories}</p>
              <p className="stat-desc">正在使用中</p>
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
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyActive: boolean;
  onToggleActive: (show: boolean) => void;
}) {
  return (
    <Card className="search-filter-modern">
      <CardBody className="search-content">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <Input
              placeholder="搜索分类名称、描述..."
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
              仅显示活跃
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
                  <h3 className="text-lg font-semibold text-foreground">分类管理</h3>
                  <p className="text-sm text-default-600">管理分类的创建、编辑、删除和状态控制</p>
                </div>
              </div>
              <Button
                color="primary"
                variant="solid"
                startContent={<Settings className="w-4 h-4" />}
                onPress={handleManageCategories}
                className="ml-4"
              >
                进入管理
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* 统计信息 */}
      <CategoryStats categories={categories} />

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onToggleActive={setShowOnlyActive}
      />

      {/* 分类列表 - 全新设计 + 动态阴影 */}
      <div className="categories-section">
        {loading ? (
          <div className="loading-state">
            <Spinner size="lg" color="primary" />
            <p>加载分类中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="empty-icon">
              <Folder className="w-16 h-16 text-danger" />
            </div>
            <h3 className="empty-title">加载失败</h3>
            <p className="empty-description">{error}</p>
            <Button color="primary" onPress={refetch} className="mt-4">
              重试
            </Button>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="categories-grid">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Folder className="w-16 h-16" />
            </div>
            <h3 className="empty-title">未找到分类</h3>
            <p className="empty-description">{searchQuery ? `没有找到包含 "${searchQuery}" 的分类` : "暂无分类数据"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
