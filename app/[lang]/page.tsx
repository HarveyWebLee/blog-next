import Image from "next/image";
import Link from "next/link";
import { BookOpen, FileText, Shield, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/dictionaries";

// 模拟特色文章数据
const featuredPosts = [
  {
    id: 1,
    title: {
      "zh-CN": "使用 Next.js 15 构建现代化博客系统",
      "en-US": "Building Modern Blog System with Next.js 15",
      "ja-JP": "Next.js 15でモダンなブログシステムを構築",
    },
    excerpt: {
      "zh-CN": "本文介绍如何使用 Next.js 15 和 Drizzle ORM 构建一个功能完整的博客系统...",
      "en-US":
        "This article introduces how to build a fully functional blog system using Next.js 15 and Drizzle ORM...",
      "ja-JP":
        "この記事では、Next.js 15とDrizzle ORMを使用して完全に機能するブログシステムを構築する方法を紹介します...",
    },
    slug: "building-modern-blog-with-nextjs-15",
    featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
    category: {
      "zh-CN": "技术分享",
      "en-US": "Tech Sharing",
      "ja-JP": "技術共有",
    },
    readTime: 8,
    publishedAt: "2024-01-15",
  },
  {
    id: 2,
    title: {
      "zh-CN": "Drizzle ORM 入门指南：从零开始学习",
      "en-US": "Drizzle ORM Getting Started Guide: Learn from Scratch",
      "ja-JP": "Drizzle ORM入門ガイド：ゼロから学ぶ",
    },
    excerpt: {
      "zh-CN": "Drizzle ORM 是一个现代化的 TypeScript ORM，本文将从基础概念开始...",
      "en-US": "Drizzle ORM is a modern TypeScript ORM, this article will start from basic concepts...",
      "ja-JP": "Drizzle ORMはモダンなTypeScript ORMで、この記事では基本概念から始めます...",
    },
    slug: "drizzle-orm-getting-started",
    featuredImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
    category: {
      "zh-CN": "数据库",
      "en-US": "Database",
      "ja-JP": "データベース",
    },
    readTime: 12,
    publishedAt: "2024-01-10",
  },
];

// 模拟统计数据
const stats = [
  {
    label: {
      "zh-CN": "文章总数",
      "en-US": "Total Posts",
      "ja-JP": "記事総数",
    },
    value: "156",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    label: {
      "zh-CN": "注册用户",
      "en-US": "Registered Users",
      "ja-JP": "登録ユーザー",
    },
    value: "2.3k",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    label: {
      "zh-CN": "总浏览量",
      "en-US": "Total Views",
      "ja-JP": "総閲覧数",
    },
    value: "45.2k",
    icon: TrendingUp,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    label: {
      "zh-CN": "分类数量",
      "en-US": "Categories",
      "ja-JP": "カテゴリー数",
    },
    value: "12",
    icon: BookOpen,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
];

// 技术栈数据
const techStack = [
  {
    name: "Next.js 15",
    icon: "N",
    description: {
      "zh-CN": "最新的 React 框架，提供优秀的开发体验和性能优化",
      "en-US": "Latest React framework with excellent developer experience and performance optimization",
      "ja-JP": "最新のReactフレームワークで、優れた開発体験とパフォーマンス最適化を提供",
    },
    color: "from-blue-500 to-blue-600",
    features: ["App Router", "Server Components", "Turbopack"],
  },
  {
    name: "Drizzle ORM",
    icon: "D",
    description: {
      "zh-CN": "现代化的 TypeScript ORM，类型安全且性能优异",
      "en-US": "Modern TypeScript ORM with type safety and excellent performance",
      "ja-JP": "モダンなTypeScript ORMで、型安全性と優れたパフォーマンスを提供",
    },
    color: "from-emerald-500 to-emerald-600",
    features: ["Type Safety", "SQL-like API", "Zero Runtime"],
  },
  {
    name: "Tailwind CSS",
    icon: "T",
    description: {
      "zh-CN": "实用优先的 CSS 框架，快速构建现代化界面",
      "en-US": "Utility-first CSS framework for rapidly building modern interfaces",
      "ja-JP": "ユーティリティファーストのCSSフレームワークで、モダンなインターフェースを素早く構築",
    },
    color: "from-cyan-500 to-cyan-600",
    features: ["Utility-first", "Responsive", "Customizable"],
  },
];

type Locale = "zh-CN" | "en-US" | "ja-JP";

export default async function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen">
      {/* Hero 区域 - 增加渐变背景和动画效果 */}
      <section className="relative py-20 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {lang === "zh-CN" && "基于 Next.js 15 构建"}
              {lang === "en-US" && "Built with Next.js 15"}
              {lang === "ja-JP" && "Next.js 15で構築"}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent animate-fade-in-up">
            {lang === "zh-CN" && "欢迎来到 BlogNext"}
            {lang === "en-US" && "Welcome to BlogNext"}
            {lang === "ja-JP" && "BlogNextへようこそ"}
          </h1>

          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-600 dark:text-gray-300 animate-fade-in-up delay-200">
            {lang === "zh-CN" && "基于 Next.js 15 和 Drizzle ORM 构建的现代化博客系统"}
            {lang === "en-US" && "Modern blog system built with Next.js 15 and Drizzle ORM"}
            {lang === "ja-JP" && "Next.js 15とDrizzle ORMで構築されたモダンなブログシステム"}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up delay-300">
            <Button
              variant="gradient"
              size="xl"
              asChild
              className="group font-semibold tracking-wide animate-button-glow button-hover-effect"
            >
              <Link href={`/${lang}/blog`}>{dict.navigation.blog}</Link>
            </Button>
            <Button variant="glass" size="xl" asChild className="group font-semibold tracking-wide button-hover-effect">
              <Link href={`/${lang}/about`}>{dict.navigation.about}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 统计数据 - 增加卡片样式和悬停效果 */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl ${stat.bgColor} border border-gray-200 dark:border-gray-700 hover:scale-105 transition-all duration-300 hover:shadow-lg animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label[lang]}</div>

                {/* 悬停时的装饰效果 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特色文章 - 增加更丰富的卡片设计和动画 */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {lang === "zh-CN" && "特色文章"}
              {lang === "en-US" && "Featured Posts"}
              {lang === "ja-JP" && "注目の記事"}
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              {lang === "zh-CN" && "精选优质技术文章，分享最新的技术趋势和开发经验"}
              {lang === "en-US" &&
                "Curated high-quality tech articles sharing the latest trends and development experience"}
              {lang === "ja-JP" && "厳選された高品質な技術記事で、最新のトレンドと開発経験を共有"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredPosts.map((post, index) => (
              <Card
                key={post.id}
                className="group overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-gray-800 border-0 shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.featuredImage}
                    alt={post.title[lang]}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <Badge className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-0 shadow-lg">
                    {post.category[lang]}
                  </Badge>
                  <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full text-xs font-medium text-gray-900 dark:text-white">
                    {lang === "zh-CN" && `${post.readTime} 分钟阅读`}
                    {lang === "en-US" && `${post.readTime} min read`}
                    {lang === "ja-JP" && `${post.readTime}分で読める`}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link href={`/${lang}/blog/${post.slug}`} className="hover:no-underline">
                      {post.title[lang]}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="mb-4 line-clamp-3 text-gray-600 dark:text-gray-300">{post.excerpt[lang]}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{post.publishedAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 animate-fade-in-up delay-500">
            <Button size="lg" variant="neon" asChild className="group font-semibold tracking-wide button-hover-effect">
              <Link href={`/${lang}/blog`}>
                {lang === "zh-CN" && "查看所有文章"}
                {lang === "en-US" && "View All Posts"}
                {lang === "ja-JP" && "すべての記事を見る"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 技术栈介绍 - 重新设计为更现代的风格 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {lang === "zh-CN" && "技术栈"}
              {lang === "en-US" && "Tech Stack"}
              {lang === "ja-JP" && "技術スタック"}
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              {lang === "zh-CN" && "采用现代化的技术栈，确保系统的高性能、可维护性和扩展性"}
              {lang === "en-US" &&
                "Using modern tech stack to ensure high performance, maintainability and scalability"}
              {lang === "ja-JP" && "モダンな技術スタックを採用し、高性能、保守性、拡張性を確保"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techStack.map((tech, index) => (
              <Card
                key={tech.name}
                className="group relative p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-gray-800 border-0 shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <span className="text-3xl font-bold text-white">{tech.icon}</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{tech.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{tech.description[lang]}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {tech.features.map((feature, featureIndex) => (
                    <Badge
                      key={featureIndex}
                      variant="secondary"
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* 悬停时的装饰效果 */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 新增：特性展示区域 */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {lang === "zh-CN" && "为什么选择我们"}
              {lang === "en-US" && "Why Choose Us"}
              {lang === "ja-JP" && "なぜ私たちを選ぶのか"}
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              {lang === "zh-CN" && "我们致力于提供最佳的技术博客体验"}
              {lang === "en-US" && "We are committed to providing the best tech blog experience"}
              {lang === "ja-JP" && "最高の技術ブログ体験を提供することに専念しています"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {lang === "zh-CN" && "极速性能"}
                {lang === "en-US" && "Lightning Fast"}
                {lang === "ja-JP" && "超高速パフォーマンス"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {lang === "zh-CN" && "基于 Next.js 15 构建，提供极致的加载速度和用户体验"}
                {lang === "en-US" && "Built with Next.js 15 for ultimate loading speed and user experience"}
                {lang === "ja-JP" && "Next.js 15で構築され、究極のロード速度とユーザー体験を提供"}
              </p>
            </div>

            <div className="text-center group animate-fade-in-up delay-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {lang === "zh-CN" && "安全可靠"}
                {lang === "en-US" && "Secure & Reliable"}
                {lang === "ja-JP" && "安全で信頼性"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {lang === "zh-CN" && "企业级安全标准，保护您的数据和隐私"}
                {lang === "en-US" && "Enterprise-grade security standards to protect your data and privacy"}
                {lang === "ja-JP" && "エンタープライズグレードのセキュリティ標準で、データとプライバシーを保護"}
              </p>
            </div>

            <div className="text-center group animate-fade-in-up delay-400">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {lang === "zh-CN" && "现代设计"}
                {lang === "en-US" && "Modern Design"}
                {lang === "ja-JP" && "モダンデザイン"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {lang === "zh-CN" && "响应式设计，支持明暗主题，适配所有设备"}
                {lang === "en-US" && "Responsive design with dark/light theme support for all devices"}
                {lang === "ja-JP" && "レスポンシブデザインで、ダーク/ライトテーマをサポート、すべてのデバイスに対応"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
