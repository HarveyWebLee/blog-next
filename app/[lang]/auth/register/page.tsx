"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Form } from "@heroui/react";
import { AlertCircle, ArrowLeftIcon, CheckCircle, Clock, Eye, EyeOff, Lock, Mail, Shield, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          validEmail: "Please enter a valid email",
          codeSent: "Verification code sent to your email",
          sendCodeFailed: "Failed to send verification code",
          sendCodeRetry: "Failed to send code, please retry",
          registerFailed: "Registration failed",
          registerRetry: "Registration failed, please retry",
          loginMessage: "Registration successful, please sign in",
          backHome: "Back Home",
          createAccount: "Create Account",
          secureRegister: "Register with email verification",
          username: "Username",
          usernamePlaceholder: "Enter username",
          usernameRequired: "Username is required",
          usernameMin: "Username must be at least 3 chars",
          usernameMax: "Username must be at most 12 chars",
          displayName: "Display Name",
          displayNamePlaceholder: "Enter display name",
          displayNameRequired: "Display name is required",
          displayNameMin: "Display name must be at least 3 chars",
          displayNameMax: "Display name must be at most 12 chars",
          email: "Email",
          emailPlaceholder: "Enter email",
          emailRequired: "Email is required",
          codeTitle: "Email Verification Code",
          sent: "Sent",
          codePlaceholder: "Enter 6-digit code",
          codeRequired: "Verification code is required",
          codeLength: "Code must be 6 digits",
          codeRemain: "digits remaining",
          sending: "Sending...",
          resendIn: "Resend",
          resend: "Resend",
          sendCode: "Send Code",
          checkInbox: "Code sent",
          sentTo: "Sent to",
          checkSpam: "Please check inbox and spam folder",
          password: "Password",
          passwordPlaceholder: "Enter password",
          hidePassword: "Hide password",
          showPassword: "Show password",
          confirmPassword: "Confirm Password",
          confirmPasswordPlaceholder: "Re-enter password",
          hideConfirm: "Hide confirm password",
          showConfirm: "Show confirm password",
          confirmRequired: "Confirm password is required",
          passwordMin: "Password must be at least 8 chars",
          passwordMismatch: "Passwords do not match",
          registering: "Registering...",
          submit: "Create Account",
          hasAccount: "Already have an account?",
          loginNow: "Sign in",
          agreePrefix: "By registering, you agree to our ",
          terms: "Terms",
          and: " and ",
          privacy: "Privacy Policy",
        }
      : lang === "ja-JP"
        ? {
            validEmail: "有効なメールアドレスを入力してください",
            codeSent: "認証コードを送信しました",
            sendCodeFailed: "認証コード送信に失敗しました",
            sendCodeRetry: "送信に失敗しました。再試行してください",
            registerFailed: "登録に失敗しました",
            registerRetry: "登録に失敗しました。再試行してください",
            loginMessage: "登録成功、ログインしてください",
            backHome: "ホームへ戻る",
            createAccount: "アカウント作成",
            secureRegister: "メール認証で安全に登録",
            username: "ユーザー名",
            usernamePlaceholder: "ユーザー名を入力",
            usernameRequired: "ユーザー名は必須です",
            usernameMin: "ユーザー名は3文字以上必要です",
            usernameMax: "ユーザー名は12文字以内です",
            displayName: "表示名",
            displayNamePlaceholder: "表示名を入力",
            displayNameRequired: "表示名は必須です",
            displayNameMin: "表示名は3文字以上必要です",
            displayNameMax: "表示名は12文字以内です",
            email: "メールアドレス",
            emailPlaceholder: "メールアドレスを入力",
            emailRequired: "メールアドレスは必須です",
            codeTitle: "メール認証コード",
            sent: "送信済み",
            codePlaceholder: "6桁コードを入力",
            codeRequired: "認証コードは必須です",
            codeLength: "認証コードは6桁です",
            codeRemain: "桁不足",
            sending: "送信中...",
            resendIn: "再送信",
            resend: "再送信",
            sendCode: "認証コード送信",
            checkInbox: "認証コード送信済み",
            sentTo: "送信先",
            checkSpam: "受信箱と迷惑メールをご確認ください",
            password: "パスワード",
            passwordPlaceholder: "パスワードを入力",
            hidePassword: "パスワードを隠す",
            showPassword: "パスワードを表示",
            confirmPassword: "パスワード確認",
            confirmPasswordPlaceholder: "パスワードを再入力",
            hideConfirm: "確認パスワードを隠す",
            showConfirm: "確認パスワードを表示",
            confirmRequired: "確認パスワードは必須です",
            passwordMin: "パスワードは8文字以上必要です",
            passwordMismatch: "パスワードが一致しません",
            registering: "登録中...",
            submit: "アカウント作成",
            hasAccount: "すでにアカウントをお持ちですか？",
            loginNow: "ログイン",
            agreePrefix: "登録することで、",
            terms: "利用規約",
            and: "と",
            privacy: "プライバシーポリシー",
          }
        : {
            validEmail: "请输入有效的邮箱地址",
            codeSent: "验证码已发送到您的邮箱",
            sendCodeFailed: "发送验证码失败",
            sendCodeRetry: "发送验证码失败，请稍后重试",
            registerFailed: "注册失败",
            registerRetry: "注册失败，请稍后重试",
            loginMessage: "注册成功，请登录",
            backHome: "返回首页",
            createAccount: "创建账户",
            secureRegister: "使用邮箱验证码注册，安全便捷",
            username: "用户名",
            usernamePlaceholder: "请输入用户名",
            usernameRequired: "用户名不能为空",
            usernameMin: "用户名长度至少3位",
            usernameMax: "用户名长度最多12位",
            displayName: "显示名称",
            displayNamePlaceholder: "请输入显示名称",
            displayNameRequired: "显示名称不能为空",
            displayNameMin: "显示名称长度至少3位",
            displayNameMax: "显示名称长度最多12位",
            email: "邮箱地址",
            emailPlaceholder: "请输入邮箱地址",
            emailRequired: "邮箱地址不能为空",
            codeTitle: "邮箱验证码",
            sent: "已发送",
            codePlaceholder: "请输入6位验证码",
            codeRequired: "验证码不能为空",
            codeLength: "验证码必须是6位数字",
            codeRemain: "位",
            sending: "发送中...",
            resendIn: "重新发送",
            resend: "重新发送",
            sendCode: "发送验证码",
            checkInbox: "验证码已发送",
            sentTo: "已发送到",
            checkSpam: "请检查邮箱（包括垃圾邮件文件夹）",
            password: "密码",
            passwordPlaceholder: "请输入密码",
            hidePassword: "隐藏密码",
            showPassword: "显示密码",
            confirmPassword: "确认密码",
            confirmPasswordPlaceholder: "请再次输入密码",
            hideConfirm: "隐藏确认密码",
            showConfirm: "显示确认密码",
            confirmRequired: "确认密码不能为空",
            passwordMin: "密码长度至少8位",
            passwordMismatch: "两次输入的密码不一致",
            registering: "注册中...",
            submit: "创建账户",
            hasAccount: "已有账户？",
            loginNow: "立即登录",
            agreePrefix: "注册即表示您同意我们的",
            terms: "服务条款",
            and: "和",
            privacy: "隐私政策",
          };

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
        setSuccessMessage(t.codeSent);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setEmailError(data.message || t.sendCodeFailed);
      }
    } catch (error) {
      setEmailError(t.sendCodeRetry);
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
        router.push(`/${lang}/auth/login?message=${encodeURIComponent(t.loginMessage)}`);
      } else {
        if (data.message?.includes("验证码")) {
          setCodeError(data.message);
        } else {
          setEmailError(data.message || t.registerFailed);
        }
      }
    } catch (error) {
      setEmailError(t.registerRetry);
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

                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim())) {
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
            <Link href={`/${lang}/terms`} className="text-blue-600 hover:underline">
              {t.terms}
            </Link>{" "}
            {t.and}{" "}
            <Link href={`/${lang}/privacy`} className="text-blue-600 hover:underline">
              {t.privacy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
