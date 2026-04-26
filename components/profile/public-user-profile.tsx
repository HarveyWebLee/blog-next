"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { BarChart3, CheckCheck, Clock3, Github, Mail, QrCode, Search } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { message } from "@/lib/utils";
import type { ApiResponse, PostData, ProfileStats, UserActivity } from "@/types/blog";

type PublicProfileData = {
  blocked: boolean;
  reason?: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    email?: string;
    socialLinks?: {
      github?: string;
      wechatQr?: string;
      douyin?: string;
      bilibili?: string;
    };
  };
  stats: ProfileStats | null;
  recentActivities: UserActivity[];
  posts: {
    data: PostData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  filters: {
    categories: Array<{ id: number; name: string }>;
    tags: Array<{ id: number; name: string }>;
  };
  visibility?: {
    isSelf?: boolean;
    isFollower?: boolean;
    isFollowedByTarget?: boolean;
  };
};

interface PublicUserProfileProps {
  lang: string;
  userId: number;
}

export default function PublicUserProfile({ lang, userId }: PublicUserProfileProps) {
  const router = useRouter();
  const t =
    lang === "en-US"
      ? {
          loading: "Loading profile...",
          empty: "No posts yet",
          blocked: "Profile is not visible to you",
          searchPlaceholder: "Search post title/content",
          allCategories: "All categories",
          allTags: "All tags",
          recentPosts: "Recent posts",
          loadMore: "Load more",
          stats: "Stats",
          recentActivities: "Recent activities",
          email: "Email",
          github: "GitHub",
          wechatQr: "WeChat QR",
          postsFound: "posts",
          follow: "Follow",
          followBack: "Follow Back",
          mutualFollowing: "Mutual Following",
          following: "Following",
          unfollow: "Unfollow",
          followSuccess: "Followed successfully",
          unfollowSuccess: "Unfollowed",
          followFailed: "Follow failed",
          unfollowFailed: "Unfollow failed",
          needLogin: "Please login first",
          mutualHint: "Mutual following in progress",
        }
      : lang === "ja-JP"
        ? {
            loading: "プロフィールを読み込み中...",
            empty: "まだ記事がありません",
            blocked: "このプロフィールは閲覧できません",
            searchPlaceholder: "記事タイトル/内容で検索",
            allCategories: "すべてのカテゴリ",
            allTags: "すべてのタグ",
            recentPosts: "最新記事",
            loadMore: "もっと見る",
            stats: "統計",
            recentActivities: "最近の活動",
            email: "メール",
            github: "GitHub",
            wechatQr: "WeChat QR",
            postsFound: "件の記事",
            follow: "フォロー",
            followBack: "フォローバック",
            mutualFollowing: "相互フォロー",
            following: "フォロー中",
            unfollow: "フォロー解除",
            followSuccess: "フォローしました",
            unfollowSuccess: "フォロー解除しました",
            followFailed: "フォローに失敗しました",
            unfollowFailed: "フォロー解除に失敗しました",
            needLogin: "先にログインしてください",
            mutualHint: "相互フォロー中です",
          }
        : {
            loading: "正在加载用户资料...",
            empty: "该用户暂未发布文章",
            blocked: "该用户资料当前对你不可见",
            searchPlaceholder: "按文章标题或内容筛选",
            allCategories: "全部分类",
            allTags: "全部标签",
            recentPosts: "最新文章",
            loadMore: "查看更多",
            stats: "数据统计",
            recentActivities: "最近活动",
            email: "邮箱",
            github: "GitHub",
            wechatQr: "微信二维码",
            postsFound: "篇文章",
            follow: "关注",
            followBack: "回关",
            mutualFollowing: "已互关",
            following: "已关注",
            unfollow: "取消关注",
            followSuccess: "关注成功",
            unfollowSuccess: "已取消关注",
            followFailed: "关注失败",
            unfollowFailed: "取消关注失败",
            needLogin: "请先登录",
            mutualHint: "当前为互相关注关系",
          };

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [favoritedMap, setFavoritedMap] = useState<Record<number, boolean>>({});
  const [likeLoadingMap, setLikeLoadingMap] = useState<Record<number, boolean>>({});
  const [favoriteLoadingMap, setFavoriteLoadingMap] = useState<Record<number, boolean>>({});
  const lastActionAtRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setPage(1);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, categoryId, tagId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: "6",
        });
        if (search.trim()) qs.set("search", search.trim());
        if (categoryId) qs.set("categoryId", categoryId);
        if (tagId) qs.set("tagId", tagId);
        qs.set("_ts", String(Date.now()));

        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const res = await fetch(`/api/profile/public/${userId}?${qs.toString()}`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = (await res.json()) as ApiResponse<PublicProfileData>;
        if (!json.success || !json.data) {
          message.error(json.message || "加载失败");
          return;
        }
        if (cancelled) return;
        setProfile(json.data);
        setIsFollowing(Boolean(json.data.visibility?.isFollower));
        const list = json.data.posts?.data || [];
        setPosts((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasNext(Boolean(json.data.posts?.pagination?.hasNext));
      } catch (error) {
        console.error("加载公开资料失败:", error);
        message.error("加载失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [userId, page, search, categoryId, tagId]);

  useEffect(() => {
    if (posts.length === 0) {
      setLikedMap({});
      setFavoritedMap({});
      return;
    }

    let cancelled = false;
    const loadEngagement = async () => {
      try {
        const ids = posts.map((p) => p.id).join(",");
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const res = await fetch(`/api/posts/engagement?ids=${ids}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        const list = Array.isArray(json?.data)
          ? (json.data as Array<{ id: number; liked: boolean; favorited: boolean }>)
          : [];
        if (cancelled) return;
        const nextLiked: Record<number, boolean> = {};
        const nextFavorited: Record<number, boolean> = {};
        for (const item of list) {
          nextLiked[item.id] = Boolean(item.liked);
          nextFavorited[item.id] = Boolean(item.favorited);
        }
        setLikedMap(nextLiked);
        setFavoritedMap(nextFavorited);
      } catch (error) {
        console.error("加载公开页互动状态失败:", error);
      }
    };
    void loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [posts]);

  const requireLoginToken = (): string | null => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      message.warning(t.needLogin);
      router.push(`/${lang}/auth/login`);
      return null;
    }
    return token;
  };

  const handleToggleLike = async (postId: number) => {
    const likeKey = `like:${postId}`;
    const now = Date.now();
    const lastAt = lastActionAtRef.current[likeKey] || 0;
    if (now - lastAt < 300) return;
    lastActionAtRef.current[likeKey] = now;
    const token = requireLoginToken();
    if (!token) return;
    setLikeLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as ApiResponse<{ liked: boolean; likeCount: number }>;
      if (!json.success || !json.data) {
        message.error(json.message || "点赞失败");
        return;
      }
      setLikedMap((prev) => ({ ...prev, [postId]: Boolean(json.data?.liked) }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likeCount: Number(json.data?.likeCount || p.likeCount || 0) } : p))
      );
    } catch (error) {
      console.error("公开页点赞失败:", error);
      message.error("点赞失败");
    } finally {
      setLikeLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleFavorite = async (postId: number) => {
    const favoriteKey = `favorite:${postId}`;
    const now = Date.now();
    const lastAt = lastActionAtRef.current[favoriteKey] || 0;
    if (now - lastAt < 300) return;
    lastActionAtRef.current[favoriteKey] = now;
    const token = requireLoginToken();
    if (!token) return;
    setFavoriteLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as ApiResponse<{ favorited: boolean; favoriteCount: number }>;
      if (!json.success || !json.data) {
        message.error(json.message || "收藏失败");
        return;
      }
      setFavoritedMap((prev) => ({ ...prev, [postId]: Boolean(json.data?.favorited) }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, favoriteCount: Number(json.data?.favoriteCount || p.favoriteCount || 0) } : p
        )
      );
    } catch (error) {
      console.error("公开页收藏失败:", error);
      message.error("收藏失败");
    } finally {
      setFavoriteLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleFollowToggle = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      message.warning(t.needLogin);
      router.push(`/${lang}/auth/login`);
      return;
    }
    if (!profile || profile.visibility?.isSelf) return;
    try {
      setFollowLoading(true);
      if (isFollowing) {
        const res = await fetch(`/api/profile/follow/${profile.user.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as ApiResponse;
        if (!json.success) {
          message.error(json.message || t.unfollowFailed);
          return;
        }
        setIsFollowing(false);
        message.success(t.unfollowSuccess);
      } else {
        const res = await fetch("/api/profile/follow", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId: profile.user.id }),
        });
        const json = (await res.json()) as ApiResponse;
        if (!json.success && res.status !== 409) {
          message.error(json.message || t.followFailed);
          return;
        }
        setIsFollowing(true);
        message.success(t.followSuccess);
      }
    } catch (error) {
      console.error("关注状态切换失败:", error);
      message.error(isFollowing ? t.unfollowFailed : t.followFailed);
    } finally {
      setFollowLoading(false);
    }
  };

  /**
   * 关注按钮状态机：
   * 1) not following + not followedByTarget => 关注
   * 2) not following + followedByTarget => 回关
   * 3) following + followedByTarget => 已互关（禁用，避免误触）
   * 4) following + not followedByTarget => 取消关注
   */
  const relationState = useMemo(() => {
    const followedByTarget = Boolean(profile?.visibility?.isFollowedByTarget);
    if (isFollowing && followedByTarget) {
      return {
        label: t.mutualFollowing,
        color: "success" as const,
        variant: "flat" as const,
        disabled: true,
      };
    }
    if (isFollowing) {
      return {
        label: t.unfollow,
        color: "default" as const,
        variant: "flat" as const,
        disabled: false,
      };
    }
    if (followedByTarget) {
      return {
        label: t.followBack,
        color: "success" as const,
        variant: "solid" as const,
        disabled: false,
      };
    }
    return {
      label: t.follow,
      color: "primary" as const,
      variant: "solid" as const,
      disabled: false,
    };
  }, [isFollowing, profile?.visibility?.isFollowedByTarget, t.follow, t.followBack, t.mutualFollowing, t.unfollow]);

  const displayStats = useMemo(() => {
    if (!profile?.stats) return [];
    return [
      { key: "totalPosts", label: "Posts", value: profile.stats.totalPosts },
      { key: "totalViews", label: "Views", value: profile.stats.totalViews },
      { key: "totalLikes", label: "Likes", value: profile.stats.totalLikes },
      { key: "totalFollowers", label: "Followers", value: profile.stats.totalFollowers },
    ];
  }, [profile?.stats]);

  if (loading && profile == null) {
    return (
      <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
        <CardBody className="py-16 text-center">
          <Spinner color="primary" />
          <p className="mt-3 text-default-500">{t.loading}</p>
        </CardBody>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
        <CardBody className="py-16 text-center text-default-500">{t.loading}</CardBody>
      </Card>
    );
  }

  if (profile.blocked) {
    return (
      <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
        <CardBody className="py-16 text-center">
          <Avatar
            className="mx-auto mb-3"
            src={profile.user.avatar || undefined}
            name={profile.user.displayName || profile.user.username}
            size="lg"
          />
          <p className="text-lg font-semibold text-foreground">{profile.user.displayName}</p>
          <p className="mt-2 text-default-500">{profile.reason || t.blocked}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
        <CardBody className="space-y-4 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar src={profile.user.avatar || undefined} name={profile.user.displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-foreground">{profile.user.displayName}</p>
              <p className="text-sm text-default-500">@{profile.user.username}</p>
              {profile.user.bio && <p className="mt-2 text-sm text-default-600">{profile.user.bio}</p>}
            </div>
            {!profile.visibility?.isSelf && (
              <Tooltip
                content={relationState.disabled ? t.mutualHint : ""}
                isDisabled={!relationState.disabled}
                placement="top"
              >
                <Button
                  color={relationState.color}
                  variant={relationState.variant}
                  className={
                    relationState.disabled
                      ? "border-2 border-success/70 bg-success/25 text-success-700 dark:text-success-300 font-semibold shadow-sm shadow-success/25 hover:bg-success/25"
                      : undefined
                  }
                  size={relationState.disabled ? "md" : "sm"}
                  startContent={relationState.disabled ? <CheckCheck className="h-4 w-4" /> : undefined}
                  isLoading={followLoading}
                  isDisabled={relationState.disabled}
                  onPress={() => void handleFollowToggle()}
                >
                  {relationState.disabled ? `${t.mutualFollowing}` : relationState.label}
                </Button>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {profile.user.email && (
              <Chip startContent={<Mail className="h-3.5 w-3.5" />} variant="flat">
                {t.email}: {profile.user.email}
              </Chip>
            )}
            {profile.user.socialLinks?.github && (
              <Chip
                as={Link}
                href={profile.user.socialLinks.github}
                target="_blank"
                startContent={<Github className="h-3.5 w-3.5" />}
                variant="flat"
                color="primary"
              >
                {t.github}
              </Chip>
            )}
            {profile.user.socialLinks?.wechatQr && (
              <Chip startContent={<QrCode className="h-3.5 w-3.5" />} variant="flat" color="secondary">
                {t.wechatQr}
              </Chip>
            )}
          </div>
          {profile.user.socialLinks?.wechatQr && (
            <div className="max-w-[220px] rounded-xl border border-white/10 p-2">
              <Image
                src={profile.user.socialLinks.wechatQr}
                alt="wechat-qr"
                width={220}
                height={220}
                className="h-auto w-full rounded-lg"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {displayStats.length > 0 && (
        <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
          <CardBody className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t.stats}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {displayStats.map((item) => (
                <div key={item.key} className="rounded-xl border border-white/10 bg-white/5 p-3 dark:bg-black/10">
                  <p className="text-xs text-default-500">{item.label}</p>
                  <p className="text-xl font-bold text-foreground">{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {profile.recentActivities.length > 0 && (
        <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
          <CardBody className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Clock3 className="h-5 w-5 text-primary" />
              {t.recentActivities}
            </h3>
            <div className="space-y-2">
              {profile.recentActivities.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm dark:bg-black/10">
                  <p className="font-medium text-foreground">{a.description || a.action}</p>
                  <p className="text-xs text-default-500">{new Date(a.createdAt).toLocaleString(lang)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="border-0 bg-white/[0.03] backdrop-blur-md dark:bg-black/[0.03]">
        <CardBody className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {t.recentPosts} · {profile.posts.pagination.total} {t.postsFound}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              placeholder={t.searchPlaceholder}
              variant="bordered"
            />
            <Select
              selectedKeys={new Set([categoryId || "all"])}
              onChange={(e) => setCategoryId(e.target.value === "all" ? "" : e.target.value)}
              items={[
                { id: "all", name: t.allCategories },
                ...profile.filters.categories.map((c) => ({ id: String(c.id), name: c.name })),
              ]}
            >
              {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
            </Select>
            <Select
              selectedKeys={new Set([tagId || "all"])}
              onChange={(e) => setTagId(e.target.value === "all" ? "" : e.target.value)}
              items={[
                { id: "all", name: t.allTags },
                ...profile.filters.tags.map((tag) => ({ id: String(tag.id), name: tag.name })),
              ]}
            >
              {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
            </Select>
          </div>

          {posts.length === 0 && !loading ? (
            <div className="py-10 text-center text-default-500">{t.empty}</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  lang={lang}
                  isLiked={Boolean(likedMap[post.id])}
                  isFavorited={Boolean(favoritedMap[post.id])}
                  likeLoading={Boolean(likeLoadingMap[post.id])}
                  favoriteLoading={Boolean(favoriteLoadingMap[post.id])}
                  onToggleLike={() => void handleToggleLike(post.id)}
                  onToggleFavorite={() => void handleToggleFavorite(post.id)}
                  onView={() => router.push(`/${lang}/blog/${post.slug}`)}
                />
              ))}
            </div>
          )}

          {loadingMore && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 dark:bg-black/10">
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 w-2/3 rounded bg-default-200" />
                    <div className="h-4 w-full rounded bg-default-200" />
                    <div className="h-4 w-5/6 rounded bg-default-200" />
                    <div className="h-36 w-full rounded bg-default-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasNext && (
            <div className="text-center">
              <Button
                variant="flat"
                color="primary"
                isLoading={loadingMore}
                onPress={() => setPage((prev) => prev + 1)}
              >
                {t.loadMore}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
