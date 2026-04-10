"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { BarChart3, BookOpen, FileText, Home, Plus, Settings } from "lucide-react";

export function BlogNavigation() {
  const pathname = usePathname();
  const lang = pathname?.split("/")[1] || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          centerTitle: "Blog Management Center",
          centerDesc: "Manage and create your blog content",
          home: "Blog Home",
          manage: "Blog Management",
          create: "Create Post",
          stats: "Analytics",
          settings: "Settings",
        }
      : lang === "ja-JP"
        ? {
            centerTitle: "ブログ管理センター",
            centerDesc: "ブログコンテンツの管理と作成",
            home: "ブログホーム",
            manage: "ブログ管理",
            create: "記事作成",
            stats: "分析",
            settings: "設定",
          }
        : {
            centerTitle: "博客管理中心",
            centerDesc: "管理和创建您的博客内容",
            home: "博客首页",
            manage: "博客管理",
            create: "创建博客",
            stats: "统计分析",
            settings: "系统设置",
          };
  const navigationItems = [
    { title: t.home, href: `/${lang}/blog`, icon: Home, color: "primary" as const },
    { title: t.manage, href: `/${lang}/blog/manage`, icon: FileText, color: "secondary" as const },
    { title: t.create, href: `/${lang}/blog/manage/create`, icon: Plus, color: "success" as const },
    { title: t.stats, href: `/${lang}/blog/manage/stats`, icon: BarChart3, color: "warning" as const },
    { title: t.settings, href: `/${lang}/blog/manage/settings`, icon: Settings, color: "default" as const },
  ];

  return (
    <Card className="mb-6">
      <CardBody className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">{t.centerTitle}</h2>
            <p className="text-sm text-default-500">{t.centerDesc}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                as={Link}
                href={item.href}
                color={isActive ? item.color : "default"}
                variant={isActive ? "solid" : "bordered"}
                size="sm"
                startContent={<Icon className="w-4 h-4" />}
                className={`flex items-center gap-2 relative font-medium tracking-wide ${isActive ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl" : "backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"}`}
              >
                {item.title}
                {isActive && <Chip size="sm" color="success" variant="dot" className="absolute -top-1 -right-1" />}
              </Button>
            );
          })}
        </nav>
      </CardBody>
    </Card>
  );
}
