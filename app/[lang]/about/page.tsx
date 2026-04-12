import type { Metadata } from "next";

import { AboutPageContent, type AboutPageDictionary } from "@/components/about/about-page-content";
import { getDictionaryForLang } from "@/lib/dictionaries";

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
  return <AboutPageContent lang={lang} about={about} />;
}
