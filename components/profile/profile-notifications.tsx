"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, Chip } from "@heroui/react";
import {
  AtSign,
  Bell,
  Check,
  Filter,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";

import {
  PROFILE_GLASS_CARD,
  PROFILE_GLASS_CARD_INTERACTIVE,
  PROFILE_NATIVE_CONTROL,
} from "@/components/profile/profile-ui-presets";
import type { ApiResponse, PaginatedResponseData, UserNotification } from "@/types/blog";

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

type NotificationListResponse = PaginatedResponseData<UserNotification>;

const notificationIcons = {
  comment: MessageSquare,
  like: Heart,
  follow: UserPlus,
  mention: AtSign,
  system: Settings,
};

const notificationColors = {
  comment: "bg-primary/15 text-primary",
  like: "bg-danger/15 text-danger",
  follow: "bg-success/15 text-success",
  mention: "bg-secondary/15 text-secondary",
  system: "bg-default-200/80 text-default-600",
};

export default function ProfileNotifications({ lang }: ProfileNotificationsProps) {
  const t =
    lang === "en-US"
      ? {
          title: "Notifications",
          subtitle: "Manage your notifications",
          markAll: "Mark all as read",
          allTypes: "All Types",
          allStatus: "All Status",
          unread: "Unread",
          read: "Read",
          isNew: "New",
          readAt: "Read",
          markRead: "Mark as read",
          del: "Delete",
          more: "More",
          emptyMatch: "No matching notifications",
          empty: "No notifications",
          emptyMatchDesc: "Try adjusting filters",
          emptyDesc: "You will receive notifications here",
          refresh: "Refresh",
          labels: { comment: "Comment", like: "Like", follow: "Follow", mention: "Mention", system: "System" },
          agoMin: "m ago",
          agoHour: "h ago",
          agoDay: "d ago",
        }
      : lang === "ja-JP"
        ? {
            title: "通知",
            subtitle: "通知を管理",
            markAll: "すべて既読",
            allTypes: "すべての種類",
            allStatus: "すべての状態",
            unread: "未読",
            read: "既読",
            isNew: "新着",
            readAt: "既読",
            markRead: "既読にする",
            del: "削除",
            more: "その他",
            emptyMatch: "一致する通知がありません",
            empty: "通知はありません",
            emptyMatchDesc: "条件を調整してください",
            emptyDesc: "新しい通知がここに表示されます",
            refresh: "更新",
            labels: {
              comment: "コメント",
              like: "いいね",
              follow: "フォロー",
              mention: "メンション",
              system: "システム",
            },
            agoMin: "分前",
            agoHour: "時間前",
            agoDay: "日前",
          }
        : {
            title: "通知中心",
            subtitle: "管理您的通知消息",
            markAll: "全部标记为已读",
            allTypes: "全部类型",
            allStatus: "全部状态",
            unread: "未读",
            read: "已读",
            isNew: "新",
            readAt: "已读于",
            markRead: "标记为已读",
            del: "删除",
            more: "更多",
            emptyMatch: "没有找到匹配的通知",
            empty: "暂无通知",
            emptyMatchDesc: "尝试调整筛选条件",
            emptyDesc: "当有新的活动时，您会在这里收到通知",
            refresh: "刷新通知",
            labels: { comment: "评论", like: "点赞", follow: "关注", mention: "提及", system: "系统" },
            agoMin: "分钟前",
            agoHour: "小时前",
            agoDay: "天前",
          };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const buildAuthHeaders = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("accessToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: "1", limit: "100" });
      if (typeFilter !== "all") {
        qs.set("type", typeFilter);
      }
      if (readFilter === "read") {
        qs.set("isRead", "true");
      } else if (readFilter === "unread") {
        qs.set("isRead", "false");
      }
      const res = await fetch(`/api/notifications?${qs.toString()}`, { headers: buildAuthHeaders() });
      const json = (await res.json()) as ApiResponse<NotificationListResponse>;
      if (!json.success || !json.data) {
        throw new Error(json.message || "获取通知失败");
      }
      const normalized: Notification[] = json.data.data.map((row) => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        title: row.title,
        content: row.content,
        data: row.data,
        isRead: row.isRead,
        readAt: row.readAt ? new Date(row.readAt) : undefined,
        createdAt: new Date(row.createdAt),
      }));
      setNotifications(normalized);
    } catch (error) {
      console.error("获取通知列表失败:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [buildAuthHeaders, readFilter, typeFilter]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ isRead: true }),
      });
      const json = (await res.json()) as ApiResponse<UserNotification>;
      if (!json.success) {
        throw new Error(json.message || "标记通知失败");
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n))
      );
    } catch (error) {
      console.error("标记通知失败:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) return;
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      const json = (await res.json()) as ApiResponse<{ updatedCount: number }>;
      if (!json.success) {
        throw new Error(json.message || "批量标记失败");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date() })));
    } catch (error) {
      console.error("标记所有通知失败:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      const json = (await res.json()) as ApiResponse<null>;
      if (!json.success) {
        throw new Error(json.message || "删除通知失败");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("删除通知失败:", error);
    }
  };

  if (loading) {
    return (
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-1/4 rounded-lg bg-default-200" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-default-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded-lg bg-default-200" />
                      <div className="h-3 w-1/2 rounded-lg bg-default-200" />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-default-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge content={unreadCount} color="danger" variant="solid">
              <Bell className="h-5 w-5" />
            </Badge>
          )}
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
            onPress={handleMarkAllAsRead}
            isDisabled={unreadCount === 0}
          >
            {t.markAll}
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card className={PROFILE_GLASS_CARD}>
        <CardBody className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 shrink-0 text-default-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`${PROFILE_NATIVE_CONTROL} min-w-[10rem]`}
              >
                <option value="all">{t.allTypes}</option>
                <option value="comment">{t.labels.comment}</option>
                <option value="like">{t.labels.like}</option>
                <option value="follow">{t.labels.follow}</option>
                <option value="mention">{t.labels.mention}</option>
                <option value="system">{t.labels.system}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className={`${PROFILE_NATIVE_CONTROL} min-w-[10rem]`}
              >
                <option value="all">{t.allStatus}</option>
                <option value="unread">{t.unread}</option>
                <option value="read">{t.read}</option>
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
          const label = t.labels[notification.type];

          return (
            <Card
              key={notification.id}
              className={`${PROFILE_GLASS_CARD_INTERACTIVE} ${!notification.isRead ? "border-l-4 border-l-primary" : ""}`}
            >
              <CardBody className="p-6">
                <div className="flex items-start gap-3">
                  {/* 通知图标 */}
                  <div className={`flex shrink-0 rounded-full p-2 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* 通知内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
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
                          {!notification.isRead && (
                            <Badge color="danger" size="sm" variant="flat">
                              {t.isNew}
                            </Badge>
                          )}
                        </div>

                        {notification.content && (
                          <p className="mb-3 text-sm text-default-600">{notification.content}</p>
                        )}

                        {/* 通知时间 */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-default-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.readAt && (
                            <span>
                              {t.readAt} {formatTimeAgo(notification.readAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="ml-0 flex shrink-0 items-center gap-1 sm:ml-4">
                        {!notification.isRead && (
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            color="success"
                            aria-label={t.markRead}
                            onPress={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          color="danger"
                          aria-label={t.del}
                          onPress={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button isIconOnly variant="light" size="sm" aria-label={t.more}>
                          <MoreHorizontal className="h-4 w-4" />
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
        <Card className={PROFILE_GLASS_CARD}>
          <CardBody className="p-12 text-center">
            <Bell className="mx-auto mb-4 h-16 w-16 text-default-300" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              {typeFilter !== "all" || readFilter !== "all" ? t.emptyMatch : t.empty}
            </h3>
            <p className="mb-6 text-default-500">
              {typeFilter !== "all" || readFilter !== "all" ? t.emptyMatchDesc : t.emptyDesc}
            </p>
            <Button
              color="primary"
              variant="flat"
              className="border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
              onPress={fetchNotifications}
            >
              {t.refresh}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
