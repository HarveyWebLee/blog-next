"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { ArrowLeft, ArrowLeftIcon, CheckCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的邮箱地址");
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
        setError(data.message || "发送失败，请稍后重试");
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen flex overflow-y-auto pt-24 justify-center">
        <div className="container max-w-screen-sm">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
                返回首页
              </Button>
            </Link>
          </div>

          {/* 成功卡片 */}
          <Card className="shadow-xl">
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">邮件已发送</h1>
              <p className="text-gray-400 mb-6">
                我们已向 <span className="text-gray-300 font-bold">{email}</span> 发送了密码重置链接。
                <br />
                请检查您的邮箱并点击链接重置密码。
              </p>

              <div className="space-y-3">
                <Button as={Link} href="/auth/login" color="primary" size="lg" className="w-full font-medium">
                  返回登录
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
                  重新发送
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              没有收到邮件？请检查垃圾邮件文件夹，或{" "}
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="text-blue-600 hover:underline"
              >
                重新发送
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
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
              返回首页
            </Button>
          </Link>
        </div>

        {/* 忘记密码卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">忘记密码</h1>
              <p className="text-gray-600">输入您的邮箱地址，我们将发送密码重置链接给您</p>
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
                  label={<span className="text-gray-200">邮箱地址</span>}
                  placeholder="请输入您的邮箱地址"
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
                {isSubmitting ? "发送中..." : "发送重置链接"}
              </Button>

              {/* 返回登录链接 */}
              <div className="text-center">
                <span className="text-sm">
                  <span className="text-gray-200">记起密码了？ </span>
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    返回登录
                  </Link>
                </span>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-100">
            如果您在几分钟内没有收到邮件，请检查您的垃圾邮件文件夹。
            <br />
            如果问题仍然存在，请联系我们的支持团队。
          </p>
        </div>
      </div>
    </div>
  );
}
