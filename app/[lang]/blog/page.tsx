"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  BookOpenIcon,
  CalendarIcon,
  FilterIcon,
  Layers,
  RefreshCwIcon,
  SearchIcon,
  Sparkles,
  TrendingUpIcon,
} from "lucide-react";

import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { PostCard } from "@/components/blog/post-card";
import { usePosts } from "@/lib/hooks/usePosts";
import { PostData } from "@/types/blog";

export default function BlogWithAPIPage() {
  const router = useRouter();
  const params = useParams();
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("publishedAt");

  const {
    posts,
    loading,
    error,
    pagination,
    searchPosts,
    filterByCategory,
    sortPosts,
    goToPage,
    incrementViewCount,
    incrementLikeCount,
  } = usePosts({
    initialParams: {
      status: "published",
      visibility: "public",
      limit: 6,
    },
  });

  console.log("posts", posts);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    searchPosts(value);
  };

  // 处理分类筛选
  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    const categoryId = value === "all" ? null : Number(value);
    filterByCategory(categoryId);
  };

  // 处理排序
  const handleSort = (value: string) => {
    setSortBy(value);
    sortPosts(value, "desc");
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  // 处理文章交互
  const handleViewPost = async (post: PostData) => {
    try {
      await incrementViewCount(post.id);
      router.push(`/${params.lang}/blog/${post.slug}`);
    } catch (error) {
      console.error("增加浏览次数失败:", error);
    }
  };

  const handleLikePost = async (post: PostData) => {
    await incrementLikeCount(post.id);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md mx-auto border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
          <CardBody className="text-center p-8">
            <div className="text-danger mb-4">
              <RefreshCwIcon className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">加载失败</h2>
              <p className="text-default-500">{error}</p>
            </div>
            <Button
              color="primary"
              variant="solid"
              startContent={<RefreshCwIcon className="w-4 h-4" />}
              onPress={() => window.location.reload()}
              className="backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
            >
              重新加载
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 主内容区 */}
        <div className="lg:col-span-3">
          {/* 筛选器 */}
          <Card className="mb-8 border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
            <CardHeader className="flex gap-3">
              <FilterIcon className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <p className="text-lg font-semibold">筛选文章</p>
                <p className="text-small text-default-500">通过搜索、分类和排序找到您需要的文章</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 搜索 */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="搜索文章标题或内容..."
                    value={searchValue}
                    onValueChange={handleSearch}
                    startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
                      inputWrapper:
                        "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 hover:border-primary/50 focus-within:border-primary",
                    }}
                  />
                  {searchValue && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                  )}
                </div>

                {/* 分类筛选 */}
                <Select
                  placeholder="选择分类"
                  selectedKeys={new Set([categoryFilter])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleCategoryFilter(selectedKey);
                  }}
                  variant="bordered"
                  size="md"
                  classNames={{
                    trigger:
                      "backdrop-blur-xl bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20",
                    value: "text-foreground",
                  }}
                >
                  <SelectItem key="all">全部分类</SelectItem>
                  <SelectItem key="1">技术分享</SelectItem>
                  <SelectItem key="2">前端开发</SelectItem>
                  <SelectItem key="3">后端开发</SelectItem>
                  <SelectItem key="4">数据库</SelectItem>
                  <SelectItem key="5">DevOps</SelectItem>
                </Select>

                {/* 排序 */}
                <Select
                  placeholder="选择排序"
                  selectedKeys={new Set([sortBy])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleSort(selectedKey);
                  }}
                  variant="bordered"
                  size="md"
                  classNames={{
                    trigger:
                      "backdrop-blur-xl bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20",
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

          {/* 文章列表 */}
          {loading ? (
            <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
              <CardBody className="text-center py-12">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-default-500">加载中...</p>
              </CardBody>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 animate-fade-in-up">
              <CardBody className="text-center py-12">
                <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-default-300 animate-float" />
                <h3 className="text-xl font-semibold mb-2">暂无文章</h3>
                <p className="text-default-500">当前没有找到符合条件的文章</p>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* 文章统计 */}
              <div className="flex items-center gap-4 mb-6 animate-fade-in-up">
                <Chip
                  startContent={<TrendingUpIcon className="w-4 h-4" />}
                  variant="flat"
                  color="primary"
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  共找到 {pagination.total} 篇文章
                </Chip>
                <Chip
                  startContent={<CalendarIcon className="w-4 h-4" />}
                  variant="flat"
                  color="secondary"
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  第 {pagination.page} 页 / 共 {pagination.totalPages} 页
                </Chip>
              </div>

              {/* 文章网格 */}
              <div className="blog-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(posts || []).map((post, index) => (
                  <div key={post.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <PostCard post={post} onView={() => handleViewPost(post)} onLike={() => handleLikePost(post)} />
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center animate-fade-in-up">
                  <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10">
                    <CardBody className="p-4">
                      <Pagination
                        total={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        showControls
                        showShadow
                        color="primary"
                        classNames={{
                          wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
                          item: "w-8 h-8 text-small rounded-none bg-transparent",
                          cursor:
                            "bg-gradient-to-b shadow-lg from-default-50 to-default-100 dark:from-default-50 dark:to-default-100",
                        }}
                      />
                    </CardBody>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="lg:col-span-1">
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
