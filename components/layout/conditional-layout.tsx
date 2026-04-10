"use client";

import { usePathname } from "next/navigation";

import { Locale } from "@/types";
import { Footer } from "./footer";
import { Header } from "./header";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  lang: string;
}

export function ConditionalLayout({ children, lang }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // 检查是否是认证页面
  // 国际化配置后，认证页面路径前会有语言前缀，如 /zh-CN/auth/、/en-US/auth/ 等
  // 因此需要使用正则表达式来匹配认证页面路径
  const isAuthPage = /^\/(zh-CN|en-US|ja-JP)\/auth\//.test(pathname);

  if (isAuthPage) {
    // 认证页面：不显示 Header 和 Footer，使用全屏布局
    return (
      <div className="w-screen h-screen relativebg-[url('/images/login-bg.png')] bg-cover bg-center">
        <video
          src="/videos/login-bg.mp4"
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // 普通页面：显示完整的布局
  return (
    <div className="min-h-screen flex flex-col">
      <Header lang={lang as Locale} />
      <main className="flex-1 min-h-[80vh] relative">{children}</main>
      <Footer />
    </div>
  );
}
