"use client";

import { useCallback, useEffect, useState } from "react";
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
    if (!confirm("确定要删除这篇博客吗？")) return;

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
        return "已发布";
      case "draft":
        return "草稿";
      case "archived":
        return "已归档";
      default:
        return "未知";
    }
  };

  // 获取可见性文本
  const getVisibilityText = (visibility: PostVisibility) => {
    switch (visibility) {
      case "public":
        return "公开";
      case "private":
        return "私有";
      case "password":
        return "密码保护";
      default:
        return "未知";
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
            博客管理
          </h1>
          <p className="text-default-500 text-lg">管理您的所有博客文章，创建精彩内容</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            as="a"
            href="/blog/manage/create"
            color="primary"
            size="lg"
            startContent={<Plus className="w-5 h-5" />}
            className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            创建博客
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
              <h3 className="text-xl font-semibold">搜索和过滤</h3>
              <p className="text-default-500">快速找到您需要的文章</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="搜索博客标题..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              variant="bordered"
              size="lg"
              className="w-full"
            />
            <Select
              placeholder="选择状态"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey as PostStatus | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all">所有状态</SelectItem>
              <SelectItem key="draft">草稿</SelectItem>
              <SelectItem key="published">已发布</SelectItem>
              <SelectItem key="archived">已归档</SelectItem>
            </Select>
            <Select
              placeholder="选择可见性"
              selectedKeys={[visibilityFilter]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setVisibilityFilter(selectedKey as PostVisibility | "all");
              }}
              variant="bordered"
              size="lg"
            >
              <SelectItem key="all">所有可见性</SelectItem>
              <SelectItem key="public">公开</SelectItem>
              <SelectItem key="private">私有</SelectItem>
              <SelectItem key="password">密码保护</SelectItem>
            </Select>
            <Select
              placeholder="排序方式"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSortBy(selectedKey as typeof sortBy);
              }}
              variant="bordered"
              size="lg"
              startContent={<SortAsc className="w-4 h-4" />}
            >
              <SelectItem key="createdAt">创建时间</SelectItem>
              <SelectItem key="updatedAt">更新时间</SelectItem>
              <SelectItem key="title">标题</SelectItem>
              <SelectItem key="viewCount">浏览量</SelectItem>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button color="primary" variant="flat" onPress={fetchPosts} size="lg">
              应用过滤
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
              重置
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 视图控制区域 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">博客列表</h3>
          {!loading && posts.length > 0 && (
            <Chip color="primary" variant="flat" size="lg">
              共 {posts.length} 篇文章
            </Chip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-default-500">视图模式:</span>
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
              <p className="mt-4 text-default-500 text-lg">加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-default-100 flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-default-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">暂无博客文章</h3>
              <p className="text-default-500 mb-6">开始创建您的第一篇博客文章吧！</p>
              <Button
                as="a"
                href="/blog/manage/create"
                color="primary"
                size="lg"
                startContent={<Plus className="w-5 h-5" />}
              >
                创建第一篇博客
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
                                href={`/blog/${post.id}`}
                              >
                                查看
                              </DropdownItem>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit className="w-4 h-4" />}
                                as="a"
                                href={`/blog/manage/edit/${post.id}`}
                              >
                                编辑
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={() => handleDelete(post.id)}
                              >
                                删除
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <p className="text-default-500 text-sm line-clamp-3 mb-4 flex-1">
                          {post.excerpt || "暂无摘要"}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-default-400">
                            <Avatar size="sm" name={post.author?.displayName || "未知"} className="w-5 h-5" />
                            <span>{post.author?.displayName || "未知"}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-default-400">
                            <div className="flex items-center gap-1">
                              <Bookmark className="w-3 h-3" />
                              <span className="truncate">{post.category?.name || "未分类"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{post.viewCount} 浏览</span>
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
                                href={`/blog/${post.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                as="a"
                                href={`/blog/manage/edit/${post.id}`}
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

                          <p className="text-default-500 text-sm line-clamp-2 mb-4">{post.excerpt || "暂无摘要"}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-default-400">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" name={post.author?.displayName || "未知"} className="w-4 h-4" />
                              <span>{post.author?.displayName || "未知"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="w-4 h-4" />
                              <span>{post.category?.name || "未分类"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>{post.viewCount} 浏览</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button isIconOnly size="sm" variant="light" color="default" as="a" href={`/blog/${post.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            as="a"
                            href={`/blog/manage/edit/${post.id}`}
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
                                删除
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
                上一页
              </Button>
              <Chip color="primary" variant="flat" size="lg">
                第 {currentPage} 页 / 共 {totalPages} 页
              </Chip>
              <Button
                variant="bordered"
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                isDisabled={currentPage === totalPages}
                size="lg"
              >
                下一页
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
