"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { ArrowLeft, ArrowLeftIcon, CheckCircle, Mail } from "lucide-react";

import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { extractResponseErrorMessage, extractUnknownErrorMessage } from "@/lib/utils/client-error";

export default function ForgotPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const dict = useClientDictionary(lang);
  const t = pickText((dict as { auth?: { forgotPasswordPage?: Record<string, string> } })?.auth?.forgotPasswordPage);

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t.enterEmail);
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.validEmail);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || (await extractResponseErrorMessage(response, t.sendFailed)));
      }
    } catch (error) {
      setError(extractUnknownErrorMessage(error, t.networkError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTextReady(t)) return null;

  if (isSuccess) {
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

          {/* 成功卡片 */}
          <Card className="shadow-xl">
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.sentTitle}</h1>
              <p className="text-gray-400 mb-6">
                {t.sentDescPrefix}
                <span className="text-gray-300 font-bold">{email}</span>
                {t.sentDescSuffix}
              </p>

              <div className="space-y-3">
                <Button as={Link} href={`/${lang}/auth/login`} color="primary" size="lg" className="w-full font-medium">
                  {t.backLogin}
                </Button>

                <Button
                  variant="light"
                  size="lg"
                  className="w-full"
                  onPress={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                >
                  {t.resend}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t.notReceived}{" "}
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="text-blue-600 hover:underline"
              >
                {t.resendAction}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* 忘记密码卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <Input
                  type="email"
                  label={<span className="text-gray-200">{t.emailLabel}</span>}
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<Mail className="w-4 h-4 text-gray-200" />}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-sm",
                    inputWrapper:
                      "border-gray-300 hover:blog-border-y-box-shadowlue-500 focus-within:blog-border-y-box-shadowlue-500",
                  }}
                />
              </div>

              {/* 发送按钮 */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-medium"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? t.sending : t.sendBtn}
              </Button>

              {/* 返回登录链接 */}
              <div className="text-center">
                <span className="text-sm">
                  <span className="text-gray-200">{t.remembered} </span>
                  <Link
                    href={`/${lang}/auth/login`}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t.backLogin2}
                  </Link>
                </span>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-100">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
