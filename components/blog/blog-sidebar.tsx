import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { ArrowRight, Bookmark, Eye, FolderOpen, Hash, Mail, Tag, TrendingUp } from "lucide-react";

// 模拟数据
const mockCategories = [
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

const mockPopularPosts = [
  {
    title: "Next.js 15 新特性详解",
    slug: "nextjs-15-features",
    viewCount: 2500,
  },
  {
    title: "Drizzle ORM 最佳实践",
    slug: "drizzle-orm-best-practices",
    viewCount: 1800,
  },
  {
    title: "TypeScript 高级技巧",
    slug: "typescript-advanced-tips",
    viewCount: 1600,
  },
  {
    title: "现代前端工程化实践",
    slug: "modern-frontend-engineering",
    viewCount: 1400,
  },
];

export function BlogSidebar() {
  return (
    <div className="space-y-6">
      {/* 分类 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">文章分类</p>
            <p className="text-small text-default-500">按主题浏览文章</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1">
            {mockCategories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
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
            <p className="text-md font-semibold">热门标签</p>
            <p className="text-small text-default-500">快速找到相关内容</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex flex-wrap gap-2">
            {mockTags.map((tag, index) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
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
            <p className="text-md font-semibold">热门文章</p>
            <p className="text-small text-default-500">最受欢迎的内容</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-4">
            {mockPopularPosts.map((post, index) => (
              <div key={post.slug} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Link href={`/blog/${post.slug}`} className="block group">
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
                        <span>{post.viewCount.toLocaleString()} 阅读</span>
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
            <p className="text-md font-semibold">订阅更新</p>
            <p className="text-small text-default-500">获取最新文章通知</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
          <Input
            type="email"
            placeholder="输入邮箱地址"
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
            variant="gradient"
            size="sm"
            className="w-full font-semibold tracking-wide"
            endContent={<Mail className="w-4 h-4" />}
          >
            订阅
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
