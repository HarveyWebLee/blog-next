import NextImage from "next/image";
import Link from "next/link";
import { Image } from "@heroui/react";
import { BookImageIcon, ClipboardPlus, HouseIcon, LibraryBig, TagIcon } from "lucide-react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { Locale } from "@/types";
import { HeaderClient } from "./header-client";

interface HeaderProps {
  lang: Locale;
}

export function Header({ lang }: HeaderProps) {
  // 多语言导航配置
  const navigation = [
    {
      name: {
        "zh-CN": "首页",
        "en-US": "Home",
        "ja-JP": "ホーム",
      },
      href: `/${lang}`,
      icon: <HouseIcon width={"1em"} height={"1em"} />,
    },
    {
      name: {
        "zh-CN": "博客",
        "en-US": "Blog",
        "ja-JP": "ブログ",
      },
      href: `/${lang}/blog`,
      icon: <BookImageIcon width={"1em"} height={"1em"} />,
    },
    {
      name: {
        "zh-CN": "分类",
        "en-US": "Categories",
        "ja-JP": "カテゴリー",
      },
      href: `/${lang}/categories`,
      icon: <LibraryBig width={"1em"} height={"1em"} />,
    },
    {
      name: {
        "zh-CN": "标签",
        "en-US": "Tags",
        "ja-JP": "タグ",
      },
      href: `/${lang}/tags`,
      icon: <TagIcon width={"1em"} height={"1em"} />,
    },
    {
      name: {
        "zh-CN": "关于",
        "en-US": "About",
        "ja-JP": "について",
      },
      href: `/${lang}/about`,
      icon: <ClipboardPlus width={"1em"} height={"1em"} />,
    },
  ];

  return (
    <header className="blog-border-y-box-shadow w-full h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo */}
      <HeaderClient navigation={navigation} lang={lang} />

      {/* 右侧操作区 */}
      <div className="flex items-center space-x-2">
        <SearchBar />
        <LanguageSwitcher />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
