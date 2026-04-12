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
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
              {t.backHome}
            </Button>
          </Link>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.welcome}</h1>
              <p className="text-gray-400">{t.subtitle}</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名/邮箱输入 */}
              <Input
                name="username"
                type="text"
                label={<span className="text-gray-200">{t.usernameLabel}</span>}
                placeholder={t.usernamePlaceholder}
                startContent={<Mail className="w-4 h-4 text-gray-200" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm",
                  inputWrapper:
                    "border-gray-300 hover:blog-border-y-box-shadowlue-500 focus-within:blog-border-y-box-shadowlue-500",
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
                label={<span className="text-gray-200">{t.passwordLabel}</span>}
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
                startContent={<Lock className="w-4 h-4 text-gray-200" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-200" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-200" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm",
                  inputWrapper:
                    "border-gray-300 hover:blog-border-y-box-shadowlue-500 focus-within:blog-border-y-box-shadowlue-500",
                }}
              />

              {/* 忘记密码链接 */}
              <div className="w-full flex justify-end">
                <Link
                  href={`/${lang}/auth/forgot-password`}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
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
                  <span className="text-gray-200">{t.noAccount} </span>
                  <Link
                    href={`/${lang}/auth/register`}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t.registerNow}
                  </Link>
                </span>
              </div>
            </Form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-200">
            {t.agreementPrefix}{" "}
            <Link
              href={`/${lang}/terms?return=${encodeURIComponent(pathname)}`}
              className="text-blue-600 hover:underline"
            >
              {t.terms}
            </Link>{" "}
            {t.and}{" "}
            <Link
              href={`/${lang}/privacy?return=${encodeURIComponent(pathname)}`}
              className="text-blue-600 hover:underline"
            >
              {t.privacy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
