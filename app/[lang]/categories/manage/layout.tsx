/**
 * 分类管理布局
 * 提供分类管理页面的通用布局
 */

import { ReactNode } from "react";

interface CategoriesManageLayoutProps {
  children: ReactNode;
}

export default function CategoriesManageLayout({ children }: CategoriesManageLayoutProps) {
  return <div className="container mx-auto px-4 py-8">{children}</div>;
}
