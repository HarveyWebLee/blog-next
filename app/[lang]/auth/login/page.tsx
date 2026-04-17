"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, Form, Input } from "@heroui/react";
import { ArrowLeftIcon, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import message from "@/lib/utils/message";
import { LoginRequest } from "@/types/blog";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          backHome: "Back Home",
          welcome: "Welcome to Wilderness",
          subtitle: "Please sign in to your account",
          usernameLabel: "Username or Email",
          usernamePlaceholder: "Enter username or email",
          usernameRequired: "Username or email is required",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter password",
          passwordRequired: "Password is required",
          passwordMin: "Password must be at least 6 characters",
          hidePassword: "Hide password",
          showPassword: "Show password",
          forgot: "Forgot password?",
          loggingIn: "Signing in...",
          login: "Sign In",
          noAccount: "No account yet?",
          registerNow: "Register now",
          agreementPrefix: "By signing in, you agree to our ",
          terms: "Terms",
          and: " and ",
          privacy: "Privacy Policy",
          networkError: "Network error, please try again later",
        }
      : lang === "ja-JP"
        ? {
            backHome: "ホームへ戻る",
            welcome: "荒野へようこそ",
            subtitle: "アカウントにログインしてください",
            usernameLabel: "ユーザー名またはメール",
            usernamePlaceholder: "ユーザー名またはメールを入力",
            usernameRequired: "ユーザー名またはメールは必須です",
            passwordLabel: "パスワード",
            passwordPlaceholder: "パスワードを入力",
            passwordRequired: "パスワードは必須です",
            passwordMin: "パスワードは6文字以上必要です",
            hidePassword: "パスワードを隠す",
            showPassword: "パスワードを表示",
            forgot: "パスワードを忘れた？",
            loggingIn: "ログイン中...",
            login: "ログイン",
            noAccount: "アカウントをお持ちでないですか？",
            registerNow: "今すぐ登録",
            agreementPrefix: "ログインすることで、",
            terms: "利用規約",
            and: "と",
            privacy: "プライバシーポリシー",
            networkError: "通信エラーです。しばらくしてからお試しください",
          }
        : {
            backHome: "返回首页",
            welcome: "欢迎来到荒野",
            subtitle: "请登录您的账户",
            usernameLabel: "用户名或邮箱",
            usernamePlaceholder: "请输入用户名或邮箱",
            usernameRequired: "用户名或邮箱不能为空",
            passwordLabel: "密码",
            passwordPlaceholder: "请输入密码",
            passwordRequired: "密码不能为空",
            passwordMin: "密码长度至少6位",
            hidePassword: "隐藏密码",
            showPassword: "显示密码",
            forgot: "忘记密码？",
            loggingIn: "登录中...",
            login: "登录",
            noAccount: "还没有账户？",
            registerNow: "立即注册",
            agreementPrefix: "登录即表示您同意我们的",
            terms: "服务条款",
            and: "和",
            privacy: "隐私政策",
            networkError: "网络异常，请稍后重试",
          };
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
              <h1 className="mb-2 text-2xl font-bold text-foreground">{t.welcome}</h1>
              <p className="text-default-600 dark:text-default-400">{t.subtitle}</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名/邮箱输入 */}
              <Input
                name="username"
                type="text"
                label={<span className="text-default-700 dark:text-default-300">{t.usernameLabel}</span>}
                placeholder={t.usernamePlaceholder}
                startContent={<Mail className="h-4 w-4 text-default-500 dark:text-default-400" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm text-foreground placeholder:text-default-400",
                  inputWrapper:
                    "border-default-300 bg-white/80 hover:border-primary data-[hover=true]:border-primary dark:border-default-400 dark:bg-transparent",
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
                label={<span className="text-default-700 dark:text-default-300">{t.passwordLabel}</span>}
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
                startContent={<Lock className="h-4 w-4 text-default-500 dark:text-default-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-default-500 dark:text-default-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-default-500 dark:text-default-400" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm text-foreground placeholder:text-default-400",
                  inputWrapper:
                    "border-default-300 bg-white/80 hover:border-primary data-[hover=true]:border-primary dark:border-default-400 dark:bg-transparent",
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
                  <span className="text-default-600 dark:text-default-400">{t.noAccount} </span>
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
          <p className="text-xs text-default-600 drop-shadow-sm dark:text-default-400 dark:drop-shadow-none">
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
