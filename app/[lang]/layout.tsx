import "@/styles/globals.scss";

import { Metadata, Viewport } from "next";

import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/types";

// 生成元数据
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;

  const dict = await getDictionary(lang);

  return dict.metadata as Metadata;
}

// 生成视口配置
export async function generateViewport({ params }: { params: Promise<{ lang: Locale }> }): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light dark",
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <ConditionalLayout lang={lang}>{children}</ConditionalLayout>;
}
