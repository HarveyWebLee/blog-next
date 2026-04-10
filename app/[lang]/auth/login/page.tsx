"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, Form, Input } from "@heroui/react";
import { ArrowLeftIcon, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useAuth } from "@/lib/contexts/auth-context";
import { LoginRequest } from "@/types/blog";

export default function LoginPage() {
  const router = useRouter();
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
        const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
        router.push(returnUrl);
      } else {
      }
    } catch (error) {
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
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
              返回首页
            </Button>
          </Link>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎来到荒野</h1>
              <p className="text-gray-400">请登录您的账户</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名/邮箱输入 */}
              <Input
                name="username"
                type="text"
                label={<span className="text-gray-200">用户名或邮箱</span>}
                placeholder="请输入用户名或邮箱"
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
                    return "用户名或邮箱不能为空";
                  }

                  return null;
                }}
              />

              {/* 密码输入 */}
              <Input
                name="password"
                // errorMessage="密码不能为空"
                type={showPassword ? "text" : "password"}
                label={<span className="text-gray-200">密码</span>}
                placeholder="请输入密码"
                validate={(value) => {
                  if (!value) {
                    return "密码不能为空";
                  }

                  if (value.length < 6) {
                    return "密码长度至少6位";
                  }
                  return null;
                }}
                startContent={<Lock className="w-4 h-4 text-gray-200" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
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
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  忘记密码？
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
                {isSubmitting ? "登录中..." : "登录"}
              </Button>

              {/* 注册链接 */}
              <div className="w-full text-center">
                <span className="text-sm">
                  <span className="text-gray-200">还没有账户？ </span>
                  <Link
                    href="/auth/register"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    立即注册
                  </Link>
                </span>
              </div>
            </Form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-200">
            登录即表示您同意我们的{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              服务条款
            </Link>{" "}
            和{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
