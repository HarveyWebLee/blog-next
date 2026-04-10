"use client";

import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { ArrowRight, Bookmark, Eye, FolderOpen, Hash, Mail, Tag, TrendingUp } from "lucide-react";

const getMockCategories = (lang: string) =>
  lang === "en-US"
    ? [
        { name: "Tech Sharing", slug: "tech", count: 15 },
        { name: "Frontend", slug: "frontend", count: 12 },
        { name: "Backend", slug: "backend", count: 8 },
        { name: "Database", slug: "database", count: 6 },
        { name: "DevOps", slug: "devops", count: 4 },
      ]
    : lang === "ja-JP"
      ? [
          { name: "技術共有", slug: "tech", count: 15 },
          { name: "フロントエンド", slug: "frontend", count: 12 },
          { name: "バックエンド", slug: "backend", count: 8 },
          { name: "データベース", slug: "database", count: 6 },
          { name: "DevOps", slug: "devops", count: 4 },
        ]
      : [
          { name: "技术分享", slug: "tech", count: 15 },
          { name: "前端开发", slug: "frontend", count: 12 },
          { name: "后端开发", slug: "backend", count: 8 },
          { name: "数据库", slug: "database", count: 6 },
          { name: "DevOps", slug: "devops", count: 4 },
        ];

const mockTags = [
  { name: "Next.js", slug: "nextjs", color: "#8B5CF6", count: 8 },
  { name: "React", slug: "react", color: "#10B981", count: 12 },
  { name: "TypeScript", slug: "typescript", color: "#3B82F6", count: 10 },
  { name: "Drizzle", slug: "drizzle", color: "#F59E0B", count: 5 },
  { name: "Tailwind CSS", slug: "tailwind", color: "#06B6D4", count: 7 },
  { name: "MySQL", slug: "mysql", color: "#EF4444", count: 4 },
];

const getMockPopularPosts = (lang: string) =>
  lang === "en-US"
    ? [
        { title: "What's New in Next.js 15", slug: "nextjs-15-features", viewCount: 2500 },
        { title: "Drizzle ORM Best Practices", slug: "drizzle-orm-best-practices", viewCount: 1800 },
        { title: "Advanced TypeScript Tips", slug: "typescript-advanced-tips", viewCount: 1600 },
        { title: "Modern Frontend Engineering", slug: "modern-frontend-engineering", viewCount: 1400 },
      ]
    : lang === "ja-JP"
      ? [
          { title: "Next.js 15 新機能解説", slug: "nextjs-15-features", viewCount: 2500 },
          { title: "Drizzle ORM ベストプラクティス", slug: "drizzle-orm-best-practices", viewCount: 1800 },
          { title: "TypeScript 上級テクニック", slug: "typescript-advanced-tips", viewCount: 1600 },
          { title: "モダンフロントエンド実践", slug: "modern-frontend-engineering", viewCount: 1400 },
        ]
      : [
          { title: "Next.js 15 新特性详解", slug: "nextjs-15-features", viewCount: 2500 },
          { title: "Drizzle ORM 最佳实践", slug: "drizzle-orm-best-practices", viewCount: 1800 },
          { title: "TypeScript 高级技巧", slug: "typescript-advanced-tips", viewCount: 1600 },
          { title: "现代前端工程化实践", slug: "modern-frontend-engineering", viewCount: 1400 },
        ];

export function BlogSidebar({ lang = "zh-CN" }: { lang?: string }) {
  const t =
    lang === "en-US"
      ? {
          categoryTitle: "Categories",
          categoryDesc: "Browse posts by topic",
          tagTitle: "Popular Tags",
          tagDesc: "Find related content quickly",
          popularTitle: "Popular Posts",
          popularDesc: "Most popular content",
          views: "views",
          subscribeTitle: "Subscribe",
          subscribeDesc: "Get updates on latest posts",
          emailPlaceholder: "Enter email address",
          subscribe: "Subscribe",
        }
      : lang === "ja-JP"
        ? {
            categoryTitle: "カテゴリ",
            categoryDesc: "テーマ別に記事を探す",
            tagTitle: "人気タグ",
            tagDesc: "関連コンテンツをすばやく検索",
            popularTitle: "人気記事",
            popularDesc: "最も人気のあるコンテンツ",
            views: "閲覧",
            subscribeTitle: "更新を購読",
            subscribeDesc: "最新記事の通知を受け取る",
            emailPlaceholder: "メールアドレスを入力",
            subscribe: "購読する",
          }
        : {
            categoryTitle: "文章分类",
            categoryDesc: "按主题浏览文章",
            tagTitle: "热门标签",
            tagDesc: "快速找到相关内容",
            popularTitle: "热门文章",
            popularDesc: "最受欢迎的内容",
            views: "阅读",
            subscribeTitle: "订阅更新",
            subscribeDesc: "获取最新文章通知",
            emailPlaceholder: "输入邮箱地址",
            subscribe: "订阅",
          };
  const mockCategories = getMockCategories(lang);
  const mockPopularPosts = getMockPopularPosts(lang);
  return (
    <div className="space-y-6">
      {/* 分类 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.categoryTitle}</p>
            <p className="text-small text-default-500">{t.categoryDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1">
            {mockCategories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/${lang}/categories/${category.slug}`}
                className="flex items-center justify-between p-3 rounded-lg backdrop-blur-xl bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 group hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-default-400 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  {category.count}
                </Chip>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 热门标签 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20">
            <Hash className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.tagTitle}</p>
            <p className="text-small text-default-500">{t.tagDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex flex-wrap gap-2">
            {mockTags.map((tag, index) => (
              <Link
                key={tag.slug}
                href={`/${lang}/tags/${tag.slug}`}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Chip
                  startContent={<Tag className="w-3 h-3" />}
                  variant="flat"
                  className="hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name} ({tag.count})
                </Chip>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 热门文章 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-success/20 to-warning/20">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.popularTitle}</p>
            <p className="text-small text-default-500">{t.popularDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-4">
            {mockPopularPosts.map((post, index) => (
              <div key={post.slug} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Link href={`/${lang}/blog/${post.slug}`} className="block group">
                  <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-xl bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 hover:scale-105">
                    <div className="flex-shrink-0">
                      <Chip
                        size="sm"
                        color={index === 0 ? "warning" : index === 1 ? "secondary" : "default"}
                        variant="solid"
                        className="backdrop-blur-xl"
                      >
                        {index + 1}
                      </Chip>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-default-400">
                        <Eye className="w-3 h-3" />
                        <span>
                          {post.viewCount.toLocaleString()} {t.views}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-default-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
                {index < mockPopularPosts.length - 1 && <Divider className="mt-4" />}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 订阅 */}
      <Card className="border-0 backdrop-blur-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 hover:from-primary/20 hover:via-secondary/20 hover:to-accent/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.subscribeTitle}</p>
            <p className="text-small text-default-500">{t.subscribeDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
          <Input
            type="email"
            placeholder={t.emailPlaceholder}
            variant="bordered"
            size="sm"
            classNames={{
              input: "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
              inputWrapper:
                "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 hover:border-primary/50 focus-within:border-primary",
            }}
          />
          <Button
            color="primary"
            variant="shadow"
            size="sm"
            className="w-full font-semibold tracking-wide"
            endContent={<Mail className="w-4 h-4" />}
          >
            {t.subscribe}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
