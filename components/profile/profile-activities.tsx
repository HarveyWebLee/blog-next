"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardBody } from "@heroui/react";
import { BookOpen, Clock, Eye, Heart, MessageSquare, MoreHorizontal, UserPlus } from "lucide-react";

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
  post_created: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  post_updated: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  comment_created: "text-green-500 bg-green-50 dark:bg-green-900/20",
  post_liked: "text-red-500 bg-red-50 dark:bg-red-900/20",
  user_followed: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  post_viewed: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
  profile_updated: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
};

const activityLabels = {
  post_created: "创建了文章",
  post_updated: "更新了文章",
  comment_created: "发表了评论",
  post_liked: "点赞了文章",
  user_followed: "关注了用户",
  post_viewed: "浏览了文章",
  profile_updated: "更新了资料",
};

export default function ProfileActivities({ lang }: ProfileActivitiesProps) {
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
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
    <Card>
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">最近活动</h3>
          <Button variant="light" size="sm" endContent={<MoreHorizontal className="w-4 h-4" />}>
            查看全部
          </Button>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.action as keyof typeof activityIcons] || Clock;
            const colorClass =
              activityColors[activity.action as keyof typeof activityColors] ||
              "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
            const label = activityLabels[activity.action as keyof typeof activityLabels] || activity.action;

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <Badge size="sm" variant="flat" color="default">
                      {formatTimeAgo(activity.createdAt)}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                  )}
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
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
            <Button variant="flat" onClick={loadMore} disabled={loading}>
              {loading ? "加载中..." : "加载更多"}
            </Button>
          </div>
        )}

        {activities.length === 0 && !loading && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无活动记录</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
