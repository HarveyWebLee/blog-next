"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { ArrowRight, Bookmark, Eye, FolderOpen, Hash, Mail, Tag, TrendingUp } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { useNewsletterGuestSubscription } from "@/lib/hooks/useNewsletterGuestSubscription";
import { usePosts } from "@/lib/hooks/usePosts";
import { useTags } from "@/lib/hooks/useTags";
import { message } from "@/lib/utils";

export function BlogSidebar({ lang = "zh-CN" }: { lang?: string }) {
  const t =
    lang === "en-US"
      ? {
          categoryTitle: "Categories",
          categoryDesc: "Browse posts by topic",
          tagTitle: "Popular Tags",
          tagDesc: "Find related content quickly",
          popularTitle: "Popular Posts",
          popularDesc: "Most popular content",
          views: "views",
          subscribeTitle: "Subscribe",
          subscribeDesc: "Get updates on latest posts",
          emailPlaceholder: "Enter email address",
          subscribe: "Subscribe",
          unsubscribe: "Unsubscribe",
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
        }
      : lang === "ja-JP"
        ? {
            categoryTitle: "カテゴリ",
            categoryDesc: "テーマ別に記事を探す",
            tagTitle: "人気タグ",
            tagDesc: "関連コンテンツをすばやく検索",
            popularTitle: "人気記事",
            popularDesc: "最も人気のあるコンテンツ",
            views: "閲覧",
            subscribeTitle: "更新を購読",
            subscribeDesc: "最新記事の通知を受け取る",
            emailPlaceholder: "メールアドレスを入力",
            subscribe: "購読する",
            unsubscribe: "購読解除",
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
          }
        : {
            categoryTitle: "文章分类",
            categoryDesc: "按主题浏览文章",
            tagTitle: "热门标签",
            tagDesc: "快速找到相关内容",
            popularTitle: "热门文章",
            popularDesc: "最受欢迎的内容",
            views: "阅读",
            subscribeTitle: "订阅更新",
            subscribeDesc: "获取最新文章通知",
            emailPlaceholder: "输入邮箱地址",
            subscribe: "订阅",
            unsubscribe: "取消订阅",
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
          };
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
  const { categories } = useCategories({ autoFetch: true, limit: 20 });
  const { tags } = useTags({ autoFetch: true, initialLimit: 20 });
  const { posts: hotPosts } = usePosts({
    initialParams: {
      status: "published",
      visibility: "public",
      limit: 5,
      sortBy: "viewCount",
      sortOrder: "desc",
    },
    autoFetch: true,
  });
  const activeCategories = categories.filter((category) => category.isActive).slice(0, 8);
  const activeTags = tags
    .filter((tag) => tag.isActive)
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
    .slice(0, 12);
  const loginEmail = useMemo(() => {
    if (!isAuthenticated) return "";
    return (user?.email || "").trim().toLowerCase();
  }, [isAuthenticated, user]);

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

    queryStatus();
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

  return (
    <div className="space-y-6">
      {/* 分类 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.categoryTitle}</p>
            <p className="text-small text-default-500">{t.categoryDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1">
            {activeCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/${lang}/blog?categoryId=${category.id}`}
                className="group flex items-center justify-between rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl transition-colors duration-300 dark:bg-black/5 hover:border-primary/20 hover:bg-white/10 dark:hover:border-primary/25 dark:hover:bg-black/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-default-400 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  className="backdrop-blur-xl bg-white/10 dark:bg-black/10"
                >
                  {category.postCount || 0}
                </Chip>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 热门标签 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20">
            <Hash className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.tagTitle}</p>
            <p className="text-small text-default-500">{t.tagDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag, index) => (
              <Link
                key={tag.id}
                href={`/${lang}/blog?tagId=${tag.id}`}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Chip
                  startContent={<Tag className="w-3 h-3" />}
                  variant="flat"
                  className="hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name} ({tag.postCount || 0})
                </Chip>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 热门文章 */}
      <Card className="border-0 backdrop-blur-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-success/20 to-warning/20">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.popularTitle}</p>
            <p className="text-small text-default-500">{t.popularDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-4">
            {hotPosts.slice(0, 5).map((post, index) => (
              <div key={post.slug} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Link href={`/${lang}/blog/${post.slug}`} className="block group">
                  {/* 悬停不用 scale，避免侧栏/卡片内出现临时滚动条；用边框与阴影做层次即可 */}
                  <div className="flex items-start gap-3 rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl transition-colors duration-300 dark:bg-black/5 hover:border-primary/20 hover:bg-white/10 dark:hover:border-primary/25 dark:hover:bg-black/10">
                    <div className="flex-shrink-0">
                      <Chip
                        size="sm"
                        color={index === 0 ? "warning" : index === 1 ? "secondary" : "default"}
                        variant="solid"
                        className="backdrop-blur-xl"
                      >
                        {index + 1}
                      </Chip>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-default-400">
                        <Eye className="w-3 h-3" />
                        <span>
                          {post.viewCount.toLocaleString()} {t.views}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-default-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
                {index < hotPosts.slice(0, 5).length - 1 && <Divider className="mt-4" />}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 订阅 */}
      <Card className="border-0 backdrop-blur-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 hover:from-primary/20 hover:via-secondary/20 hover:to-accent/20 transition-all duration-300 animate-fade-in-up">
        <CardHeader className="flex gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-semibold">{t.subscribeTitle}</p>
            <p className="text-small text-default-500">{t.subscribeDesc}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0 space-y-3">
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
                  input: "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
                  inputWrapper:
                    "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 hover:border-primary/50 focus-within:border-primary",
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
                  input: "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
                  inputWrapper:
                    "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 hover:border-primary/50 focus-within:border-primary",
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="flat"
                className="w-full font-medium"
                isLoading={guestNl.sendingCode}
                isDisabled={guestNl.cooldownSec > 0}
                onPress={() => void guestNl.sendVerification(guestNl.guestIsSubscribed ? "unsubscribe" : "subscribe")}
              >
                {guestNl.cooldownSec > 0 ? `${guestNl.cooldownSec}s` : t.sendCode}
              </Button>
            </>
          )}
          <Button
            color="primary"
            variant="shadow"
            size="sm"
            className="w-full font-semibold tracking-wide"
            endContent={<Mail className="w-4 h-4" />}
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
                ? t.unsubscribe
                : t.subscribe
              : guestNl.guestIsSubscribed
                ? t.unsubscribe
                : t.subscribe}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
