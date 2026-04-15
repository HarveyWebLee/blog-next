import type { Metadata } from "next";

import { AboutPageContent, type AboutPageDictionary } from "@/components/about/about-page-content";
import { getDictionaryForLang } from "@/lib/dictionaries";
import { getAboutOwnerPublic } from "@/lib/services/about-owner.service";

/** 站长资料来自 DB 时适度再验证，避免个人中心改邮箱后关于页长期缓存旧值 */
export const revalidate = 120;

type AboutRouteProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: AboutRouteProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);
  const about = dict.aboutPage as AboutPageDictionary;
  return {
    title: about.metaTitle,
    description: about.metaDescription,
  };
}

export default async function AboutPage({ params }: AboutRouteProps) {
  const { lang } = await params;
  const dict = await getDictionaryForLang(lang);
  const about = dict.aboutPage as AboutPageDictionary;
  const ownerPublic = await getAboutOwnerPublic();
  return <AboutPageContent lang={lang} about={about} ownerPublic={ownerPublic} />;
}
