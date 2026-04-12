"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Avatar, Button, Card, CardBody, Chip } from "@heroui/react";
import { BookOpen, Calendar, Eye, Filter, Heart, MessageSquare, Search, Tag, Trash2, User } from "lucide-react";

import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";

interface ProfileFavoritesProps {
  lang: string;
}

interface FavoritePost {
  id: number;
  userId: number;
  postId: number;
  createdAt: Date;
  updatedAt: Date;
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    viewCount: number;
    likeCount: number;
    publishedAt?: Date;
    author: {
      id: number;
      username: string;
      displayName?: string;
      avatar?: string;
    };
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
  };
}

export default function ProfileFavorites({ lang }: ProfileFavoritesProps) {
  const t =
    lang === "en-US"
      ? {
          title: "My Favorites",
          subtitle: "Posts you have favorited",
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
        }
      : lang === "ja-JP"
        ? {
            title: "お気に入り",
            subtitle: "お気に入りの記事一覧",
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
          }
        : {
            title: "我的收藏",
            subtitle: "您收藏的文章列表",
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
          };
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile/favorites');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          setFavorites([
            {
              id: 1,
              userId: 1,
              postId: 101,
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              post: {
                id: 101,
                title: "深入理解JavaScript闭包",
                slug: "understanding-javascript-closures",
                excerpt: "闭包是JavaScript中一个重要的概念，理解闭包对于编写高质量的JavaScript代码至关重要...",
                featuredImage: "/images/placeholder.jpg",
                viewCount: 2500,
                likeCount: 156,
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                author: {
                  id: 2,
                  username: "developer",
                  displayName: "开发者",
                  avatar: "/images/avatar.jpeg",
                },
                category: {
                  id: 1,
                  name: "前端开发",
                  slug: "frontend",
                },
                tags: [
                  { id: 1, name: "JavaScript", slug: "javascript", color: "#f7df1e" },
                  { id: 2, name: "闭包", slug: "closure", color: "#61dafb" },
                ],
              },
            },
            {
              id: 2,
              userId: 1,
              postId: 102,
              createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              post: {
                id: 102,
                title: "React性能优化最佳实践",
                slug: "react-performance-optimization",
                excerpt: "本文将介绍一些React性能优化的实用技巧，帮助您构建更高效的React应用...",
                featuredImage: "/images/placeholder.jpg",
                viewCount: 1800,
                likeCount: 98,
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                author: {
                  id: 3,
                  username: "reactdev",
                  displayName: "React开发者",
                  avatar: "/images/avatar.jpeg",
                },
                category: {
                  id: 1,
                  name: "前端开发",
                  slug: "frontend",
                },
                tags: [
                  { id: 3, name: "React", slug: "react", color: "#61dafb" },
                  { id: 4, name: "性能优化", slug: "performance", color: "#ff6b6b" },
                ],
              },
            },
            {
              id: 3,
              userId: 1,
              postId: 103,
              createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              post: {
                id: 103,
                title: "Node.js微服务架构设计",
                slug: "nodejs-microservices-architecture",
                excerpt: "微服务架构是现代应用开发的重要模式，本文将介绍如何使用Node.js构建微服务...",
                featuredImage: "/images/placeholder.jpg",
                viewCount: 1200,
                likeCount: 67,
                publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                author: {
                  id: 4,
                  username: "backenddev",
                  displayName: "后端开发者",
                  avatar: "/images/avatar.jpeg",
                },
                category: {
                  id: 2,
                  name: "后端开发",
                  slug: "backend",
                },
                tags: [
                  { id: 5, name: "Node.js", slug: "nodejs", color: "#339933" },
                  { id: 6, name: "微服务", slug: "microservices", color: "#8b5cf6" },
                ],
              },
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取收藏列表失败:", error);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const filteredFavorites = favorites.filter((favorite) => {
    const matchesSearch =
      favorite.post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || favorite.post.category?.slug === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      // 这里应该调用真实的API
      // await fetch(`/api/profile/favorites?id=${favoriteId}`, { method: 'DELETE' });

      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
    } catch (error) {
      console.error("取消收藏失败:", error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {favorites.length} {t.total}
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t.allCategories}</option>
                <option value="frontend">前端开发</option>
                <option value="backend">后端开发</option>
                <option value="design">设计</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 收藏列表 */}
      <div className="space-y-4">
        {filteredFavorites.map((favorite) => (
          <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
            <CardBody className="p-6">
              <div className="flex items-start space-x-4">
                {/* 文章封面 */}
                <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {favorite.post.featuredImage ? (
                    <Image
                      src={favorite.post.featuredImage}
                      alt={favorite.post.title}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* 文章信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {favorite.post.title}
                      </h3>
                      {favorite.post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {stripMarkdownForExcerpt(favorite.post.excerpt)}
                        </p>
                      )}

                      {/* 作者信息 */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar
                          src={favorite.post.author.avatar}
                          name={favorite.post.author.displayName || favorite.post.author.username}
                          size="sm"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {favorite.post.author.displayName || favorite.post.author.username}
                        </span>
                      </div>

                      {/* 文章元信息 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{favorite.post.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{favorite.post.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {favorite.post.publishedAt
                              ? formatDate(favorite.post.publishedAt)
                              : formatDate(favorite.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* 分类和标签 */}
                      <div className="flex items-center space-x-2 mb-3">
                        {favorite.post.category && (
                          <Chip size="sm" variant="flat" color="primary">
                            {favorite.post.category.name}
                          </Chip>
                        )}
                        {favorite.post.tags?.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag.id}
                            size="sm"
                            variant="flat"
                            style={{ backgroundColor: tag.color + "20", color: tag.color }}
                          >
                            {tag.name}
                          </Chip>
                        ))}
                        {favorite.post.tags && favorite.post.tags.length > 3 && (
                          <Chip size="sm" variant="flat">
                            +{favorite.post.tags.length - 3}
                          </Chip>
                        )}
                      </div>

                      {/* 收藏时间 */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t.favoritedAt} {formatDate(favorite.createdAt)}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="light" size="sm" className="text-blue-600 hover:text-blue-700">
                        {t.readPost}
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        color="danger"
                        startContent={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleRemoveFavorite(favorite.id)}
                      >
                        {t.remove}
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
      {filteredFavorites.length === 0 && !loading && (
        <Card>
          <CardBody className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || categoryFilter !== "all" ? t.emptyMatch : t.empty}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || categoryFilter !== "all" ? t.emptyMatchDesc : t.emptyDesc}
            </p>
            <Button color="primary" variant="flat">
              {t.browse}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
