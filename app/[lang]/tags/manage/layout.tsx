/**
 * 标签管理布局组件
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "标签管理 - 荒野博客",
  description: "管理博客标签，包括创建、编辑、删除和状态控制",
};

export default function TagsManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      {/* 页面内容 */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
