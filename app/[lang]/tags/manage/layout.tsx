/**
 * 标签管理布局组件
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tag Management - Blog",
  description: "Manage blog tags, including create, edit, delete, and status control",
};

export default function TagsManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      {/* 页面内容 */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
