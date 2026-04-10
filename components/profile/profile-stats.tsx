"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Bell, BookOpen, Eye, Heart, MessageSquare, Star, UserPlus, Users } from "lucide-react";

interface ProfileStatsProps {
  lang: string;
}

interface StatsData {
  totalPosts: number;
  totalComments: number;
  totalViews: number;
  totalLikes: number;
  totalFavorites: number;
  totalFollowers: number;
  totalFollowing: number;
  unreadNotifications: number;
  lastActivityAt?: Date;
}

const statsItems = [
  {
    key: "totalPosts",
    label: "我的文章",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    key: "totalComments",
    label: "我的评论",
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    key: "totalViews",
    label: "总浏览量",
    icon: Eye,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    key: "totalLikes",
    label: "总点赞数",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
  {
    key: "totalFavorites",
    label: "我的收藏",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    key: "totalFollowers",
    label: "粉丝数",
    icon: Users,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    key: "totalFollowing",
    label: "关注数",
    icon: UserPlus,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
  },
  {
    key: "unreadNotifications",
    label: "未读通知",
    icon: Bell,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
];

export default function ProfileStats({ lang }: ProfileStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile/stats');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          setStats({
            totalPosts: 12,
            totalComments: 45,
            totalViews: 1250,
            totalLikes: 89,
            totalFavorites: 23,
            totalFollowers: 156,
            totalFollowing: 78,
            unreadNotifications: 3,
            lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取统计信息失败:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
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
      <Card>
        <CardBody className="p-6 text-center">
          <p className="text-gray-500">无法加载统计信息</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据统计</h3>
          {stats.lastActivityAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              最后活动: {stats.lastActivityAt.toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsItems.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key as keyof StatsData] as number;

            return (
              <div
                key={item.key}
                className={`p-4 rounded-lg ${item.bgColor} transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 快速操作 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              查看我的文章
            </button>
            <button className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              管理收藏
            </button>
            <button className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
              查看通知
            </button>
            <button className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
              活动日志
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
