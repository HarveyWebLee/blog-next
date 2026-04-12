"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  BookOpenIcon,
  CalendarIcon,
  FilePlus2Icon,
  FilterIcon,
  FolderOpen,
  Hash,
  RefreshCwIcon,
  SearchIcon,
  Sparkles,
  TrendingUpIcon,
} from "lucide-react";

import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { PostCard } from "@/components/blog/post-card";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { usePosts } from "@/lib/hooks/usePosts";
import { useTags } from "@/lib/hooks/useTags";
import { PostData } from "@/types/blog";

export type BlogPageContentProps = {
  /** 路由语言段，如 zh-CN */
  lang: string;
  /**
   * 由服务端 page 从 searchParams.categoryId 解析；与地址栏同步。
   * 有值时首屏 usePosts 即带 categoryId，避免先拉全量再筛。
   */
  initialCategoryId?: number;
  /** 由服务端 page 从 searchParams.tagId 解析；与侧栏热门标签一致 */
  initialTagId?: number;
};

export function BlogPageContent({ lang, initialCategoryId, initialTagId }: BlogPageContentProps) {
  const router = useRouter();
  const blogBasePath = `/${lang}/blog`;

  const t =
    lang === "en-US"
      ? {
          loadFailed: "Load failed",
          filterTitle: "Filter Posts",
          filterDesc: "Search, filter by category or tag, and sort posts.",
          createDoc: "Create Post",
          selectCategory: "Select category",
          searchPlaceholder: "Search title or content...",
          selectSort: "Select sort",
          loading: "Loading...",
          emptyTitle: "No posts",
          emptyHint: "No posts match your filters.",
          totalFound: "posts found",
          pagePrefix: "Page",
          pageMiddle: "of",
          pageSuffix: "",
          reload: "Reload",
          allCategories: "All categories",
          viewAllPosts: "View all posts",
        }
      : lang === "ja-JP"
        ? {
            loadFailed: "読み込み失敗",
            filterTitle: "記事を絞り込む",
            filterDesc: "検索・カテゴリ（またはタグ絞り込み）・並び順で記事を探せます。",
            createDoc: "記事を作成",
            selectCategory: "カテゴリを選択",
            searchPlaceholder: "タイトルまたは内容を検索...",
            selectSort: "並び順を選択",
            loading: "読み込み中...",
            emptyTitle: "記事がありません",
            emptyHint: "条件に一致する記事がありません。",
            totalFound: "件の記事",
            pagePrefix: "ページ",
            pageMiddle: "/",
            pageSuffix: "",
            reload: "再読み込み",
            allCategories: "すべてのカテゴリ",
            viewAllPosts: "すべての記事へ",
          }
        : {
            loadFailed: "加载失败",
            filterTitle: "筛选文章",
            filterDesc: "通过搜索、分类、标签（侧栏入口）与排序找到您需要的文章。",
            createDoc: "新建文章",
            selectCategory: "选择分类",
            searchPlaceholder: "搜索文章标题或内容...",
            selectSort: "选择排序",
            loading: "加载中...",
            emptyTitle: "暂无文章",
            emptyHint: "当前没有找到符合条件的文章。",
            totalFound: "篇文章",
            pagePrefix: "第",
            pageMiddle: "页 / 共",
            pageSuffix: "页",
            reload: "重新加载",
            allCategories: "全部分类",
            viewAllPosts: "查看全部文章",
          };

  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategoryId != null && Number.isFinite(initialCategoryId) ? String(Math.floor(initialCategoryId)) : "all"
  );
  const [sortBy, setSortBy] = useState("publishedAt");
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    posts,
    loading,
    error,
    pagination,
    params,
    fetchPosts,
    searchPosts,
    filterByCategory,
    filterByTag,
    sortPosts,
    goToPage,
    incrementViewCount,
    incrementLikeCount,
  } = usePosts({
    initialParams: {
      status: "published",
      visibility: "public",
      limit: 6,
      ...(initialCategoryId != null && Number.isFinite(initialCategoryId) && initialCategoryId > 0
        ? { categoryId: Math.floor(initialCategoryId) }
        : {}),
      ...(initialTagId != null && Number.isFinite(initialTagId) && initialTagId > 0
        ? { tagId: Math.floor(initialTagId) }
        : {}),
    },
  });

  const { categories } = useCategories({ autoFetch: true, limit: 100 });
  const { tags } = useTags({ autoFetch: true, initialLimit: 100 });
  const selectableCategories = categories.filter((category) => category.isActive);
  const categoryOptions = [
    { key: "all", label: t.allCategories },
    ...selectableCategories.map((category) => ({
      key: category.id.toString(),
      label: category.name,
    })),
  ];

  /**
   * 从地址栏进入 / 客户端路由切换时，将 URL 上的 categoryId、tagId 与列表请求对齐。
   * 分类与标签互斥展示为主；若两者同时出现在 URL，则按 AND 查询（与接口一致）。
   */
  const skipFirstUrlSync = useRef(true);
  useEffect(() => {
    if (skipFirstUrlSync.current) {
      skipFirstUrlSync.current = false;
      return;
    }
    const uc = initialCategoryId ?? undefined;
    const ut = initialTagId ?? undefined;
    const dc = params.categoryId;
    const dt = params.tagId;
    if (uc === dc && ut === dt) return;

    if (ut != null && uc != null) {
      setCategoryFilter(String(uc));
      void fetchPosts({ ...params, categoryId: uc, tagId: ut, page: 1 });
      return;
    }
    if (ut != null) {
      setCategoryFilter("all");
      filterByTag(ut);
      return;
    }
    if (uc != null) {
      setCategoryFilter(String(uc));
      filterByCategory(uc);
      return;
    }
    setCategoryFilter("all");
    filterByCategory(null);
  }, [
    initialCategoryId,
    initialTagId,
    params.categoryId,
    params.tagId,
    filterByCategory,
    filterByTag,
    fetchPosts,
    params,
  ]);

  const activeCategoryMeta = useMemo(() => {
    if (categoryFilter === "all") return null;
    const id = Number(categoryFilter);
    if (!Number.isFinite(id)) return null;
    return selectableCategories.find((c) => c.id === id) ?? null;
  }, [categoryFilter, selectableCategories]);

  const categoryHeading = useMemo(() => {
    if (!activeCategoryMeta) return "";
    const name =
      activeCategoryMeta.name?.trim() || (lang === "en-US" ? "Category" : lang === "ja-JP" ? "カテゴリ" : "未命名分类");
    if (lang === "en-US") return `Posts in “${name}”`;
    if (lang === "ja-JP") return `「${name}」の記事`;
    return `「${name}」下的文章`;
  }, [activeCategoryMeta, lang]);

  const activeTagId = params.tagId ?? undefined;
  const activeTagMeta = useMemo(() => {
    if (activeTagId == null || !Number.isFinite(activeTagId)) return null;
    return tags.find((tg) => tg.id === activeTagId) ?? null;
  }, [activeTagId, tags]);

  const tagHeading = useMemo(() => {
    if (activeTagId == null) return "";
    const name =
      activeTagMeta?.name?.trim() ||
      (lang === "en-US" ? `Tag #${activeTagId}` : lang === "ja-JP" ? `タグ #${activeTagId}` : `标签 #${activeTagId}`);
    if (lang === "en-US") return `Posts tagged “${name}”`;
    if (lang === "ja-JP") return `「${name}」の記事一覧`;
    return `含「${name}」标签的文章`;
  }, [activeTagId, activeTagMeta, lang]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    searchPosts(value);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    const categoryId = value === "all" ? null : Number(value);
    filterByCategory(categoryId);
    const next =
      categoryId == null || !Number.isFinite(categoryId)
        ? blogBasePath
        : `${blogBasePath}?categoryId=${Math.floor(categoryId)}`;
    router.replace(next, { scroll: false });
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    sortPosts(value, "desc");
  };

  const handlePageChange = (raw: number) => {
    const p = Math.floor(Number(raw));
    if (!Number.isFinite(p)) return;
    goToPage(p);
    requestAnimationFrame(() => {
      document.getElementById("blog-posts-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleViewPost = async (post: PostData) => {
    try {
      await incrementViewCount(post.id);
      router.push(`/${lang}/blog/${post.slug}`);
    } catch (e) {
      console.error("Failed to increment view count:", e);
    }
  };

  const handleLikePost = async (post: PostData) => {
    await incrementLikeCount(post.id);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="mx-auto max-w-md border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
          <CardBody className="p-8 text-center">
            <div className="mb-4 text-danger">
              <RefreshCwIcon className="mx-auto mb-4 h-12 w-12 animate-pulse" />
              <h2 className="mb-2 text-2xl font-bold">{t.loadFailed}</h2>
              <p className="text-default-500">{error}</p>
            </div>
            <Button
              color="primary"
              variant="solid"
              startContent={<RefreshCwIcon className="h-4 w-4" />}
              onPress={() => window.location.reload()}
              className="min-w-0 border border-primary/20 bg-primary/10 px-3 text-primary backdrop-blur-xl hover:bg-primary/20 dark:bg-black/10 dark:hover:bg-black/20"
            >
              {t.reload}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {categoryFilter !== "all" && activeCategoryMeta && (
            <Card className="mb-6 border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
              <CardBody className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-secondary/20 text-primary">
                    <FolderOpen className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight text-foreground">{categoryHeading}</p>
                    {activeCategoryMeta.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-default-500">{activeCategoryMeta.description}</p>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="flat"
                  color="primary"
                  className="shrink-0 font-medium"
                  onPress={() => handleCategoryFilter("all")}
                >
                  {t.viewAllPosts}
                </Button>
              </CardBody>
            </Card>
          )}

          {activeTagId != null && Number.isFinite(activeTagId) && activeTagId > 0 && (
            <Card className="mb-6 border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
              <CardBody className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-accent/20 text-secondary"
                    style={
                      activeTagMeta?.color
                        ? {
                            background: `linear-gradient(135deg, ${activeTagMeta.color}35, ${activeTagMeta.color}18)`,
                            color: activeTagMeta.color,
                          }
                        : undefined
                    }
                  >
                    <Hash className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight text-foreground">{tagHeading}</p>
                    {activeTagMeta?.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-default-500">{activeTagMeta.description}</p>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="flat"
                  color="secondary"
                  className="shrink-0 font-medium"
                  onPress={() => handleCategoryFilter("all")}
                >
                  {t.viewAllPosts}
                </Button>
              </CardBody>
            </Card>
          )}

          <Card className="mb-8 border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
            <CardHeader className="flex gap-3">
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FilterIcon className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <p className="text-lg font-semibold">{t.filterTitle}</p>
                    <p className="text-small text-default-500">{t.filterDesc}</p>
                  </div>
                </div>
                {!isAuthLoading && isAuthenticated && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<FilePlus2Icon className="h-4 w-4" />}
                    onPress={() => router.push(`/${lang}/blog/manage/create`)}
                    className="min-w-0 border border-primary/20 bg-primary/10 px-3 text-primary backdrop-blur-xl hover:bg-primary/20"
                  >
                    {t.createDoc}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchValue}
                    onValueChange={handleSearch}
                    startContent={<SearchIcon className="h-4 w-4 text-default-400" />}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: "bg-white/10 backdrop-blur-xl dark:bg-black/10",
                      inputWrapper:
                        "border-white/20 bg-white/10 backdrop-blur-xl hover:border-primary/50 focus-within:border-primary dark:border-white/10 dark:bg-black/10",
                    }}
                  />
                  {searchValue ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    </div>
                  ) : null}
                </div>

                <Select
                  placeholder={t.selectCategory}
                  selectedKeys={new Set([categoryFilter])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleCategoryFilter(selectedKey);
                  }}
                  variant="bordered"
                  size="md"
                  classNames={{
                    trigger:
                      "border-white/20 bg-white/10 backdrop-blur-xl hover:bg-white/20 dark:border-white/10 dark:bg-black/10 dark:hover:bg-black/20",
                    value: "text-foreground",
                  }}
                >
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder={t.selectSort}
                  selectedKeys={new Set([sortBy])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleSort(selectedKey);
                  }}
                  variant="bordered"
                  size="md"
                  classNames={{
                    trigger:
                      "border-white/20 bg-white/10 backdrop-blur-xl hover:bg-white/20 dark:border-white/10 dark:bg-black/10 dark:hover:bg-black/20",
                    value: "text-foreground",
                  }}
                >
                  <SelectItem key="publishedAt">最新发布</SelectItem>
                  <SelectItem key="createdAt">创建时间</SelectItem>
                  <SelectItem key="viewCount">浏览次数</SelectItem>
                  <SelectItem key="likeCount">点赞次数</SelectItem>
                  <SelectItem key="title">标题排序</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {loading ? (
            <Card className="border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
              <CardBody className="py-12 text-center">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-default-500">{t.loading}</p>
              </CardBody>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="border-0 bg-white/10 backdrop-blur-xl animate-fade-in-up dark:bg-black/10">
              <CardBody className="py-12 text-center">
                <BookOpenIcon className="mx-auto mb-4 h-16 w-16 text-default-300 animate-float" />
                <h3 className="mb-2 text-xl font-semibold">{t.emptyTitle}</h3>
                <p className="text-default-500">{t.emptyHint}</p>
              </CardBody>
            </Card>
          ) : (
            <>
              <div
                id="blog-posts-anchor"
                className="mb-6 flex scroll-mt-24 flex-wrap items-center gap-4 animate-fade-in-up"
              >
                <Chip
                  startContent={<TrendingUpIcon className="h-4 w-4" />}
                  variant="flat"
                  color="primary"
                  className="bg-white/10 backdrop-blur-xl dark:bg-black/10"
                >
                  {pagination.total} {t.totalFound}
                </Chip>
                <Chip
                  startContent={<CalendarIcon className="h-4 w-4" />}
                  variant="flat"
                  color="secondary"
                  className="bg-white/10 backdrop-blur-xl dark:bg-black/10"
                >
                  {t.pagePrefix} {pagination.page} {t.pageMiddle} {pagination.totalPages}
                  {t.pageSuffix ? ` ${t.pageSuffix}` : ""}
                </Chip>
              </div>

              <div className="blog-grid mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {(posts || []).map((post, index) => (
                  <div key={post.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <PostCard
                      post={post}
                      lang={lang}
                      onView={() => handleViewPost(post)}
                      onLike={() => handleLikePost(post)}
                    />
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="mx-auto w-full max-w-3xl animate-fade-in-up rounded-2xl border-[3px] border-foreground/15 bg-white/20 px-2 py-1 backdrop-blur-xl dark:border-white/15 dark:bg-black/20">
                  <BlogPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    lang={lang}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <BlogSidebar lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
