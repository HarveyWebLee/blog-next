"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { BookOpen, ClipboardList, FolderOpen, Hash, Home, Mail, Scale, Shield } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useNewsletterGuestSubscription } from "@/lib/hooks/useNewsletterGuestSubscription";
import { message } from "@/lib/utils";
import { Locale } from "@/types";

/** 与 middleware 默认语言保持一致，避免在非 [lang] 段误用 Footer 时链接无效 */
const FALLBACK_LANG = "zh-CN";

const resolveLocale = (lang: string): Locale => {
  if (lang === "en-US" || lang === "ja-JP") return lang;
  return "zh-CN";
};

/** 底部文案：与 Header 导航对齐，并补充隐私条款、关于页联系区块 */
const copy = {
  "zh-CN": {
    explore: "浏览",
    home: "首页",
    blog: "博客",
    categories: "分类",
    tags: "标签",
    about: "关于",
    legal: "条款与说明",
    privacy: "隐私政策",
    terms: "服务条款",
    contact: "联系与反馈",
    contactDesc: "合作、建议或问题，欢迎到关于页查看联系方式。",
    contactCta: "前往联系",
    subscribe: "邮件订阅",
    subscribeDesc: "新文章发布时我们会发送邮件通知。",
    emailPlaceholder: "输入邮箱地址",
    subscribeBtn: "订阅",
    unsubscribeBtn: "取消订阅",
    subscribeSuccess: "订阅成功",
    subscribeFail: "订阅失败",
    unsubscribeSuccess: "已取消订阅",
    unsubscribeFail: "取消订阅失败",
    invalidEmail: "请输入有效的邮箱地址",
    codePlaceholder: "邮箱验证码",
    sendCode: "发送验证码",
    needSubscribeCode: "请填写邮件中的验证码后再完成订阅",
    needUnsubscribeCode: "请填写邮件中的验证码后再取消订阅",
    sendCodeOk: "验证码已发送，请查收邮件",
    sendCodeFail: "验证码发送失败",
    loggedInHint: "将使用当前账号邮箱接收通知。",
    rights: "保留所有权利。",
  },
  "en-US": {
    explore: "Explore",
    home: "Home",
    blog: "Blog",
    categories: "Categories",
    tags: "Tags",
    about: "About",
    legal: "Legal & docs",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    contactDesc: "For collaboration or feedback, see contact options on the About page.",
    contactCta: "View contact",
    subscribe: "Newsletter",
    subscribeDesc: "Get an email when new posts are published.",
    emailPlaceholder: "Enter your email",
    subscribeBtn: "Subscribe",
    unsubscribeBtn: "Unsubscribe",
    subscribeSuccess: "Subscription successful",
    subscribeFail: "Subscription failed",
    unsubscribeSuccess: "Unsubscribed",
    unsubscribeFail: "Unsubscribe failed",
    invalidEmail: "Please enter a valid email",
    codePlaceholder: "Email code",
    sendCode: "Send code",
    needSubscribeCode: "Enter the code from your email to finish subscribing",
    needUnsubscribeCode: "Enter the code from your email to unsubscribe",
    sendCodeOk: "Verification code sent. Check your inbox.",
    sendCodeFail: "Failed to send verification code",
    loggedInHint: "Notifications will use your account email.",
    rights: "All rights reserved.",
  },
  "ja-JP": {
    explore: "ナビ",
    home: "ホーム",
    blog: "ブログ",
    categories: "カテゴリー",
    tags: "タグ",
    about: "について",
    legal: "規約・資料",
    privacy: "プライバシー",
    terms: "利用規約",
    contact: "お問い合わせ",
    contactDesc: "連携やご意見は、についてページの連絡先をご覧ください。",
    contactCta: "連絡先へ",
    subscribe: "メール購読",
    subscribeDesc: "新着記事をメールでお知らせします。",
    emailPlaceholder: "メールアドレスを入力",
    subscribeBtn: "購読する",
    unsubscribeBtn: "購読解除",
    subscribeSuccess: "購読しました",
    subscribeFail: "購読に失敗しました",
    unsubscribeSuccess: "購読を解除しました",
    unsubscribeFail: "購読解除に失敗しました",
    invalidEmail: "有効なメールアドレスを入力してください",
    codePlaceholder: "確認コード",
    sendCode: "コードを送信",
    needSubscribeCode: "メールの確認コードを入力してから購読を完了してください",
    needUnsubscribeCode: "メールの確認コードを入力してから購読解除してください",
    sendCodeOk: "確認コードを送信しました。メールをご確認ください",
    sendCodeFail: "確認コードの送信に失敗しました",
    loggedInHint: "アカウントのメールアドレスで通知を受け取ります。",
    rights: "All rights reserved.",
  },
} as const;

export function Footer() {
  const params = useParams();
  const pathname = usePathname() || "/";
  const lang = typeof params?.lang === "string" ? params.lang : FALLBACK_LANG;
  const locale = resolveLocale(lang);
  const prefix = `/${lang}`;
  const t = copy[locale];

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const guestNl = useNewsletterGuestSubscription(isAuthenticated, {
    invalidEmail: t.invalidEmail,
    needSubscribeCode: t.needSubscribeCode,
    needUnsubscribeCode: t.needUnsubscribeCode,
    sendCodeOk: t.sendCodeOk,
    sendCodeFail: t.sendCodeFail,
    subscribeSuccess: t.subscribeSuccess,
    subscribeFail: t.subscribeFail,
    unsubscribeSuccess: t.unsubscribeSuccess,
    unsubscribeFail: t.unsubscribeFail,
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

  return (
    <footer className="blog-border-x-box-shadow relative mt-auto overflow-hidden bg-background">
      {/* 与首页氛围呼应的轻渐变，不抢主内容 */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-secondary/[0.05]"
        aria-hidden
      />
      <div className="relative container mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-8">
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
              <Link href={`${prefix}/categories`} className={navLinkClass}>
                <FolderOpen className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.categories}
              </Link>
              <Link href={`${prefix}/tags`} className={navLinkClass}>
                <Hash className="h-4 w-4 shrink-0 text-default-400 transition-colors group-hover:text-primary" />
                {t.tags}
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
