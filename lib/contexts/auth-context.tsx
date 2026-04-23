"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { LoginRequest, LoginResponse, User } from "@/types/blog";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  /** 个人资料等更新后同步本地 user（如邮箱变更），避免仅 localStorage 与界面不一致 */
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

  // 从localStorage恢复用户状态
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData as User);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("恢复用户状态失败:", error);
        // 清除可能损坏的数据
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
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
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { user: userData, token, refreshToken } = data.data as LoginResponse;

        // 存储用户信息和令牌
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);

        setUser(userData as User);
        setIsAuthenticated(true);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "登录失败" };
      }
    } catch (error) {
      console.error("登录错误:", error);
      return { success: false, message: "网络错误，请稍后重试" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        return false;
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { token, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", newRefreshToken);

        return true;
      } else {
        // 刷新失败，清除认证状态
        logout();
        return false;
      }
    } catch (error) {
      console.error("刷新令牌失败:", error);
      logout();
      return false;
    }
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
