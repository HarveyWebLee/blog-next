"use client";

import { useParams } from "next/navigation";

import NotFoundNoise from "@/components/ui/not-found-noise";

/** 根级 404：middleware 会将多数路径重定向到 /{lang}/...，此处作兜底 */
export default function NotFoundPage() {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "zh-CN";

  return <NotFoundNoise lang={lang} />;
}
