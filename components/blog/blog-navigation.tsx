"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { BarChart3, BookOpen, FileText, Home, Plus, Settings } from "lucide-react";

const navigationItems = [
  {
    title: "博客首页",
    href: "/blog",
    icon: Home,
    description: "查看所有博客文章",
    color: "primary" as const,
  },
  {
    title: "博客管理",
    href: "/blog/manage",
    icon: FileText,
    description: "管理您的博客文章",
    color: "secondary" as const,
  },
  {
    title: "创建博客",
    href: "/blog/manage/create",
    icon: Plus,
    description: "创建新的博客文章",
    color: "success" as const,
  },
  {
    title: "统计分析",
    href: "/blog/manage/stats",
    icon: BarChart3,
    description: "查看博客统计数据",
    color: "warning" as const,
  },
  {
    title: "系统设置",
    href: "/blog/manage/settings",
    icon: Settings,
    description: "配置博客系统",
    color: "default" as const,
  },
];

export function BlogNavigation() {
  const pathname = usePathname();

  return (
    <Card className="mb-6">
      <CardBody className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">博客管理中心</h2>
            <p className="text-sm text-default-500">管理和创建您的博客内容</p>
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
