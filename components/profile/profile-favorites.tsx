"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { BookOpen, Eye, Filter, Lock, MessageSquare, Search, Star } from "lucide-react";

import {
  PROFILE_GLASS_CARD,
  PROFILE_GLASS_CARD_INTERACTIVE,
  PROFILE_NATIVE_CONTROL,
} from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import type { ApiResponse, PaginatedResponseData, UserFavorite } from "@/types/blog";

interface ProfileFavoritesProps {
  lang: string;
}

export default function ProfileFavorites({ lang }: ProfileFavoritesProps) {
  const params = useParams();
  const router = useRouter();
  const routeLang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const { user } = useAuth();

  const t =
    lang === "en-US"
      ? {
          title: "My Favorites",
          subtitle: "Posts you have favorited",
          loadFailed: "Failed to load favorites",
          removeFailed: "Failed to unfavorite",
          total: "posts",
          search: "Search favorite posts...",
          allCategories: "All Categories",
          readPost: "Read",
          remove: "Unfavorite",
          favoritedAt: "Favorited at",
          emptyMatch: "No matching favorites",
          empty: "No favorites yet",
          emptyMatchDesc: "Try adjusting filters",
          emptyDesc: "Start saving posts you like",
          browse: "Browse Posts",
          passwordTitle: "Password Required",
          passwordHint: "This post is protected. Enter password to continue.",
          passwordPlaceholder: "Enter post password",
          passwordConfirm: "Unlock & Read",
          passwordCancel: "Cancel",
          passwordInvalid: "Wrong password",
          passwordTag: "Password",
        }
      : lang === "ja-JP"
        ? {
            title: "お気に入り",
            subtitle: "お気に入りの記事一覧",
            loadFailed: "お気に入りの取得に失敗しました",
            removeFailed: "お気に入り解除に失敗しました",
            total: "件",
            search: "お気に入り記事を検索...",
            allCategories: "すべてのカテゴリー",
            readPost: "記事を読む",
            remove: "お気に入り解除",
            favoritedAt: "お気に入り登録",
            emptyMatch: "一致するお気に入りがありません",
            empty: "お気に入りがありません",
            emptyMatchDesc: "条件を調整してください",
            emptyDesc: "気に入った記事を保存しましょう",
            browse: "記事を見る",
            passwordTitle: "パスワードが必要です",
            passwordHint: "この記事はパスワード保護されています。入力後に閲覧できます。",
            passwordPlaceholder: "記事パスワードを入力",
            passwordConfirm: "解除して読む",
            passwordCancel: "キャンセル",
            passwordInvalid: "パスワードが正しくありません",
            passwordTag: "パスワード保護",
          }
        : {
            title: "我的收藏",
            subtitle: "您收藏的文章列表",
            loadFailed: "获取收藏列表失败",
            removeFailed: "取消收藏失败",
            total: "篇文章",
            search: "搜索收藏的文章...",
            allCategories: "全部分类",
            readPost: "阅读文章",
            remove: "取消收藏",
            favoritedAt: "收藏于",
            emptyMatch: "没有找到匹配的收藏",
            empty: "还没有收藏任何文章",
            emptyMatchDesc: "尝试调整搜索条件或筛选器",
            emptyDesc: "开始收藏您喜欢的文章吧",
            browse: "浏览文章",
            passwordTitle: "需要文章密码",
            passwordHint: "该文章已开启密码保护，请先输入密码后再阅读。",
            passwordPlaceholder: "请输入文章密码",
            passwordConfirm: "解锁并阅读",
            passwordCancel: "取消",
            passwordInvalid: "密码错误，请重试",
            passwordTag: "密码保护",
          };
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  /** 输入框即时展示的关键词 */
  const [searchInput, setSearchInput] = useState("");
  /**
   * 防抖后的关键词：用于列表过滤，避免收藏较多时每次按键都做全表字符串匹配。
   * 延迟与标签/管理页搜索请求一致（400ms），交互节奏统一。
   */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [pendingPostSlug, setPendingPostSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/profile/favorites?page=1&limit=100", {
          headers: {
            ...clientBearerHeaders(),
          },
        });
        const json = (await response.json()) as ApiResponse<PaginatedResponseData<UserFavorite>>;
        if (!json.success || !json.data) {
          message.error(json.message || t.loadFailed);
          setFavorites([]);
          return;
        }
        const list = json.data.data
          .filter((item) => item.post)
          .map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            post: item.post
              ? {
                  ...item.post,
                  publishedAt: item.post.publishedAt ? new Date(item.post.publishedAt) : undefined,
                  createdAt: new Date(item.post.createdAt),
                  updatedAt: new Date(item.post.updatedAt),
                }
              : undefined,
          })) as UserFavorite[];
        setFavorites(list);
      } catch (error) {
        console.error("获取收藏列表失败:", error);
        message.error(t.loadFailed);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchFavorites();
  }, [t.loadFailed]);

  // 搜索防抖：输入立即更新 searchInput，过滤使用 debouncedSearch
  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    searchDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [searchInput]);

  const filteredFavorites = favorites.filter((favorite) => {
    const q = debouncedSearch.trim().toLowerCase();
    const title = favorite.post?.title?.toLowerCase();
    const excerpt = favorite.post?.excerpt?.toLowerCase();
    const matchesSearch = q === "" || Boolean(title?.includes(q)) || Boolean(excerpt?.includes(q));
    const matchesCategory = categoryFilter === "all" || favorite.post?.category?.slug === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = Array.from(
    new Set(favorites.map((favorite) => favorite.post?.category?.slug).filter((slug): slug is string => Boolean(slug)))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      const favorite = favorites.find((item) => item.id === favoriteId);
      if (!favorite) return;
      const response = await fetch(`/api/profile/favorites?postId=${favorite.postId}`, {
        method: "DELETE",
        headers: {
          ...clientBearerHeaders(),
        },
      });
      const json = (await response.json()) as ApiResponse;
      if (!json.success) {
        message.error(json.message || t.removeFailed);
        return;
      }
      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
    } catch (error) {
      console.error("取消收藏失败:", error);
      message.error(t.removeFailed);
    }
  };

  const handleReadPost = async (post: NonNullable<UserFavorite["post"]>) => {
    const isPasswordPost = post.visibility === "password";
    const isAuthor = Boolean(user?.id && post.authorId && user.id === post.authorId);
    if (!isPasswordPost || isAuthor) {
      router.push(`/${routeLang}/blog/${post.slug}`);
      return;
    }
    setPendingPostSlug(post.slug);
    setPasswordInput("");
    setPasswordError("");
    setPasswordModalOpen(true);
  };

  const handlePasswordUnlock = async () => {
    if (!pendingPostSlug) return;
    if (!passwordInput.trim()) {
      setPasswordError(t.passwordInvalid);
      return;
    }
    try {
      setPasswordSubmitting(true);
      setPasswordError("");
      const payload = await sealPasswordInRequestBody({ password: passwordInput }, passwordInput, "password");
      const response = await fetch(`/api/posts/slug/${pendingPostSlug}`, {
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
      router.push(
        unlockToken
          ? `/${routeLang}/blog/${pendingPostSlug}?unlock=${encodeURIComponent(unlockToken)}`
          : `/${routeLang}/blog/${pendingPostSlug}`
      );
    } catch (error) {
      console.error("密码校验失败:", error);
      setPasswordError(t.passwordInvalid);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded-lg bg-default-200" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4 dark:border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-lg bg-default-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded-lg bg-default-200" />
                      <div className="h-3 w-1/2 rounded-lg bg-default-200" />
                      <div className="h-3 w-1/4 rounded-lg bg-default-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-default-500">{t.subtitle}</p>
        </div>
        <div className="text-sm text-default-500">
          {favorites.length} {t.total}
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${PROFILE_NATIVE_CONTROL} w-full pl-10`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 shrink-0 text-default-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`${PROFILE_NATIVE_CONTROL} min-w-[10rem]`}
              >
                <option value="all">{t.allCategories}</option>
                {categoryOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 收藏列表 */}
      <div className="space-y-4">
        {filteredFavorites.map((favorite) => {
          const post = favorite.post;
          if (!post) return null;
          return (
            <Card key={favorite.id} className={PROFILE_GLASS_CARD_INTERACTIVE}>
              <CardBody className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="w-full shrink-0 space-y-2 md:w-36">
                    {/* 文章封面 */}
                    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-default-100">
                      {post.featuredImage ? (
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={144}
                          height={96}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/40 to-primary/35">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* 统计区：移动到封面图下方 */}
                    <div className="grid grid-cols-3 gap-1 rounded-lg border border-default-200/70 bg-default-50/40 p-2 text-xs text-default-500 dark:border-default-100/10 dark:bg-black/10">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{post.viewCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        <span>{post.likeCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.commentCount ?? post.comments?.length ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* 文章信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 line-clamp-2 text-lg font-semibold text-foreground">
                          {post.title}
                        </h3>
                        {post.visibility === "password" && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="warning"
                            startContent={<Lock className="h-3.5 w-3.5" />}
                            className="shrink-0"
                          >
                            {t.passwordTag}
                          </Chip>
                        )}
                        <div className="flex max-w-[45%] shrink-0 items-center gap-2">
                          <Avatar
                            src={post.author?.avatar}
                            name={post.author?.displayName || post.author?.username || "?"}
                            size="sm"
                          />
                          <span className="truncate text-sm text-default-600">
                            {post.author?.displayName || post.author?.username || "-"}
                          </span>
                        </div>
                      </div>
                      {post.excerpt && (
                        <p className="line-clamp-2 text-default-600">{stripMarkdownForExcerpt(post.excerpt)}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag.id}
                            size="sm"
                            variant="flat"
                            style={{ backgroundColor: tag.color + "20", color: tag.color }}
                          >
                            {tag.name}
                          </Chip>
                        ))}
                        {post.tags && post.tags.length > 3 && (
                          <Chip size="sm" variant="flat">
                            +{post.tags.length - 3}
                          </Chip>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 md:-mt-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {post.category && (
                            <Chip size="sm" variant="flat" color="primary">
                              {post.category.name}
                            </Chip>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="flat"
                            size="sm"
                            color="primary"
                            className="border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
                            onPress={() => void handleReadPost(post)}
                          >
                            {t.readPost}
                          </Button>
                          <Button
                            isIconOnly
                            variant="flat"
                            size="sm"
                            color="danger"
                            aria-label={t.remove}
                            onPress={() => handleRemoveFavorite(favorite.id)}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </Button>
                          <span className="text-xs text-default-500">{formatDate(favorite.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredFavorites.length === 0 && !loading && (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="p-12 text-center">
            <Star className="mx-auto mb-4 h-16 w-16 text-default-300" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              {searchInput || categoryFilter !== "all" ? t.emptyMatch : t.empty}
            </h3>
            <p className="mb-6 text-default-500">
              {searchInput || categoryFilter !== "all" ? t.emptyMatchDesc : t.emptyDesc}
            </p>
            <Button
              as={Link}
              href={`/${routeLang}/blog`}
              color="primary"
              variant="flat"
              className="border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
            >
              {t.browse}
            </Button>
          </CardBody>
        </Card>
      )}

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
              isInvalid={Boolean(passwordError)}
              errorMessage={passwordError || undefined}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPasswordModalOpen(false)}>
              {t.passwordCancel}
            </Button>
            <Button color="primary" isLoading={passwordSubmitting} onPress={handlePasswordUnlock}>
              {t.passwordConfirm}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
