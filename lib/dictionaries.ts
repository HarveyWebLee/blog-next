import { Locale } from "@/types";

const dictionaries = {
  "zh-CN": () => import("@/dictionaries/zh-CN.json"),
  "en-US": () => import("@/dictionaries/en-US.json"),
  "ja-JP": () => import("@/dictionaries/ja-JP.json"),
};

export const getDictionary = async (locale: Locale) => {
  const dict = await dictionaries[locale]();
  return dict.default || dict;
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
