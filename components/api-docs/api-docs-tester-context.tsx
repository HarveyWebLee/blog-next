"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ApiDocsTesterContextValue = {
  /** 供「测试接口」模态框默认填入 Authorization: Bearer … */
  bearerToken: string;
  setBearerToken: (token: string) => void;
  /** 用当前 localStorage 的 accessToken 覆盖（与全站登录态同步） */
  syncBearerFromStorage: () => void;
};

/** 供 ApiTester 等可选消费：在 Provider 外则为 null */
export const ApiDocsTesterContext = createContext<ApiDocsTesterContextValue | null>(null);

export function ApiDocsTesterProvider({ children }: { children: ReactNode }) {
  const [bearerToken, setBearerTokenState] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "") : ""
  );

  const syncBearerFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    setBearerTokenState(localStorage.getItem("accessToken") ?? "");
  }, []);

  const setBearerToken = useCallback((token: string) => {
    setBearerTokenState(token);
  }, []);

  const value = useMemo(
    () => ({ bearerToken, setBearerToken, syncBearerFromStorage }),
    [bearerToken, setBearerToken, syncBearerFromStorage]
  );

  return <ApiDocsTesterContext.Provider value={value}>{children}</ApiDocsTesterContext.Provider>;
}

export function useApiDocsTesterOptional(): ApiDocsTesterContextValue | null {
  return useContext(ApiDocsTesterContext);
}

export function useApiDocsTester(): ApiDocsTesterContextValue {
  const ctx = useApiDocsTesterOptional();
  if (!ctx) {
    throw new Error("useApiDocsTester 须在 ApiDocsTesterProvider 内使用");
  }
  return ctx;
}
