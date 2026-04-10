"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge, Button, Card, CardBody, Chip } from "@heroui/react";
import { BookOpen, Edit, Eye, Filter, Heart, MessageSquare, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";

interface ProfilePostsProps {
  lang: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "password";
  viewCount: number;
  likeCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile/posts');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          setPosts([
            {
              id: 1,
              title: "如何学习React Hooks",
              slug: "how-to-learn-react-hooks",
              excerpt: "React Hooks是React 16.8引入的新特性，它让我们可以在函数组件中使用状态和其他React特性...",
              featuredImage: "/images/placeholder.jpg",
              status: "published",
              visibility: "public",
              viewCount: 1250,
              likeCount: 89,
              publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              category: {
                id: 1,
                name: "前端开发",
                slug: "frontend",
              },
              tags: [
                { id: 1, name: "React", slug: "react", color: "#61dafb" },
                { id: 2, name: "JavaScript", slug: "javascript", color: "#f7df1e" },
              ],
            },
            {
              id: 2,
              title: "Vue.js 3.0 新特性详解",
              slug: "vue-3-features",
              excerpt: "Vue.js 3.0带来了许多令人兴奋的新特性，包括Composition API、更好的TypeScript支持等...",
              featuredImage: "/images/placeholder.jpg",
              status: "published",
              visibility: "public",
              viewCount: 890,
              likeCount: 67,
              publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              category: {
                id: 1,
                name: "前端开发",
                slug: "frontend",
              },
              tags: [
                { id: 3, name: "Vue", slug: "vue", color: "#4fc08d" },
                { id: 4, name: "TypeScript", slug: "typescript", color: "#3178c6" },
              ],
            },
            {
              id: 3,
              title: "Node.js 性能优化技巧",
              slug: "nodejs-performance",
              excerpt: "本文将介绍一些Node.js性能优化的实用技巧，帮助您构建更高效的应用程序...",
              featuredImage: "/images/placeholder.jpg",
              status: "draft",
              visibility: "private",
              viewCount: 0,
              likeCount: 0,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              category: {
                id: 2,
                name: "后端开发",
                slug: "backend",
              },
              tags: [
                { id: 5, name: "Node.js", slug: "nodejs", color: "#339933" },
                { id: 6, name: "性能优化", slug: "performance", color: "#ff6b6b" },
              ],
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取文章列表失败:", error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的文章</h1>
          <p className="text-gray-500 dark:text-gray-400">管理您的文章内容</p>
        </div>
        <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
          写文章
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 文章列表 */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardBody className="p-6">
              <div className="flex items-start space-x-4">
                {/* 文章封面 */}
                <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* 文章信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{post.excerpt}</p>
                      )}

                      {/* 文章元信息 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                          {post.status}
                        </Badge>
                        <Badge color={visibilityColors[post.visibility]} variant="flat">
                          {post.visibility}
                        </Badge>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button isIconOnly variant="light" size="sm" startContent={<Edit className="w-4 h-4" />}>
                        编辑
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        color="danger"
                        startContent={<Trash2 className="w-4 h-4" />}
                      >
                        删除
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        startContent={<MoreHorizontal className="w-4 h-4" />}
                      >
                        更多
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
        <Card>
          <CardBody className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all" ? "没有找到匹配的文章" : "还没有文章"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== "all" ? "尝试调整搜索条件或筛选器" : "开始创建您的第一篇文章吧"}
            </p>
            <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
              写文章
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
