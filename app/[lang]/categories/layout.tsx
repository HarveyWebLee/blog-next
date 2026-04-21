"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/lib/contexts/auth-context";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/${params.lang || "zh-CN"}/auth/login`);
    }
  }, [isAuthenticated, isLoading, params.lang, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* 与首页内容区统一：2xl(1536px) 起增加横向留白，避免内容贴边 */}
      <div className="container relative mx-auto px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">{children}</div>
    </section>
  );
}
