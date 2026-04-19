import { useState } from "react";
import Image from "next/image";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import dayjs from "dayjs";
import { ArrowRight, BookOpen, Calendar, Clock, Eye, Folder, Heart, Lock, MessageCircle, Star } from "lucide-react";

import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import { PostData } from "@/types/blog";

interface PostCardProps {
  post: PostData;
  lang?: string;
  onView?: () => void;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;
  isLiked?: boolean;
  isFavorited?: boolean;
  likeLoading?: boolean;
  favoriteLoading?: boolean;
}

export function PostCard({
  post,
  lang = "zh-CN",
  onView,
  onToggleLike,
  onToggleFavorite,
  isLiked = false,
  isFavorited = false,
  likeLoading = false,
  favoriteLoading = false,
}: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const resolveRoleName = (role?: string): string => {
    if (!role) return "";
    if (lang === "en-US") {
      if (role === "super_admin") return "Super Admin";
      if (role === "admin") return "Admin";
      if (role === "author") return "Author";
      return "User";
    }
    if (lang === "ja-JP") {
      if (role === "super_admin") return "スーパー管理者";
      if (role === "admin") return "管理者";
      if (role === "author") return "著者";
      return "ユーザー";
    }
    if (role === "super_admin") return "超级管理员";
    if (role === "admin") return "管理员";
    if (role === "author") return "作者";
    return "用户";
  };
  const authorLabel =
    post.author?.displayName?.trim() || resolveRoleName(post.author?.role) || post.author?.username?.trim() || "—";
  /** 统一头部元信息行高度：无分类/标签时也保留占位，避免不同卡片标题起始位置错位 */
  const hasMetaRowContent = post.visibility === "password" || Boolean(post.category) || Boolean(post.tags?.length);
  const t =
    lang === "en-US"
      ? {
          emptyExcerpt: "No excerpt",
          minutes: "min",
          liked: "Liked",
          like: "Like",
          favorite: "Favorite",
          favorited: "Favorited",
          readMore: "Read More",
        }
      : lang === "ja-JP"
        ? {
            emptyExcerpt: "概要なし",
            minutes: "分",
            liked: "いいね済み",
            like: "いいね",
            favorite: "お気に入り",
            favorited: "お気に入り済み",
            readMore: "続きを読む",
          }
        : {
            emptyExcerpt: "暂无摘要",
            minutes: "分钟",
            liked: "已点赞",
            like: "点赞",
            favorite: "收藏",
            favorited: "已收藏",
            readMore: "阅读更多",
          };

  return (
    <div className="group relative animate-fade-in-up blog-card-container">
      {/* 背景光效 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* 主卡片：底色与磨砂刻意偏淡，便于透出博客页 fixed WebGL 水波纹/极光 */}
      <Card
        className="blog-card relative w-full cursor-pointer overflow-hidden border-0 bg-white/[0.025] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.065] hover:shadow-2xl hover:shadow-primary/20 dark:bg-black/[0.025] dark:hover:bg-black/[0.065]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          // 点击标题、封面、摘要等任意非按钮区域即可进入详情；底部 HeroUI Button 会拦截，不重复跳转
          const el = e.target as HTMLElement;
          if (el.closest("button, [role='button']")) return;
          onView?.();
        }}
      >
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

        {/* 头部区域 - 固定高度 */}
        <CardHeader className="blog-card-header pb-3">
          <div className="flex flex-col gap-3 w-full">
            {/* 分类和标签组合展示区域 */}
            <div className="flex min-h-8 items-center justify-between flex-wrap gap-2">
              {post.visibility === "password" && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="warning"
                  startContent={<Lock className="h-3.5 w-3.5" />}
                  className="bg-warning/20 text-warning-700 dark:text-warning-300"
                >
                  {lang === "en-US" ? "Password" : lang === "ja-JP" ? "パスワード保護" : "密码保护"}
                </Chip>
              )}
              {/* 分类标签 - 更突出的设计 */}
              {post.category && (
                <div className="relative group/category">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg opacity-30 blur group-hover/category:opacity-60 transition-opacity"></div>
                  <Chip
                    size="md"
                    variant="shadow"
                    color="primary"
                    startContent={<Folder className="w-3.5 h-3.5" />}
                    className="relative backdrop-blur-sm bg-gradient-to-r from-primary/90 to-primary/70 text-white font-medium shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    {post.category.name}
                  </Chip>
                </div>
              )}

              {/* 标签预览 - 仅显示最多2个 */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {post.tags.slice(0, 2).map((tag, index) => (
                    <div key={tag.slug} className="relative group/tag" style={{ animationDelay: `${index * 50}ms` }}>
                      <div
                        className="absolute -inset-0.5 rounded-full opacity-20 blur-sm group-hover/tag:opacity-50 transition-opacity"
                        style={{
                          background:
                            tag.color ||
                            "linear-gradient(to right, rgb(var(--heroui-secondary)), rgb(var(--heroui-secondary-400)))",
                        }}
                      ></div>
                      <Chip
                        size="sm"
                        variant="dot"
                        classNames={{
                          base: "relative backdrop-blur-sm bg-white/[0.06] dark:bg-black/[0.06] border border-white/25 dark:border-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/[0.11] dark:hover:bg-black/[0.11]",
                          content: "text-xs font-medium px-2",
                          dot: "w-1.5 h-1.5",
                        }}
                        style={{
                          borderColor: tag.color ? `${tag.color}40` : undefined,
                        }}
                      >
                        <span style={{ color: tag.color || undefined }}>{tag.name}</span>
                      </Chip>
                    </div>
                  ))}
                  {post.tags.length > 2 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      className="text-xs backdrop-blur-sm bg-white/[0.03] dark:bg-black/[0.03] border border-white/15 dark:border-white/10"
                    >
                      +{post.tags.length - 2}
                    </Chip>
                  )}
                </div>
              )}
              {!hasMetaRowContent && <span className="invisible h-8 w-px" aria-hidden="true" />}
            </div>

            {/* 标题 - 固定行数 */}
            <h3 className="min-h-[3.25rem] line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {post.title}
            </h3>

            {/* 摘要 - 固定行数 */}
            <p className="min-h-[3.25rem] line-clamp-2 text-small leading-6 text-default-600">
              {stripMarkdownForExcerpt(post.excerpt || "") || t.emptyExcerpt}
            </p>
          </div>
        </CardHeader>

        {/* 主体内容 - 使用flex-grow确保填充剩余空间 */}
        <CardBody className="blog-card-body py-2">
          {/* 特色图片 - 固定高度 */}
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden flex-shrink-0">
            {post.featuredImage ? (
              <>
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* 图片底部轻遮罩（悬停）：仅氛围，不叠分类文案（分类仍在卡片头部展示） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/25 via-white/5 to-secondary/20 dark:from-primary/30 dark:via-black/12 dark:to-secondary/25"
                aria-hidden="true"
              >
                <BookOpen className="w-12 h-12 text-white/80 drop-shadow-md" />
              </div>
            )}
          </div>

          {/* 元信息 - 固定在底部 */}
          <div className="meta-info mt-auto rounded-xl border border-white/8 bg-white/[0.02] p-3 backdrop-blur-sm dark:border-white/8 dark:bg-black/[0.02]">
            <div className="flex flex-col gap-2 text-small text-default-500">
              {/* 作者和发布时间 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    src={post.author?.avatar || undefined}
                    name={authorLabel}
                    className="w-6 h-6 backdrop-blur-md bg-white/[0.03] dark:bg-black/[0.03]"
                  />
                  <span className="truncate text-xs">{authorLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {dayjs(post.publishedAt || post.createdAt || post.updatedAt).format("YYYY-MM-DD")}
                  </span>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">{post.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-xs">{post.comments?.length || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {post.readTime || 5} {t.minutes}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>

        {/* 底部按钮 - 固定在底部 */}
        <CardFooter className="blog-card-footer relative z-10 border-t border-white/8 pt-3 dark:border-white/[0.06]">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              size="sm"
              variant={isLiked ? "solid" : "flat"}
              color="danger"
              startContent={<Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-current" : ""}`} />}
              isLoading={likeLoading}
              onPress={() => onToggleLike?.()}
              className={`button-hover-effect font-semibold tracking-wide ${isLiked ? "animate-button-pulse bg-gradient-to-r from-red-500 to-pink-500 shadow-lg hover:from-red-600 hover:to-pink-600 hover:shadow-xl" : "bg-white/[0.03] backdrop-blur-md hover:bg-danger/20 dark:bg-black/[0.03] dark:hover:bg-danger/20"}`}
            >
              {t.like} ({post.likeCount || 0})
            </Button>

            <Button
              size="sm"
              variant={isFavorited ? "solid" : "flat"}
              color="secondary"
              isLoading={favoriteLoading}
              startContent={<Star className={`w-4 h-4 transition-all ${isFavorited ? "fill-current" : ""}`} />}
              onPress={() => onToggleFavorite?.()}
              className="button-hover-effect bg-primary/22 text-primary-700 font-semibold tracking-wide backdrop-blur-md hover:bg-primary/30 dark:border dark:border-primary/25 dark:bg-primary/25 dark:text-white dark:hover:bg-primary/35"
            >
              {t.favorite} ({post.favoriteCount || 0})
            </Button>

            <Button
              size="sm"
              variant="bordered"
              color="primary"
              endContent={
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
              }
              onPress={() => onView?.()}
              className="button-hover-effect border-2 border-primary/25 bg-primary/5 font-semibold tracking-wide hover:border-primary/50 hover:bg-primary/15 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            >
              {t.readMore}
            </Button>
          </div>
        </CardFooter>

        {/* 悬停时玻璃高光：挂载后单次扫过（见 globals 的 animate-post-card-glass-sweep-once），避免沿用加载骨架的 infinite shimmer */}
        {isHovered && (
          <div
            className="absolute inset-0 animate-post-card-glass-sweep-once pointer-events-none rounded-2xl"
            aria-hidden
          />
        )}
      </Card>
    </div>
  );
}
