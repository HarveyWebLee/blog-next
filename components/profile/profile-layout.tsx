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
import { ProfileDictProvider } from "@/lib/contexts/profile-dict-context";
import ProfileSidebar from "./profile-sidebar";

interface ProfileLayoutProps {
  children: React.ReactNode;
  lang: string;
  dict: { profile?: { sidebar?: Record<string, string> } };
}

/**
 * 个人中心布局：与博客前台共用 Header/Footer（由 ConditionalLayout 提供），
 * 本组件仅负责内容区背景、与博客列表一致的 container + 栅格、右侧导航卡片。
 */
export default function ProfileLayout({ children, lang, dict }: ProfileLayoutProps) {
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
    const L = dict.profile?.sidebar ?? {};
    const pick = (key: string, fallback: string) => L[key] ?? fallback;

    const base: {
      key: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      href: string;
    }[] = [
      { key: "overview", label: pick("overview", "Overview"), icon: User, href: "/profile" },
      { key: "posts", label: pick("posts", "Posts"), icon: BookOpen, href: "/profile/posts" },
      { key: "likes", label: pick("likes", "Likes"), icon: Heart, href: "/profile/likes" },
      { key: "favorites", label: pick("favorites", "Favorites"), icon: Star, href: "/profile/favorites" },
      { key: "followers", label: pick("followers", "Followers"), icon: Users, href: "/profile/followers" },
      { key: "following", label: pick("following", "Following"), icon: UserPlus, href: "/profile/following" },
      {
        key: "notifications",
        label: pick("notifications", "Notifications"),
        icon: Bell,
        href: "/profile/notifications",
      },
      {
        key: "categories-manage",
        label: pick("categories", "Categories"),
        icon: FolderTree,
        href: "/profile/categories",
      },
      { key: "tags-manage", label: pick("tags", "Tags"), icon: Tags, href: "/profile/tags" },
      { key: "settings", label: pick("settings", "Settings"), icon: Settings, href: "/profile/settings" },
    ];
    if (user?.role === "super_admin") {
      base.splice(5, 0, {
        key: "accounts",
        label: pick("accountsAdmin", "Accounts"),
        icon: Users,
        href: "/profile/accounts",
      });
      base.splice(6, 0, {
        key: "api-docs",
        label: pick("apiDocs", "API Docs"),
        icon: FileCode2,
        href: "/api-docs",
      });
      base.splice(7, 0, {
        key: "comment-review",
        label: pick("commentReview", "Comment Review"),
        icon: Bell,
        href: "/blog/manage/comments",
      });
    }
    const labels = {
      pageTitle: pick("pageTitle", "Profile"),
      pageSubtitle: pick("pageSubtitle", ""),
      openMenu: pick("openMenu", "Menu"),
    };
    return { labels, navigationItems: base };
  }, [dict.profile?.sidebar, user?.role]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <ProfileDictProvider dict={dict as Record<string, unknown>}>
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
    </ProfileDictProvider>
  );
}
