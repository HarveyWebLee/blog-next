import { useState } from "react";
import Image from "next/image";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import dayjs from "dayjs";
import { ArrowRight, Calendar, Clock, Eye, Folder, Heart, MessageCircle, Tag } from "lucide-react";

import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import { PostData } from "@/types/blog";

interface PostCardProps {
  post: PostData;
  lang?: string;
  onView?: () => void;
  onLike?: () => void;
}

export function PostCard({ post, lang = "zh-CN", onView, onLike }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const t =
    lang === "en-US"
      ? { emptyExcerpt: "No excerpt", minutes: "min", liked: "Liked", like: "Like", readMore: "Read More" }
      : lang === "ja-JP"
        ? { emptyExcerpt: "概要なし", minutes: "分", liked: "いいね済み", like: "いいね", readMore: "続きを読む" }
        : { emptyExcerpt: "暂无摘要", minutes: "分钟", liked: "已点赞", like: "点赞", readMore: "阅读更多" };

  return (
    <div className="group relative animate-fade-in-up blog-card-container">
      {/* 背景光效 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* 主卡片 - 使用flex布局确保高度一致 */}
      <Card
        className="blog-card relative w-full border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer overflow-hidden"
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
        <CardHeader className="blog-card-header pb-2">
          <div className="flex flex-col gap-3 w-full">
            {/* 分类和标签组合展示区域 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* 分类标签 - 更突出的设计 */}
              {post.category && (
                <div className="relative group/category">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg opacity-30 blur group-hover/category:opacity-60 transition-opacity"></div>
                  <Chip
                    size="md"
                    variant="shadow"
                    color="primary"
                    startContent={<Folder className="w-3.5 h-3.5" />}
                    className="relative backdrop-blur-xl bg-gradient-to-r from-primary/90 to-primary/70 text-white font-medium shadow-lg transition-all duration-300 hover:scale-105"
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
                          base: "relative backdrop-blur-lg bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/30 dark:hover:bg-black/30",
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
                      className="text-xs backdrop-blur-lg bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10"
                    >
                      +{post.tags.length - 2}
                    </Chip>
                  )}
                </div>
              )}
            </div>

            {/* 标题 - 固定行数 */}
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
              {post.title}
            </h3>

            {/* 摘要 - 固定行数 */}
            <p className="text-small text-default-600 line-clamp-3 min-h-[4.5rem]">
              {stripMarkdownForExcerpt(post.excerpt || "") || t.emptyExcerpt}
            </p>
          </div>
        </CardHeader>

        {/* 主体内容 - 使用flex-grow确保填充剩余空间 */}
        <CardBody className="blog-card-body py-2">
          {/* 特色图片 - 固定高度 */}
          {post.featuredImage && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* 图片底部轻遮罩（悬停）：仅氛围，不叠分类文案（分类仍在卡片头部展示） */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}

          {/* 元信息 - 固定在底部 */}
          <div className="meta-info mt-auto">
            <div className="flex flex-col gap-2 text-small text-default-500">
              {/* 作者和发布时间 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    src={post.author?.avatar || undefined}
                    name={post.author?.displayName || undefined}
                    className="w-6 h-6 backdrop-blur-xl bg-white/10 dark:bg-black/10"
                  />
                  <span className="truncate text-xs">{post.author.displayName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {dayjs(post.publishedAt || post.createdAt || post.updatedAt).format("YYYY-MM-DD")}
                  </span>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between">
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
        <CardFooter className="blog-card-footer relative z-10 pt-2 border-t border-white/10 dark:border-white/5">
          <div className="flex items-center justify-between w-full">
            <Button
              size="sm"
              variant={isLiked ? "solid" : "flat"}
              color="danger"
              startContent={<Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-current" : ""}`} />}
              onPress={() => {
                setIsLiked(!isLiked);
                onLike?.();
              }}
              className={`font-semibold tracking-wide button-hover-effect ${isLiked ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl animate-button-pulse" : "backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-danger/20 dark:hover:bg-danger/20"}`}
            >
              {isLiked ? t.liked : t.like}
            </Button>

            <Button
              size="sm"
              variant="bordered"
              color="primary"
              endContent={
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
              }
              onPress={() => onView?.()}
              className="font-semibold tracking-wide border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] button-hover-effect"
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
