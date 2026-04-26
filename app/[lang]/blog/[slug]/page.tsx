"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  BookOpen,
  Calendar,
  Edit,
  Eye,
  Heart,
  Lock,
  MessageCircle,
  Share2,
  Star,
  ThumbsUp,
} from "lucide-react";

import MarkdownRenderer from "@/components/blog/markdown-renderer";
import { useAuth } from "@/lib/contexts/auth-context";
import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { message } from "@/lib/utils";
import { clientBearerHeaders } from "@/lib/utils/client-bearer-auth";
import { stripMarkdownForExcerpt } from "@/lib/utils/markdown-plain";
import { PostData } from "@/types/blog";

export default function BlogDetailPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ lang: string; slug: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const lang = resolvedParams?.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          fetchFailed: "Failed to load post",
          passwordWrong: "Incorrect password, try again",
          verifyFailed: "Verification failed, try again",
          commentRequired: "Please enter comment content",
          guest: "Guest",
          commentSuccess: "Comment submitted successfully!",
          commentFailed: "Failed to submit comment, try again",
          passwordLabel: "Access Password",
          passwordPlaceholder: "Enter password",
          published: "✨ Published",
          draft: "📝 Draft",
          archived: "📦 Archived",
          unknownAuthor: "Unknown Author",
          liked: "Liked",
          like: "Like",
          commentLabel: "💭 Leave a comment",
          commentPlaceholder: "Share your thoughts...",
          submitting: "Submitting...",
          submitComment: "Post Comment",
          anonymous: "Anonymous",
          authorBadge: "Author",
          editArticle: "Edit post",
          follow: "Follow",
          following: "Following",
          followFailed: "Failed to follow, try again",
          followSuccess: "Followed",
          loginToFollow: "Please login first",
        }
      : lang === "ja-JP"
        ? {
            fetchFailed: "記事の取得に失敗しました",
            passwordWrong: "パスワードが違います",
            verifyFailed: "検証に失敗しました",
            commentRequired: "コメント内容を入力してください",
            guest: "ゲスト",
            commentSuccess: "コメントを投稿しました！",
            commentFailed: "コメント投稿に失敗しました",
            passwordLabel: "アクセスパスワード",
            passwordPlaceholder: "パスワードを入力",
            published: "✨ 公開済み",
            draft: "📝 下書き",
            archived: "📦 アーカイブ",
            unknownAuthor: "不明な著者",
            liked: "いいね済み",
            like: "いいね",
            favorited: "お気に入り済み",
            favorite: "お気に入り",
            commentLabel: "💭 コメントを投稿",
            commentPlaceholder: "ご意見をどうぞ...",
            submitting: "投稿中...",
            submitComment: "コメント投稿",
            anonymous: "匿名ユーザー",
            authorBadge: "作者",
            editArticle: "記事を編集",
            follow: "フォロー",
            following: "フォロー中",
            followFailed: "フォローに失敗しました",
            followSuccess: "フォローしました",
            loginToFollow: "先にログインしてください",
          }
        : {
            fetchFailed: "获取博客失败",
            passwordWrong: "密码错误，请重试",
            verifyFailed: "验证失败，请重试",
            commentRequired: "请输入评论内容",
            guest: "访客",
            commentSuccess: "评论提交成功！",
            commentFailed: "评论提交失败，请重试",
            passwordLabel: "访问密码",
            passwordPlaceholder: "输入密码",
            published: "✨ 已发布",
            draft: "📝 草稿",
            archived: "📦 已归档",
            unknownAuthor: "未知作者",
            liked: "已点赞",
            like: "点赞",
            favorited: "已收藏",
            favorite: "收藏",
            commentLabel: "💭 发表您的评论",
            commentPlaceholder: "写下您的想法和见解...",
            submitting: "发布中...",
            submitComment: "发表评论",
            anonymous: "匿名用户",
            authorBadge: "作者",
            editArticle: "编辑文章",
            follow: "关注",
            following: "已关注",
            followFailed: "关注失败，请重试",
            followSuccess: "关注成功",
            loginToFollow: "请先登录",
          };

  const { user, isAuthenticated } = useAuth();

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
        const unlockParam = searchParams.get("unlock");
        const unlockQuery = unlockParam ? `&unlock=${encodeURIComponent(unlockParam)}` : "";
        const response = await fetch(`/api/posts/slug/${resolvedParams.slug}?includeRelations=true${unlockQuery}`, {
          headers: {
            ...clientBearerHeaders(),
          },
        });
        const result = await response.json();

        if (result.success) {
          const postData = result.data;

          // 检查是否需要密码
          if (postData.visibility === "password" && !postData.passwordVerified) {
            setShowPasswordForm(true);
          }
          setPost(postData);
          setLikeCount(postData.likeCount || 0);
          setFavoriteCount(postData.favoriteCount || 0);
        } else {
          if (result.message.includes("密码")) {
            setShowPasswordForm(true);
          } else {
            message.error(t.fetchFailed);
            router.push("/blog");
          }
        }
      } catch (error) {
        console.error("获取博客失败:", error);
        message.error(t.fetchFailed);
        router.push("/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [resolvedParams?.slug, router, searchParams, t.fetchFailed]);

  useEffect(() => {
    if (!post?.id) return;
    let cancelled = false;
    const loadEngagement = async () => {
      try {
        const res = await fetch(`/api/posts/engagement?ids=${post.id}`, {
          headers:
            typeof window !== "undefined" && localStorage.getItem("accessToken")
              ? { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
              : undefined,
        });
        const json = await res.json();
        const state = (json?.data || [])[0];
        if (!cancelled && state) {
          setIsLiked(Boolean(state.liked));
          setIsFavorited(Boolean(state.favorited));
        }
      } catch (error) {
        console.error("加载互动状态失败:", error);
      }
    };
    void loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [post?.id, isAuthenticated]);

  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const authorId = Number(post?.authorId || post?.author?.id);
    // 作者不存在、当前用户是作者本人或未登录时，直接重置关注状态，避免展示脏数据。
    if (
      !Number.isInteger(authorId) ||
      authorId <= 0 ||
      !isAuthenticated ||
      (currentUserId != null && authorId === currentUserId)
    ) {
      setIsFollowingAuthor(false);
      return;
    }

    let cancelled = false;
    const loadFollowState = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
          if (!cancelled) setIsFollowingAuthor(false);
          return;
        }
        const response = await fetch(`/api/profile/public/${authorId}?page=1&limit=1&_ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (!cancelled) {
          setIsFollowingAuthor(Boolean(result?.data?.visibility?.isFollower));
        }
      } catch (error) {
        console.error("加载作者关注状态失败:", error);
        if (!cancelled) setIsFollowingAuthor(false);
      }
    };

    void loadFollowState();
    return () => {
      cancelled = true;
    };
  }, [post?.authorId, post?.author?.id, isAuthenticated, currentUserId]);

  // 验证密码
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const payload = await sealPasswordInRequestBody({ password }, password, "password");
      const response = await fetch(`/api/posts/slug/${resolvedParams?.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        const unlockToken = (result?.data as { unlockToken?: string } | undefined)?.unlockToken;
        if (unlockToken && resolvedParams?.slug) {
          router.replace(`/${lang}/blog/${resolvedParams.slug}?unlock=${encodeURIComponent(unlockToken)}`);
        }
        setShowPasswordForm(false);
        setPost(result.data);
      } else {
        setPasswordError(t.passwordWrong);
      }
    } catch (error) {
      console.error("验证密码失败:", error);
      setPasswordError(t.verifyFailed);
    }
  };

  // 提交评论
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      message.warning(t.commentRequired);
      return;
    }

    try {
      setSubmittingComment(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const isLoggedIn = Boolean(isAuthenticated && token);
      // 登录用户优先显示个人昵称，其次用户名；仅未登录时回退为“访客”。
      const commentAuthorName = isLoggedIn
        ? user?.displayName?.trim() || user?.username?.trim() || t.anonymous
        : t.guest;

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          postId: post?.id,
          content: comment,
          authorName: commentAuthorName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setComment("");
        message.success(t.commentSuccess);
        // 重新获取博客数据以显示新评论
        const postResponse = await fetch(`/api/posts/slug/${resolvedParams?.slug}?includeRelations=true`, {
          headers: {
            ...clientBearerHeaders(),
          },
        });
        const postResult = await postResponse.json();
        if (postResult.success) {
          setPost(postResult.data);
        }
      } else {
        message.error(`评论提交失败: ${result.message}`);
      }
    } catch (error) {
      console.error("提交评论失败:", error);
      message.error(t.commentFailed);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 点赞功能
  const handleLike = async () => {
    if (!post?.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.push(`/${lang}/auth/login`);
      return;
    }
    try {
      setLikeLoading(true);
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!result.success) {
        message.error(result.message || "点赞失败");
        return;
      }
      setIsLiked(Boolean(result.data?.liked));
      setLikeCount(Number(result.data?.likeCount || 0));
    } catch (error) {
      console.error("点赞失败:", error);
      message.error("点赞失败");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!post?.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.push(`/${lang}/auth/login`);
      return;
    }
    try {
      setFavoriteLoading(true);
      const response = await fetch(`/api/posts/${post.id}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!result.success) {
        message.error(result.message || "收藏失败");
        return;
      }
      setIsFavorited(Boolean(result.data?.favorited));
      setFavoriteCount(Number(result.data?.favoriteCount || 0));
      message.success(result.message || (result.data?.favorited ? "收藏成功" : "已取消收藏"));
    } catch (error) {
      console.error("收藏失败:", error);
      message.error("收藏失败");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleFollowAuthor = async () => {
    const authorId = Number(post?.authorId || post?.author?.id);
    if (!Number.isInteger(authorId) || authorId <= 0) return;
    if (user != null && authorId === user.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      message.warning(t.loginToFollow);
      router.push(`/${lang}/auth/login`);
      return;
    }
    try {
      setFollowLoading(true);
      const response = await fetch("/api/profile/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followingId: authorId }),
      });
      const result = await response.json();
      if (result?.success) {
        setIsFollowingAuthor(true);
        message.success(t.followSuccess);
        return;
      }
      // 已关注视为幂等成功，避免用户重复点击时产生负反馈。
      if (response.status === 409) {
        setIsFollowingAuthor(true);
        return;
      }
      message.error(result?.message || t.followFailed);
    } catch (error) {
      console.error("关注作者失败:", error);
      message.error(t.followFailed);
    } finally {
      setFollowLoading(false);
    }
  };

  /** 记录分享打点（可选登录），并优先使用系统分享或复制链接 */
  const handleShare = async () => {
    if (!post?.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    try {
      await fetch(`/api/posts/${post.id}/share`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // 打点失败不阻断后续分享
    }
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = post.title || "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* 用户取消系统分享 */
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        message.success(lang === "en-US" ? "Link copied" : lang === "ja-JP" ? "リンクをコピーしました" : "链接已复制");
      } catch {
        message.error(lang === "en-US" ? "Copy failed" : lang === "ja-JP" ? "コピーに失敗しました" : "复制失败");
      }
    }
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
              <div className="flex flex-col">
                <p className="text-xl font-bold blog-title-gradient">🔐 需要密码访问</p>
                <p className="text-small text-default-500">请输入访问密码以查看内容</p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input
                  label={t.passwordLabel}
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                  placeholder={t.passwordPlaceholder}
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
        <div className="animate-blog-slide-in-right flex items-center justify-between gap-3">
          <Button
            variant="bordered"
            size="md"
            onPress={() => router.back()}
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="hover-lift button-hover-effect"
          >
            返回上一页
          </Button>
          {/* 仅文章作者本人可见编辑入口（与 /api/posts/[id] PUT 权限一致） */}
          {isAuthenticated && user != null && (post.authorId === user.id || post.author?.id === user.id) && (
            <Button
              variant="flat"
              color="primary"
              size="lg"
              as={Link}
              href={`/${lang}/blog/manage/edit/${post.id}`}
              startContent={<Edit className="w-5 h-5" />}
              className="button-hover-effect animate-blog-scale-in delay-400 shadow-sm hover:shadow-md"
            >
              {t.editArticle}
            </Button>
          )}
        </div>

        {/* 博客头部信息 - 使用渐变色样式 */}
        <div className="animate-blog-fade-in-up delay-100">
          <Card className="card-hover-effect glass-enhanced">
            <CardBody className="p-8 space-y-6">
              {/* 标题和状态 */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <h1 className="text-4xl lg:text-5xl font-bold blog-title-gradient leading-tight">{post.title}</h1>
                  {post.excerpt && (
                    <p className="w-full text-xl text-default-600 leading-relaxed">
                      {stripMarkdownForExcerpt(post.excerpt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
                  {Number(post.authorId) > 0 ? (
                    <Link href={`/${lang}/users/${post.authorId}`} className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={post.author?.avatar || undefined}
                        name={post.author?.displayName || t.unknownAuthor}
                        className="w-8 h-8 hover-lift"
                      />
                      <span className="font-medium">{post.author?.displayName || t.unknownAuthor}</span>
                    </Link>
                  ) : (
                    <>
                      <Avatar
                        size="sm"
                        src={post.author?.avatar || undefined}
                        name={post.author?.displayName || t.unknownAuthor}
                        className="w-8 h-8 hover-lift"
                      />
                      <span className="font-medium">{post.author?.displayName || t.unknownAuthor}</span>
                    </>
                  )}
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
                {Number(post.authorId) > 0 && (!user || Number(post.authorId) !== user.id) && (
                  <div className="meta-item">
                    <Button
                      size="sm"
                      variant={isFollowingAuthor ? "flat" : "solid"}
                      color={isFollowingAuthor ? "success" : "primary"}
                      onPress={() => void handleFollowAuthor()}
                      isLoading={followLoading}
                      isDisabled={isFollowingAuthor}
                    >
                      {isFollowingAuthor ? t.following : t.follow}
                    </Button>
                  </div>
                )}
                {/* 文章状态移动到元信息区右侧，避免在标题区独占一列 */}
                <div className="w-full sm:w-auto sm:ml-auto flex justify-end">
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
                    {post.status === "published" ? t.published : post.status === "draft" ? t.draft : t.archived}
                  </Chip>
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
            <CardBody className="p-5 sm:p-8">
              <MarkdownRenderer content={post.content ?? ""} />
            </CardBody>
          </Card>

          {/* 操作按钮 - 使用渐变色按钮 */}
          <div className="animate-blog-fade-in-up delay-300 mt-4">
            <Card className="glass-enhanced">
              <CardBody className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* 左侧保留互动按钮，分享按钮独立放在右侧，避免混在同一组里 */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="flat"
                      color={isLiked ? "danger" : "default"}
                      size="lg"
                      isLoading={likeLoading}
                      onPress={handleLike}
                      startContent={<Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />}
                      className={`button-hover-effect animate-blog-scale-in delay-100 ${
                        isLiked ? "gradient-button-danger" : ""
                      }`}
                    >
                      {isLiked ? t.liked : t.like} ({likeCount})
                    </Button>
                    <Button
                      variant="flat"
                      color={isFavorited ? "secondary" : "default"}
                      size="lg"
                      isLoading={favoriteLoading}
                      onPress={handleFavorite}
                      startContent={<Star className="w-5 h-5" />}
                      className="button-hover-effect animate-blog-scale-in delay-300 gradient-button-secondary"
                    >
                      {t.favorite} ({favoriteCount})
                    </Button>
                  </div>
                  <div className="self-end sm:self-auto">
                    <Button
                      variant="flat"
                      color="primary"
                      size="lg"
                      startContent={<Share2 className="w-5 h-5" />}
                      className="button-hover-effect animate-blog-scale-in delay-200 gradient-button-primary"
                      onPress={() => void handleShare()}
                    >
                      分享文章
                    </Button>
                  </div>
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
                        label={t.commentLabel}
                        placeholder={t.commentPlaceholder}
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
                        {submittingComment ? t.submitting : t.submitComment}
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
                                    src={comment.author?.avatar || undefined}
                                    name={comment.author?.displayName || comment.authorName || t.anonymous}
                                    className="hover-lift"
                                  />
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                                      <span>{comment.author?.displayName || comment.authorName || t.anonymous}</span>
                                      {comment.authorId != null && comment.authorId === post.authorId && (
                                        <Chip size="sm" color="warning" variant="flat" className="font-medium">
                                          {t.authorBadge}
                                        </Chip>
                                      )}
                                    </div>
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
