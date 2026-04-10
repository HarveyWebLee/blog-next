"use client";

import { Button } from "@heroui/react";
import { Bell, Menu, Search } from "lucide-react";

interface ProfileNavigationProps {
  onMenuClick: () => void;
  lang: string;
}

export default function ProfileNavigation({ onMenuClick, lang }: ProfileNavigationProps) {
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* 左侧 */}
        <div className="flex items-center space-x-4">
          <Button isIconOnly variant="light" size="sm" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">个人中心</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">管理您的账户和内容</p>
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center space-x-2">
          {/* 搜索按钮 */}
          <Button isIconOnly variant="light" size="sm" className="hidden sm:flex">
            <Search className="w-5 h-5" />
          </Button>

          {/* 通知按钮 */}
          <Button isIconOnly variant="light" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {/* 未读通知徽章 */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">3</span>
            </span>
          </Button>

          {/* 用户头像 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">U</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">用户名</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">在线</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
