"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { getClientAccessToken } from "@/lib/utils/client-bearer-auth";

type ApiDocsTesterContextValue = {
  /** 供「测试接口」模态框默认填入 Authorization: Bearer … */
  bearerToken: string;
  setBearerToken: (token: string) => void;
  /** 用当前会话 accessToken 覆盖（与全站登录态同步） */
  syncBearerFromStorage: () => void;
};

/** 供 ApiTester 等可选消费：在 Provider 外则为 null */
export const ApiDocsTesterContext = createContext<ApiDocsTesterContextValue | null>(null);

export function ApiDocsTesterProvider({ children }: { children: ReactNode }) {
  const [bearerToken, setBearerTokenState] = useState(() => getClientAccessToken() ?? "");

  const syncBearerFromStorage = useCallback(() => {
    setBearerTokenState(getClientAccessToken() ?? "");
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
  const ctx = useContext(ApiDocsTesterContext);
  if (!ctx) {
    throw new Error("useApiDocsTester must be used within ApiDocsTesterProvider");
  }
  return ctx;
}
