import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { BookOpen, Compass, LayoutGrid, Library, Newspaper, Sparkles } from "lucide-react";

import { HomeAmbientBackground } from "@/components/home/home-ambient-background";
import { HomeDarkStarfield } from "@/components/home/home-dark-starfield";
import { HomeGlassRain } from "@/components/home/home-glass-rain";
import { HomeLightMist } from "@/components/home/home-light-mist";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db/config";
import { categories } from "@/lib/db/schema";
import { getDictionary } from "@/lib/dictionaries";
import { postService } from "@/lib/services/post.service";
import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import type { Locale } from "@/types";

// 首页依赖数据库实时数据，强制运行时渲染，避免 Docker/CI 构建阶段预渲染触发连库失败。
export const dynamic = "force-dynamic";

/** 日期展示与 [lang] 对齐 */
const dateLocale: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  "en-US": "en-US",
  "ja-JP": "ja-JP",
};

function formatPostDate(d: Date | string | null | undefined, lang: Locale) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(dateLocale[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 列表接口返回的文章条目（含作者与分类摘要字段） */
type HomePost = Awaited<ReturnType<typeof postService.getPosts>>["data"][number];

type HomeTopic = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

/**
 * 首页文章卡片：服务端渲染，无客户端交互，利于 SEO 与首屏速度。
 * 封面图使用 unoptimized，兼容任意图床域名。
 */
function HomePostCard({
  post,
  lang,
  isHero,
  readMore,
  viewsLabel,
}: {
  post: HomePost;
  lang: Locale;
  isHero: boolean;
  readMore: string;
  viewsLabel: string;
}) {
  const href = `/${lang}/blog/${post.slug}`;
  const excerpt = stripMarkdownForExcerpt((post.excerpt ?? "").trim());
  const authorLabel = post.author?.displayName || post.author?.username || "";
  const categoryName = post.category?.name;

  return (
    <div className="blog-card-container">
      {/* 玻璃拟态：底色与模糊刻意偏轻，让首页雪花/雨景能透过来；悬停时略加深以保证可读性 */}
      <article
        className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-0 bg-white/[0.05] shadow-none backdrop-blur-md transition-all duration-500 hover:bg-white/[0.12] hover:shadow-2xl hover:shadow-primary/20 dark:bg-black/[0.05] dark:hover:bg-black/[0.12] dark:hover:shadow-primary/25 ${
          isHero ? "lg:min-h-[17rem] lg:flex-row" : ""
        }`}
      >
        <div
          className="absolute left-0 right-0 top-0 z-10 h-1 bg-gradient-to-r from-primary via-secondary to-accent"
          aria-hidden
        />

        <Link
          href={href}
          className={`relative block shrink-0 overflow-hidden bg-white/5 dark:bg-black/20 ${
            isHero ? "aspect-[16/10] lg:aspect-auto lg:w-[46%] lg:min-h-full" : "aspect-[16/10]"
          }`}
          aria-label={post.title}
        >
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes={
                isHero ? "(max-width:1024px) 100vw, 46vw" : "(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              }
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/25 via-white/10 to-secondary/20 dark:from-primary/30 dark:via-black/20 dark:to-secondary/25"
              aria-hidden
            >
              <BookOpen className="h-14 w-14 text-foreground/30 dark:text-foreground/40" strokeWidth={1.25} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-90 lg:opacity-70" />
        </Link>

        <div className="relative z-[1] flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-foreground/65 dark:text-foreground/60">
            {categoryName ? (
              <span className="inline-flex max-w-full items-center truncate rounded-lg bg-gradient-to-r from-primary/90 to-primary/70 px-2.5 py-1 text-xs font-medium text-white shadow-md backdrop-blur-sm">
                {categoryName}
              </span>
            ) : null}
            <time dateTime={post.publishedAt ? String(post.publishedAt) : undefined}>
              {formatPostDate(post.publishedAt, lang)}
            </time>
            {authorLabel ? <span className="text-foreground/55">· {authorLabel}</span> : null}
          </div>

          <h2 className="mb-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            <Link href={href} className="transition-colors hover:text-primary">
              {post.title}
            </Link>
          </h2>

          {excerpt ? (
            <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground/70 dark:text-foreground/65 sm:text-[0.9375rem]">
              {excerpt}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <span className="text-xs text-foreground/60 sm:text-sm">
              {typeof post.viewCount === "number" ? (
                <>
                  {post.viewCount}
                  <span className="ml-1 text-foreground/50">{viewsLabel}</span>
                </>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-primary hover:bg-white/15 dark:hover:bg-white/10"
              asChild
            >
              <Link href={href}>{readMore}</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const h = dict.home;
  const readMore = dict.common.readMore;
  const viewsLabel = dict.common.views;

  let latest: HomePost[] = [];
  let topics: HomeTopic[] = [];

  try {
    const [postsResult, topicRows] = await Promise.all([
      // 不传 sortBy：与 GET /api/posts、博客列表默认一致，按 COALESCE(publishedAt, updatedAt, createdAt) 最近优先。
      // 若只按 publishedAt 排序，历史上 publishedAt 为空的已发布文章会排在博客靠前、首页却靠后或进不了前 6 条。
      postService.getPosts({
        status: "published",
        visibility: "public",
        page: 1,
        limit: 6,
        sortOrder: "desc",
      }),
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
        })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder))
        .limit(12),
    ]);
    latest = postsResult.data as HomePost[];
    topics = topicRows;
  } catch (e) {
    console.error("[home] 数据加载失败:", e);
  }

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <HomeAmbientBackground />
      {/* 深色：雪花精灵；浅色：朦胧雾气（互斥，由各自组件内 theme 判断） */}
      <HomeDarkStarfield />
      <HomeLightMist />
      {/* Three.js 全屏着色器玻璃雨景，叠在背景之上、内容之下（fixed + 透明混合） */}
      <HomeGlassRain />
      <div className="relative z-10">
        {/* 首屏：与博客列表页相同的整体渐变氛围 */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent dark:from-primary/10" />
          <div className="container relative mx-auto px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 md:pb-20 md:pt-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border-0 bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-none backdrop-blur-xl dark:bg-black/10 sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                {h.pill}
              </div>
              <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                {dict.blog.title}
              </h1>
              <p className="mb-8 max-w-2xl text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg md:text-xl">
                {dict.blog.subtitle}
              </p>
              <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={`/${lang}/blog`}>{h.ctaRead}</Link>
                </Button>
                <Button
                  variant="glass"
                  size="lg"
                  className="w-full !border-0 bg-white/10 shadow-none backdrop-blur-xl hover:scale-100 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 sm:w-auto"
                  asChild
                >
                  <Link href={`/${lang}/categories`}>{h.ctaTopics}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full text-foreground hover:bg-white/10 dark:hover:bg-white/5 sm:w-auto"
                  asChild
                >
                  <Link href={`/${lang}/tags`}>{h.ctaTags}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 分类：移动端横向滑动，桌面端网格 */}
        {topics.length > 0 ? (
          <section className="py-10 sm:py-12 md:py-14">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-6 flex flex-col gap-2 sm:mb-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {h.sectionTopics}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-foreground/70 sm:text-base">{h.sectionTopicsDesc}</p>
                </div>
                <Link
                  href={`/${lang}/categories`}
                  className="mt-2 text-sm font-medium text-primary hover:underline md:mt-0"
                >
                  {h.seeAll} →
                </Link>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 pt-0.5 [scrollbar-width:none] sm:-mx-0 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/${lang}/blog?categoryId=${topic.id}`}
                    className="min-w-[11rem] max-w-[14rem] shrink-0 snap-start rounded-2xl border-0 bg-white/10 p-4 shadow-none backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:shadow-lg hover:shadow-primary/10 dark:bg-black/10 dark:hover:bg-black/20 sm:min-w-0 sm:max-w-none sm:flex-1 sm:basis-[calc(50%-0.375rem)] lg:basis-[calc(25%-0.45rem)]"
                  >
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Library className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="line-clamp-1 font-medium text-foreground">{topic.name}</span>
                    </div>
                    {topic.description ? (
                      <p className="line-clamp-2 text-xs leading-relaxed text-foreground/65">{topic.description}</p>
                    ) : (
                      <p className="text-xs text-transparent"> </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 最新文章 */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{h.sectionLatest}</h2>
                <p className="mt-1 max-w-xl text-sm text-foreground/70 sm:text-base">{h.sectionLatestDesc}</p>
              </div>
              <Button
                variant="glass"
                size="sm"
                className="w-fit shrink-0 !border-0 bg-white/10 shadow-none backdrop-blur-xl hover:scale-100 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
                asChild
              >
                <Link href={`/${lang}/blog`}>{h.seeAll}</Link>
              </Button>
            </div>

            {latest.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-0 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-sm dark:bg-black/[0.04]">
                <Newspaper className="mb-4 h-12 w-12 text-foreground/40" strokeWidth={1.25} />
                <p className="max-w-md text-sm leading-relaxed text-foreground/70 sm:text-base">{h.empty}</p>
                <Button className="mt-6" asChild>
                  <Link href={`/${lang}/blog`}>{h.ctaRead}</Link>
                </Button>
              </div>
            ) : (
              <div className="blog-grid grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {latest.map((post, index) => (
                  <div key={post.id} className={index === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
                    <HomePostCard
                      post={post}
                      lang={lang}
                      isHero={index === 0}
                      readMore={readMore}
                      viewsLabel={viewsLabel}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 阅读体验：产品向说明，不涉及实现技术栈 */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-foreground sm:mb-10 sm:text-2xl">
              {h.valueTitle}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              <div className="rounded-2xl border-0 bg-white/[0.03] p-6 text-center shadow-none backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-primary/10 dark:bg-black/[0.04] dark:hover:bg-black/[0.08]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <BookOpen className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{h.value1Title}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{h.value1Desc}</p>
              </div>
              <div className="rounded-2xl border-0 bg-white/[0.03] p-6 text-center shadow-none backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-primary/10 dark:bg-black/[0.04] dark:hover:bg-black/[0.08]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <LayoutGrid className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{h.value2Title}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{h.value2Desc}</p>
              </div>
              <div className="rounded-2xl border-0 bg-white/[0.03] p-6 text-center shadow-none backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-primary/10 dark:bg-black/[0.04] dark:hover:bg-black/[0.08]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Compass className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{h.value3Title}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{h.value3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 底部 CTA */}
        <section className="py-12 sm:py-14 md:py-16">
          <div className="container mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="mb-3 text-xl font-semibold text-foreground sm:text-2xl">{h.bottomTitle}</h2>
            <p className="mb-8 text-sm text-foreground/70 sm:text-base">{h.bottomDesc}</p>
            <Button variant="gradient" size="lg" asChild>
              <Link href={`/${lang}/blog`}>{h.bottomCta}</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
