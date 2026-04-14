"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Bell, BookOpen, FolderTree, Heart, Menu, Settings, Tags, User } from "lucide-react";

import { PROFILE_PAGE_BG } from "@/components/profile/profile-ui-presets";
import ProfileSidebar from "./profile-sidebar";

interface ProfileLayoutProps {
  children: React.ReactNode;
  lang: string;
  /** 由页面传入；布局层暂用组件内文案，保留 props 避免调用方改动 */
  dict: unknown;
}

/**
 * 个人中心布局：与博客前台共用 Header/Footer（由 ConditionalLayout 提供），
 * 本组件仅负责内容区背景、与博客列表一致的 container + 栅格、右侧导航卡片。
 */
export default function ProfileLayout({ children, lang, dict: _dict }: ProfileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const labels =
    lang === "en-US"
      ? {
          overview: "Overview",
          posts: "My Posts",
          favorites: "My Favorites",
          notifications: "Notifications",
          settings: "Settings",
          categoryManage: "Category Management",
          tagManage: "Tag Management",
          pageTitle: "Profile",
          pageSubtitle: "Account and content hub",
          openMenu: "Menu",
        }
      : lang === "ja-JP"
        ? {
            overview: "概要",
            posts: "自分の記事",
            favorites: "お気に入り",
            notifications: "通知",
            settings: "アカウント設定",
            categoryManage: "カテゴリー管理",
            tagManage: "タグ管理",
            pageTitle: "プロフィール",
            pageSubtitle: "アカウントとコンテンツ",
            openMenu: "メニュー",
          }
        : {
            overview: "概览",
            posts: "我的文章",
            favorites: "我的收藏",
            notifications: "通知中心",
            settings: "账户设置",
            categoryManage: "分类管理",
            tagManage: "标签管理",
            pageTitle: "个人中心",
            pageSubtitle: "账户与内容入口",
            openMenu: "目录",
          };

  // 仅保留已存在路由的入口，避免指向未实现的页面
  const navigationItems = [
    { key: "overview", label: labels.overview, icon: User, href: "/profile" },
    { key: "posts", label: labels.posts, icon: BookOpen, href: "/profile/posts" },
    { key: "favorites", label: labels.favorites, icon: Heart, href: "/profile/favorites" },
    { key: "notifications", label: labels.notifications, icon: Bell, href: "/profile/notifications" },
    { key: "settings", label: labels.settings, icon: Settings, href: "/profile/settings" },
    { key: "category-manage", label: labels.categoryManage, icon: FolderTree, href: "/categories/manage" },
    { key: "tag-manage", label: labels.tagManage, icon: Tags, href: "/tags/manage" },
  ];

  return (
    <div className={PROFILE_PAGE_BG}>
      <section className="flex flex-col gap-4 py-6 md:py-8">
        <div className="container mx-auto px-4">
          {/* 小屏：标题 + 打开侧栏（不重复站点 Header 的搜索/通知） */}
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{labels.pageTitle}</h1>
              <p className="text-small text-default-500">{labels.pageSubtitle}</p>
            </div>
            <Button
              variant="flat"
              color="primary"
              size="sm"
              className="shrink-0 border border-primary/20 bg-primary/10 text-primary backdrop-blur-xl"
              startContent={<Menu className="h-4 w-4" />}
              onPress={() => setSidebarOpen(true)}
            >
              {labels.openMenu}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* 主列：与博客列表同宽比例 */}
            <div className="min-w-0 space-y-6 lg:col-span-3">{children}</div>

            {/* 侧栏：大屏固定；小屏由抽屉承载 */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-20 z-20 max-h-[calc(100dvh-5.5rem)] overflow-y-auto pr-1">
                <ProfileSidebar variant="inline" items={navigationItems} lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 小屏抽屉：挂载在布局末尾，避免占据栅格流 */}
      <div className="lg:hidden">
        <ProfileSidebar
          variant="drawer"
          items={navigationItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lang={lang}
        />
      </div>
    </div>
  );
}
