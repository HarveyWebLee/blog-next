import { BookImageIcon, ClipboardPlus, HouseIcon } from "lucide-react";

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
  return (
    <header className="blog-border-y-box-shadow sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
      <HeaderClient
        lang={lang}
        navIcons={{
          home: <HouseIcon width={"1em"} height={"1em"} />,
          blog: <BookImageIcon width={"1em"} height={"1em"} />,
          about: <ClipboardPlus width={"1em"} height={"1em"} />,
        }}
      />

      {/* 右侧操作区 */}
      <div className="flex items-center space-x-2">
        <SearchBar lang={lang} />
        <LanguageSwitcher />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
