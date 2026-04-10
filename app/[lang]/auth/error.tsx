"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          logPrefix: "Auth page error:",
          title: "Something went wrong",
          desc: "Sorry, an error occurred on auth page. Please retry or go home.",
          retry: "Retry",
          backHome: "Back Home",
          devInfo: "Development error details:",
        }
      : lang === "ja-JP"
        ? {
            logPrefix: "認証ページエラー:",
            title: "エラーが発生しました",
            desc: "認証ページで問題が発生しました。再試行するかホームへ戻ってください。",
            retry: "再試行",
            backHome: "ホームへ戻る",
            devInfo: "開発モードのエラー情報：",
          }
        : {
            logPrefix: "认证页面错误:",
            title: "出现错误",
            desc: "抱歉，认证页面遇到了问题。请尝试刷新页面或返回首页。",
            retry: "重试",
            backHome: "返回首页",
            devInfo: "开发模式错误信息：",
          };
  useEffect(() => {
    // 记录错误到控制台
    console.error(t.logPrefix, error);
  }, [error, t.logPrefix]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.title}</h1>
            <p className="text-gray-600 mb-6">{t.desc}</p>

            <div className="space-y-3">
              <Button
                onClick={reset}
                color="primary"
                size="lg"
                className="w-full font-medium"
                startContent={<RefreshCw className="w-4 h-4" />}
              >
                {t.retry}
              </Button>

              <Button
                as={Link}
                href={`/${lang}`}
                variant="light"
                size="lg"
                className="w-full"
                startContent={<ArrowLeft className="w-4 h-4" />}
              >
                {t.backHome}
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-xs text-gray-600 mb-2">{t.devInfo}</p>
                <p className="text-xs text-red-600 font-mono break-all">{error.message}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
