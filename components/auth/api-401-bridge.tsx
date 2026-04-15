"use client";

/**
 * 在客户端安装全局 fetch 401 拦截：任意受保护 API 返回 401 时清会话并跳转登录。
 * 需放在 AuthProvider 子树内以便调用 logout。
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/contexts/auth-context";
import { getLoginRedirectPath, installClientApi401Interceptor } from "@/lib/utils/client-api-401-interceptor";

export function Api401Bridge() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const uninstall = installClientApi401Interceptor(() => {
      logout();
      router.replace(getLoginRedirectPath());
    });
    return uninstall;
  }, [logout, router]);

  return null;
}
