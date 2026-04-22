"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Bell,
  BookOpen,
  FileCode2,
  FolderTree,
  Heart,
  Menu,
  Settings,
  Star,
  Tags,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { PROFILE_PAGE_BG } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${lang}/auth/login`);
    }
  }, [isAuthenticated, isLoading, lang, router]);

  const { labels, navigationItems } = useMemo(() => {
    const L =
      lang === "en-US"
        ? {
            overview: "Overview",
            posts: "My Posts",
            likes: "My Likes",
            favorites: "My Favorites",
            followers: "Followers",
            following: "Following",
            notifications: "Notifications",
            settings: "Settings",
            categories: "Category Manage",
            tags: "Tag Manage",
            accountsAdmin: "Accounts",
            apiDocs: "API Docs",
            commentReview: "Comment Review",
            pageTitle: "Profile",
            pageSubtitle: "Account and content hub",
            openMenu: "Menu",
          }
        : lang === "ja-JP"
          ? {
              overview: "概要",
              posts: "自分の記事",
              likes: "自分のいいね",
              favorites: "お気に入り",
              followers: "フォロワー",
              following: "フォロー中",
              notifications: "通知",
              settings: "アカウント設定",
              categories: "カテゴリ管理",
              tags: "タグ管理",
              accountsAdmin: "アカウント管理",
              apiDocs: "APIドキュメント",
              commentReview: "コメント審査",
              pageTitle: "プロフィール",
              pageSubtitle: "アカウントとコンテンツ",
              openMenu: "メニュー",
            }
          : {
              overview: "概览",
              posts: "我的文章",
              likes: "我的点赞",
              favorites: "我的收藏",
              followers: "我的粉丝",
              following: "我的关注",
              notifications: "通知中心",
              settings: "账户设置",
              categories: "分类管理",
              tags: "标签管理",
              accountsAdmin: "账户管理",
              apiDocs: "API 文档",
              commentReview: "评论审核",
              pageTitle: "个人中心",
              pageSubtitle: "账户与内容入口",
              openMenu: "目录",
            };

    const base: {
      key: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      href: string;
    }[] = [
      { key: "overview", label: L.overview, icon: User, href: "/profile" },
      { key: "posts", label: L.posts, icon: BookOpen, href: "/profile/posts" },
      { key: "likes", label: L.likes, icon: Heart, href: "/profile/likes" },
      { key: "favorites", label: L.favorites, icon: Star, href: "/profile/favorites" },
      { key: "followers", label: L.followers, icon: Users, href: "/profile/followers" },
      { key: "following", label: L.following, icon: UserPlus, href: "/profile/following" },
      { key: "notifications", label: L.notifications, icon: Bell, href: "/profile/notifications" },
      { key: "categories-manage", label: L.categories, icon: FolderTree, href: "/profile/categories" },
      { key: "tags-manage", label: L.tags, icon: Tags, href: "/profile/tags" },
      { key: "settings", label: L.settings, icon: Settings, href: "/profile/settings" },
    ];
    if (user?.role === "super_admin") {
      base.splice(5, 0, {
        key: "accounts",
        label: L.accountsAdmin,
        icon: Users,
        href: "/profile/accounts",
      });
      base.splice(6, 0, {
        key: "api-docs",
        label: L.apiDocs,
        icon: FileCode2,
        href: "/api-docs",
      });
      base.splice(7, 0, {
        key: "comment-review",
        label: L.commentReview,
        icon: Bell,
        href: "/blog/manage/comments",
      });
    }
    return { labels: L, navigationItems: base };
  }, [lang, user?.role]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

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
