"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Card, CardBody } from "@heroui/react";
import { User, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavigationItem {
  key: string;
  label: string;
  icon: any;
  href: string;
}

interface ProfileSidebarProps {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export default function ProfileSidebar({ items, isOpen, onClose, lang }: ProfileSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </div>
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-lg">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">个人中心</span>
            </div>
            <Button isIconOnly variant="light" size="sm" className="lg:hidden" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 用户信息卡片 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardBody className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">用户名</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">user@example.com</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === `/${lang}${item.href}`;

              return (
                <Link
                  key={item.key}
                  href={`/${lang}${item.href}`}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                  onClick={onClose}
                >
                  <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-500" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 底部 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">© 2024 荒野博客</div>
          </div>
        </div>
      </div>
    </>
  );
}
