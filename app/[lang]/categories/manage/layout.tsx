/**
 * 分类管理布局
 * 提供分类管理页面的通用布局，并按角色门禁（author / admin / super_admin）
 */

import { ReactNode } from "react";

import { TaxonomyManageGate } from "@/components/auth/taxonomy-manage-gate";

interface CategoriesManageLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function CategoriesManageLayout({ children, params }: CategoriesManageLayoutProps) {
  const { lang } = await params;
  const locale = lang || "zh-CN";

  return (
    <TaxonomyManageGate loginHref={`/${locale}/auth/login`} fallbackHref={`/${locale}/categories`}>
      <div className="container mx-auto px-4 py-8">{children}</div>
    </TaxonomyManageGate>
  );
}
