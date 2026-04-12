"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardBody } from "@heroui/react";
import { BookOpen, Clock, Eye, Heart, MessageSquare, MoreHorizontal, UserPlus } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";

interface ProfileActivitiesProps {
  lang: string;
}

interface Activity {
  id: number;
  userId: number;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityIcons = {
  post_created: BookOpen,
  post_updated: BookOpen,
  comment_created: MessageSquare,
  post_liked: Heart,
  user_followed: UserPlus,
  post_viewed: Eye,
  profile_updated: UserPlus,
};

const activityColors = {
  post_created: "bg-primary/15 text-primary",
  post_updated: "bg-primary/15 text-primary",
  comment_created: "bg-success/15 text-success",
  post_liked: "bg-danger/15 text-danger",
  user_followed: "bg-secondary/15 text-secondary",
  post_viewed: "bg-default-200/80 text-default-600",
  profile_updated: "bg-warning/15 text-warning",
};

export default function ProfileActivities({ lang }: ProfileActivitiesProps) {
  const t =
    lang === "en-US"
      ? {
          title: "Recent Activities",
          viewAll: "View All",
          loading: "Loading...",
          loadMore: "Load More",
          empty: "No activities yet",
          labels: {
            post_created: "Created post",
            post_updated: "Updated post",
            comment_created: "Commented",
            post_liked: "Liked post",
            user_followed: "Followed user",
            post_viewed: "Viewed post",
            profile_updated: "Updated profile",
          },
          agoMin: "m ago",
          agoHour: "h ago",
          agoDay: "d ago",
        }
      : lang === "ja-JP"
        ? {
            title: "最近のアクティビティ",
            viewAll: "すべて表示",
            loading: "読み込み中...",
            loadMore: "もっと見る",
            empty: "アクティビティはありません",
            labels: {
              post_created: "記事を作成",
              post_updated: "記事を更新",
              comment_created: "コメントを投稿",
              post_liked: "記事にいいね",
              user_followed: "ユーザーをフォロー",
              post_viewed: "記事を閲覧",
              profile_updated: "プロフィールを更新",
            },
            agoMin: "分前",
            agoHour: "時間前",
            agoDay: "日前",
          }
        : {
            title: "最近活动",
            viewAll: "查看全部",
            loading: "加载中...",
            loadMore: "加载更多",
            empty: "暂无活动记录",
            labels: {
              post_created: "创建了文章",
              post_updated: "更新了文章",
              comment_created: "发表了评论",
              post_liked: "点赞了文章",
              user_followed: "关注了用户",
              post_viewed: "浏览了文章",
              profile_updated: "更新了资料",
            },
            agoMin: "分钟前",
            agoHour: "小时前",
            agoDay: "天前",
          };
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch(`/api/profile/activities?page=${page}&limit=5`);
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          const mockActivities: Activity[] = [
            {
              id: 1,
              userId: 1,
              action: "post_created",
              description: "创建了文章《如何学习React》",
              metadata: { postId: 123, postTitle: "如何学习React" },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0...",
              createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
              updatedAt: new Date(Date.now() - 30 * 60 * 1000),
            },
            {
              id: 2,
              userId: 1,
              action: "comment_created",
              description: "在文章《Vue.js最佳实践》下发表了评论",
              metadata: { postId: 122, commentId: 456 },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0...",
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
              updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
              id: 3,
              userId: 1,
              action: "post_liked",
              description: "点赞了文章《TypeScript入门指南》",
              metadata: { postId: 121, postTitle: "TypeScript入门指南" },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0...",
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
              updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            },
            {
              id: 4,
              userId: 1,
              action: "user_followed",
              description: "关注了用户 @developer",
              metadata: { followingId: 456, followingName: "developer" },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0...",
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
              updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            },
            {
              id: 5,
              userId: 1,
              action: "profile_updated",
              description: "更新了个人资料",
              metadata: { fields: ["bio", "location"] },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0...",
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
              updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          ];

          setActivities((prev) => (page === 1 ? mockActivities : [...prev, ...mockActivities]));
          setHasMore(mockActivities.length === 5);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取活动日志失败:", error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, [page]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}${t.agoMin}`;
    } else if (hours < 24) {
      return `${hours}${t.agoHour}`;
    } else {
      return `${days}${t.agoDay}`;
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && activities.length === 0) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded-lg bg-default-200" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-default-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg bg-default-200" />
                    <div className="h-3 w-1/2 rounded-lg bg-default-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t.title}</h3>
          <Button
            variant="light"
            size="sm"
            className="text-default-600"
            endContent={<MoreHorizontal className="h-4 w-4" />}
          >
            {t.viewAll}
          </Button>
        </div>

        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.action as keyof typeof activityIcons] || Clock;
            const colorClass =
              activityColors[activity.action as keyof typeof activityColors] || "bg-default-200/80 text-default-600";
            const label = t.labels[activity.action as keyof typeof t.labels] || activity.action;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 p-3 transition-colors hover:bg-white/10 dark:border-white/5 dark:hover:bg-white/5"
              >
                <div className={`rounded-full p-2 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <Badge size="sm" variant="flat" color="default" className="bg-white/10 dark:bg-black/20">
                      {formatTimeAgo(activity.createdAt)}
                    </Badge>
                  </div>
                  {activity.description && <p className="mt-1 text-sm text-default-600">{activity.description}</p>}
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-default-500">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="flat" color="primary" onPress={loadMore} isDisabled={loading}>
              {loading ? t.loading : t.loadMore}
            </Button>
          </div>
        )}

        {activities.length === 0 && !loading && (
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-default-300" />
            <p className="text-default-500">{t.empty}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
