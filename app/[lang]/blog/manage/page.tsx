"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  User,
} from "lucide-react";

import { BlogNavigation } from "@/components/blog/blog-navigation";
import { PostData, PostStatus, PostVisibility } from "@/types/blog";

export default function BlogManagePage() {
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          title: "Blog Management",
          subtitle: "Manage all your posts",
          create: "Create Post",
          searchFilter: "Search & Filter",
          searchFilterDesc: "Quickly find the posts you need",
          search: "Search post title...",
          statusPlaceholder: "Select status",
          visibilityPlaceholder: "Select visibility",
          sortPlaceholder: "Sort by",
          sortCreatedAt: "Created At",
          sortUpdatedAt: "Updated At",
          sortTitle: "Title",
          sortViewCount: "Views",
          viewMode: "View mode:",
          views: "views",
          loading: "Loading...",
          empty: "No posts",
          emptyDesc: "Create your first post!",
          createFirst: "Create First Post",
          apply: "Apply",
          reset: "Reset",
          list: "Post List",
          total: "posts",
          prev: "Previous",
          next: "Next",
          page: "Page",
          of: "of",
          deleteConfirm: "Are you sure to delete this post?",
          deleted: "Delete",
          edit: "Edit",
          view: "View",
          unknown: "Unknown",
          uncategorized: "Uncategorized",
          statusAll: "All Status",
          visibilityAll: "All Visibility",
          statusPublished: "Published",
          statusDraft: "Draft",
          statusArchived: "Archived",
          visibilityPublic: "Public",
          visibilityPrivate: "Private",
          visibilityPassword: "Password Protected",
        }
      : lang === "ja-JP"
        ? {
            title: "ブログ管理",
            subtitle: "すべての記事を管理",
            create: "記事作成",
            searchFilter: "検索と絞り込み",
            searchFilterDesc: "必要な記事をすばやく見つける",
            search: "記事タイトルを検索...",
            statusPlaceholder: "状態を選択",
            visibilityPlaceholder: "公開範囲を選択",
            sortPlaceholder: "並び順",
            sortCreatedAt: "作成日時",
            sortUpdatedAt: "更新日時",
            sortTitle: "タイトル",
            sortViewCount: "閲覧数",
            viewMode: "表示モード:",
            views: "閲覧",
            loading: "読み込み中...",
            empty: "記事がありません",
            emptyDesc: "最初の記事を作成しましょう！",
            createFirst: "最初の記事を作成",
            apply: "適用",
            reset: "リセット",
            list: "記事一覧",
            total: "件",
            prev: "前へ",
            next: "次へ",
            page: "ページ",
            of: "/",
            deleteConfirm: "このブログを削除しますか？",
            deleted: "削除",
            edit: "編集",
            view: "表示",
            unknown: "不明",
            uncategorized: "未分類",
            statusAll: "すべての状態",
            visibilityAll: "すべての公開範囲",
            statusPublished: "公開済み",
            statusDraft: "下書き",
            statusArchived: "アーカイブ",
            visibilityPublic: "公開",
            visibilityPrivate: "非公開",
            visibilityPassword: "パスワード保護",
          }
        : {
            title: "博客管理",
            subtitle: "管理您的所有博客文章，创建精彩内容",
            create: "创建博客",
            searchFilter: "搜索和过滤",
            searchFilterDesc: "快速找到您需要的文章",
            search: "搜索博客标题...",
            statusPlaceholder: "选择状态",
            visibilityPlaceholder: "选择可见性",
            sortPlaceholder: "排序方式",
            sortCreatedAt: "创建时间",
            sortUpdatedAt: "更新时间",
            sortTitle: "标题",
            sortViewCount: "浏览量",
            viewMode: "视图模式:",
            views: "浏览",
            loading: "加载中...",
            empty: "暂无博客文章",
            emptyDesc: "开始创建您的第一篇博客文章吧！",
            createFirst: "创建第一篇博客",
            apply: "应用过滤",
            reset: "重置",
            list: "博客列表",
            total: "篇文章",
            prev: "上一页",
            next: "下一页",
            page: "第",
            of: "页 / 共",
            deleteConfirm: "确定要删除这篇博客吗？",
            deleted: "删除",
            edit: "编辑",
            view: "查看",
            unknown: "未知",
            uncategorized: "未分类",
            statusAll: "所有状态",
            visibilityAll: "所有可见性",
            statusPublished: "已发布",
            statusDraft: "草稿",
            statusArchived: "已归档",
            visibilityPublic: "公开",
            visibilityPrivate: "私有",
            visibilityPassword: "密码保护",
          };
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<PostVisibility | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "title" | "viewCount">("createdAt");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        search: searchTerm,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(visibilityFilter !== "all" && { visibility: visibilityFilter }),
        sortBy: sortBy,
      });

      const response = await fetch(`/api/posts?${params}`);
      const result = await response.json();

      if (result.success) {
        console.log("result", result.data.data);
        setPosts(result.data.data);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取博客列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, visibilityFilter, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 删除博客
  const handleDelete = async (postId: number) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("删除博客失败:", error);
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
          <p className="text-default-500 text-lg">{t.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
      <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
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
              placeholder={t.statusPlaceholder}
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey as PostStatus | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all">{t.statusAll}</SelectItem>
              <SelectItem key="draft">{t.statusDraft}</SelectItem>
              <SelectItem key="published">{t.statusPublished}</SelectItem>
              <SelectItem key="archived">{t.statusArchived}</SelectItem>
            </Select>
            <Select
              placeholder={t.visibilityPlaceholder}
              selectedKeys={[visibilityFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setVisibilityFilter(selectedKey as PostVisibility | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all">{t.visibilityAll}</SelectItem>
              <SelectItem key="public">{t.visibilityPublic}</SelectItem>
              <SelectItem key="private">{t.visibilityPrivate}</SelectItem>
              <SelectItem key="password">{t.visibilityPassword}</SelectItem>
            </Select>
            <Select
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
              <SelectItem key="createdAt">{t.sortCreatedAt}</SelectItem>
              <SelectItem key="updatedAt">{t.sortUpdatedAt}</SelectItem>
              <SelectItem key="title">{t.sortTitle}</SelectItem>
              <SelectItem key="viewCount">{t.sortViewCount}</SelectItem>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button color="primary" variant="flat" onPress={fetchPosts} size="lg">
              {t.apply}
            </Button>
            <Button
              variant="bordered"
              onPress={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVisibilityFilter("all");
                setSortBy("createdAt");
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

        <div className="flex items-center gap-2">
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
              {posts.map((post) => (
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
                                href={`/${lang}/blog/${post.id}`}
                              >
                                {t.view}
                              </DropdownItem>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit className="w-4 h-4" />}
                                as="a"
                                href={`/${lang}/blog/manage/edit/${post.id}`}
                              >
                                {t.edit}
                              </DropdownItem>
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
                        </div>

                        <p className="text-default-500 text-sm line-clamp-3 mb-4 flex-1">{post.excerpt || "..."}</p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-default-400">
                            <Avatar size="sm" name={post.author?.displayName || t.unknown} className="w-5 h-5" />
                            <span>{post.author?.displayName || t.unknown}</span>
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
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="default"
                                as="a"
                                href={`/${lang}/blog/${post.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
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
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // 列表视图
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
                            <Chip size="sm" color={getStatusColor(post.status)} variant="flat">
                              {getStatusText(post.status)}
                            </Chip>
                            <Chip size="sm" color={getVisibilityColor(post.visibility)} variant="flat">
                              {getVisibilityText(post.visibility)}
                            </Chip>
                          </div>

                          <p className="text-default-500 text-sm line-clamp-2 mb-4">{post.excerpt || "..."}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-default-400">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" name={post.author?.displayName || t.unknown} className="w-4 h-4" />
                              <span>{post.author?.displayName || t.unknown}</span>
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
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="default"
                            as="a"
                            href={`/${lang}/blog/${post.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
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
