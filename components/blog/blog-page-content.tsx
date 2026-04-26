"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  BookOpenIcon,
  CalendarIcon,
  FilePlus2Icon,
  FilterIcon,
  Hash,
  Lock,
  RefreshCwIcon,
  SearchIcon,
  Sparkles,
  TrendingUpIcon,
} from "lucide-react";

import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { PostCard } from "@/components/blog/post-card";
import PostsAPI from "@/lib/api/posts";
import { useAuth } from "@/lib/contexts/auth-context";
import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { usePosts } from "@/lib/hooks/usePosts";
import { PostData } from "@/types/blog";

export type BlogPageContentProps = {
  /** 路由语言段，如 zh-CN */
  lang: string;
  /** 由服务端 page 从 searchParams.tagId 解析；与侧栏热门标签一致 */
  initialTagId?: number;
  /** 由服务端 page 从 searchParams.authorId 解析；用于“查看某位作者的文章” */
  initialAuthorId?: number;
  /** 由服务端 page 从 searchParams.postId 解析；用于通知兜底跳转到文章详情 */
  initialPostId?: number;
};

export function BlogPageContent({ lang, initialTagId, initialAuthorId, initialPostId }: BlogPageContentProps) {
  const router = useRouter();
  const blogBasePath = `/${lang}/blog`;

  const t =
    lang === "en-US"
      ? {
          loadFailed: "Load failed",
          filterTitle: "Filter Posts",
          filterDesc: "Search, filter by tag, and sort posts.",
          createDoc: "Create Post",
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
          viewAllPosts: "View all posts",
          passwordTitle: "Password Required",
          passwordHint: "This post is protected. Enter password to continue.",
          passwordPlaceholder: "Enter post password",
          passwordConfirm: "Unlock & Read",
          passwordCancel: "Cancel",
          passwordInvalid: "Wrong password",
        }
      : lang === "ja-JP"
        ? {
            loadFailed: "読み込み失敗",
            filterTitle: "記事を絞り込む",
            filterDesc: "検索・タグ絞り込み・並び順で記事を探せます。",
            createDoc: "記事を作成",
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
            viewAllPosts: "すべての記事へ",
            passwordTitle: "パスワードが必要です",
            passwordHint: "この記事はパスワード保護されています。入力後に閲覧できます。",
            passwordPlaceholder: "記事パスワードを入力",
            passwordConfirm: "解除して読む",
            passwordCancel: "キャンセル",
            passwordInvalid: "パスワードが正しくありません",
          }
        : {
            loadFailed: "加载失败",
            filterTitle: "筛选文章",
            filterDesc: "通过搜索、标签（侧栏入口）与排序找到您需要的文章。",
            createDoc: "新建文章",
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
            viewAllPosts: "查看全部文章",
            passwordTitle: "需要文章密码",
            passwordHint: "该文章已开启密码保护，请先输入密码再继续阅读。",
            passwordPlaceholder: "请输入文章密码",
            passwordConfirm: "解锁并阅读",
            passwordCancel: "取消",
            passwordInvalid: "密码错误，请重试",
          };

  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [favoritedPostIds, setFavoritedPostIds] = useState<Set<number>>(new Set());
  const [likeLoadingPostIds, setLikeLoadingPostIds] = useState<Set<number>>(new Set());
  const [favoriteLoadingPostIds, setFavoriteLoadingPostIds] = useState<Set<number>>(new Set());
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingPost, setPendingPost] = useState<PostData | null>(null);
  const [passwordVerifying, setPasswordVerifying] = useState(false);
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [resolvingPostId, setResolvingPostId] = useState(false);

  const {
    posts,
    loading,
    error,
    pagination,
    params,
    fetchPosts,
    searchPosts,
    filterByTag,
    sortPosts,
    goToPage,
    incrementViewCount,
    toggleLike,
    toggleFavorite,
  } = usePosts({
    initialParams: {
      status: "published",
      includePasswordProtected: true,
      limit: 6,
      ...(initialTagId != null && Number.isFinite(initialTagId) && initialTagId > 0
        ? { tagId: Math.floor(initialTagId) }
        : {}),
      ...(initialAuthorId != null && Number.isFinite(initialAuthorId) && initialAuthorId > 0
        ? { authorId: Math.floor(initialAuthorId) }
        : {}),
    },
  });

  /**
   * 从地址栏进入 / 客户端路由切换时，将 URL 上的 tagId 与列表请求对齐。
   */
  const skipFirstUrlSync = useRef(true);
  useEffect(() => {
    if (skipFirstUrlSync.current) {
      skipFirstUrlSync.current = false;
      return;
    }
    const ut = initialTagId ?? undefined;
    const dt = params.tagId;
    if (ut === dt) return;
    if (ut != null) {
      filterByTag(ut);
      return;
    }
    filterByTag(null);
  }, [initialTagId, params.tagId, filterByTag]);

  const activeTagId = params.tagId ?? undefined;
  const activeAuthorId = params.authorId ?? undefined;

  const tagHeading = useMemo(() => {
    if (activeTagId == null) return "";
    const name =
      lang === "en-US" ? `Tag #${activeTagId}` : lang === "ja-JP" ? `タグ #${activeTagId}` : `标签 #${activeTagId}`;
    if (lang === "en-US") return `Posts tagged “${name}”`;
    if (lang === "ja-JP") return `「${name}」の記事一覧`;
    return `含「${name}」标签的文章`;
  }, [activeTagId, lang]);

  const authorHeading = useMemo(() => {
    if (activeAuthorId == null) return "";
    if (lang === "en-US") return `Posts by author #${activeAuthorId}`;
    if (lang === "ja-JP") return `投稿者 #${activeAuthorId} の記事一覧`;
    return `作者 #${activeAuthorId} 的文章`;
  }, [activeAuthorId, lang]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    searchPosts(value);
  };

  const handleClearTagFilter = () => {
    filterByTag(null);
    // 清除标签筛选时保留作者筛选；若无作者筛选则回到纯博客首页。
    if (activeAuthorId != null) {
      router.replace(`${blogBasePath}?authorId=${activeAuthorId}`, { scroll: false });
      return;
    }
    router.replace(blogBasePath, { scroll: false });
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
    const isPasswordPost = post.visibility === "password";
    const isAuthor = user?.id === post.authorId;
    // 密码保护文章：作者本人可免密直达，其他访问者需先输入密码。
    if (isPasswordPost && !isAuthor) {
      setPendingPost(post);
      setPasswordInput("");
      setPasswordError("");
      setPasswordModalOpen(true);
      return;
    }
    try {
      await incrementViewCount(post.id);
      router.push(`/${lang}/blog/${post.slug}`);
    } catch (e) {
      console.error("Failed to increment view count:", e);
    }
  };

  const handlePasswordUnlock = async () => {
    if (!pendingPost) return;
    if (!passwordInput.trim()) {
      setPasswordError(t.passwordInvalid);
      return;
    }
    try {
      setPasswordVerifying(true);
      setPasswordError("");
      const payload = await sealPasswordInRequestBody({ password: passwordInput }, passwordInput, "password");
      const response = await fetch(`/api/posts/slug/${pendingPost.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        setPasswordError(result.message || t.passwordInvalid);
        return;
      }
      const unlockToken = (result?.data as { unlockToken?: string } | undefined)?.unlockToken;
      setPasswordModalOpen(false);
      await incrementViewCount(pendingPost.id);
      router.push(
        unlockToken
          ? `/${lang}/blog/${pendingPost.slug}?unlock=${encodeURIComponent(unlockToken)}`
          : `/${lang}/blog/${pendingPost.slug}`
      );
    } catch (e) {
      console.error("密码校验失败:", e);
      setPasswordError(t.passwordInvalid);
    } finally {
      setPasswordVerifying(false);
    }
  };

  const handleLikePost = async (post: PostData) => {
    if (!isAuthenticated) {
      router.push(`/${lang}/auth/login`);
      return;
    }
    setLikeLoadingPostIds((prev) => new Set(prev).add(post.id));
    try {
      const result = await toggleLike(post.id);
      if (!result) return;
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
    } finally {
      setLikeLoadingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const handleFavoritePost = async (post: PostData) => {
    if (!isAuthenticated) {
      router.push(`/${lang}/auth/login`);
      return;
    }
    setFavoriteLoadingPostIds((prev) => new Set(prev).add(post.id));
    try {
      const result = await toggleFavorite(post.id);
      if (!result) return;
      setFavoritedPostIds((prev) => {
        const next = new Set(prev);
        if (result.favorited) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
    } finally {
      setFavoriteLoadingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!posts.length) {
        setLikedPostIds(new Set());
        setFavoritedPostIds(new Set());
        return;
      }
      try {
        const states = await PostsAPI.getEngagementStates(posts.map((p) => p.id));
        if (cancelled) return;
        setLikedPostIds(new Set(states.filter((x) => x.liked).map((x) => x.postId)));
        setFavoritedPostIds(new Set(states.filter((x) => x.favorited).map((x) => x.postId)));
      } catch (e) {
        console.error("加载互动状态失败:", e);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [posts, isAuthenticated]);

  /**
   * 通知兜底跳转：当 URL 仅带 postId 时，先解析对应 slug，再跳转详情页。
   * 这样通知在缺少 postSlug 的情况下仍可落到具体文章，而不是停在列表页。
   */
  useEffect(() => {
    if (initialPostId == null || !Number.isFinite(initialPostId) || initialPostId <= 0) return;
    let cancelled = false;
    const run = async () => {
      try {
        setResolvingPostId(true);
        const res = await fetch(`/api/posts/${initialPostId}`);
        const json = await res.json();
        if (cancelled) return;
        const slug = json?.data?.posts?.slug || json?.data?.slug;
        if (typeof slug === "string" && slug.trim() !== "") {
          router.replace(`/${lang}/blog/${slug}`);
        }
      } catch (e) {
        console.error("postId 跳转解析失败:", e);
      } finally {
        if (!cancelled) setResolvingPostId(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialPostId, lang, router]);

  if (error) {
    return (
      <div className="min-h-screen">
        <Card className="mx-auto max-w-md border-0 bg-white/[0.025] backdrop-blur-md animate-fade-in-up dark:bg-black/[0.025]">
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
              className="min-w-0 border border-primary/20 bg-primary/[0.04] px-3 text-primary backdrop-blur-md hover:bg-primary/12 dark:bg-black/[0.03] dark:hover:bg-black/[0.08]"
            >
              {t.reload}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {(activeTagId != null && Number.isFinite(activeTagId) && activeTagId > 0) ||
          (activeAuthorId != null && Number.isFinite(activeAuthorId) && activeAuthorId > 0) ? (
            <Card className="mb-6 border-0 bg-white/[0.025] backdrop-blur-md animate-fade-in-up dark:bg-black/[0.025]">
              <CardBody className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-accent/20 text-secondary">
                    <Hash className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {activeTagId != null && Number.isFinite(activeTagId) && activeTagId > 0
                        ? tagHeading
                        : authorHeading}
                    </p>
                  </div>
                </div>
                <Button
                  variant="flat"
                  color="secondary"
                  className="shrink-0 font-medium"
                  onPress={handleClearTagFilter}
                >
                  {t.viewAllPosts}
                </Button>
              </CardBody>
            </Card>
          ) : null}

          <Card className="mb-8 border-0 bg-white/[0.025] backdrop-blur-md animate-fade-in-up dark:bg-black/[0.025]">
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
                    className="min-w-0 border border-primary/20 bg-primary/[0.04] px-3 text-primary backdrop-blur-md hover:bg-primary/12"
                  >
                    {t.createDoc}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      input: "bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]",
                      inputWrapper:
                        "border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-primary/50 focus-within:border-primary dark:border-white/10 dark:bg-black/[0.03]",
                    }}
                  />
                  {searchValue ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    </div>
                  ) : null}
                </div>

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
                      "border-white/15 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.055] dark:border-white/10 dark:bg-black/[0.03] dark:hover:bg-black/[0.055]",
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

          {loading || resolvingPostId ? (
            <Card className="border-0 bg-white/[0.025] backdrop-blur-md animate-fade-in-up dark:bg-black/[0.025]">
              <CardBody className="py-12 text-center">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-default-500">{t.loading}</p>
              </CardBody>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="border-0 bg-white/[0.025] backdrop-blur-md animate-fade-in-up dark:bg-black/[0.025]">
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
                  className="bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]"
                >
                  {pagination.total} {t.totalFound}
                </Chip>
                <Chip
                  startContent={<CalendarIcon className="h-4 w-4" />}
                  variant="flat"
                  color="secondary"
                  className="bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]"
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
                      isLiked={likedPostIds.has(post.id)}
                      isFavorited={favoritedPostIds.has(post.id)}
                      likeLoading={likeLoadingPostIds.has(post.id)}
                      favoriteLoading={favoriteLoadingPostIds.has(post.id)}
                      onToggleLike={() => handleLikePost(post)}
                      onToggleFavorite={() => handleFavoritePost(post)}
                    />
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="mx-auto w-full max-w-3xl animate-fade-in-up rounded-2xl border-[3px] border-foreground/15 bg-white/[0.055] px-2 py-1 backdrop-blur-md dark:border-white/15 dark:bg-black/[0.055]">
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

      <Modal isOpen={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-warning" />
            {t.passwordTitle}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t.passwordHint}</p>
            <Input
              type="password"
              value={passwordInput}
              onValueChange={setPasswordInput}
              placeholder={t.passwordPlaceholder}
              autoFocus
              variant="bordered"
              isInvalid={Boolean(passwordError)}
              errorMessage={passwordError || undefined}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPasswordModalOpen(false)}>
              {t.passwordCancel}
            </Button>
            <Button color="primary" isLoading={passwordVerifying} onPress={handlePasswordUnlock}>
              {t.passwordConfirm}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
