"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Card, CardBody } from "@heroui/react";
import { X } from "lucide-react";

import { PROFILE_GLASS_CARD } from "@/components/profile/profile-ui-presets";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/images/avatar.jpeg";
const FALLBACK_AVATAR = "/images/fallback.svg";

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface ProfileSidebarProps {
  items: NavigationItem[];
  lang: string;
  /** 大屏：嵌入栅格侧栏；小屏：抽屉覆盖层 */
  variant: "inline" | "drawer";
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * 个人中心侧栏：玻璃卡片 + 主题色激活态，与博客筛选侧栏气质一致。
 */
export default function ProfileSidebar({ items, isOpen = false, onClose, lang, variant }: ProfileSidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const t =
    lang === "en-US"
      ? { navTitle: "Shortcuts", fallbackName: "Guest" }
      : lang === "ja-JP"
        ? { navTitle: "ショートカット", fallbackName: "ゲスト" }
        : { navTitle: "快捷入口", fallbackName: "访客" };

  const displayName =
    isAuthenticated && user
      ? (user.displayName?.trim() || user.username || "").trim() || t.fallbackName
      : t.fallbackName;
  const emailLine = isAuthenticated && user?.email ? user.email : "";

  const NavCard = (
    <Card className={cn(PROFILE_GLASS_CARD, "shadow-none")}>
      <CardBody className="gap-4 p-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 dark:border-white/10">
          <Avatar
            isBordered
            radius="sm"
            className="shrink-0"
            src={isAuthenticated && user?.avatar ? user.avatar : DEFAULT_AVATAR}
            fallback={<Image src={FALLBACK_AVATAR} alt="" width={40} height={40} />}
            showFallback
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {emailLine ? <p className="truncate text-xs text-default-500">{emailLine}</p> : null}
          </div>
          {variant === "drawer" ? (
            <Button isIconOnly variant="light" size="sm" className="shrink-0 lg:hidden" onPress={() => onClose?.()}>
              <X className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-default-500">{t.navTitle}</p>
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const fullPath = `/${lang}${item.href}`;
              const active =
                item.href === "/profile"
                  ? pathname === fullPath
                  : pathname === fullPath || pathname.startsWith(`${fullPath}/`);

              return (
                <Link
                  key={item.key}
                  href={fullPath}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-default-600 hover:bg-white/10 hover:text-foreground dark:hover:bg-white/5"
                  )}
                  onClick={() => onClose?.()}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/15 text-primary",
                      active && "from-primary/30 to-secondary/25"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </CardBody>
    </Card>
  );

  if (variant === "inline") {
    return NavCard;
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => onClose?.()}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(100vw-2rem,20rem)] max-w-sm transform border-r border-white/10 bg-background/95 shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-background/90 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="h-full overflow-y-auto p-4">{NavCard}</div>
      </div>
    </>
  );
}
