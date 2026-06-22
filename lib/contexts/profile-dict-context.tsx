"use client";

import { createContext, useContext } from "react";

/** 个人中心子树共享词典（由 ProfileLayout 从 Server page 注入，避免各 client 组件重复加载） */
const ProfileDictContext = createContext<Record<string, unknown> | null>(null);

export function ProfileDictProvider({ dict, children }: { dict: Record<string, unknown>; children: React.ReactNode }) {
  return <ProfileDictContext.Provider value={dict}>{children}</ProfileDictContext.Provider>;
}

/** 读取 profile 词典子树，如 useProfileDict("stats") */
export function useProfileDict<T = Record<string, unknown>>(section?: string): T | null {
  const dict = useContext(ProfileDictContext);
  if (!dict) return null;
  const profile = (dict as { profile?: Record<string, unknown> }).profile;
  if (!profile) return null;
  if (!section) return profile as T;
  return (profile[section] as T) ?? null;
}
