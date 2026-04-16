"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Github, Globe, Heart, Mail, MapPin, MessageCircle, PenLine, Sparkles } from "lucide-react";

import { AnimatedSection, ParticleBackground } from "@/components/about/about-animations";
import { AboutMusicPlayer, type AboutMusicCopy } from "@/components/about/about-music-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AboutOwnerPublic } from "@/lib/services/about-owner.service";
import { cn } from "@/lib/utils";

import "./about-page-content.scss";

/**
 * 关于页卡片统一复用「分类页卡片」的核心视觉与交互：
 * 1) 毛玻璃半透明底 + 细描边；
 * 2) 顶部渐变条 hover 展开；
 * 3) hover 光晕蒙层 + 发光阴影；
 * 4) 轻微上浮（减少动画偏好时自动关闭位移）。
 */
const ABOUT_CARD_HOVER = cn("about-card-modern", "group");

/**
 * 底部致谢卡沿用同一交互语言，保持全页卡片体验一致。
 * 仅保留轻微渐变底色来区分信息层级，不再使用另一套 hover 动效。
 */
const ABOUT_THANKS_HOVER = cn(ABOUT_CARD_HOVER, "about-card-modern--thanks");

/** 关于页文案：由服务端词典注入，避免硬编码三语文案 */
export type AboutPageDictionary = AboutMusicCopy & {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroLead: string;
  badge1: string;
  badge2: string;
  badge3: string;
  ctaBlog: string;
  ctaContact: string;
  introTitle: string;
  introLead: string;
  intro1Title: string;
  intro1Desc: string;
  intro2Title: string;
  intro2Desc: string;
  intro3Title: string;
  intro3Desc: string;
  valuesTitle: string;
  valuesLead: string;
  practiceTitle: string;
  practiceLead: string;
  practice1Title: string;
  practice1Desc: string;
  practice2Title: string;
  practice2Desc: string;
  practice3Title: string;
  practice3Desc: string;
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
  timelineTitle: string;
  timelineLead: string;
  t1Title: string;
  t1Desc: string;
  t1Meta: string;
  t2Title: string;
  t2Desc: string;
  t2Meta: string;
  t3Title: string;
  t3Desc: string;
  t3Meta: string;
  contactTitle: string;
  contactLead: string;
  contactEmailTitle: string;
  contactEmailDesc: string;
  contactEmailOpen: string;
  contactEmailCopy: string;
  contactEmailValue: string;
  contactSocialTitle: string;
  contactSocialDesc: string;
  contactGithubLabel: string;
  /** 个人网站按钮（资料中填写 website 时显示） */
  contactWebsiteLabel: string;
  contactLocationTitle: string;
  contactLocationDesc: string;
  thanksTitle: string;
  thanksBody: string;
  thanksCtaBlog: string;
  thanksCtaHome: string;
  copyOk: string;
  /** 社交链接：无接口数据时在词典中配置 GitHub 主页 */
  socialGithubUrl: string;
};

type Props = {
  lang: string;
  about: AboutPageDictionary;
  /** 内存超级管理员个人资料（服务端注入）；无则仅用词典占位 */
  ownerPublic?: AboutOwnerPublic | null;
};

export function AboutPageContent({ lang, about: a, ownerPublic }: Props) {
  const prefix = `/${lang}`;
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 接口优先：与 /api/profile、/api/about/owner 同源（user_profiles.user_id=0）
  const displayEmail = ownerPublic?.email ?? a.contactEmailValue;
  const displayGithubUrl = ownerPublic?.githubUrl ?? a.socialGithubUrl;
  const displayLocationBadge = ownerPublic?.location ?? a.badge1;
  const displayLocationDesc = ownerPublic?.location ?? a.contactLocationDesc;
  const displayWebsite = ownerPublic?.website?.trim() || null;

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* 剪贴板权限被拒时静默失败 */
    }
  }, [displayEmail]);

  const musicCopy: AboutMusicCopy = {
    musicTitle: a.musicTitle,
    musicLead: a.musicLead,
    musicPlaylist: a.musicPlaylist,
    musicNoPreview: a.musicNoPreview,
    musicPrev: a.musicPrev,
    musicNext: a.musicNext,
    musicPlay: a.musicPlay,
    musicPause: a.musicPause,
    musicMute: a.musicMute,
    musicUnmute: a.musicUnmute,
    musicVolume: a.musicVolume,
    musicOpenExternal: a.musicOpenExternal,
    musicLoopOff: a.musicLoopOff,
    musicLoopAll: a.musicLoopAll,
    musicLoopOne: a.musicLoopOne,
    tracks: a.tracks,
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />

      {/* 首屏：无额外全幅色块，避免与主背景形成「硬边条」 */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="relative z-10 container mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection animation="fadeInUp">
            <div className="relative mx-auto mb-8 w-28 h-28 md:w-32 md:h-32">
              <div className="relative z-10 overflow-hidden rounded-full shadow-xl ring-2 ring-primary/10">
                <Image
                  src="/images/logo.png"
                  alt=""
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{a.heroTitle}</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{a.heroLead}</p>
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {displayLocationBadge}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {a.badge2}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <PenLine className="h-3.5 w-3.5" />
                {a.badge3}
              </Badge>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full shadow-md" asChild>
                <Link href={`${prefix}/blog`}>{a.ctaBlog}</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-border/40 bg-background/50" asChild>
                <Link href="#contact">{a.ctaContact}</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative pb-8 md:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection className="mb-8 text-center" animation="fadeInUp">
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">{a.introTitle}</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">{a.introLead}</p>
          </AnimatedSection>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: a.intro1Title, desc: a.intro1Desc, icon: BookOpen },
              { title: a.intro2Title, desc: a.intro2Desc, icon: PenLine },
              { title: a.intro3Title, desc: a.intro3Desc, icon: Sparkles },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80} animation="slideInUp">
                <Card className={cn("h-full p-6", ABOUT_CARD_HOVER)}>
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-[transform,background-color] duration-300 ease-out group-hover:scale-[1.06] group-hover:bg-primary/[0.16]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold transition-colors duration-300 group-hover:text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/90">
                    {item.desc}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 价值观：仅用极淡背景做过渡，不用上下边框线 */}
      <section className="relative bg-gradient-to-b from-muted/0 via-muted/20 to-muted/0 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection className="mb-12 text-center" animation="fadeInUp">
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">{a.practiceTitle}</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">{a.practiceLead}</p>
          </AnimatedSection>
          <div className="mb-14 grid gap-6 md:grid-cols-3">
            {[
              { title: a.practice1Title, desc: a.practice1Desc, icon: PenLine },
              { title: a.practice2Title, desc: a.practice2Desc, icon: Sparkles },
              { title: a.practice3Title, desc: a.practice3Desc, icon: Heart },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80} animation="slideInUp">
                <Card className={cn("h-full p-6", ABOUT_CARD_HOVER)}>
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-[transform,background-color] duration-300 ease-out group-hover:scale-[1.06] group-hover:bg-primary/[0.16]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold transition-colors duration-300 group-hover:text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/90">
                    {item.desc}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mb-12 text-center" animation="fadeInUp">
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">{a.valuesTitle}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">{a.valuesLead}</p>
          </AnimatedSection>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: a.value1Title, desc: a.value1Desc, icon: BookOpen },
              { title: a.value2Title, desc: a.value2Desc, icon: Sparkles },
              { title: a.value3Title, desc: a.value3Desc, icon: Heart },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80} animation="slideInUp">
                <Card className={cn("h-full p-6", ABOUT_CARD_HOVER)}>
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-[transform,background-color] duration-300 ease-out group-hover:scale-[1.06] group-hover:bg-primary/[0.16]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold transition-colors duration-300 group-hover:text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/90">
                    {item.desc}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 音乐：外链 QQ 音乐 + 可选站内试听 */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection className="mb-8 text-center" animation="fadeInUp">
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">{a.musicTitle}</h2>
          </AnimatedSection>
          <AnimatedSection delay={60} animation="scaleIn">
            <AboutMusicPlayer copy={musicCopy} />
          </AnimatedSection>
        </div>
      </section>

      {/* 时间线：生活化叙事，而非开发排期 */}
      <section className="relative bg-gradient-to-b from-muted/0 via-muted/12 to-muted/0 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection className="mb-10 text-center" animation="fadeInUp">
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">{a.timelineTitle}</h2>
            <p className="text-muted-foreground">{a.timelineLead}</p>
          </AnimatedSection>
          <div className="relative space-y-8 pl-1 md:pl-2">
            {[
              { title: a.t1Title, desc: a.t1Desc, meta: a.t1Meta },
              { title: a.t2Title, desc: a.t2Desc, meta: a.t2Meta },
              { title: a.t3Title, desc: a.t3Desc, meta: a.t3Meta },
            ].map((row, i) => (
              <AnimatedSection key={row.title} delay={i * 100} animation="fadeInLeft">
                <div className="group/row relative flex gap-4 md:gap-6">
                  {/* 仅保留圆点；悬停时与右侧卡片联动微缩放 */}
                  <div className="relative z-10 mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15 transition-[transform,box-shadow] duration-300 ease-out group-hover/row:scale-110 group-hover/row:ring-primary/25 md:mt-2.5 md:h-3 md:w-3" />
                  <Card className={cn("flex-1 p-5", ABOUT_CARD_HOVER)}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold transition-colors duration-300 group-hover/row:text-foreground">
                        {row.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal transition-colors duration-300 group-hover/row:bg-primary/12 group-hover/row:text-foreground"
                      >
                        {row.meta}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover/row:text-muted-foreground/90">
                      {row.desc}
                    </p>
                  </Card>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 联系 */}
      <section id="contact" className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <AnimatedSection className="mb-10 text-center" animation="fadeInUp">
            <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
              <MessageCircle className="h-7 w-7 text-primary" />
              {a.contactTitle}
            </h2>
            <p className="text-muted-foreground">{a.contactLead}</p>
          </AnimatedSection>

          <div className="grid gap-6 md:grid-cols-3">
            <AnimatedSection animation="scaleIn">
              <Card className={cn("h-full p-6 text-center", ABOUT_CARD_HOVER)}>
                <Mail className="mx-auto mb-3 h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:scale-110" />
                <h3 className="mb-1 font-semibold">{a.contactEmailTitle}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{a.contactEmailDesc}</p>
                <p className="mb-4 truncate text-xs text-muted-foreground">{displayEmail}</p>
                <div className="flex flex-col gap-2">
                  <Button variant="default" className="w-full rounded-full" asChild>
                    <a href={`mailto:${displayEmail}`}>{a.contactEmailOpen}</a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    type="button"
                    onClick={() => void copyEmail()}
                  >
                    {copied ? a.copyOk : a.contactEmailCopy}
                  </Button>
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={80} animation="scaleIn">
              <Card className={cn("h-full p-6 text-center", ABOUT_CARD_HOVER)}>
                <Github className="mx-auto mb-3 h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:scale-110" />
                <h3 className="mb-1 font-semibold">{a.contactSocialTitle}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{a.contactSocialDesc}</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <a href={displayGithubUrl} target="_blank" rel="noopener noreferrer">
                      {a.contactGithubLabel}
                    </a>
                  </Button>
                  {displayWebsite ? (
                    <Button variant="outline" className="w-full rounded-full gap-1.5" asChild>
                      <a href={displayWebsite} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 shrink-0" />
                        {a.contactWebsiteLabel}
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={160} animation="scaleIn">
              <Card className={cn("h-full p-6 text-center", ABOUT_CARD_HOVER)}>
                <MapPin className="mx-auto mb-3 h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:scale-110" />
                <h3 className="mb-1 font-semibold">{a.contactLocationTitle}</h3>
                <p className="text-sm text-muted-foreground">{displayLocationDesc}</p>
              </Card>
            </AnimatedSection>
          </div>

          <AnimatedSection className="mt-12" delay={120} animation="fadeInUp">
            <Card className={cn("p-8 text-center", ABOUT_THANKS_HOVER)}>
              <h3 className="mb-3 flex items-center justify-center gap-2 text-xl font-bold">
                <Heart className="h-6 w-6 text-primary transition-transform duration-300 ease-out group-hover:scale-110" />
                {a.thanksTitle}
              </h3>
              <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">{a.thanksBody}</p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" className="rounded-full" asChild>
                  <Link href={`${prefix}/blog`}>{a.thanksCtaBlog}</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href={prefix}>{a.thanksCtaHome}</Link>
                </Button>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
