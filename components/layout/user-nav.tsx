"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { FileIcon, LogInIcon, LogOutIcon, MailIcon, SettingsIcon, User, UserCircleIcon } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { Locale } from "@/types";

const iconClasses = "text-base text-default-500 shrink-0";

// 默认头像图片 - 使用更可靠的图片源
const DEFAULT_AVATAR = "/images/avatar.jpeg";
const FALLBACK_AVATAR = "/images/fallback.svg";

export function UserNav() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const locale: Locale = lang === "en-US" || lang === "ja-JP" ? lang : "zh-CN";
  const t =
    locale === "en-US"
      ? {
          dropdown: "User menu",
          section: "Profile & Actions",
          username: "Username",
          email: "Email",
          profile: "Profile",
          profileDesc: "Open profile center",
          write: "Write Post",
          writeDesc: "Open editor",
          settings: "Settings",
          settingsDesc: "System settings",
          logout: "Logout",
          logoutDesc: "You cannot edit after logout",
          avatarError: "Avatar load failed, fallback applied",
        }
      : locale === "ja-JP"
        ? {
            dropdown: "ユーザーメニュー",
            section: "情報と操作",
            username: "ユーザー名",
            email: "メール",
            profile: "プロフィール",
            profileDesc: "プロフィールセンターへ",
            write: "記事を書く",
            writeDesc: "エディターを開く",
            settings: "設定",
            settingsDesc: "システム設定",
            logout: "ログアウト",
            logoutDesc: "ログアウト後は編集できません",
            avatarError: "アバター読み込み失敗、代替画像を使用",
          }
        : {
            dropdown: "登录下拉框",
            section: "信息及操作",
            username: "用户名",
            email: "邮箱",
            profile: "个人中心",
            profileDesc: "个人信息操作入口",
            write: "写文章",
            writeDesc: "文章编辑入口",
            settings: "设置",
            settingsDesc: "系统设置",
            logout: "退出登录",
            logoutDesc: "退出登录后，将无法编辑文章和信息",
            avatarError: "头像加载失败，使用默认头像",
          };
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          isIconOnly
          aria-label="login"
          color="primary"
          size="sm"
          variant="shadow"
          as={Link}
          href="/auth/login"
          className="font-semibold"
        >
          <LogInIcon width="1em" height="1em" className="text-base" />
        </Button>
      </div>
    );
  }

  // 获取用户头像，优先使用用户数据中的头像
  const avatarSrc = user.avatar || DEFAULT_AVATAR;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Avatar
          isBordered
          radius="sm"
          src={avatarSrc}
          fallback={<Image src={FALLBACK_AVATAR} alt="fallback" width={40} height={40} />}
          className="cursor-pointer"
          onError={() => {
            console.log(t.avatarError);
          }}
          showFallback
        />
      </DropdownTrigger>
      <DropdownMenu aria-label={t.dropdown} variant="faded">
        <DropdownSection showDivider title={t.section}>
          <DropdownItem
            key="user"
            description={t.username}
            startContent={<User className={iconClasses} width="1em" height="1em" />}
          >
            {user.displayName || user.username}
          </DropdownItem>
          <DropdownItem
            key="email"
            description={t.email}
            startContent={<MailIcon className={iconClasses} width="1em" height="1em" />}
          >
            {user.email}
          </DropdownItem>
          <DropdownItem
            key="user-center"
            description={t.profileDesc}
            startContent={<UserCircleIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${lang}/profile`}
          >
            {t.profile}
          </DropdownItem>
          <DropdownItem
            key="write-article"
            description={t.writeDesc}
            startContent={<FileIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${lang}/blog/manage/create`}
          >
            {t.write}
          </DropdownItem>
          <DropdownItem
            key="settings"
            description={t.settingsDesc}
            startContent={<SettingsIcon width="1em" height="1em" className={iconClasses} />}
            href={`/${lang}/profile/settings`}
          >
            {t.settings}
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            description={t.logoutDesc}
            startContent={<LogOutIcon className={iconClasses} width="1em" height="1em" />}
            onClick={logout}
          >
            {t.logout}
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
