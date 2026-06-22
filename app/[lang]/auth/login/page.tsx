"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, Form, Input } from "@heroui/react";
import { ArrowLeftIcon, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import message from "@/lib/utils/message";
import { LoginRequest } from "@/types/blog";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const lang = params.lang || "zh-CN";
  const dict = useClientDictionary(lang);
  const t = pickText((dict as { auth?: { loginPage?: Record<string, string> } })?.auth?.loginPage);
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    const data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));

    try {
      const result = await login(data as unknown as LoginRequest);
      if (result.success) {
        // 登录成功，跳转到首页或之前访问的页面
        const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || `/${lang}`;
        router.push(returnUrl);
      } else {
        // 接口返回 success:false 时携带 message（如 401 用户名或密码错误）
        message.error(result.message || t.networkError);
      }
    } catch (error) {
      console.error("登录提交异常:", error);
      message.error(t.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTextReady(t)) return null;

  return (
    <div className="h-screen flex overflow-y-auto pt-24 justify-center">
      <div className="container max-w-screen-sm">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center text-sm text-default-700 transition-colors hover:text-foreground"
          >
            <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
              {t.backHome}
            </Button>
          </Link>
        </div>

        {/* 登录卡片：浅色用柔和白底+细边+轻阴影，避免与视频底对比过硬；文案用语义色保证对比度 */}
        <Card
          classNames={{
            base: [
              "w-full border backdrop-blur-xl backdrop-saturate-150",
              "border-default-200/90 bg-white/88 shadow-lg shadow-black/[0.06]",
              "dark:border-white/10 dark:bg-background/55 dark:shadow-black/40",
            ].join(" "),
          }}
        >
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="mb-2 text-2xl font-bold text-foreground dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                {t.welcome}
              </h1>
              <p className="text-default-600 dark:text-white/90 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {t.subtitle}
              </p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名/邮箱输入 */}
              <Input
                name="username"
                type="text"
                label={<span className="text-default-700 dark:text-white/85">{t.usernameLabel}</span>}
                placeholder={t.usernamePlaceholder}
                startContent={<Mail className="h-4 w-4 text-default-500 dark:text-white/65" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input:
                    "text-sm text-foreground placeholder:text-default-400 dark:text-white dark:placeholder:text-white/50",
                  inputWrapper:
                    "border-default-300 bg-white/80 hover:border-primary data-[hover=true]:border-primary dark:border-white/35 dark:bg-black/35 dark:data-[hover=true]:border-primary",
                }}
                isClearable
                validate={(value) => {
                  if (!value) {
                    return t.usernameRequired;
                  }

                  return null;
                }}
              />

              {/* 密码输入 */}
              <Input
                name="password"
                // errorMessage="密码不能为空"
                type={showPassword ? "text" : "password"}
                label={<span className="text-default-700 dark:text-white/85">{t.passwordLabel}</span>}
                placeholder={t.passwordPlaceholder}
                validate={(value) => {
                  if (!value) {
                    return t.passwordRequired;
                  }

                  if (value.length < 6) {
                    return t.passwordMin;
                  }
                  return null;
                }}
                startContent={<Lock className="h-4 w-4 text-default-500 dark:text-white/65" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-default-500 dark:text-white/65" />
                    ) : (
                      <Eye className="h-4 w-4 text-default-500 dark:text-white/65" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                classNames={{
                  input:
                    "text-sm text-foreground placeholder:text-default-400 dark:text-white dark:placeholder:text-white/50",
                  inputWrapper:
                    "border-default-300 bg-white/80 hover:border-primary data-[hover=true]:border-primary dark:border-white/35 dark:bg-black/35 dark:data-[hover=true]:border-primary",
                }}
              />

              {/* 忘记密码链接 */}
              <div className="w-full flex justify-end">
                <Link
                  href={`/${lang}/auth/forgot-password`}
                  className="text-sm font-medium text-primary hover:opacity-90"
                >
                  {t.forgot}
                </Link>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-medium"
                isLoading={isSubmitting || isLoading}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? t.loggingIn : t.login}
              </Button>

              {/* 注册链接 */}
              <div className="w-full text-center">
                <span className="text-sm">
                  <span className="text-default-600 dark:text-white/85">{t.noAccount} </span>
                  <Link href={`/${lang}/auth/register`} className="font-medium text-primary hover:opacity-90">
                    {t.registerNow}
                  </Link>
                </span>
              </div>
            </Form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-default-600 drop-shadow-sm dark:text-white/80 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {t.agreementPrefix}{" "}
            <Link
              href={`/${lang}/terms?return=${encodeURIComponent(pathname)}`}
              className="font-medium text-primary hover:underline"
            >
              {t.terms}
            </Link>{" "}
            {t.and}{" "}
            <Link
              href={`/${lang}/privacy?return=${encodeURIComponent(pathname)}`}
              className="font-medium text-primary hover:underline"
            >
              {t.privacy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
