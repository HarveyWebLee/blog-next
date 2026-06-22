"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { BookOpen, ClipboardList, Home, Mail, Scale, Shield } from "lucide-react";

import { FooterFishSwim } from "@/components/layout/footer-fish-swim";
import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { useNewsletterGuestSubscription } from "@/lib/hooks/useNewsletterGuestSubscription";
import { message } from "@/lib/utils";

/** 与 middleware 默认语言保持一致，避免在非 [lang] 段误用 Footer 时链接无效 */
const FALLBACK_LANG = "zh-CN";

type FooterCopy = Record<
  | "explore"
  | "home"
  | "blog"
  | "about"
  | "legal"
  | "privacy"
  | "terms"
  | "contact"
  | "contactDesc"
  | "contactCta"
  | "subscribe"
  | "subscribeDesc"
  | "emailPlaceholder"
  | "subscribeBtn"
  | "unsubscribeBtn"
  | "subscribeSuccess"
  | "subscribeFail"
  | "unsubscribeSuccess"
  | "unsubscribeFail"
  | "invalidEmail"
  | "codePlaceholder"
  | "sendCode"
  | "needSubscribeCode"
  | "needUnsubscribeCode"
  | "sendCodeOk"
  | "sendCodeFail"
  | "loggedInHint"
  | "rights",
  string
>;

export function Footer() {
  const params = useParams();
  const pathname = usePathname() || "/";
  const lang = typeof params?.lang === "string" ? params.lang : FALLBACK_LANG;
  const prefix = `/${lang}`;
  const dict = useClientDictionary(lang);
  const t = ((dict as { footer?: FooterCopy })?.footer ?? {}) as FooterCopy;

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const guestNl = useNewsletterGuestSubscription(isAuthenticated, {
    invalidEmail: t.invalidEmail ?? "",
    needSubscribeCode: t.needSubscribeCode ?? "",
    needUnsubscribeCode: t.needUnsubscribeCode ?? "",
    sendCodeOk: t.sendCodeOk ?? "",
    sendCodeFail: t.sendCodeFail ?? "",
    subscribeSuccess: t.subscribeSuccess ?? "",
    subscribeFail: t.subscribeFail ?? "",
    unsubscribeSuccess: t.unsubscribeSuccess ?? "",
    unsubscribeFail: t.unsubscribeFail ?? "",
  });

  const loginEmail = useMemo(() => {
    if (!isAuthenticated) return "";
    return (user?.email || "").trim().toLowerCase();
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    const queryStatus = async () => {
      if (!loginEmail) {
        setIsSubscribed(false);
        return;
      }
      try {
        const res = await fetch(`/api/subscriptions?email=${encodeURIComponent(loginEmail)}`);
        const result = await res.json();
        if (result.success) {
          setIsSubscribed(Boolean(result.data?.isSubscribed));
        }
      } catch (error) {
        console.error("获取订阅状态失败:", error);
      }
    };
    void queryStatus();
  }, [loginEmail]);

  const handleAuthSubscribe = async () => {
    const targetEmail = loginEmail.trim().toLowerCase();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail);
    if (!isEmailValid) {
      message.warning(t.invalidEmail);
      return;
    }

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: targetEmail,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        message.error(result.message || t.subscribeFail);
        return;
      }

      setIsSubscribed(true);
      message.success(t.subscribeSuccess);
    } catch (error) {
      console.error("订阅失败:", error);
      message.error(t.subscribeFail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthUnsubscribe = async () => {
    if (!loginEmail) return;
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase() }),
      });
      const result = await response.json();
      if (!result.success) {
        message.error(result.message || t.unsubscribeFail);
        return;
      }
      setIsSubscribed(false);
      message.success(t.unsubscribeSuccess);
    } catch (error) {
      console.error("取消订阅失败:", error);
      message.error(t.unsubscribeFail);
    } finally {
      setSubmitting(false);
    }
  };

  /** 与博客卡片、侧栏一致的链接行：图标 + 文案 + hover 主色 */
  const navLinkClass =
    "group flex items-center gap-2.5 rounded-lg py-1.5 text-sm text-default-600 transition-colors hover:text-primary dark:text-default-400 dark:hover:text-primary";

  if (!dict?.footer) {
    return null;
  }

  return (
    <footer className="blog-border-x-box-shadow relative mt-auto bg-background">
      {/* 与首页氛围呼应的轻渐变，不抢主内容 */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-secondary/[0.05]"
        aria-hidden
      />
      {/* Canvas 小鱼游动：顶层装饰层，pointer-events-none 不挡底部交互（见 footer-fish-swim.tsx） */}
      <FooterFishSwim />
      <div className="relative z-20 container mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-8">
        {/* 顶栏渐变条：与 PostCard / 首页文章卡同一视觉语言 */}
        <div
          className="mb-8 h-1 max-w-32 rounded-full bg-gradient-to-r from-primary via-secondary to-accent md:mb-10"
          aria-hidden
        />

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          {/* 主导航 */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-default-400">{t.explore}</h3>
            <nav className="flex flex-col" aria-label={t.explore}>
              <Link href={prefix} className={navLinkClass}>
                <Home className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.home}
              </Link>
              <Link href={`${prefix}/blog`} className={navLinkClass}>
                <BookOpen className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.blog}
              </Link>
              <Link href={`${prefix}/about`} className={navLinkClass}>
                <ClipboardList className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.about}
              </Link>
            </nav>
          </div>

          {/* 条款与说明（链接） */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-default-400">{t.legal}</h3>
            <nav className="flex flex-col" aria-label={t.legal}>
              <Link href={`${prefix}/privacy?return=${encodeURIComponent(pathname)}`} className={navLinkClass}>
                <Shield className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.privacy}
              </Link>
              <Link href={`${prefix}/terms?return=${encodeURIComponent(pathname)}`} className={navLinkClass}>
                <Scale className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.terms}
              </Link>
            </nav>
          </div>

          {/* 联系与反馈：独占一列（lg 下与浏览 / 条款 / 订阅并列各占 3 栅格） */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-default-400">{t.contact}</h3>
            <div className="rounded-2xl border-0 bg-white/40 p-4 backdrop-blur-md dark:bg-black/20">
              <p className="text-xs leading-relaxed text-default-500">{t.contactDesc}</p>
              <Button
                as="a"
                href={`${prefix}/about#contact`}
                size="sm"
                variant="flat"
                color="primary"
                className="mt-3 font-medium"
                endContent={<Mail className="h-3.5 w-3.5" />}
              >
                {t.contactCta}
              </Button>
            </div>
          </div>

          {/* 邮件订阅：独占一列 */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-default-400">{t.subscribe}</h3>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-xs leading-relaxed text-default-500">{t.subscribeDesc}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-4 backdrop-blur-xl dark:border-white/10">
              {!isAuthLoading && isAuthenticated && <p className="mb-3 text-xs text-default-500">{t.loggedInHint}</p>}
              {!isAuthLoading && !isAuthenticated && (
                <>
                  <Input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={guestNl.subscribeEmail}
                    onValueChange={guestNl.setSubscribeEmail}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      input: "bg-white/10 dark:bg-black/10",
                      inputWrapper:
                        "mb-3 bg-white/20 dark:bg-black/20 border-white/25 dark:border-white/10 hover:border-primary/40",
                    }}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t.codePlaceholder}
                    value={guestNl.subscribeCode}
                    onValueChange={guestNl.setSubscribeCode}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      input: "bg-white/10 dark:bg-black/10",
                      inputWrapper:
                        "mb-3 bg-white/20 dark:bg-black/20 border-white/25 dark:border-white/10 hover:border-primary/40",
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="flat"
                    className="mb-3 w-full font-medium"
                    isLoading={guestNl.sendingCode}
                    isDisabled={guestNl.cooldownSec > 0}
                    onPress={() =>
                      void guestNl.sendVerification(guestNl.guestIsSubscribed ? "unsubscribe" : "subscribe")
                    }
                  >
                    {guestNl.cooldownSec > 0 ? `${guestNl.cooldownSec}s` : t.sendCode}
                  </Button>
                </>
              )}
              <Button
                color="primary"
                variant="shadow"
                size="sm"
                className="w-full font-semibold"
                endContent={<Mail className="h-4 w-4" />}
                isLoading={isAuthenticated ? submitting : guestNl.submitting}
                onPress={() => {
                  if (isAuthenticated) {
                    if (isSubscribed) void handleAuthUnsubscribe();
                    else void handleAuthSubscribe();
                  } else if (guestNl.guestIsSubscribed) {
                    void guestNl.submitGuestUnsubscribe();
                  } else {
                    void guestNl.submitGuestSubscribe();
                  }
                }}
              >
                {isAuthenticated
                  ? isSubscribed
                    ? t.unsubscribeBtn
                    : t.subscribeBtn
                  : guestNl.guestIsSubscribed
                    ? t.unsubscribeBtn
                    : t.subscribeBtn}
              </Button>
            </div>
          </div>
        </div>

        <Divider className="my-8 bg-default-200/60" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-default-500 sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} BlogNext. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
