"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/dropdown";
import { FileIcon, FilesIcon, LibraryBig, LogInIcon, LogOutIcon, TagIcon, UserCircleIcon } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";

const iconClasses = "text-base text-default-500 shrink-0";

const DEFAULT_AVATAR = "/images/avatar.jpeg";
const FALLBACK_AVATAR = "/images/fallback.svg";

export function UserNav() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";
  const dict = useClientDictionary(lang);
  const t = (dict as { layout?: { userNav?: Record<string, string> } })?.layout?.userNav;

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  if (!t) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          isIconOnly
          aria-label={t.loginAria}
          color="primary"
          size="sm"
          variant="shadow"
          as={Link}
          href={`/${lang}/auth/login`}
          className="font-semibold"
        >
          <LogInIcon width="1em" height="1em" className="text-base" />
        </Button>
      </div>
    );
  }

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
            key="user-center"
            description={t.profileDesc}
            startContent={<UserCircleIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${lang}/profile`}
          >
            {t.profile}
          </DropdownItem>
          <DropdownItem
            key="write-article"
            description={t.manageDesc}
            startContent={<FilesIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${lang}/blog/manage`}
          >
            {t.manage}
          </DropdownItem>
          <DropdownItem
            key="create-article"
            description={t.writeDesc}
            startContent={<FileIcon className={iconClasses} width="1em" height="1em" />}
            href={`/${lang}/blog/manage/create`}
          >
            {t.write}
          </DropdownItem>
          <DropdownItem
            key="categories"
            description={t.categoriesDesc}
            startContent={<LibraryBig width="1em" height="1em" className={iconClasses} />}
            href={`/${lang}/categories`}
          >
            {t.categories}
          </DropdownItem>
          <DropdownItem
            key="tags"
            description={t.tagsDesc}
            startContent={<TagIcon width="1em" height="1em" className={iconClasses} />}
            href={`/${lang}/tags`}
          >
            {t.tags}
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
