"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardBody } from "@heroui/react";
import {
  BookOpen,
  Clock,
  Eye,
  FolderOpen,
  Heart,
  Mail,
  MessageSquare,
  Share2,
  Shield,
  Star,
  Tag as TagIcon,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProfileDict } from "@/lib/contexts/profile-dict-context";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { message } from "@/lib/utils";
import type { ApiResponse, PaginatedResponseData, UserActivity } from "@/types/blog";

interface ProfileActivitiesProps {
  lang: string;
}

const activityIcons = {
  post_created: BookOpen,
  post_updated: BookOpen,
  post_deleted: Trash2,
  comment_created: MessageSquare,
  post_liked: Heart,
  post_unliked: Heart,
  post_favorited: Star,
  post_unfavorited: Star,
  post_shared: Share2,
  user_followed: UserPlus,
  post_viewed: Eye,
  profile_updated: UserPlus,
  category_created: FolderOpen,
  category_updated: FolderOpen,
  category_deleted: FolderOpen,
  tag_created: TagIcon,
  tag_updated: TagIcon,
  tag_deleted: TagIcon,
  newsletter_subscribed: Mail,
  newsletter_unsubscribed: Mail,
  admin_user_updated: Shield,
};

const activityColors = {
  post_created: "bg-primary/15 text-primary",
  post_updated: "bg-primary/15 text-primary",
  post_deleted: "bg-danger/15 text-danger",
  comment_created: "bg-success/15 text-success",
  post_liked: "bg-danger/15 text-danger",
  post_unliked: "bg-default-200/80 text-default-600",
  post_favorited: "bg-secondary/15 text-secondary",
  post_unfavorited: "bg-default-200/80 text-default-600",
  post_shared: "bg-primary/15 text-primary",
  user_followed: "bg-secondary/15 text-secondary",
  post_viewed: "bg-default-200/80 text-default-600",
  profile_updated: "bg-warning/15 text-warning",
  category_created: "bg-success/15 text-success",
  category_updated: "bg-success/15 text-success",
  category_deleted: "bg-warning/15 text-warning",
  tag_created: "bg-primary/15 text-primary",
  tag_updated: "bg-primary/15 text-primary",
  tag_deleted: "bg-warning/15 text-warning",
  newsletter_subscribed: "bg-primary/15 text-primary",
  newsletter_unsubscribed: "bg-default-200/80 text-default-600",
  admin_user_updated: "bg-danger/15 text-danger",
};

export default function ProfileActivities({ lang }: ProfileActivitiesProps) {
  const t = pickText(useProfileDict("activities")) as Record<string, string> & { labels?: Record<string, string> };

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setActivities([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      setPage(1);
      return;
    }

    const fetchActivities = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setActivities([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/profile/activities?page=${page}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await response.json()) as ApiResponse<PaginatedResponseData<UserActivity>>;
        if (!json.success || !json.data) {
          message.error(json.message || t.empty);
          if (page === 1) {
            setActivities([]);
            setHasMore(false);
          }
          return;
        }

        const list = json.data.data.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));

        setActivities((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(json.data.pagination.hasNext);
        setTotal(json.data.pagination.total);
      } catch (error) {
        console.error("获取活动日志失败:", error);
        message.error(t.empty);
        if (page === 1) {
          setActivities([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchActivities();
  }, [authLoading, isAuthenticated, page, t.empty]);

  if (!authLoading && !isAuthenticated) {
    return (
      <Card id="recent-activities" className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6 text-center">
          <p className="text-default-500">{t.needLogin}</p>
        </CardBody>
      </Card>
    );
  }

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
    <Card id="recent-activities" className={PROFILE_GLASS_CARD}>
      <CardBody className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t.title}</h3>
          <Badge size="sm" variant="flat" color="default" className="bg-white/10 dark:bg-black/20">
            {t.total} {total}
          </Badge>
        </div>

        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.action as keyof typeof activityIcons] || Clock;
            const colorClass =
              activityColors[activity.action as keyof typeof activityColors] || "bg-default-200/80 text-default-600";
            const label = t.labels?.[activity.action as string] || activity.action;

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
