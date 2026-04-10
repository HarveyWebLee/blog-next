"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  Heart,
  Lock,
  MessageCircle,
  Share2,
  ThumbsUp,
} from "lucide-react";

import MarkdownRenderer from "@/components/blog/markdown-renderer";
import { message } from "@/lib/utils";
import { PostData } from "@/types/blog";

export default function BlogDetailPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ lang: string; slug: string } | null>(null);
  const router = useRouter();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // 解析params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // 获取博客详情
  useEffect(() => {
    if (!resolvedParams?.slug) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/slug/${resolvedParams.slug}?includeRelations=true`);
        const result = await response.json();

        if (result.success) {
          const postData = result.data;

          // 检查是否需要密码
          if (postData.visibility === "password" && !postData.passwordVerified) {
            setShowPasswordForm(true);
          }
          console.log("postData", postData);
          setPost(postData);
        } else {
          if (result.message.includes("密码")) {
            setShowPasswordForm(true);
          } else {
            message.error("获取博客失败");
            router.push("/blog");
          }
        }
      } catch (error) {
        console.error("获取博客失败:", error);
        message.error("获取博客失败");
        router.push("/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [resolvedParams?.slug, router]);

  // 验证密码
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const response = await fetch(`/api/posts/slug/${resolvedParams?.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        setShowPasswordForm(false);
        // 重新获取博客数据
        const postResponse = await fetch(`/api/posts/slug/${resolvedParams?.slug}?includeRelations=true`);
        const postResult = await postResponse.json();
        if (postResult.success) {
          setPost(postResult.data);
        }
      } else {
        setPasswordError("密码错误，请重试");
      }
    } catch (error) {
      console.error("验证密码失败:", error);
      setPasswordError("验证失败，请重试");
    }
  };

  // 提交评论
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      message.warning("请输入评论内容");
      return;
    }

    try {
      setSubmittingComment(true);

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post?.posts.id,
          content: comment,
          authorName: "访客",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setComment("");
        message.success("评论提交成功！");
        // 重新获取博客数据以显示新评论
        const postResponse = await fetch(`/api/posts/slug/${resolvedParams?.slug}?includeRelations=true`);
        const postResult = await postResponse.json();
        if (postResult.success) {
          setPost(postResult.data);
        }
      } else {
        message.error(`评论提交失败: ${result.message}`);
      }
    } catch (error) {
      console.error("提交评论失败:", error);
      message.error("评论提交失败，请重试");
    } finally {
      setSubmittingComment(false);
    }
  };

  // 点赞功能
  const handleLike = () => {
    setIsLiked(!isLiked);
    // 这里可以添加API调用来更新点赞状态
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  // 加载状态 - 使用渐变色样式
  if (loading) {
    return (
      <div className="blog-detail-container">
        <div className="animate-blog-fade-in-up">
          <Card className="glass-enhanced">
            <CardBody className="text-center py-16">
              <div className="animate-blog-float">
                <Spinner size="lg" color="primary" />
              </div>
              <div className="mt-6 space-y-2">
                <div className="animate-blog-shimmer h-4 bg-default-200 rounded-full w-32 mx-auto"></div>
                <p className="text-default-500 animate-pulse loading-gradient">正在加载精彩内容...</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // 密码验证表单 - 使用渐变色样式
  if (showPasswordForm) {
    return (
      <div className="blog-detail-container">
        <div className="animate-blog-scale-in">
          <Card className="max-w-md mx-auto glass-enhanced hover-lift-enhanced">
            <CardHeader className="flex gap-3 pb-6">
              <div className="animate-blog-float">
                <Lock className="w-6 h-6 text-warning" />
              </div>
              <div className="flex flex-col">
                <p className="text-xl font-bold blog-title-gradient">🔐 需要密码访问</p>
                <p className="text-small text-default-500">请输入访问密码以查看内容</p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input
                  label="访问密码"
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                  placeholder="输入密码"
                  variant="bordered"
                  isRequired
                  errorMessage={passwordError}
                  isInvalid={!!passwordError}
                  className="animate-blog-slide-in-right"
                  classNames={{
                    input: "text-lg",
                    inputWrapper: "hover-lift border-2 hover:border-primary transition-colors",
                  }}
                />
                <Button
                  type="submit"
                  color="primary"
                  className="w-full button-hover-effect animate-blog-slide-in-right delay-100 gradient-button-primary"
                  size="lg"
                >
                  🔓 验证密码
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // 博客不存在状态 - 使用渐变色样式
  if (!post) {
    return (
      <div className="blog-detail-container">
        <div className="animate-blog-fade-in-up">
          <Card className="glass-enhanced">
            <CardBody className="text-center py-16">
              <div className="animate-blog-float">
                <BookOpen className="w-24 h-24 mx-auto mb-6 text-default-300" />
              </div>
              <p className="text-xl text-default-500 mb-6">博客内容不存在</p>
              <Button
                onPress={() => router.push("/blog")}
                color="primary"
                size="lg"
                className="button-hover-effect gradient-button-primary"
                startContent={<ArrowLeft className="w-4 h-4" />}
              >
                返回博客列表
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-container">
      <div className="space-y-8 animate-blog-fade-in-up">
        {/* 返回按钮 - 使用渐变色样式 */}
        <div className="animate-blog-slide-in-right">
          <Button
            variant="bordered"
            size="md"
            onPress={() => router.back()}
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="hover-lift button-hover-effect"
          >
            返回上一页
          </Button>
        </div>

        {/* 博客头部信息 - 使用渐变色样式 */}
        <div className="animate-blog-fade-in-up delay-100">
          <Card className="card-hover-effect glass-enhanced">
            <CardBody className="p-8 space-y-6">
              {/* 标题和状态 */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <h1 className="text-4xl lg:text-5xl font-bold blog-title-gradient leading-tight">{post.title}</h1>
                  {post.excerpt && <p className="text-xl text-default-600 leading-relaxed">{post.excerpt}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip
                    color={getStatusColor(post.status)}
                    variant="flat"
                    size="lg"
                    className={`animate-blog-scale-in delay-200 ${
                      post.status === "published"
                        ? "status-published"
                        : post.status === "draft"
                          ? "status-draft"
                          : "status-archived"
                    }`}
                  >
                    {post.status === "published" ? "✨ 已发布" : post.status === "draft" ? "📝 草稿" : "📦 已归档"}
                  </Chip>
                  {post.visibility === "private" && (
                    <Chip color="secondary" variant="flat" size="lg" className="animate-blog-scale-in delay-300">
                      🔒 私有
                    </Chip>
                  )}
                  {post.visibility === "password" && (
                    <Chip color="warning" variant="flat" size="lg" className="animate-blog-scale-in delay-400">
                      🔐 密码保护
                    </Chip>
                  )}
                </div>
              </div>

              {/* 特色图片 - 使用渐变色遮罩 */}
              {post.featuredImage && (
                <div className="featured-image-container w-full h-80 lg:h-96 rounded-2xl overflow-hidden hover-lift-enhanced animate-blog-scale-in delay-200">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    width={1200}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    priority
                  />
                </div>
              )}

              {/* 博客元信息 - 使用渐变色悬停效果 */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-default-500 py-4 border-y border-divider animate-blog-slide-in-right delay-300">
                <div className="meta-item flex items-center gap-2">
                  <Avatar size="sm" name={post.author?.displayName || "未知作者"} className="w-8 h-8 hover-lift" />
                  <span className="font-medium">{post.author?.displayName || "未知作者"}</span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{post.viewCount} 次浏览</span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments?.length || 0} 条评论</span>
                </div>
                <div className="meta-item flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>{post.likeCount} 个赞</span>
                </div>
              </div>

              {/* 分类和标签 - 使用渐变色样式 */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 animate-blog-slide-in-right delay-400">
                {post.category && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-default-600">📁 分类:</span>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        key={post.category?.slug}
                        variant="flat"
                        color="secondary"
                        className={`hover-lift animate-blog-scale-in delay-${500 + 0 * 100}`}
                      >
                        {post.category?.name}
                      </Chip>
                    </div>
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-default-600">🏷️ 标签:</span>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <Chip
                          key={tag.id}
                          variant="flat"
                          color="primary"
                          size="sm"
                          className={`hover-lift animate-blog-scale-in delay-${600 + index * 100}`}
                        >
                          {tag.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 博客内容 - 使用 Markdown 渲染器 */}
        <div className="animate-blog-fade-in-up delay-200">
          <Card className="glass-enhanced">
            <CardBody className="p-8">
              <MarkdownRenderer content={post.content} />
            </CardBody>
          </Card>

          {/* 操作按钮 - 使用渐变色按钮 */}
          <div className="animate-blog-fade-in-up delay-300 mt-4">
            <Card className="glass-enhanced">
              <CardBody className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="flat"
                      color={isLiked ? "danger" : "default"}
                      size="lg"
                      onPress={handleLike}
                      startContent={<Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />}
                      className={`button-hover-effect animate-blog-scale-in delay-100 ${
                        isLiked ? "gradient-button-danger" : ""
                      }`}
                    >
                      {isLiked ? "已点赞" : "点赞"} ({post.likeCount})
                    </Button>
                    <Button
                      variant="flat"
                      color="primary"
                      size="lg"
                      startContent={<Share2 className="w-5 h-5" />}
                      className="button-hover-effect animate-blog-scale-in delay-200 gradient-button-primary"
                    >
                      分享文章
                    </Button>
                    <Button
                      variant="flat"
                      color="secondary"
                      size="lg"
                      startContent={<Bookmark className="w-5 h-5" />}
                      className="button-hover-effect animate-blog-scale-in delay-300 gradient-button-secondary"
                    >
                      收藏
                    </Button>
                  </div>

                  {/* 编辑按钮 */}
                  <Button
                    variant="bordered"
                    size="lg"
                    as="a"
                    href={`/blog/manage/edit/${post.id}`}
                    startContent={<Edit className="w-5 h-5" />}
                    className="button-hover-effect animate-blog-scale-in delay-400"
                  >
                    编辑文章
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 评论区域 - 使用渐变色样式 */}
          {post.allowComments && (
            <div className="animate-blog-fade-in-up delay-400 mt-4">
              <Card className="card-hover-effect glass-enhanced">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    <p className="text-2xl font-bold blog-title-gradient">💬 评论区</p>
                    <Chip variant="flat" color="primary" size="sm">
                      {post.comments?.length || 0} 条评论
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody className="space-y-8 pt-0">
                  {/* 发表评论表单 - 使用渐变色样式 */}
                  <div className="animate-blog-slide-in-right delay-100">
                    <form onSubmit={handleCommentSubmit} className="space-y-6">
                      <Textarea
                        label="💭 发表您的评论"
                        placeholder="写下您的想法和见解..."
                        value={comment}
                        onValueChange={setComment}
                        variant="bordered"
                        minRows={4}
                        isRequired
                        className="hover-lift mt-4"
                        classNames={{
                          input: "text-base",
                          inputWrapper: "border-2 hover:border-primary transition-colors",
                        }}
                      />
                      <Button
                        type="submit"
                        color="primary"
                        size="lg"
                        isLoading={submittingComment}
                        className="button-hover-effect gradient-button-primary"
                        startContent={!submittingComment && <ThumbsUp className="w-5 h-5" />}
                      >
                        {submittingComment ? "发布中..." : "发表评论"}
                      </Button>
                    </form>
                  </div>

                  <Divider className="my-8" />

                  {/* 评论列表 - 使用渐变色样式 */}
                  {post.comments && post.comments.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-secondary" />
                        全部评论
                      </h3>
                      <div className="space-y-4">
                        {post.comments.map((comment, index) => (
                          <div key={comment.id} className={`animate-blog-slide-in-right delay-${200 + index * 100}`}>
                            <Card className="comment-card hover-lift card-hover-effect">
                              <CardBody className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <Avatar
                                    size="md"
                                    name={comment.author?.displayName || comment.authorName || "匿名用户"}
                                    className="hover-lift"
                                  />
                                  <div className="flex-1">
                                    <p className="font-semibold text-lg">
                                      {comment.author?.displayName || comment.authorName || "匿名用户"}
                                    </p>
                                    <p className="text-sm text-default-400">
                                      {new Date(comment.createdAt).toLocaleDateString("zh-CN", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-base leading-relaxed">{comment.content}</p>
                              </CardBody>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 animate-blog-scale-in delay-200">
                      <div className="animate-blog-float">
                        <MessageCircle className="w-20 h-20 mx-auto mb-6 text-default-300" />
                      </div>
                      <p className="text-xl text-default-500 mb-4">暂无评论</p>
                      <p className="text-default-400">成为第一个评论的人，分享您的想法！</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
