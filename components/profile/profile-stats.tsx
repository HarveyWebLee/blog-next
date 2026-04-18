"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Bell, BookOpen, Eye, Heart, MessageSquare, Star, UserPlus, Users } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { message } from "@/lib/utils";
import type { ApiResponse, ProfileStats as ProfileStatsData } from "@/types/blog";

interface ProfileStatsProps {
  lang: string;
}

/** 统计块配色：与博客 Chip 的 primary/secondary 系协调，避免彩虹色块 */
const statsItems = [
  { key: "totalPosts", icon: BookOpen, tone: "primary" as const },
  { key: "totalComments", icon: MessageSquare, tone: "secondary" as const },
  { key: "totalViews", icon: Eye, tone: "success" as const },
  { key: "totalLikes", icon: Heart, tone: "danger" as const },
  { key: "totalFavorites", icon: Star, tone: "warning" as const },
  { key: "totalFollowers", icon: Users, tone: "primary" as const },
  { key: "totalFollowing", icon: UserPlus, tone: "secondary" as const },
  { key: "unreadNotifications", icon: Bell, tone: "default" as const },
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
  const t =
    lang === "en-US"
      ? {
          loadFailed: "Unable to load statistics",
          title: "Statistics",
          lastActivity: "Last activity",
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
      : lang === "ja-JP"
        ? {
            loadFailed: "統計情報を読み込めません",
            title: "データ統計",
            lastActivity: "最終アクティビティ",
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
            title: "数据统计",
            lastActivity: "最后活动",
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

  useEffect(() => {
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
  }, [t.loadFailed]);

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
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t.title}</h3>
          {stats.lastActivityAt && (
            <p className="text-sm text-default-500">
              {t.lastActivity}: {new Date(stats.lastActivityAt).toLocaleString(lang)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {statsItems.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key as keyof ProfileStatsData] as number;
            const wrap = toneIconWrap[item.tone];

            return (
              <div
                key={item.key}
                className="rounded-xl border border-white/10 bg-white/5 p-4 dark:border-white/10 dark:bg-black/20"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${wrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-default-500">
                      {t.labels[item.key as keyof typeof t.labels]}
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
