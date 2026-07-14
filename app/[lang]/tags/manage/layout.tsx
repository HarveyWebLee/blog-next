/**
 * 标签管理布局组件（含 author / admin / super_admin 门禁）
 */

import { Metadata } from "next";

import { TaxonomyManageGate } from "@/components/auth/taxonomy-manage-gate";

export const metadata: Metadata = {
  title: "Tag Management - Blog",
  description: "Manage blog tags, including create, edit, delete, and status control",
};

export default async function TagsManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang || "zh-CN";

  return (
    <TaxonomyManageGate loginHref={`/${locale}/auth/login`} fallbackHref={`/${locale}/tags`}>
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
        <div className="space-y-6">{children}</div>
      </div>
    </TaxonomyManageGate>
  );
}
