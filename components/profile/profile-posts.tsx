"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Button, Card, CardBody, Chip } from "@heroui/react";
import { BookOpen, Edit, Eye, Filter, Heart, MessageSquare, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="flex items-start gap-4">
                {/* 文章封面 */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-default-100">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      width={96}
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

                {/* 文章信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground">{post.title}</h3>
                      {post.excerpt && (
                        <p className="mb-3 line-clamp-2 text-default-600">{stripMarkdownForExcerpt(post.excerpt)}</p>
                      )}

                      {/* 文章元信息 */}
                      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-default-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <span>{post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</span>
                      </div>

                      {/* 分类和标签 */}
                      <div className="flex items-center space-x-2 mb-3">
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

                      {/* 状态标签 */}
                      <div className="flex items-center space-x-2">
                        <Badge color={statusColors[post.status]} variant="flat">
                          {post.status === "published" ? t.published : post.status === "draft" ? t.draft : t.archived}
                        </Badge>
                        <Badge color={visibilityColors[post.visibility]} variant="flat">
                          {post.visibility}
                        </Badge>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="ml-0 flex shrink-0 items-center gap-1 sm:ml-4">
                      <Button isIconOnly variant="light" size="sm" aria-label={t.edit}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button isIconOnly variant="light" size="sm" color="danger" aria-label={t.del}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button isIconOnly variant="light" size="sm" aria-label={t.more}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
              {searchTerm || statusFilter !== "all" ? t.noMatch : t.noPosts}
            </h3>
            <p className="mb-6 text-default-500">
              {searchTerm || statusFilter !== "all" ? t.noMatchDesc : t.noPostsDesc}
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
