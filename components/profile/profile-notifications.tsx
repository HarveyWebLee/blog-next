"use client";

import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, CardBody, Chip } from "@heroui/react";
import {
  AtSign,
  Bell,
  Check,
  Filter,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";

interface ProfileNotificationsProps {
  lang: string;
}

interface Notification {
  id: number;
  userId: number;
  type: "comment" | "like" | "follow" | "mention" | "system";
  title: string;
  content?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationIcons = {
  comment: MessageSquare,
  like: Heart,
  follow: UserPlus,
  mention: AtSign,
  system: Settings,
};

const notificationColors = {
  comment: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  like: "text-red-500 bg-red-50 dark:bg-red-900/20",
  follow: "text-green-500 bg-green-50 dark:bg-green-900/20",
  mention: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  system: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
};

const notificationLabels = {
  comment: "评论",
  like: "点赞",
  follow: "关注",
  mention: "提及",
  system: "系统",
};

export default function ProfileNotifications({ lang }: ProfileNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 这里应该调用真实的API
        // const response = await fetch('/api/profile/notifications');
        // const data = await response.json();

        // 模拟数据
        setTimeout(() => {
          setNotifications([
            {
              id: 1,
              userId: 1,
              type: "comment",
              title: "新的评论",
              content: "用户 @developer 在您的文章《如何学习React Hooks》下发表了评论",
              data: { postId: 101, commentId: 201, authorId: 2 },
              isRead: false,
              createdAt: new Date(Date.now() - 30 * 60 * 1000),
            },
            {
              id: 2,
              userId: 1,
              type: "like",
              title: "文章被点赞",
              content: "用户 @reactdev 点赞了您的文章《Vue.js 3.0 新特性详解》",
              data: { postId: 102, likerId: 3 },
              isRead: false,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
              id: 3,
              userId: 1,
              type: "follow",
              title: "新的关注者",
              content: "用户 @frontenddev 开始关注您",
              data: { followerId: 4 },
              isRead: false,
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            },
            {
              id: 4,
              userId: 1,
              type: "mention",
              title: "被提及",
              content: "用户 @backenddev 在评论中提到了您",
              data: { postId: 103, commentId: 202, authorId: 5 },
              isRead: true,
              readAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
            },
            {
              id: 5,
              userId: 1,
              type: "system",
              title: "系统通知",
              content: "您的账户安全设置已更新",
              data: { action: "security_update" },
              isRead: true,
              readAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("获取通知列表失败:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesRead =
      readFilter === "all" ||
      (readFilter === "read" && notification.isRead) ||
      (readFilter === "unread" && !notification.isRead);
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      // 这里应该调用真实的API
      // await fetch('/api/profile/notifications', {
      //   method: 'PUT',
      //   body: JSON.stringify({ notificationIds: [notificationId] })
      // });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n))
      );
    } catch (error) {
      console.error("标记通知失败:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // 这里应该调用真实的API
      // await fetch('/api/profile/notifications', {
      //   method: 'PUT',
      //   body: JSON.stringify({ markAllAsRead: true })
      // });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
    } catch (error) {
      console.error("标记所有通知失败:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      // 这里应该调用真实的API
      // await fetch(`/api/profile/notifications?id=${notificationId}`, { method: 'DELETE' });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("删除通知失败:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
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
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">通知中心</h1>
          <p className="text-gray-500 dark:text-gray-400">管理您的通知消息</p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge content={unreadCount} color="danger" variant="solid">
              <Bell className="w-5 h-5" />
            </Badge>
          )}
          <Button color="primary" variant="flat" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            全部标记为已读
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                <option value="comment">评论</option>
                <option value="like">点赞</option>
                <option value="follow">关注</option>
                <option value="mention">提及</option>
                <option value="system">系统</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="unread">未读</option>
                <option value="read">已读</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 通知列表 */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const Icon = notificationIcons[notification.type];
          const colorClass = notificationColors[notification.type];
          const label = notificationLabels[notification.type];

          return (
            <Card
              key={notification.id}
              className={`hover:shadow-lg transition-shadow ${
                !notification.isRead ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <CardBody className="p-6">
                <div className="flex items-start space-x-3">
                  {/* 通知图标 */}
                  <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* 通知内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              notification.type === "comment"
                                ? "primary"
                                : notification.type === "like"
                                  ? "danger"
                                  : notification.type === "follow"
                                    ? "success"
                                    : notification.type === "mention"
                                      ? "secondary"
                                      : "default"
                            }
                          >
                            {label}
                          </Chip>
                          {!notification.isRead && <Badge content="新" color="danger" size="sm" />}
                        </div>

                        {notification.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{notification.content}</p>
                        )}

                        {/* 通知时间 */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.readAt && <span>已读于 {formatTimeAgo(notification.readAt)}</span>}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            color="success"
                            startContent={<Check className="w-4 h-4" />}
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            标记为已读
                          </Button>
                        )}
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          color="danger"
                          startContent={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          删除
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          startContent={<MoreHorizontal className="w-4 h-4" />}
                        >
                          更多
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredNotifications.length === 0 && !loading && (
        <Card>
          <CardBody className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {typeFilter !== "all" || readFilter !== "all" ? "没有找到匹配的通知" : "暂无通知"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {typeFilter !== "all" || readFilter !== "all" ? "尝试调整筛选条件" : "当有新的活动时，您会在这里收到通知"}
            </p>
            <Button color="primary" variant="flat">
              刷新通知
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
