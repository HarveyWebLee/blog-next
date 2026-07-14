"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import {
  PASSWORD_TRANSPORT_REQUIRES_HTTPS_CODE,
  PasswordTransportSecureContextRequiredError,
} from "@/lib/crypto/password-transport/client";
import { getDictionaryForLang } from "@/lib/dictionaries";
import { getClientPageLocale } from "@/lib/i18n/locale";
import { refreshClientAccessToken } from "@/lib/utils/client-api-fetch";
import {
  clearClientAuthStorage,
  clearLegacyRefreshTokenStorage,
  getClientAccessToken,
  getStoredClientUserJson,
  setClientAccessToken,
  setStoredClientUserJson,
} from "@/lib/utils/client-bearer-auth";
import { extractResponseErrorMessage, extractUnknownErrorMessage } from "@/lib/utils/client-error";
import { LoginRequest, LoginResponse, User } from "@/types/blog";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  /** 个人资料等更新后同步本地 user（如邮箱变更），避免仅本地存储与界面不一致 */
  patchUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 从统一存储恢复 accessToken + user；refresh 仅走 HttpOnly Cookie
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = getStoredClientUserJson();
        const storedToken = getClientAccessToken();

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData as User);
          setIsAuthenticated(true);
        }

        // 启动时清掉遗留的明文 refreshToken
        clearLegacyRefreshTokenStorage();
      } catch (error) {
        console.error("恢复用户状态失败:", error);
        clearClientAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const patchUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      setStoredClientUserJson(JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      console.error("清除刷新会话失败:", extractUnknownErrorMessage(error, "登出请求异常"));
    });

    clearClientAuthStorage();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      const plain = credentials.password ?? "";
      const payload = await sealPasswordInRequestBody(
        {
          username: credentials.username,
          password: plain,
        },
        plain,
        "password"
      );

      const locale = getClientPageLocale();
      const dict = await getDictionaryForLang(locale);
      const loginFailed = (dict as { auth?: { loginFailed?: string } }).auth?.loginFailed ?? "登录失败";
      const loginRequestFailed =
        (dict as { auth?: { loginRequestFailed?: string } }).auth?.loginRequestFailed ?? "登录请求失败";

      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { user: userData, token } = data.data as LoginResponse;

        setStoredClientUserJson(JSON.stringify(userData));
        setClientAccessToken(token);
        clearLegacyRefreshTokenStorage();

        setUser(userData as User);
        setIsAuthenticated(true);

        return { success: true, message: data.message };
      } else {
        const msg =
          data?.message || (response.ok ? loginFailed : await extractResponseErrorMessage(response, loginFailed));
        return { success: false, message: msg };
      }
    } catch (error) {
      console.error("登录错误:", error);
      const locale = getClientPageLocale();
      const dict = await getDictionaryForLang(locale);
      const authDict = dict as {
        auth?: { loginRequestFailed?: string; loginRequiresHttps?: string };
      };
      const loginRequiresHttps =
        authDict.auth?.loginRequiresHttps ??
        "当前通过非 HTTPS 访问，浏览器无法启用密码加密。请改用 https:// 地址登录。";
      if (
        error instanceof PasswordTransportSecureContextRequiredError ||
        (error instanceof Error && error.message === PASSWORD_TRANSPORT_REQUIRES_HTTPS_CODE)
      ) {
        return { success: false, message: loginRequiresHttps };
      }
      const loginRequestFailed = authDict.auth?.loginRequestFailed ?? "登录请求失败";
      return { success: false, message: extractUnknownErrorMessage(error, loginRequestFailed) };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const ok = await refreshClientAccessToken();
    if (!ok) {
      logout();
      return false;
    }
    return true;
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
