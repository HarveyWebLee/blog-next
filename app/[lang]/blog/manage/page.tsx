"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  Bookmark,
  Calendar,
  Edit,
  Eye,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  SortAsc,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { BlogNavigation } from "@/components/blog/blog-navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { message } from "@/lib/utils";
import { isInMemorySuperRootClientUser } from "@/lib/utils/authz-client";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import { PostData, PostStatus, PostVisibility, User } from "@/types/blog";

/** 普通用户仅作者本人可编辑/删除；超级管理员可管理全部文章 */
function isPostOwner(post: PostData, userId: number | undefined): boolean {
  return userId != null && post.authorId === userId;
}

/** 作者展示名优先级：displayName > username > 用户#ID */
function resolveAuthorName(post: PostData, unknownText: string, currentUser?: User | null): string {
  const displayName = post.author?.displayName?.trim();
  if (displayName) return displayName;
  const username = post.author?.username?.trim();
  if (username) return username;
  // 兜底：当作者就是当前登录用户但关联用户信息缺失时，优先用登录态昵称
  if (currentUser?.id != null && post.authorId === currentUser.id) {
    const currentDisplayName = currentUser.displayName?.trim();
    if (currentDisplayName) return currentDisplayName;
    const currentUsername = currentUser.username?.trim();
    if (currentUsername) return currentUsername;
  }
  return `${unknownText} #${post.authorId}`;
}

/** 作者头像：无自定义头像时使用统一默认头像 */
function resolveAuthorAvatar(post: PostData, currentUser?: User | null): string {
  if (post.author?.avatar) return post.author.avatar;
  // 兜底：作者是当前登录用户时，尝试使用登录态头像
  if (currentUser?.id != null && post.authorId === currentUser.id && currentUser.avatar) {
    return currentUser.avatar;
  }
  return post.author?.avatar || "/images/avatar.jpeg";
}

export default function BlogManagePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const dict = useClientDictionary(lang);
  const t = pickText((dict as { blog?: { manage?: Record<string, string> } })?.blog?.manage);

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isSuperAdmin = isInMemorySuperRootClientUser(user);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<PostVisibility | "all">("all");
  // 已应用的查询条件：仅在点击“应用过滤”后更新，避免每次输入/选择都触发请求
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<PostStatus | "all">("all");
  const [appliedVisibilityFilter, setAppliedVisibilityFilter] = useState<PostVisibility | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "title" | "viewCount">("createdAt");
  const [appliedSortBy, setAppliedSortBy] = useState<"createdAt" | "updatedAt" | "title" | "viewCount">("createdAt");
  const [applyVersion, setApplyVersion] = useState(0);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  const fetchPosts = useCallback(async () => {
    if (user?.id == null) return;
    // 读取 applyVersion：用户重复点击「应用/重置」且已应用条件与当前一致时，React 可能跳过 applied* 更新，仍需重新请求列表
    void applyVersion;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortOrder: "desc",
        search: appliedSearchTerm,
        includePasswordProtected: "true",
        includePrivate: "true",
        ...(appliedStatusFilter !== "all" && { status: appliedStatusFilter }),
        ...(appliedVisibilityFilter !== "all" && { visibility: appliedVisibilityFilter }),
        sortBy: appliedSortBy,
      });
      // 管理页统一只展示当前登录用户自己的文章（即使是超级管理员也不展示他人文章）。
      params.set("authorId", String(user.id));

      const response = await fetch(`/api/posts?${params}`, {
        headers: {
          ...clientBearerHeaders(),
        },
      });
      const result = await response.json();

      if (result.success) {
        const nextPosts = result.data.data as PostData[];
        setPosts(nextPosts);
        setTotalPages(result.data.pagination.totalPages);
        // 列表数据刷新后，仅保留当前页仍然可见且可管理的勾选项，避免“跨页幽灵选择”
        const manageableIds = new Set(
          nextPosts.filter((post) => isSuperAdmin || isPostOwner(post, user?.id)).map((post) => post.id)
        );
        setSelectedPostIds((prev) => prev.filter((id) => manageableIds.has(id)));
      } else if (response.status === 401 || response.status === 403) {
        message.error(result.message || "无权加载该列表，请重新登录");
      }
    } catch (error) {
      console.error("获取博客列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    appliedSearchTerm,
    appliedStatusFilter,
    appliedVisibilityFilter,
    appliedSortBy,
    applyVersion,
    user?.id,
    isSuperAdmin,
  ]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(`/${lang}/auth/login`);
      return;
    }
    void fetchPosts();
  }, [fetchPosts, isAuthLoading, isAuthenticated, user, router, lang]);

  // 删除博客：普通用户仅可删除本人文章；超级管理员可删除任意文章
  const handleDelete = async (postId: number) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          ...clientBearerHeaders(),
        },
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        fetchPosts();
      } else {
        message.error((result as { message?: string }).message || t.deleteForbidden);
      }
    } catch (error) {
      console.error("删除博客失败:", error);
      message.error(t.deleteForbidden);
    }
  };

  // 切换单个博客的选中状态，仅允许对当前用户可管理的博客进行勾选
  const togglePostSelected = (post: PostData) => {
    const canManage = isSuperAdmin || isPostOwner(post, user?.id);
    if (!canManage) return;
    setSelectedPostIds((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
  };

  // 选中当前页可管理的全部博客
  const selectAllCurrentPage = () => {
    const ids = posts.filter((post) => isSuperAdmin || isPostOwner(post, user?.id)).map((post) => post.id);
    setSelectedPostIds(ids);
  };

  // 清空勾选
  const clearSelectedPosts = () => {
    setSelectedPostIds([]);
  };

  // 批量删除：逐个调用既有删除接口，复用后端权限控制
  const handleBatchDelete = async () => {
    if (selectedPostIds.length === 0) return;
    if (!confirm(t.batchDeleteConfirm)) return;
    try {
      setLoading(true);
      const results = await Promise.all(
        selectedPostIds.map(async (postId) => {
          const response = await fetch(`/api/posts/${postId}`, {
            method: "DELETE",
            headers: {
              ...clientBearerHeaders(),
            },
          });
          return response.ok;
        })
      );
      const failedCount = results.filter((ok) => !ok).length;
      if (failedCount > 0) {
        message.error(t.batchDeletePartialFailed);
      }
      setSelectedPostIds([]);
      await fetchPosts();
    } catch (error) {
      console.error("批量删除博客失败:", error);
      message.error(t.batchDeletePartialFailed);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  // 获取可见性标签颜色
  const getVisibilityColor = (visibility: PostVisibility) => {
    switch (visibility) {
      case "public":
        return "primary";
      case "private":
        return "secondary";
      case "password":
        return "warning";
      default:
        return "default";
    }
  };

  // 获取状态文本
  const getStatusText = (status: PostStatus) => {
    switch (status) {
      case "published":
        return t.statusPublished;
      case "draft":
        return t.statusDraft;
      case "archived":
        return t.statusArchived;
      default:
        return t.unknown;
    }
  };

  // 获取可见性文本
  const getVisibilityText = (visibility: PostVisibility) => {
    switch (visibility) {
      case "public":
        return t.visibilityPublic;
      case "private":
        return t.visibilityPrivate;
      case "password":
        return t.visibilityPassword;
      default:
        return t.unknown;
    }
  };

  if (isAuthLoading) {
    return (
      <>
        <BlogNavigation />
        <div className="flex justify-center py-24">
          <Spinner size="lg" color="primary" />
        </div>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* 导航 */}
      <BlogNavigation />

      {/* 页面标题和操作区域 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isSuperAdmin ? (
            <Button as="a" href={`/${lang}/blog/manage/comments`} variant="flat" size="lg" className="font-semibold">
              {t.commentReview}
            </Button>
          ) : null}
          <Button
            as="a"
            href={`/${lang}/blog/manage/create`}
            color="primary"
            size="lg"
            startContent={<Plus className="w-5 h-5" />}
            className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t.create}
          </Button>
        </div>
      </div>

      {/* 搜索和过滤区域 */}
      <Card className="mb-8 shadow-sm border border-default-200/65 bg-default-50/50 dark:border-default-100/20 dark:bg-default-100/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Filter className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{t.searchFilter}</h3>
              <p className="text-default-500">{t.searchFilterDesc}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder={t.search}
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              variant="bordered"
              size="lg"
              className="w-full"
            />
            <Select
              label={t.statusPlaceholder}
              aria-label={t.statusPlaceholder || "status filter"}
              labelPlacement="outside"
              placeholder={t.statusPlaceholder}
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey as PostStatus | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all" textValue={t.statusAll ?? "all"}>
                {t.statusAll}
              </SelectItem>
              <SelectItem key="draft" textValue={t.statusDraft ?? "draft"}>
                {t.statusDraft}
              </SelectItem>
              <SelectItem key="published" textValue={t.statusPublished ?? "published"}>
                {t.statusPublished}
              </SelectItem>
              <SelectItem key="archived" textValue={t.statusArchived ?? "archived"}>
                {t.statusArchived}
              </SelectItem>
            </Select>
            <Select
              label={t.visibilityPlaceholder}
              aria-label={t.visibilityPlaceholder || "visibility filter"}
              labelPlacement="outside"
              placeholder={t.visibilityPlaceholder}
              selectedKeys={[visibilityFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setVisibilityFilter(selectedKey as PostVisibility | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all" textValue={t.visibilityAll ?? "all"}>
                {t.visibilityAll}
              </SelectItem>
              <SelectItem key="public" textValue={t.visibilityPublic ?? "public"}>
                {t.visibilityPublic}
              </SelectItem>
              <SelectItem key="private" textValue={t.visibilityPrivate ?? "private"}>
                {t.visibilityPrivate}
              </SelectItem>
              <SelectItem key="password" textValue={t.visibilityPassword ?? "password"}>
                {t.visibilityPassword}
              </SelectItem>
            </Select>
            <Select
              label={t.sortPlaceholder}
              aria-label={t.sortPlaceholder || "sort"}
              labelPlacement="outside"
              placeholder={t.sortPlaceholder}
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSortBy(selectedKey as typeof sortBy);
              }}
              variant="bordered"
              size="lg"
              startContent={<SortAsc className="w-4 h-4" />}
            >
              <SelectItem key="createdAt" textValue={t.sortCreatedAt ?? "createdAt"}>
                {t.sortCreatedAt}
              </SelectItem>
              <SelectItem key="updatedAt" textValue={t.sortUpdatedAt ?? "updatedAt"}>
                {t.sortUpdatedAt}
              </SelectItem>
              <SelectItem key="title" textValue={t.sortTitle ?? "title"}>
                {t.sortTitle}
              </SelectItem>
              <SelectItem key="viewCount" textValue={t.sortViewCount ?? "viewCount"}>
                {t.sortViewCount}
              </SelectItem>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              variant="flat"
              onPress={() => {
                // 仅在点击“应用过滤”时，把表单值提交为查询条件并触发请求
                setAppliedSearchTerm(searchTerm);
                setAppliedStatusFilter(statusFilter);
                setAppliedVisibilityFilter(visibilityFilter);
                setAppliedSortBy(sortBy);
                setCurrentPage(1);
                setApplyVersion((v) => v + 1);
              }}
              size="lg"
            >
              {t.apply}
            </Button>
            <Button
              variant="bordered"
              onPress={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVisibilityFilter("all");
                setSortBy("createdAt");
                // 重置时同步更新“已应用条件”，并立即按默认条件重新查询
                setAppliedSearchTerm("");
                setAppliedStatusFilter("all");
                setAppliedVisibilityFilter("all");
                setAppliedSortBy("createdAt");
                setCurrentPage(1);
                setApplyVersion((v) => v + 1);
              }}
              size="lg"
            >
              {t.reset}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 视图控制区域 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">{t.list}</h3>
          {!loading && posts.length > 0 && (
            <Chip color="primary" variant="flat" size="lg">
              {posts.length} {t.total}
            </Chip>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="bordered"
            onPress={selectAllCurrentPage}
            isDisabled={loading || posts.length === 0}
          >
            {t.selectAll}
          </Button>
          <Button size="sm" variant="light" onPress={clearSelectedPosts} isDisabled={selectedPostIds.length === 0}>
            {t.clearSelected}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={() => void handleBatchDelete()}
            isDisabled={selectedPostIds.length === 0 || loading}
          >
            {t.batchDelete}
          </Button>
          {selectedPostIds.length > 0 ? (
            <Chip size="sm" variant="flat" color="warning">
              {lang === "zh-CN"
                ? `${t.selectedCount} ${selectedPostIds.length} 项`
                : `${selectedPostIds.length} ${t.selectedCount}`}
            </Chip>
          ) : null}
          <span className="text-sm text-default-500">{t.viewMode}</span>
          <div className="flex bg-default-100 rounded-lg p-1">
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "list" ? "solid" : "light"}
              color={viewMode === "list" ? "primary" : "default"}
              onPress={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "grid" ? "solid" : "light"}
              color={viewMode === "grid" ? "primary" : "default"}
              onPress={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 博客列表 */}
      <Card className="shadow-lg border-0">
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-default-500 text-lg">{t.loading}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-default-100 flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-default-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.empty}</h3>
              <p className="text-default-500 mb-6">{t.emptyDesc}</p>
              <Button
                as="a"
                href={`/${lang}/blog/manage/create`}
                color="primary"
                size="lg"
                startContent={<Plus className="w-5 h-5" />}
              >
                {t.createFirst}
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
              {posts.map((post) => {
                const canManage = isSuperAdmin || isPostOwner(post, user?.id);
                const viewHref = `/${lang}/blog/${post.slug}`;
                const authorName = resolveAuthorName(post, t.unknown, user);
                const authorAvatar = resolveAuthorAvatar(post, user);
                return (
                  <Card
                    key={post.id}
                    className={`border-1 hover:border-primary transition-all duration-300 hover:shadow-lg ${
                      viewMode === "grid" ? "h-full" : ""
                    }`}
                  >
                    <CardBody className={viewMode === "grid" ? "p-6 flex flex-col h-full" : "p-4"}>
                      {viewMode === "grid" ? (
                        // 网格视图
                        <>
                          <div className="mb-3">
                            <label className="inline-flex items-center gap-2 text-xs text-default-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPostIds.includes(post.id)}
                                onChange={() => togglePostSelected(post)}
                                disabled={!canManage}
                              />
                              {canManage ? "选择" : "无权限"}
                            </label>
                          </div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Chip size="sm" color={getStatusColor(post.status)} variant="flat">
                                  {getStatusText(post.status)}
                                </Chip>
                                <Chip size="sm" color={getVisibilityColor(post.visibility)} variant="flat">
                                  {getVisibilityText(post.visibility)}
                                </Chip>
                              </div>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" color="default">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="view"
                                  startContent={<Eye className="w-4 h-4" />}
                                  as="a"
                                  href={viewHref}
                                >
                                  {t.view}
                                </DropdownItem>
                                {canManage ? (
                                  <DropdownItem
                                    key="edit"
                                    startContent={<Edit className="w-4 h-4" />}
                                    as="a"
                                    href={`/${lang}/blog/manage/edit/${post.id}`}
                                  >
                                    {t.edit}
                                  </DropdownItem>
                                ) : null}
                                {canManage ? (
                                  <DropdownItem
                                    key="delete"
                                    color="danger"
                                    startContent={<Trash2 className="w-4 h-4" />}
                                    onPress={() => handleDelete(post.id)}
                                  >
                                    {t.deleted}
                                  </DropdownItem>
                                ) : null}
                              </DropdownMenu>
                            </Dropdown>
                          </div>

                          <p className="text-default-500 text-sm line-clamp-3 mb-4 flex-1">
                            {stripMarkdownForExcerpt(post.excerpt || "") || "..."}
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-default-400">
                              <Avatar size="sm" src={authorAvatar} name={authorName} className="w-5 h-5" />
                              <span>{authorName}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-default-400">
                              <div className="flex items-center gap-1">
                                <Bookmark className="w-3 h-3" />
                                <span className="truncate">{post.category?.name || t.uncategorized}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>
                                  {post.viewCount} {t.views}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-default-100">
                              <span className="text-xs text-default-400">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                <Button isIconOnly size="sm" variant="light" color="default" as="a" href={viewHref}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                                {canManage ? (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    as="a"
                                    href={`/${lang}/blog/manage/edit/${post.id}`}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        // 列表视图
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="mb-3">
                              <label className="inline-flex items-center gap-2 text-xs text-default-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedPostIds.includes(post.id)}
                                  onChange={() => togglePostSelected(post)}
                                  disabled={!canManage}
                                />
                                {canManage ? "选择" : "无权限"}
                              </label>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
                              <Chip size="sm" color={getStatusColor(post.status)} variant="flat">
                                {getStatusText(post.status)}
                              </Chip>
                              <Chip size="sm" color={getVisibilityColor(post.visibility)} variant="flat">
                                {getVisibilityText(post.visibility)}
                              </Chip>
                            </div>

                            <p className="text-default-500 text-sm line-clamp-2 mb-4">
                              {stripMarkdownForExcerpt(post.excerpt || "") || "..."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-default-400">
                              <div className="flex items-center gap-2">
                                <Avatar size="sm" src={authorAvatar} name={authorName} className="w-4 h-4" />
                                <span>{authorName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bookmark className="w-4 h-4" />
                                <span>{post.category?.name || t.uncategorized}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>
                                  {post.viewCount} {t.views}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button isIconOnly size="sm" variant="light" color="default" as="a" href={viewHref}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManage ? (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                as="a"
                                href={`/${lang}/blog/manage/edit/${post.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            ) : null}
                            {canManage ? (
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button isIconOnly size="sm" variant="light" color="default">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  <DropdownItem
                                    key="delete"
                                    color="danger"
                                    startContent={<Trash2 className="w-4 h-4" />}
                                    onPress={() => handleDelete(post.id)}
                                  >
                                    {t.deleted}
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="bordered"
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                isDisabled={currentPage === 1}
                size="lg"
              >
                {t.prev}
              </Button>
              <Chip color="primary" variant="flat" size="lg">
                {lang === "zh-CN"
                  ? `${t.page} ${currentPage} ${t.of} ${totalPages} 页`
                  : `${t.page} ${currentPage} ${t.of} ${totalPages}`}
              </Chip>
              <Button
                variant="bordered"
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                isDisabled={currentPage === totalPages}
                size="lg"
              >
                {t.next}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
