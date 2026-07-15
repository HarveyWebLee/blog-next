"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/lib/contexts/auth-context";
import { canManageTaxonomyClient } from "@/lib/utils/authz-client";

type TaxonomyManageGateProps = {
  children: ReactNode;
  /** 无权限时回退路径，如 /zh-CN/categories */
  fallbackHref: string;
  /** 未登录时跳转的登录页，如 /zh-CN/auth/login */
  loginHref: string;
};

/**
 * 分类/标签管理子路由门禁：须登录且 role 为 author / admin / super_admin。
 * 与写接口 {@link requireTaxonomyManager} 对齐，避免仅靠前端隐藏按钮被绕过时仍进入管理页。
 */
export function TaxonomyManageGate({ children, fallbackHref, loginHref }: TaxonomyManageGateProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const allowed = isAuthenticated && canManageTaxonomyClient(user);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(loginHref);
      return;
    }
    if (!canManageTaxonomyClient(user)) {
      router.replace(fallbackHref);
    }
  }, [fallbackHref, isAuthenticated, isLoading, loginHref, router, user]);

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return <>{children}</>;
}
