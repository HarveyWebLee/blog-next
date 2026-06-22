"use client";

import { useMemo } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image } from "@heroui/react";
import clsx from "clsx";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { Locale } from "@/types";

interface HeaderClientProps {
  lang: Locale;
  navIcons: {
    home: React.ReactNode;
    blog: React.ReactNode;
    about: React.ReactNode;
  };
}

export function HeaderClient({ lang, navIcons }: HeaderClientProps) {
  const pathname = usePathname();
  const dict = useClientDictionary(lang);
  const nav = (dict as { navigation?: Record<string, string> })?.navigation;
  const siteTitle = (dict as { title?: string })?.title ?? "";

  const navigation = useMemo(() => {
    if (!nav) return [];
    return [
      { key: "home", name: nav.home, href: `/${lang}`, icon: navIcons.home },
      { key: "blog", name: nav.blog, href: `/${lang}/blog`, icon: navIcons.blog },
      { key: "about", name: nav.about, href: `/${lang}/about`, icon: navIcons.about },
    ];
  }, [lang, nav, navIcons.about, navIcons.blog, navIcons.home]);

  const activeIndex = navigation.findIndex((item) => item.href === pathname);

  if (!dict || navigation.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 animate-pulse rounded bg-gray-200" />
        <div className="hidden h-6 w-20 animate-pulse rounded bg-gray-200 md:block" />
      </div>
    );
  }

  return (
    <>
      <Link href={`/${lang}`} className="flex items-center space-x-2">
        <Image
          alt={siteTitle}
          src="/images/logo.png"
          width={40}
          height={40}
          priority
          isZoomed
          isBlurred
          fallbackSrc="/images/fallback.svg"
          as={NextImage}
        />
        <span className="hidden text-xl font-bold md:block">{siteTitle}</span>
      </Link>

      <nav className="relative flex h-[48px] w-[60%] items-center rounded-full bg-[hsla(var(--blog-nav-background))] blog-box-shadow">
        <div
          style={{
            display: activeIndex < 0 ? "none" : "block",
            width: `${100 / navigation.length}%`,
            transition: ".9s cubic-bezier(.98,-.65,.265,1.55),background-color .5s",
            willChange: "transform,background-color",
            boxShadow: "0 0 10px var(--blog-color-bg-end)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
          className="absolute left-0 h-full rounded-full bg-[var(--blog-nav-link-active-color-bg)]"
        ></div>
        {navigation.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              "relative z-[1] flex h-full flex-1 items-center justify-center transition-colors hover:text-primary",
              pathname === item.href ? "link-active" : undefined
            )}
          >
            {item.icon}
            <span className="ml-1 hidden md:block">{item.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
