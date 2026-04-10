import { useState } from "react";
import Image from "next/image";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import dayjs from "dayjs";
import { ArrowRight, Calendar, Clock, Eye, Folder, Heart, MessageCircle, Tag, User } from "lucide-react";

import { PostData } from "@/types/blog";

interface PostCardProps {
  post: PostData;
  onView?: () => void;
  onLike?: () => void;
}

export function PostCard({ post, onView, onLike }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group relative animate-fade-in-up blog-card-container">
      {/* 背景光效 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* 主卡片 - 使用flex布局确保高度一致 */}
      <Card
        className="blog-card relative w-full border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            <p className="text-small text-default-600 line-clamp-3 min-h-[4.5rem]">{post.excerpt || "暂无摘要"}</p>
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
              {/* 图片遮罩效果 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 图片上的分类标签（备用位置） */}
              {post.category && (
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Chip
                    size="sm"
                    variant="solid"
                    color="primary"
                    startContent={<Folder className="w-3 h-3" />}
                    className="backdrop-blur-md bg-primary/90 text-white font-medium shadow-lg"
                  >
                    {post.category.name}
                  </Chip>
                </div>
              )}
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
                    icon={<User className="w-3 h-3" />}
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
                  <span className="text-xs">{post.readTime || 5} 分钟</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>

        {/* 底部按钮 - 固定在底部 */}
        <CardFooter className="blog-card-footer pt-2 border-t border-white/10 dark:border-white/5">
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
              {isLiked ? "已点赞" : "点赞"}
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
              阅读更多
            </Button>
          </div>
        </CardFooter>

        {/* 悬停时的光效 */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
        )}
      </Card>
    </div>
  );
}
