"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@heroui/react";
import { Bell, BookOpen, ChevronRight, Eye, Heart, MessageSquare, Star, UserPlus, Users } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { message } from "@/lib/utils";
import type { ApiResponse, ProfileStats as ProfileStatsData } from "@/types/blog";

interface ProfileStatsProps {
  lang: string;
}

/** 语言兜底：除 en-US / ja-JP 外全部按中文展示，避免异常语言值时回退英文 */
function resolveLocale(lang: string): "zh-CN" | "en-US" | "ja-JP" {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
}

/** 统计块配色：与博客 Chip 的 primary/secondary 系协调，避免彩虹色块 */
const statsItems = [
  { key: "totalPosts", icon: BookOpen, tone: "primary" as const },
  { key: "totalComments", icon: MessageSquare, tone: "secondary" as const },
  { key: "totalViews", icon: Eye, tone: "success" as const },
  { key: "totalLikes", icon: Heart, tone: "danger" as const },
  { key: "totalFavorites", icon: Star, tone: "warning" as const },
  { key: "totalFollowers", icon: Users, tone: "primary" as const, href: "/profile/followers" },
  { key: "totalFollowing", icon: UserPlus, tone: "secondary" as const, href: "/profile/following" },
  { key: "unreadNotifications", icon: Bell, tone: "default" as const, href: "/profile/notifications?status=unread" },
];

const toneIconWrap: Record<(typeof statsItems)[number]["tone"], string> = {
  primary: "bg-primary/15 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/15 text-warning",
  default: "bg-default-200/80 text-default-600",
};

export default function ProfileStats({ lang }: ProfileStatsProps) {
  const locale = resolveLocale(lang);
  const t =
    locale === "en-US"
      ? {
          loadFailed: "Unable to load statistics",
          needLogin: "Please sign in to view your statistics.",
          login: "Sign in",
          title: "Statistics",
          subtitle: "Overview of your content and engagement.",
          lastActivity: "Last activity",
          clickableHint: "Click to view details",
          labels: {
            totalPosts: "My Posts",
            totalComments: "My Comments",
            totalViews: "Total Views",
            totalLikes: "Total Likes",
            totalFavorites: "Favorites",
            totalFollowers: "Followers",
            totalFollowing: "Following",
            unreadNotifications: "Unread",
          },
        }
      : locale === "ja-JP"
        ? {
            loadFailed: "統計情報を読み込めません",
            needLogin: "統計情報を表示するにはログインしてください。",
            login: "ログイン",
            title: "データ統計",
            subtitle: "コンテンツとエンゲージメントの概要",
            lastActivity: "最終アクティビティ",
            clickableHint: "クリックして詳細を見る",
            labels: {
              totalPosts: "自分の記事",
              totalComments: "自分のコメント",
              totalViews: "総閲覧数",
              totalLikes: "総いいね数",
              totalFavorites: "お気に入り",
              totalFollowers: "フォロワー",
              totalFollowing: "フォロー中",
              unreadNotifications: "未読通知",
            },
          }
        : {
            loadFailed: "无法加载统计信息",
            needLogin: "请先登录后查看统计信息。",
            login: "去登录",
            title: "数据统计",
            subtitle: "内容产出与互动表现一览",
            lastActivity: "最后活动",
            clickableHint: "点击查看详情",
            labels: {
              totalPosts: "我的文章",
              totalComments: "我的评论",
              totalViews: "总浏览量",
              totalLikes: "总点赞数",
              totalFavorites: "我的收藏",
              totalFollowers: "粉丝数",
              totalFollowing: "关注数",
              unreadNotifications: "未读通知",
            },
          };
  const [stats, setStats] = useState<ProfileStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setStats(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setStats(null);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/profile/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await response.json()) as ApiResponse<ProfileStatsData>;
        if (!json.success || !json.data) {
          message.error(json.message || t.loadFailed);
          setStats(null);
          return;
        }
        setStats(json.data);
      } catch (error) {
        console.error("获取统计信息失败:", error);
        message.error(t.loadFailed);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [authLoading, isAuthenticated, t.loadFailed]);

  if (!authLoading && !isAuthenticated) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6 text-center">
          <p className="text-default-500">{t.needLogin}</p>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded-lg bg-default-200" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 rounded-lg bg-default-200" />
                  <div className="h-6 rounded-lg bg-default-200" />
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6 text-center">
          <p className="text-default-500">{t.loadFailed}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="mb-4 flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-foreground">{t.title}</h3>
          <p className="text-xs text-default-500">{t.subtitle}</p>
          {stats.lastActivityAt && (
            <div className="mt-2 inline-flex w-fit rounded-large border border-default-200/60 bg-default-50/60 px-3 py-1.5 text-xs text-default-600 dark:border-default-100/10 dark:bg-default-100/5">
              {t.lastActivity}: {new Date(stats.lastActivityAt).toLocaleString(locale)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statsItems.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key as keyof ProfileStatsData] as number;
            const wrap = toneIconWrap[item.tone];
            const isLink = Boolean(item.href);

            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-default-500">
                      {t.labels[item.key as keyof typeof t.labels]}
                    </p>
                    <p className="mt-1 text-2xl font-bold leading-none tracking-tight text-foreground">
                      {value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${wrap} ring-1 ring-black/5 dark:ring-white/5`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                {isLink ? (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-default-400">
                    <span>{t.clickableHint}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </>
            );

            if (!item.href) {
              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-default-200/70 bg-content1/80 p-4 shadow-sm backdrop-blur-sm dark:border-default-100/10"
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={`/${lang}${item.href}`}
                className="rounded-xl border border-default-200/70 bg-content1/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-default-100/10"
                aria-label={t.labels[item.key as keyof typeof t.labels]}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
