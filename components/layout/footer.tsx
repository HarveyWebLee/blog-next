"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Locale } from "@/types";

/** 与 middleware 默认语言保持一致，避免在非 [lang] 段误用 Footer 时链接无效 */
const FALLBACK_LANG = "zh-CN";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

export function Footer() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : FALLBACK_LANG;
  const locale = resolveLocale(lang);
  const prefix = `/${lang}`;
  const t =
    locale === "en-US"
      ? {
          about: "About BlogNext",
          aboutDesc: "A modern blog built with Next.js 15 and Drizzle ORM",
          quickLinks: "Quick Links",
          blogPosts: "Blog Posts",
          categories: "Categories",
          tags: "Tags",
          contact: "Contact",
          subscribe: "Subscribe",
          subscribeDesc: "Get the latest blog posts and updates",
          emailPlaceholder: "Enter your email",
          subscribeBtn: "Subscribe",
          rights: "All rights reserved.",
        }
      : locale === "ja-JP"
        ? {
            about: "BlogNext について",
            aboutDesc: "Next.js 15 と Drizzle ORM で構築されたモダンなブログシステム",
            quickLinks: "クイックリンク",
            blogPosts: "ブログ記事",
            categories: "カテゴリー",
            tags: "タグ",
            contact: "お問い合わせ",
            subscribe: "購読",
            subscribeDesc: "最新記事と更新情報を受け取る",
            emailPlaceholder: "メールアドレスを入力",
            subscribeBtn: "購読",
            rights: "All rights reserved.",
          }
        : {
            about: "关于 BlogNext",
            aboutDesc: "基于 Next.js 15 和 Drizzle ORM 构建的现代化博客系统",
            quickLinks: "快速链接",
            blogPosts: "博客文章",
            categories: "文章分类",
            tags: "标签云",
            contact: "联系我们",
            subscribe: "订阅更新",
            subscribeDesc: "获取最新的博客文章和更新通知",
            emailPlaceholder: "输入邮箱地址",
            subscribeBtn: "订阅",
            rights: "保留所有权利。",
          };

  return (
    <footer className="blog-border-x-box-shadow bg-background">
      <div className="container mx-auto px-4">
        <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 关于我们 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t.about}</h3>
            <p className="text-sm text-muted-foreground">{t.aboutDesc}</p>
          </div>

          {/* 快速链接 —— 使用 next/link 且带语言前缀，符合 App Router i18n 路由 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t.quickLinks}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`${prefix}/blog`} className="hover:text-foreground transition-colors">
                  {t.blogPosts}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/categories`} className="hover:text-foreground transition-colors">
                  {t.categories}
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/tags`} className="hover:text-foreground transition-colors">
                  {t.tags}
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t.contact}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>邮箱: contact@blognext.com</li>
            </ul>
          </div>

          {/* 订阅 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t.subscribe}</h3>
            <p className="text-sm text-muted-foreground">{t.subscribeDesc}</p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                {t.subscribeBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="blog-border-x-box-shadow py-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 BlogNext. {t.rights}</p>
      </div>
    </footer>
  );
}
