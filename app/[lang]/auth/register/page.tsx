"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Form } from "@heroui/react";
import { AlertCircle, ArrowLeftIcon, CheckCircle, Clock, Eye, EyeOff, Lock, Mail, Shield, User } from "lucide-react";

import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";
import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";
import { isTextReady, pickText } from "@/lib/i18n/pick-text";
import { extractResponseErrorMessage, extractUnknownErrorMessage } from "@/lib/utils/client-error";
import { isValidEmailFormat } from "@/lib/utils/email-format";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const lang = params.lang || "zh-CN";
  const dict = useClientDictionary(lang);
  const t = pickText((dict as { auth?: { registerPage?: Record<string, string> } })?.auth?.registerPage);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useEmailVerification, setUseEmailVerification] = useState(true);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  /** 非邮箱、非验证码类的服务端错误（如用户名已存在、密码强度不足），避免误显示在邮箱下方 */
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");

  // 发送验证码
  const handleSendCode = async (emailValue: string) => {
    setEmailError("");
    setCodeError("");
    setSubmitError("");

    const trimmed = emailValue?.trim() ?? "";
    // 与后端文案一致：先提示「必填」，再提示「格式」
    if (!trimmed) {
      setEmailError(t.emailRequired);
      return;
    }

    if (!isValidEmailFormat(trimmed)) {
      setEmailError(t.validEmail);
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmed, type: "register" }),
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
        setSuccessMessage(t.codeSent);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setEmailError(data.message || (await extractResponseErrorMessage(response, t.sendCodeFailed)));
      }
    } catch (error) {
      setEmailError(extractUnknownErrorMessage(error, t.sendCodeRetry));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");
    setCodeError("");
    setSubmitError("");

    const formData = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    const emailTrimmed = typeof formData.email === "string" ? formData.email.trim() : "";

    // 提交前再次校验邮箱，避免仅依赖服务端或绕过表单项校验
    if (!emailTrimmed) {
      setEmailError(t.emailRequired);
      return;
    }

    if (!isValidEmailFormat(emailTrimmed)) {
      setEmailError(t.validEmail);
      return;
    }

    setIsSubmitting(true);

    try {
      const base: Record<string, unknown> = {
        ...(formData as Record<string, unknown>),
        email: emailTrimmed,
        useEmailVerification: true,
        verificationCode,
      };
      const plainPwd = typeof formData.password === "string" ? formData.password : "";
      const payload = await sealPasswordInRequestBody(base, plainPwd, "password");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功，跳转到登录页面
        router.push(`/${lang}/auth/login?message=${encodeURIComponent(t.loginMessage)}`);
      } else {
        const msg: string = data.message || (await extractResponseErrorMessage(response, t.registerFailed));
        // 含「验证码」的归验证码区；其余含「邮箱」的归邮箱区；其它归通用提交错误
        if (msg.includes("验证码")) {
          setCodeError(msg);
        } else if (msg.includes("邮箱")) {
          setEmailError(msg);
        } else {
          setSubmitError(msg);
        }
      }
    } catch (error) {
      setSubmitError(extractUnknownErrorMessage(error, t.registerRetry));
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
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Button radius="full" color="warning" variant="light" startContent={<ArrowLeftIcon />}>
              {t.backHome}
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

        {/* 注册接口返回的通用错误（用户名冲突、密码强度等），与邮箱/验证码分区展示 */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{submitError}</span>
            </div>
          </div>
        )}

        {/* 注册卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.createAccount}</h1>
              <p className="text-gray-400">{t.secureRegister}</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名输入 */}
              <Input
                type="text"
                label={<span className="text-gray-200">{t.username}</span>}
                name="username"
                placeholder={t.usernamePlaceholder}
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
                    return t.usernameRequired;
                  }

                  if (value.length < 3) {
                    return t.usernameMin;
                  }

                  if (value.length > 12) {
                    return t.usernameMax;
                  }

                  return null;
                }}
              />

              {/* 显示名称输入 */}
              <Input
                type="text"
                label={<span className="text-gray-200">{t.displayName}</span>}
                name="displayName"
                placeholder={t.displayNamePlaceholder}
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
                    return t.displayNameRequired;
                  }

                  if (value.length < 3) {
                    return t.displayNameMin;
                  }

                  if (value.length > 12) {
                    return t.displayNameMax;
                  }

                  return null;
                }}
              />

              {/* 邮箱输入 */}
              <Input
                type="email"
                name="email"
                label={<span className="text-gray-200">{t.email}</span>}
                placeholder={t.emailPlaceholder}
                startContent={<Mail className="w-4 h-4 text-gray-200" />}
                variant="bordered"
                size="lg"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                  setSubmitError("");
                }}
                classNames={{
                  input: "text-sm",
                  inputWrapper: `border-gray-300 hover:border-blue-500 focus-within:border-blue-500 ${
                    emailError ? "border-red-500" : ""
                  }`,
                }}
                validate={(value) => {
                  if (!value?.trim()) {
                    return t.emailRequired;
                  }

                  if (!isValidEmailFormat(value)) {
                    return t.validEmail;
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
                    <span className="text-sm font-medium text-gray-200">{t.codeTitle}</span>
                    {codeSent && (
                      <div className="flex items-center space-x-1 text-green-500 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t.sent}</span>
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
                      placeholder={t.codePlaceholder}
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
                          return t.codeRequired;
                        }

                        if (value && value.length !== 6) {
                          return t.codeLength;
                        }

                        return null;
                      }}
                    />

                    {/* 验证码输入提示 */}
                    {verificationCode.length > 0 && verificationCode.length < 6 && (
                      <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
                        {6 - verificationCode.length} {t.codeRemain}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    color={codeSent ? "success" : "primary"}
                    variant={codeSent ? "bordered" : "solid"}
                    size="lg"
                    isLoading={isSendingCode}
                    disabled={isSendingCode || countdown > 0 || !email?.trim() || !isValidEmailFormat(email)}
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
                      ? t.sending
                      : countdown > 0
                        ? `${t.resendIn} (${countdown}s)`
                        : codeSent
                          ? t.resend
                          : t.sendCode}
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
                        <div className="text-blue-600 dark:text-blue-400 font-medium">{t.checkInbox}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          {t.sentTo} <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                        </div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t.checkSpam}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 密码输入 */}
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                label={<span className="text-gray-200">{t.password}</span>}
                placeholder={t.passwordPlaceholder}
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
                validate={(value) => {
                  if (!value) {
                    return t.confirmRequired;
                  }

                  if (value.length < 8) {
                    return t.passwordMin;
                  }

                  if (confirmPassword && value && value !== confirmPassword) {
                    return t.passwordMismatch;
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
                label={<span className="text-gray-200">{t.confirmPassword}</span>}
                placeholder={t.confirmPasswordPlaceholder}
                startContent={<Lock className="w-4 h-4 text-gray-200" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                    aria-label={showConfirmPassword ? t.hideConfirm : t.showConfirm}
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
                    return t.confirmRequired;
                  }

                  if (value.length < 8) {
                    return t.passwordMin;
                  }

                  //  实时校验
                  if (password && value && value !== password) {
                    return t.passwordMismatch;
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
                {isSubmitting ? t.registering : t.submit}
              </Button>

              {/* 登录链接 */}
              <div className="w-full text-center">
                <span className="text-sm text-gray-600">
                  {t.hasAccount}
                  <Link
                    href={`/${lang}/auth/login`}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t.loginNow}
                  </Link>
                </span>
              </div>
            </Form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-200">
            {t.agreePrefix}{" "}
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
