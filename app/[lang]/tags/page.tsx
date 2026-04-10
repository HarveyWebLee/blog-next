/**
 * 标签页面 - 基于真实API接口
 * 展示所有博客标签，支持标签云、搜索、筛选和排序
 * 添加玻璃态效果和交互动画
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Chip, Input, Select, SelectItem, Spinner } from "@heroui/react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Eye,
  Filter,
  Grid3X3,
  Hash,
  Heart,
  Layers,
  List,
  Palette,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Sparkles,
  Star,
  Tag as TagIcon,
  TrendingUp,
  Zap,
} from "lucide-react";

import { TagCloud } from "@/components/ui/tag-cloud";
import { useTags } from "@/lib/hooks/useTags";
import { Tag } from "@/types/blog";

/**
 * 玻璃态标签卡片组件
 * 展示单个标签的信息和统计，具有玻璃态效果和交互动画
 */
function TagCard({ tag, index, onDelete }: { tag: Tag; index: number; onDelete?: (id: number) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group relative animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      {/* 背景光效 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* 主卡片 */}
      <Card
        className="relative w-full border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 顶部装饰条 */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"
          style={{
            background: `linear-gradient(90deg, ${tag.color || "#667eea"}, ${tag.color || "#764ba2"})`,
          }}
        />

        <CardBody className="p-6 relative">
          {/* 标签头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* 动态颜色指示器 */}
              <div className="relative">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                  style={{
                    backgroundColor: tag.color || "#667eea",
                    boxShadow: `0 0 20px ${tag.color || "#667eea"}40`,
                  }}
                />
                {isHovered && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: tag.color || "#667eea" }}
                  />
                )}
              </div>

              {/* 标签信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  {tag.name}
                </h3>
                {tag.description && (
                  <p className="text-sm text-default-600 mt-1 line-clamp-2 group-hover:text-default-700 dark:group-hover:text-default-300 transition-colors duration-300">
                    {tag.description}
                  </p>
                )}
              </div>
            </div>

            {/* 文章数量徽章 */}
            <Badge
              content={tag.postCount || 0}
              color="primary"
              variant="flat"
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
            </Badge>
          </div>

          {/* 标签统计信息 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-default-600">
              <Calendar className="w-4 h-4" />
              <span>创建于 {new Date(tag.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-default-600">
              <Eye className="w-4 h-4" />
              <span>{Math.floor(Math.random() * 1000)} 次浏览</span>
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                className="text-default-500 hover:text-red-500 transition-colors duration-300"
                onPress={() => setIsLiked(!isLiked)}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                className="text-default-500 hover:text-primary transition-colors duration-300"
              >
                <Star className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  className="text-default-500 hover:text-danger transition-colors duration-300"
                  onPress={() => onDelete(tag.id)}
                >
                  <AlertCircle className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-default-500">
              <Zap className="w-3 h-3" />
              <span>{tag.isActive ? "活跃标签" : "非活跃标签"}</span>
            </div>
          </div>

          {/* 悬停时的光效 */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * 玻璃态搜索和筛选组件
 */
function SearchAndFilter({
  searchQuery,
  onSearchChange,
  showOnlyActive,
  onToggleActive,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  loading,
  onRefresh,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyActive: boolean;
  onToggleActive: (show: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  loading: boolean;
  onRefresh: () => void;
}) {
  const sortOptions = [
    { key: "name", label: "按名称排序", icon: TagIcon },
    { key: "postCount", label: "按文章数量排序", icon: BarChart3 },
    { key: "createdAt", label: "按创建时间排序", icon: Calendar },
  ];

  return (
    <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
      <CardBody className="p-6">
        <div className="flex flex-col gap-6">
          {/* 搜索输入框 */}
          <div className="relative">
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onValueChange={onSearchChange}
              startContent={<Search className="w-5 h-5 text-default-400" />}
              className="w-full"
              variant="bordered"
              classNames={{
                input: "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
                inputWrapper:
                  "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 hover:border-primary/50 focus-within:border-primary",
              }}
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
            )}
          </div>

          {/* 筛选和排序选项 */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* 筛选选项 */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant={showOnlyActive ? "solid" : "bordered"}
                color={showOnlyActive ? "primary" : "default"}
                onPress={() => onToggleActive(!showOnlyActive)}
                startContent={<Filter className="w-4 h-4" />}
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
              >
                仅显示活跃
              </Button>
              <Button
                size="sm"
                variant="bordered"
                isIconOnly
                onPress={onRefresh}
                isLoading={loading}
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* 排序选项 */}
            <div className="flex items-center gap-3 flex-1">
              <Select
                size="sm"
                placeholder="选择排序方式"
                selectedKeys={new Set([sortBy])}
                onSelectionChange={(keys) => onSortChange(Array.from(keys)[0] as string)}
                className="max-w-xs"
                variant="bordered"
                classNames={{
                  trigger:
                    "backdrop-blur-xl bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20",
                  value: "text-foreground",
                }}
              >
                {sortOptions.map((option) => (
                  <SelectItem key={option.key} startContent={<option.icon className="w-4 h-4" />}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <Button
                size="sm"
                variant="bordered"
                isIconOnly
                onPress={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20"
              >
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "solid" : "bordered"}
                color={viewMode === "grid" ? "primary" : "default"}
                isIconOnly
                onPress={() => onViewModeChange("grid")}
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "solid" : "bordered"}
                color={viewMode === "list" ? "primary" : "default"}
                isIconOnly
                onPress={() => onViewModeChange("list")}
                className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * 热门标签组件 - 玻璃态版本
 */
function PopularTags({ tags }: { tags: Tag[] }) {
  const popularTags = tags
    .filter((tag) => tag.isActive)
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
    .slice(0, 10);

  return (
    <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
      <CardHeader className="pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">热门标签</span>
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {popularTags.map((tag, index) => (
            <div
              key={tag.id}
              className="group flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors duration-300">
                  {tag.name}
                </p>
                <p className="text-xs text-default-500">{tag.postCount || 0} 篇文章</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * 标签统计组件 - 玻璃态版本
 */
function TagStats({ tags, pagination }: { tags: Tag[]; pagination: any }) {
  const stats = useMemo(() => {
    const total = pagination?.total || tags.length;
    const active = tags.filter((tag) => tag.isActive).length;
    const totalPosts = tags.reduce((sum, tag) => sum + (tag.postCount || 0), 0);
    const avgPosts = tags.length > 0 ? Math.round(totalPosts / tags.length) : 0;

    return { total, active, totalPosts, avgPosts };
  }, [tags, pagination]);

  const statItems = [
    { label: "总标签数", value: stats.total, icon: TagIcon, color: "text-primary" },
    { label: "活跃标签", value: stats.active, icon: Zap, color: "text-success" },
    { label: "总文章数", value: stats.totalPosts, icon: BarChart3, color: "text-warning" },
    { label: "平均文章", value: stats.avgPosts, icon: TrendingUp, color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card
          key={item.label}
          className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-105 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardBody className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mx-auto mb-3">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{item.value}</div>
            <div className="text-sm text-default-600">{item.label}</div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/**
 * 错误提示组件
 */
function ErrorAlert({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="mb-8 border-0 backdrop-blur-xl bg-red-500/10 dark:bg-red-500/5 animate-fade-in-up">
      <CardBody className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">加载失败</h3>
            <p className="text-red-500 dark:text-red-400 mt-1">{error}</p>
          </div>
          <Button color="danger" variant="light" onPress={onRetry} startContent={<RefreshCw className="w-4 h-4" />}>
            重试
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * 主标签页面组件
 */
export default function TagsPage() {
  // 使用自定义 Hook 管理标签数据
  const {
    tags,
    loading,
    error,
    pagination,
    fetchTags,
    deleteTag,
    refreshTags,
    setPage,
    setLimit,
    setSearchQuery,
    setShowOnlyActive,
    setSortBy,
    setSortOrder,
  } = useTags({
    initialPage: 1,
    initialLimit: 20,
    autoFetch: true,
  });

  // 本地状态
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mounted, setMounted] = useState(false);

  // 组件挂载状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // 搜索、筛选和排序逻辑
  const filteredAndSortedTags = useMemo(() => {
    const filtered = tags;

    // 排序已经在 API 层面处理，这里只需要返回数据
    return filtered;
  }, [tags]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 搜索时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ search: query, page: 1 });
  };

  // 处理筛选切换
  const handleToggleActive = (show: boolean) => {
    setShowOnlyActive(show);
    // 筛选时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ isActive: show ? true : undefined, page: 1 });
  };

  // 处理排序变化
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    // 排序时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ sortBy: sort, page: 1 });
  };

  // 处理排序顺序变化
  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrder(order);
    // 排序时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ sortOrder: order, page: 1 });
  };

  // 处理视图模式变化
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  // 处理删除标签
  const handleDeleteTag = async (id: number) => {
    if (confirm("确定要删除这个标签吗？")) {
      const success = await deleteTag(id);
      if (success) {
        console.log("标签删除成功");
      }
    }
  };

  // 处理刷新
  const handleRefresh = () => {
    refreshTags();
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 错误提示 */}
      {error && <ErrorAlert error={error} onRetry={handleRefresh} />}

      {/* 统计信息 */}
      <TagStats tags={tags} pagination={pagination} />

      {/* 标签云 */}
      {tags.length > 0 && (
        <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">标签云</span>
            </h2>
          </CardHeader>
          <CardBody>
            <TagCloud
              tags={tags.filter((tag) => tag.isActive)}
              maxTags={30}
              minSize={12}
              maxSize={20}
              showPostCount={true}
              onTagClick={(tag) => {
                console.log("Clicked tag:", tag);
              }}
              layout="cloud"
              sortBy="postCount"
            />
          </CardBody>
        </Card>
      )}

      {/* 热门标签 */}
      {tags.length > 0 && <PopularTags tags={tags} />}

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchQuery=""
        onSearchChange={handleSearch}
        showOnlyActive={false}
        onToggleActive={handleToggleActive}
        sortBy="createdAt"
        onSortChange={handleSortChange}
        sortOrder="desc"
        onSortOrderChange={handleSortOrderChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* 标签列表 */}
      <div
        className={`grid gap-6 ${
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        }`}
      >
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-default-600">加载标签中...</p>
            </div>
          </div>
        ) : filteredAndSortedTags.length > 0 ? (
          filteredAndSortedTags.map((tag, index) => (
            <TagCard key={tag.id} tag={tag} index={index} onDelete={handleDeleteTag} />
          ))
        ) : (
          <div className="col-span-full">
            <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10">
              <CardBody className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-default-200 to-default-300 dark:from-default-700 dark:to-default-800">
                    <TagIcon className="w-12 h-12 text-default-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">未找到标签</h3>
                  <p className="text-default-600 max-w-md">暂无标签数据，请稍后再试或联系管理员</p>
                  <Button color="primary" variant="light" onPress={handleRefresh} className="mt-4">
                    刷新页面
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* 分页信息 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={() => {
                    setPage(pagination.page - 1);
                    fetchTags({ page: pagination.page - 1 });
                  }}
                  isDisabled={!pagination.hasPrev}
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  上一页
                </Button>
                <span className="text-sm text-default-600">
                  第 {pagination.page} 页，共 {pagination.totalPages} 页
                </span>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={() => {
                    setPage(pagination.page + 1);
                    fetchTags({ page: pagination.page + 1 });
                  }}
                  isDisabled={!pagination.hasNext}
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  下一页
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
