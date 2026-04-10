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

const navigationItems = [
  {
    key: "overview",
    label: "概览",
    icon: User,
    href: "/profile",
  },
  {
    key: "posts",
    label: "我的文章",
    icon: BookOpen,
    href: "/profile/posts",
  },
  {
    key: "comments",
    label: "我的评论",
    icon: MessageSquare,
    href: "/profile/comments",
  },
  {
    key: "favorites",
    label: "我的收藏",
    icon: Heart,
    href: "/profile/favorites",
  },
  {
    key: "followers",
    label: "关注者",
    icon: Users,
    href: "/profile/followers",
  },
  {
    key: "activities",
    label: "活动日志",
    icon: Activity,
    href: "/profile/activities",
  },
  {
    key: "notifications",
    label: "通知中心",
    icon: Bell,
    href: "/profile/notifications",
  },
  {
    key: "settings",
    label: "账户设置",
    icon: Settings,
    href: "/profile/settings",
  },
];

export default function ProfileLayout({ children, lang, dict }: ProfileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
