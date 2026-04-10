"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Activity, Bell, BookOpen, Heart, MessageSquare, Settings, User, Users } from "lucide-react";

import ProfileNavigation from "./profile-navigation";
import ProfileSidebar from "./profile-sidebar";

interface ProfileLayoutProps {
  children: React.ReactNode;
  lang: string;
  dict: any;
}

export default function ProfileLayout({ children, lang, dict }: ProfileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const labels =
    lang === "en-US"
      ? {
          overview: "Overview",
          posts: "My Posts",
          comments: "My Comments",
          favorites: "My Favorites",
          followers: "Followers",
          activities: "Activities",
          notifications: "Notifications",
          settings: "Settings",
        }
      : lang === "ja-JP"
        ? {
            overview: "概要",
            posts: "自分の記事",
            comments: "自分のコメント",
            favorites: "お気に入り",
            followers: "フォロワー",
            activities: "アクティビティ",
            notifications: "通知",
            settings: "アカウント設定",
          }
        : {
            overview: "概览",
            posts: "我的文章",
            comments: "我的评论",
            favorites: "我的收藏",
            followers: "关注者",
            activities: "活动日志",
            notifications: "通知中心",
            settings: "账户设置",
          };
  const navigationItems = [
    { key: "overview", label: labels.overview, icon: User, href: "/profile" },
    { key: "posts", label: labels.posts, icon: BookOpen, href: "/profile/posts" },
    { key: "comments", label: labels.comments, icon: MessageSquare, href: "/profile/comments" },
    { key: "favorites", label: labels.favorites, icon: Heart, href: "/profile/favorites" },
    { key: "followers", label: labels.followers, icon: Users, href: "/profile/followers" },
    { key: "activities", label: labels.activities, icon: Activity, href: "/profile/activities" },
    { key: "notifications", label: labels.notifications, icon: Bell, href: "/profile/notifications" },
    { key: "settings", label: labels.settings, icon: Settings, href: "/profile/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端侧边栏 */}
      <div className="lg:hidden">
        <ProfileSidebar
          items={navigationItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lang={lang}
        />
      </div>

      <div className="flex">
        {/* 桌面端侧边栏 */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <ProfileSidebar items={navigationItems} isOpen={true} onClose={() => {}} lang={lang} />
        </div>

        {/* 主内容区域 */}
        <div className="lg:pl-64 flex-1">
          {/* 顶部导航 */}
          <ProfileNavigation onMenuClick={() => setSidebarOpen(true)} lang={lang} />

          {/* 页面内容 */}
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
