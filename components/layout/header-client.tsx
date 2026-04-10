"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image } from "@heroui/react";
import clsx from "clsx";

import { getDictionary } from "@/lib/dictionaries";
import { Dictionary, Locale } from "@/types";

interface NavigationItem {
  name: {
    "zh-CN": string;
    "en-US": string;
    "ja-JP": string;
  };
  href: string;
  icon: React.ReactNode;
}

interface HeaderClientProps {
  navigation: NavigationItem[];
  lang: Locale;
}

export function HeaderClient({ navigation, lang }: HeaderClientProps) {
  const pathname = usePathname();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const activeIndex = navigation.findIndex((item) => item.href === pathname);

  useEffect(() => {
    const loadDictionary = async () => {
      const dictionary = await getDictionary(lang);
      setDict(dictionary);
    };
    loadDictionary();
  }, [lang]);

  if (!dict) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse hidden md:block" />
      </div>
    );
  }

  return (
    <>
      {/* Logo */}
      <Link href={`/${lang}`} className="flex items-center space-x-2">
        <Image
          alt={dict.title}
          src="/images/logo.png"
          width={40}
          height={40}
          isZoomed
          isBlurred
          fallbackSrc="/images/fallback.svg"
          as={NextImage}
        />
        <span className="text-xl font-bold md:block hidden">{dict.title}</span>
      </Link>

      {/* 主导航 */}
      <nav className="w-[60%] relative flex items-center h-[48px] bg-[hsla(var(--blog-nav-background))] blog-box-shadow rounded-full">
        <div
          style={{
            display: activeIndex < 0 ? "none" : "block",
            width: `${100 / navigation.length}%`,
            transition: ".9s cubic-bezier(.98,-.65,.265,1.55),background-color .5s",
            willChange: "transform,background-color",
            boxShadow: "0 0 10px var(--blog-color-bg-end)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
          className="bg-[var(--blog-nav-link-active-color-bg)] h-full absolute left-0 rounded-full"
        ></div>
        {navigation.map((item) => (
          <Link
            key={item.name[lang as keyof typeof item.name]}
            href={item.href}
            className={clsx(
              `relative z-[1] flex items-center justify-center flex-1 h-full transition-colors hover:text-primary`,
              pathname === item.href ? "link-active" : undefined
            )}
          >
            {item.icon}
            <span className="ml-1 hidden md:block">{item.name[lang as keyof typeof item.name]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
