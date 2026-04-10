"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

/** 与 middleware 默认语言保持一致，避免在非 [lang] 段误用 Footer 时链接无效 */
const FALLBACK_LANG = "zh-CN";

export function Footer() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : FALLBACK_LANG;
  const prefix = `/${lang}`;

  return (
    <footer className="blog-border-x-box-shadow bg-background">
      <div className="container mx-auto px-4">
        <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 关于我们 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">关于 BlogNext</h3>
            <p className="text-sm text-muted-foreground">基于 Next.js 15 和 Drizzle ORM 构建的现代化博客系统</p>
          </div>

          {/* 快速链接 —— 使用 next/link 且带语言前缀，符合 App Router i18n 路由 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">快速链接</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`${prefix}/blog`} className="hover:text-foreground transition-colors">
                  博客文章
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/categories`} className="hover:text-foreground transition-colors">
                  文章分类
                </Link>
              </li>
              <li>
                <Link href={`${prefix}/tags`} className="hover:text-foreground transition-colors">
                  标签云
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">联系我们</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>邮箱: contact@blognext.com</li>
            </ul>
          </div>

          {/* 订阅 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">订阅更新</h3>
            <p className="text-sm text-muted-foreground">获取最新的博客文章和更新通知</p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="输入邮箱地址"
                className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                订阅
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="blog-border-x-box-shadow py-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 BlogNext. 保留所有权利。</p>
      </div>
    </footer>
  );
}
