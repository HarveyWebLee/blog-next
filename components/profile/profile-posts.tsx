"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  FilePenLine,
  Filter,
  Heart,
  KeyRound,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  PROFILE_GLASS_CARD,
  PROFILE_GLASS_CARD_INTERACTIVE,
  PROFILE_NATIVE_CONTROL,
} from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import type { ApiResponse, PaginatedResponseData, PostData } from "@/types/blog";

interface ProfilePostsProps {
  lang: string;
}

const statusColors = {
  draft: "warning",
  published: "success",
  archived: "default",
} as const;

const visibilityColors = {
  public: "success",
  private: "warning",
  password: "danger",
} as const;

export default function ProfilePosts({ lang }: ProfilePostsProps) {
  const params = useParams();
  const routeLang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const t =
    lang === "en-US"
      ? {
          pageTitle: "My Posts",
          pageDesc: "Manage your posts",
          loadFailed: "Failed to load posts",
          write: "Write",
          search: "Search posts...",
          allStatus: "All Status",
          published: "Published",
          draft: "Draft",
          archived: "Archived",
          visibilityPublic: "Public",
          visibilityPrivate: "Private",
          visibilityPassword: "Password",
          edit: "Edit",
          del: "Delete",
          more: "More",
          noMatch: "No matching posts found",
          noPosts: "No posts yet",
          noMatchDesc: "Try adjusting search or filters",
          noPostsDesc: "Create your first post",
        }
      : lang === "ja-JP"
        ? {
            pageTitle: "自分の記事",
            pageDesc: "記事コンテンツを管理",
            loadFailed: "記事一覧の取得に失敗しました",
            write: "記事を書く",
            search: "記事を検索...",
            allStatus: "すべての状態",
            published: "公開済み",
            draft: "下書き",
            archived: "アーカイブ",
            visibilityPublic: "公開",
            visibilityPrivate: "非公開",
            visibilityPassword: "パスワード保護",
            edit: "編集",
            del: "削除",
            more: "その他",
            noMatch: "一致する記事がありません",
            noPosts: "まだ記事がありません",
            noMatchDesc: "検索条件を調整してください",
            noPostsDesc: "最初の記事を作成しましょう",
          }
        : {
            pageTitle: "我的文章",
            pageDesc: "管理您的文章内容",
            loadFailed: "获取文章列表失败",
            write: "写文章",
            search: "搜索文章...",
            allStatus: "全部状态",
            published: "已发布",
            draft: "草稿",
            archived: "已归档",
            visibilityPublic: "公开",
            visibilityPrivate: "私有",
            visibilityPassword: "密码保护",
            edit: "编辑",
            del: "删除",
            more: "更多",
            noMatch: "没有找到匹配的文章",
            noPosts: "还没有文章",
            noMatchDesc: "尝试调整搜索条件或筛选器",
            noPostsDesc: "开始创建您的第一篇文章吧",
          };
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  /** 输入框即时展示的关键词 */
  const [searchInput, setSearchInput] = useState("");
  /**
   * 防抖后的关键词：用于列表过滤，文章较多时减少每次按键的过滤计算。
   * 与收藏/点赞页一致，400ms。
   */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchPosts = async () => {
      if (authLoading) return;
      if (!isAuthenticated || !user?.id) {
        setPosts([]);
        setLoading(false);
        return;
      }
      try {
        const query = new URLSearchParams({
          page: "1",
          limit: "100",
          authorId: String(user.id),
          sortBy: "updatedAt",
          sortOrder: "desc",
        });
        const response = await fetch(`/api/posts?${query.toString()}`, {
          headers: {
            ...clientBearerHeaders(),
          },
        });
        const json = (await response.json()) as ApiResponse<PaginatedResponseData<PostData>>;
        if (!json.success || !json.data) {
          message.error(json.message || t.loadFailed);
          setPosts([]);
          return;
        }
        setPosts(json.data.data);
      } catch (error) {
        console.error("获取文章列表失败:", error);
        message.error(t.loadFailed);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, [authLoading, isAuthenticated, user?.id, t.loadFailed]);

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

  const filteredPosts = posts.filter((post) => {
    const q = debouncedSearch.trim().toLowerCase();
    const title = post.title?.toLowerCase();
    const excerpt = post.excerpt?.toLowerCase();
    const matchesSearch = q === "" || Boolean(title?.includes(q)) || Boolean(excerpt?.includes(q));
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getStatusDisplay = (status: PostData["status"]) => {
    switch (status) {
      case "published":
        return {
          label: t.published,
          icon: CheckCircle2,
          color: statusColors.published,
        };
      case "draft":
        return {
          label: t.draft,
          icon: FilePenLine,
          color: statusColors.draft,
        };
      default:
        return {
          label: t.archived,
          icon: Archive,
          color: statusColors.archived,
        };
    }
  };

  const getVisibilityDisplay = (visibility: PostData["visibility"]) => {
    switch (visibility) {
      case "private":
        return {
          label: t.visibilityPrivate,
          icon: EyeOff,
          color: visibilityColors.private,
        };
      case "password":
        return {
          label: t.visibilityPassword,
          icon: KeyRound,
          color: visibilityColors.password,
        };
      default:
        return {
          label: t.visibilityPublic,
          icon: Eye,
          color: visibilityColors.public,
        };
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.pageTitle}</h1>
          <p className="text-default-500">{t.pageDesc}</p>
        </div>
        <Button
          as={Link}
          href={`/${routeLang}/blog/manage/create`}
          color="primary"
          variant="flat"
          className="shrink-0 border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
          startContent={<Plus className="h-4 w-4" />}
        >
          {t.write}
        </Button>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${PROFILE_NATIVE_CONTROL} min-w-[10rem]`}
              >
                <option value="all">{t.allStatus}</option>
                <option value="published">{t.published}</option>
                <option value="draft">{t.draft}</option>
                <option value="archived">{t.archived}</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 文章列表 */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className={PROFILE_GLASS_CARD_INTERACTIVE}>
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
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-secondary/35">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* 统计区：移动到封面图下方 */}
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-default-200/70 bg-default-50/40 p-2 text-xs text-default-500 dark:border-default-100/10 dark:bg-black/10">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{post.viewCount}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{post.likeCount}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>0</span>
                    </div>
                  </div>
                </div>

                {/* 文章信息 */}
                <div className="min-w-0 flex-1">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-lg font-semibold text-foreground">{post.title}</h3>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const statusDisplay = getStatusDisplay(post.status);
                          const visibilityDisplay = getVisibilityDisplay(post.visibility);
                          const StatusIcon = statusDisplay.icon;
                          const VisibilityIcon = visibilityDisplay.icon;
                          return (
                            <>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={statusDisplay.color}
                                startContent={<StatusIcon className="h-3.5 w-3.5" />}
                              >
                                {statusDisplay.label}
                              </Chip>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={visibilityDisplay.color}
                                startContent={<VisibilityIcon className="h-3.5 w-3.5" />}
                              >
                                {visibilityDisplay.label}
                              </Chip>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {post.excerpt && (
                      <p className="line-clamp-2 text-default-600">{stripMarkdownForExcerpt(post.excerpt)}</p>
                    )}

                    <div className="relative md:top-1 flex flex-wrap items-center justify-between gap-2 pt-0">
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        {post.category && (
                          <Chip size="sm" variant="flat" color="primary">
                            {post.category.name}
                          </Chip>
                        )}
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
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          as={Link}
                          href={`/${routeLang}/blog/manage/edit/${post.id}`}
                          variant="flat"
                          size="sm"
                          startContent={<Edit className="h-4 w-4" />}
                          aria-label={t.edit}
                        >
                          {t.edit}
                        </Button>
                        <Button
                          variant="flat"
                          size="sm"
                          color="danger"
                          startContent={<Trash2 className="h-4 w-4" />}
                          aria-label={t.del}
                        >
                          {t.del}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredPosts.length === 0 && !loading && (
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-default-300" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              {searchInput || statusFilter !== "all" ? t.noMatch : t.noPosts}
            </h3>
            <p className="mb-6 text-default-500">
              {searchInput || statusFilter !== "all" ? t.noMatchDesc : t.noPostsDesc}
            </p>
            <Button
              as={Link}
              href={`/${routeLang}/blog/manage/create`}
              color="primary"
              variant="flat"
              className="border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
              startContent={<Plus className="h-4 w-4" />}
            >
              {t.write}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
