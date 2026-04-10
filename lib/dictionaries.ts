import { Locale } from "@/types";

const dictionaries = {
  "zh-CN": () => import("@/dictionaries/zh-CN.json"),
  "en-US": () => import("@/dictionaries/en-US.json"),
  "ja-JP": () => import("@/dictionaries/ja-JP.json"),
};

/** 路由动态段 [lang] 在类型上为 string，据此收窄为 Locale */
const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en-US", "ja-JP"];

function toLocale(lang: string): Locale {
  return SUPPORTED_LOCALES.includes(lang as Locale) ? (lang as Locale) : "zh-CN";
}

export const getDictionary = async (locale: Locale) => {
  const dict = await dictionaries[locale]();
  return dict.default || dict;
};

/** 供 [lang] 页面使用：将字符串 lang 安全映射到受支持词典 */
export const getDictionaryForLang = async (lang: string) => getDictionary(toLocale(lang));

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
