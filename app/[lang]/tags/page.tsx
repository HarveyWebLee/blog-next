/**
 * 标签页面 - 基于真实API接口
 * 展示所有博客标签，支持标签云、搜索、筛选和排序
 * 添加玻璃态效果和交互动画
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Chip, Input, Select, SelectItem, Spinner } from "@heroui/react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
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
import { Locale } from "@/types";
import { Tag } from "@/types/blog";

const TAG_PAGE_TEXT: Record<
  Locale,
  {
    createdAt: string;
    activeTag: string;
    inactiveTag: string;
    sortByName: string;
    sortByPostCount: string;
    sortByCreatedAt: string;
    searchTags: string;
    onlyActive: string;
    selectSort: string;
    popularTags: string;
    postUnit: string;
    totalTags: string;
    activeTags: string;
    totalPosts: string;
    avgPosts: string;
    loadFailed: string;
    retry: string;
    tagCloud: string;
    loadingTags: string;
    emptyTitle: string;
    emptyDesc: string;
    refreshPage: string;
    prevPage: string;
    nextPage: string;
    pageInfo: (page: number, totalPages: number) => string;
    manageTitle: string;
    manageDesc: string;
    enterManage: string;
  }
> = {
  "zh-CN": {
    createdAt: "创建于",
    activeTag: "活跃标签",
    inactiveTag: "非活跃标签",
    sortByName: "按名称排序",
    sortByPostCount: "按文章数量排序",
    sortByCreatedAt: "按创建时间排序",
    searchTags: "搜索标签...",
    onlyActive: "仅显示活跃",
    selectSort: "选择排序方式",
    popularTags: "热门标签",
    postUnit: "篇文章",
    totalTags: "总标签数",
    activeTags: "活跃标签",
    totalPosts: "总文章数",
    avgPosts: "平均文章",
    loadFailed: "加载失败",
    retry: "重试",
    tagCloud: "标签云",
    loadingTags: "加载标签中...",
    emptyTitle: "未找到标签",
    emptyDesc: "暂无标签数据，请稍后再试或联系管理员",
    refreshPage: "刷新页面",
    prevPage: "上一页",
    nextPage: "下一页",
    pageInfo: (page, totalPages) => `第 ${page} 页，共 ${totalPages} 页`,
    manageTitle: "标签管理",
    manageDesc: "登录后可管理标签的创建、编辑、删除和状态",
    enterManage: "进入管理",
  },
  "en-US": {
    createdAt: "Created at",
    activeTag: "Active Tag",
    inactiveTag: "Inactive Tag",
    sortByName: "Sort by Name",
    sortByPostCount: "Sort by Post Count",
    sortByCreatedAt: "Sort by Created Time",
    searchTags: "Search tags...",
    onlyActive: "Only active",
    selectSort: "Select sort method",
    popularTags: "Popular Tags",
    postUnit: "posts",
    totalTags: "Total Tags",
    activeTags: "Active Tags",
    totalPosts: "Total Posts",
    avgPosts: "Avg Posts",
    loadFailed: "Load failed",
    retry: "Retry",
    tagCloud: "Tag Cloud",
    loadingTags: "Loading tags...",
    emptyTitle: "No tags found",
    emptyDesc: "No tag data available, please try again later",
    refreshPage: "Refresh",
    prevPage: "Previous",
    nextPage: "Next",
    pageInfo: (page, totalPages) => `Page ${page} of ${totalPages}`,
    manageTitle: "Tag Management",
    manageDesc: "Sign in to create, edit, delete, and control tag status",
    enterManage: "Manage Tags",
  },
  "ja-JP": {
    createdAt: "作成日",
    activeTag: "有効タグ",
    inactiveTag: "無効タグ",
    sortByName: "名前順",
    sortByPostCount: "記事数順",
    sortByCreatedAt: "作成日時順",
    searchTags: "タグを検索...",
    onlyActive: "有効のみ表示",
    selectSort: "並び順を選択",
    popularTags: "人気タグ",
    postUnit: "記事",
    totalTags: "タグ総数",
    activeTags: "有効タグ",
    totalPosts: "記事総数",
    avgPosts: "平均記事数",
    loadFailed: "読み込み失敗",
    retry: "再試行",
    tagCloud: "タグクラウド",
    loadingTags: "タグを読み込み中...",
    emptyTitle: "タグが見つかりません",
    emptyDesc: "タグデータがありません。後でもう一度お試しください",
    refreshPage: "再読み込み",
    prevPage: "前へ",
    nextPage: "次へ",
    pageInfo: (page, totalPages) => `${page} / ${totalPages} ページ`,
    manageTitle: "タグ管理",
    manageDesc: "ログイン後にタグの作成・編集・削除・状態管理ができます",
    enterManage: "管理へ",
  },
};

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

/**
 * 玻璃态标签卡片组件
 * 展示单个标签的信息和统计，具有玻璃态效果和交互动画
 */
function TagCard({
  tag,
  index,
  onDelete,
  onOpenTag,
  locale,
  t,
}: {
  tag: Tag;
  index: number;
  onDelete?: (id: number) => void;
  onOpenTag?: (tag: Tag) => void;
  locale: Locale;
  t: (typeof TAG_PAGE_TEXT)[Locale];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      className="group relative flex h-full min-h-0 animate-fade-in-up flex-col"
      style={{ animationDelay: `${index * 100}ms` }}
      role="button"
      tabIndex={0}
      onClick={() => onOpenTag?.(tag)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenTag?.(tag);
        }
      }}
    >
      {/* 背景光效：与博客 PostCard 外层一致（不使用全局 .blog-card，避免文章卡专用 min-height 拉到标签卡） */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* 主卡片：整列等高（grid items-stretch + h-full），内部用 flex 把底栏顶到底 */}
      <Card
        className="relative flex h-full min-h-[260px] w-full cursor-pointer flex-col overflow-hidden border-0 bg-white/10 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:bg-white/20 hover:shadow-2xl hover:shadow-primary/20 sm:min-h-[280px] dark:bg-black/10 dark:hover:bg-black/20"
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

        <CardBody className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {/* 标签头部：标题两行 + 描述两行占位，避免有无描述时卡片高低不一 */}
          <div className="mb-4 flex shrink-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="relative shrink-0">
                <div
                  className="h-6 w-6 rounded-full border-2 border-white/50 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                  style={{
                    backgroundColor: tag.color || "#667eea",
                    boxShadow: `0 0 20px ${tag.color || "#667eea"}40`,
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 min-h-[3.25rem] text-xl font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary">
                  {tag.name}
                </h3>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-default-600 transition-colors duration-300 group-hover:text-default-700 dark:group-hover:text-default-300">
                  {tag.description?.trim() ? tag.description : "\u00a0"}
                </p>
              </div>
            </div>

            <Badge
              content={tag.postCount || 0}
              color="primary"
              variant="flat"
              className="shrink-0 animate-scale-in"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <Hash className="h-5 w-5 text-primary" />
              </div>
            </Badge>
          </div>

          {/* 标签统计信息 */}
          <div className="mb-4 grid shrink-0 grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-default-600">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="leading-snug">
                {t.createdAt} {new Date(tag.createdAt).toLocaleDateString(locale)}
              </span>
            </div>
            {/* 须使用稳定数据：勿用 Math.random()，否则 isHovered / isLiked 触发重渲染时数字会跳变 */}
            <div className="flex items-center gap-2 text-sm text-default-600">
              <Layers className="h-4 w-4 shrink-0" />
              <span className="leading-snug">
                {tag.postCount ?? 0} {t.postUnit}
              </span>
            </div>
          </div>

          {/* 底部操作栏：顶到底部，同一行卡片等高时仍对齐底边 */}
          <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/10 pt-4">
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
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
              <span>{tag.isActive ? t.activeTag : t.inactiveTag}</span>
            </div>
          </div>
        </CardBody>

        {/* 悬停玻璃高光：与 PostCard 相同的一次性扫光，避免 CardBody 内 infinite shimmer */}
        {isHovered ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl animate-post-card-glass-sweep-once"
            aria-hidden
          />
        ) : null}
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
  t,
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
  t: (typeof TAG_PAGE_TEXT)[Locale];
}) {
  const sortOptions = [
    { key: "name", label: t.sortByName, icon: TagIcon },
    { key: "postCount", label: t.sortByPostCount, icon: BarChart3 },
    { key: "createdAt", label: t.sortByCreatedAt, icon: Calendar },
  ];

  return (
    <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
      <CardBody className="p-6">
        <div className="flex flex-col gap-6">
          {/* 搜索输入框 */}
          <div className="relative">
            <Input
              placeholder={t.searchTags}
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
                {t.onlyActive}
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
                placeholder={t.selectSort}
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
function PopularTags({
  tags,
  onTagClick,
  t,
}: {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  t: (typeof TAG_PAGE_TEXT)[Locale];
}) {
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
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.popularTags}
          </span>
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {popularTags.map((tag, index) => (
            <div
              key={tag.id}
              className="group flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onTagClick?.(tag)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors duration-300">
                  {tag.name}
                </p>
                <p className="text-xs text-default-500">
                  {tag.postCount || 0} {t.postUnit}
                </p>
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
function TagStats({ tags, pagination, t }: { tags: Tag[]; pagination: any; t: (typeof TAG_PAGE_TEXT)[Locale] }) {
  const stats = useMemo(() => {
    const total = pagination?.total || tags.length;
    const active = tags.filter((tag) => tag.isActive).length;
    const totalPosts = tags.reduce((sum, tag) => sum + (tag.postCount || 0), 0);
    const avgPosts = tags.length > 0 ? Math.round(totalPosts / tags.length) : 0;

    return { total, active, totalPosts, avgPosts };
  }, [tags, pagination]);

  const statItems = [
    { label: t.totalTags, value: stats.total, icon: TagIcon, color: "text-primary" },
    { label: t.activeTags, value: stats.active, icon: Zap, color: "text-success" },
    { label: t.totalPosts, value: stats.totalPosts, icon: BarChart3, color: "text-warning" },
    { label: t.avgPosts, value: stats.avgPosts, icon: TrendingUp, color: "text-secondary" },
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
function ErrorAlert({ error, onRetry, t }: { error: string; onRetry: () => void; t: (typeof TAG_PAGE_TEXT)[Locale] }) {
  return (
    <Card className="mb-8 border-0 backdrop-blur-xl bg-red-500/10 dark:bg-red-500/5 animate-fade-in-up">
      <CardBody className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">{t.loadFailed}</h3>
            <p className="text-red-500 dark:text-red-400 mt-1">{error}</p>
          </div>
          <Button color="danger" variant="light" onPress={onRetry} startContent={<RefreshCw className="w-4 h-4" />}>
            {t.retry}
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
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const locale = resolveLocale(params.lang);
  const t = TAG_PAGE_TEXT[locale];
  // 使用自定义 Hook 管理标签数据
  const {
    tags,
    loading,
    error,
    pagination,
    fetchTags,
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
  const [searchValue, setSearchValue] = useState("");
  const [showOnlyActive, setShowOnlyActiveValue] = useState(false);
  const [sortByValue, setSortByValue] = useState("createdAt");
  const [sortOrderValue, setSortOrderValue] = useState<"asc" | "desc">("desc");
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
    setSearchValue(query);
    setSearchQuery(query);
    // 搜索时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ search: query, page: 1 });
  };

  // 处理筛选切换
  const handleToggleActive = (show: boolean) => {
    setShowOnlyActiveValue(show);
    setShowOnlyActive(show);
    // 筛选时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ isActive: show ? true : undefined, page: 1 });
  };

  // 处理排序变化
  const handleSortChange = (sort: string) => {
    setSortByValue(sort);
    setSortBy(sort);
    // 排序时重置到第一页
    setPage(1);
    // 触发 API 调用
    fetchTags({ sortBy: sort, page: 1 });
  };

  // 处理排序顺序变化
  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrderValue(order);
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

  // 处理刷新
  const handleRefresh = () => {
    refreshTags();
  };

  /** 跳转博客并按标签筛选 */
  const handleOpenTagPosts = (tag: Tag) => {
    router.push(`/${locale}/blog?tagId=${tag.id}`);
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
      {error && <ErrorAlert error={error} onRetry={handleRefresh} t={t} />}

      {/* 统计信息 */}
      <TagStats tags={tags} pagination={pagination} t={t} />

      {/* 标签云 */}
      {tags.length > 0 && (
        <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t.tagCloud}
              </span>
            </h2>
          </CardHeader>
          <CardBody>
            <TagCloud
              tags={tags.filter((tag) => tag.isActive)}
              maxTags={30}
              minSize={12}
              maxSize={20}
              showPostCount={true}
              onTagClick={handleOpenTagPosts}
              layout="cloud"
              sortBy="postCount"
            />
          </CardBody>
        </Card>
      )}

      {/* 热门标签 */}
      {tags.length > 0 && <PopularTags tags={tags} onTagClick={handleOpenTagPosts} t={t} />}

      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchQuery={searchValue}
        onSearchChange={handleSearch}
        showOnlyActive={showOnlyActive}
        onToggleActive={handleToggleActive}
        sortBy={sortByValue}
        onSortChange={handleSortChange}
        sortOrder={sortOrderValue}
        onSortOrderChange={handleSortOrderChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        loading={loading}
        onRefresh={handleRefresh}
        t={t}
      />

      {/* 标签列表 */}
      <div
        className={`grid items-stretch gap-6 ${
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        }`}
      >
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-default-600">{t.loadingTags}</p>
            </div>
          </div>
        ) : filteredAndSortedTags.length > 0 ? (
          filteredAndSortedTags.map((tag, index) => (
            <TagCard key={tag.id} tag={tag} index={index} onOpenTag={handleOpenTagPosts} locale={locale} t={t} />
          ))
        ) : (
          <div className="col-span-full">
            <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10">
              <CardBody className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-default-200 to-default-300 dark:from-default-700 dark:to-default-800">
                    <TagIcon className="w-12 h-12 text-default-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t.emptyTitle}</h3>
                  <p className="text-default-600 max-w-md">{t.emptyDesc}</p>
                  <Button color="primary" variant="light" onPress={handleRefresh} className="mt-4">
                    {t.refreshPage}
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
                  {t.prevPage}
                </Button>
                <span className="text-sm text-default-600">{t.pageInfo(pagination.page, pagination.totalPages)}</span>
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
                  {t.nextPage}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
