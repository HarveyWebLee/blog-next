"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Form } from "@heroui/react";
import { AlertCircle, ArrowLeftIcon, CheckCircle, Clock, Eye, EyeOff, Lock, Mail, Shield, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useEmailVerification, setUseEmailVerification] = useState(true);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");

  // 发送验证码
  const handleSendCode = async (emailValue: string) => {
    setEmailError("");
    setCodeError("");

    // 验证邮箱地址是否为空或格式不正确
    if (!emailValue?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      setEmailError("请输入有效的邮箱地址");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailValue, type: "register" }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setEmailError("");
        setSuccessMessage("验证码已发送到您的邮箱");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setEmailError(data.message || "发送验证码失败");
      }
    } catch (error) {
      setEmailError("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    const formData = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          useEmailVerification: true,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功，跳转到登录页面
        router.push("/auth/login?message=注册成功，请登录");
      } else {
        if (data.message?.includes("验证码")) {
          setCodeError(data.message);
        } else {
          setEmailError(data.message || "注册失败");
        }
      }
    } catch (error) {
      setEmailError("注册失败，请稍后重试");
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

        {/* 成功提示 */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* 注册卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账户</h1>
              <p className="text-gray-400">使用邮箱验证码注册，安全便捷</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名输入 */}
              <Input
                type="text"
                label={<span className="text-gray-200">用户名</span>}
                name="username"
                placeholder="请输入用户名"
                startContent={<User className="w-4 h-4 text-gray-200" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm",
                  inputWrapper:
                    "border-gray-300 hover:blog-border-y-box-shadowlue-500 focus-within:blog-border-y-box-shadowlue-500",
                }}
                validate={(value) => {
                  if (!value) {
                    return "用户名不能为空";
                  }

                  if (value.length < 3) {
                    return "用户名长度至少3位";
                  }

                  if (value.length > 12) {
                    return "用户名长度最多12位";
                  }

                  return null;
                }}
              />

              {/* 显示名称输入 */}
              <Input
                type="text"
                label={<span className="text-gray-200">显示名称</span>}
                name="displayName"
                placeholder="请输入显示名称"
                startContent={<User className="w-4 h-4 text-gray-200" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-sm",
                  inputWrapper:
                    "border-gray-300 hover:blog-border-y-box-shadowlue-500 focus-within:blog-border-y-box-shadowlue-500",
                }}
                validate={(value) => {
                  if (!value?.trim()) {
                    return "显示名称不能为空";
                  }

                  if (value.length < 3) {
                    return "显示名称长度至少3位";
                  }

                  if (value.length > 12) {
                    return "显示名称长度最多12位";
                  }

                  return null;
                }}
              />

              {/* 邮箱输入 */}
              <Input
                type="email"
                name="email"
                label={<span className="text-gray-200">邮箱地址</span>}
                placeholder="请输入邮箱地址"
                startContent={<Mail className="w-4 h-4 text-gray-200" />}
                variant="bordered"
                size="lg"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                classNames={{
                  input: "text-sm",
                  inputWrapper: `border-gray-300 hover:border-blue-500 focus-within:border-blue-500 ${
                    emailError ? "border-red-500" : ""
                  }`,
                }}
                validate={(value) => {
                  if (!value?.trim()) {
                    return "邮箱地址不能为空";
                  }

                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim())) {
                    return "请输入有效的邮箱地址";
                  }

                  return null;
                }}
              />

              {/* 邮箱错误提示 */}
              {emailError && (
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}

              {/* 验证码输入和发送按钮 */}
              <div className="space-y-3 w-full">
                {/* 验证码标题和状态 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-200">邮箱验证码</span>
                    {codeSent && (
                      <div className="flex items-center space-x-1 text-green-500 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span>已发送</span>
                      </div>
                    )}
                  </div>
                  {countdown > 0 && (
                    <div className="flex items-center space-x-1 text-orange-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{countdown}s</span>
                    </div>
                  )}
                </div>

                {/* 验证码输入和发送按钮 */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-[0.8]">
                    <Input
                      type="text"
                      name="verificationCode"
                      placeholder="请输入6位验证码"
                      startContent={
                        <div className="flex items-center space-x-1 text-gray-400">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                      }
                      variant="bordered"
                      size="lg"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setCodeError("");
                      }}
                      maxLength={6}
                      classNames={{
                        input: "text-lg text-center font-mono tracking-[0.5em] font-semibold",
                        inputWrapper: `border-2 rounded-xl transition-all duration-200 ${
                          codeError
                            ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                            : verificationCode.length === 6
                              ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-300 hover:border-blue-400 focus-within:border-blue-500 bg-white dark:bg-gray-800"
                        }`,
                        base: "w-full",
                      }}
                      validate={(value) => {
                        if (!value?.trim()) {
                          return "验证码不能为空";
                        }

                        if (value && value.length !== 6) {
                          return "验证码必须是6位数字";
                        }

                        return null;
                      }}
                    />

                    {/* 验证码输入提示 */}
                    {verificationCode.length > 0 && verificationCode.length < 6 && (
                      <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
                        还需输入 {6 - verificationCode.length} 位
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    color={codeSent ? "success" : "primary"}
                    variant={codeSent ? "bordered" : "solid"}
                    size="lg"
                    isLoading={isSendingCode}
                    disabled={
                      isSendingCode ||
                      countdown > 0 ||
                      !email?.trim() ||
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim())
                    }
                    onPress={() => handleSendCode(email)}
                    className={`flex-[0.3] h-12 rounded-xl font-medium transition-all duration-200 ${
                      codeSent
                        ? "border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                    startContent={
                      isSendingCode ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : codeSent ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )
                    }
                  >
                    {isSendingCode
                      ? "发送中..."
                      : countdown > 0
                        ? `重新发送 (${countdown}s)`
                        : codeSent
                          ? "重新发送"
                          : "发送验证码"}
                  </Button>
                </div>

                {/* 验证码错误提示 */}
                {codeError && (
                  <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{codeError}</span>
                  </div>
                )}

                {/* 验证码提示信息 */}
                {codeSent && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="text-blue-600 dark:text-blue-400 font-medium">验证码已发送</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          已发送到 <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                        </div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          请检查邮箱（包括垃圾邮件文件夹）
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 密码输入 */}
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                label={<span className="text-gray-200">密码</span>}
                placeholder="请输入密码"
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
                validate={(value) => {
                  if (!value) {
                    return "确认密码不能为空";
                  }

                  if (value.length < 8) {
                    return "密码长度至少8位";
                  }

                  if (confirmPassword && value && value !== confirmPassword) {
                    return "两次输入的密码不一致";
                  }

                  return null;
                }}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setConfirmPassword(e.target.value);
                }}
              />

              {/* 确认密码输入 */}
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                label={<span className="text-gray-200">确认密码</span>}
                placeholder="请再次输入密码"
                startContent={<Lock className="w-4 h-4 text-gray-200" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                    aria-label={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
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
                validate={(value) => {
                  if (!value) {
                    return "确认密码不能为空";
                  }

                  if (value.length < 8) {
                    return "密码长度至少8位";
                  }

                  //  实时校验
                  if (password && value && value !== password) {
                    return "两次输入的密码不一致";
                  }

                  return null;
                }}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
              />

              {/* 注册按钮 */}
              <Button
                type="submit"
                color="success"
                size="lg"
                className="w-full font-medium"
                isLoading={isSubmitting}
                disabled={isSubmitting || !verificationCode || verificationCode.length !== 6}
                startContent={<Shield className="w-4 h-4" />}
              >
                {isSubmitting ? "注册中..." : "创建账户"}
              </Button>

              {/* 登录链接 */}
              <div className="w-full text-center">
                <span className="text-sm text-gray-600">
                  已有账户？
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    立即登录
                  </Link>
                </span>
              </div>
            </Form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-200">
            注册即表示您同意我们的{" "}
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
