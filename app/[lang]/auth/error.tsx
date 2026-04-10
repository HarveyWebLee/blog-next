"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 记录错误到控制台
    console.error("认证页面错误:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">出现错误</h1>
            <p className="text-gray-600 mb-6">抱歉，认证页面遇到了问题。请尝试刷新页面或返回首页。</p>

            <div className="space-y-3">
              <Button
                onClick={reset}
                color="primary"
                size="lg"
                className="w-full font-medium"
                startContent={<RefreshCw className="w-4 h-4" />}
              >
                重试
              </Button>

              <Button
                as={Link}
                href="/"
                variant="light"
                size="lg"
                className="w-full"
                startContent={<ArrowLeft className="w-4 h-4" />}
              >
                返回首页
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-xs text-gray-600 mb-2">开发模式错误信息：</p>
                <p className="text-xs text-red-600 font-mono break-all">{error.message}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
