"use client";

import { useEffect, useState } from "react";

import { getDictionaryForLang } from "@/lib/dictionaries";

/** 客户端按需加载当前语言词典（用于 error/not-found 等无 Server 传参的边界页） */
export function useClientDictionary(lang: string) {
  const [dict, setDict] = useState<Awaited<ReturnType<typeof getDictionaryForLang>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDictionaryForLang(lang).then((loaded) => {
      if (!cancelled) setDict(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return dict;
}
