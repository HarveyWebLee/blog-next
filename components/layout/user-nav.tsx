"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { FileIcon, LogInIcon, LogOutIcon, MailIcon, SettingsIcon, User, UserCircleIcon } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";

const iconClasses = "text-base text-default-500 shrink-0";

// 默认头像图片 - 使用更可靠的图片源
const DEFAULT_AVATAR = "/images/avatar.jpeg";
const FALLBACK_AVATAR = "/images/fallback.svg";

export function UserNav() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const params = useParams();
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
          variant="gradient"
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
            console.log("头像加载失败，使用默认头像");
          }}
          showFallback
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="登录下拉框" variant="faded">
        <DropdownSection showDivider title="信息及操作">
          <DropdownItem
            key="user"
            description="用户名"
            startContent={<User className={iconClasses} width="1em" height="1em" />}
          >
            {user.displayName || user.username}
          </DropdownItem>
          <DropdownItem
            key="email"
            description="邮箱"
            startContent={<MailIcon className={iconClasses} width="1em" height="1em" />}
          >
            {user.email}
          </DropdownItem>
          <DropdownItem
            key="user-center"
            description="个人信息操作入口"
            startContent={<UserCircleIcon className={iconClasses} width="1em" height="1em" />}
            href="/profile"
          >
            个人中心
          </DropdownItem>
          <DropdownItem
            key="write-article"
            description="文章编辑入口"
            startContent={<FileIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${params.lang}/blog/manage/create`}
          >
            写文章
          </DropdownItem>
          <DropdownItem
            key="settings"
            description="系统设置"
            startContent={<SettingsIcon width="1em" height="1em" className={iconClasses} />}
            href="/settings"
          >
            设置
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            description="退出登录后，将无法编辑文章和信息"
            startContent={<LogOutIcon className={iconClasses} width="1em" height="1em" />}
            onClick={logout}
          >
            退出登录
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
