"use client";

import { useParams } from "next/navigation";

import NotFoundNoise from "@/components/ui/not-found-noise";

/** 带语言前缀路由下的 404（由 useParams 解析当前 lang） */
export default function LangNotFoundPage() {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";

  return <NotFoundNoise lang={lang} />;
}
