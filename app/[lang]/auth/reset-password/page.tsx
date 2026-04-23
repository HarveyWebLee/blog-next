"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";

import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "zh-CN";
  const t =
    lang === "en-US"
      ? {
          invalidLink: "Invalid Link",
          invalidDesc: "Reset link is invalid or expired.",
          applyAgain: "Request Again",
          backLogin: "Back to Login",
          title: "Reset Password",
          subtitle: "Please enter your new password",
          newPassword: "New Password",
          newPasswordPlaceholder: "Enter new password",
          confirmPassword: "Confirm New Password",
          confirmPasswordPlaceholder: "Re-enter new password",
          passwordReq: "Password requirements:",
          req1: "At least 8 characters",
          req2: "Contains uppercase and lowercase letters",
          req3: "Contains at least one number",
          req4: "Contains at least one special character",
          resetting: "Resetting...",
          resetBtn: "Reset Password",
          successTitle: "Password Reset Successful",
          successDesc: "Your password has been reset successfully.",
          loginNow: "Sign In Now",
          footer: "After reset, please sign in with your new password.",
          errEnter: "Please enter new password",
          errMin: "Password must be at least 8 characters",
          errComplex: "Password must include upper/lowercase letters, number and special character",
          errConfirm: "Please confirm new password",
          errMismatch: "Passwords do not match",
          errFailed: "Reset failed, please try again",
          errNetwork: "Network error, please try again",
        }
      : lang === "ja-JP"
        ? {
            invalidLink: "無効なリンク",
            invalidDesc: "リンクが無効または期限切れです。",
            applyAgain: "再申請",
            backLogin: "ログインへ戻る",
            title: "パスワード再設定",
            subtitle: "新しいパスワードを入力してください",
            newPassword: "新しいパスワード",
            newPasswordPlaceholder: "新しいパスワードを入力",
            confirmPassword: "新しいパスワード確認",
            confirmPasswordPlaceholder: "もう一度入力",
            passwordReq: "パスワード要件：",
            req1: "8文字以上",
            req2: "大文字・小文字を含む",
            req3: "数字を1つ以上含む",
            req4: "記号を1つ以上含む",
            resetting: "リセット中...",
            resetBtn: "パスワードをリセット",
            successTitle: "パスワード再設定成功",
            successDesc: "パスワードを再設定しました。",
            loginNow: "今すぐログイン",
            footer: "再設定後は新しいパスワードでログインしてください。",
            errEnter: "新しいパスワードを入力してください",
            errMin: "パスワードは8文字以上必要です",
            errComplex: "大文字/小文字/数字/記号を含めてください",
            errConfirm: "確認用パスワードを入力してください",
            errMismatch: "パスワードが一致しません",
            errFailed: "リセットに失敗しました",
            errNetwork: "ネットワークエラーが発生しました",
          }
        : {
            invalidLink: "无效的链接",
            invalidDesc: "密码重置链接无效或已过期，请重新申请。",
            applyAgain: "重新申请",
            backLogin: "返回登录",
            title: "重置密码",
            subtitle: "请输入您的新密码",
            newPassword: "新密码",
            newPasswordPlaceholder: "请输入新密码",
            confirmPassword: "确认新密码",
            confirmPasswordPlaceholder: "请再次输入新密码",
            passwordReq: "密码要求：",
            req1: "至少8个字符",
            req2: "包含大写和小写字母",
            req3: "包含至少一个数字",
            req4: "包含至少一个特殊字符",
            resetting: "重置中...",
            resetBtn: "重置密码",
            successTitle: "密码重置成功",
            successDesc: "您的密码已成功重置，现在可以使用新密码登录了。",
            loginNow: "立即登录",
            footer: "密码重置后，您需要使用新密码重新登录。",
            errEnter: "请输入新密码",
            errMin: "密码长度至少8位",
            errComplex: "密码必须包含大小写字母、数字和特殊字符",
            errConfirm: "请确认新密码",
            errMismatch: "两次输入的密码不一致",
            errFailed: "重置失败，请稍后重试",
            errNetwork: "网络错误，请稍后重试",
          };
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      router.push(`/${lang}/auth/forgot-password`);
    }
  }, [token, router, lang]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = t.errEnter;
    } else if (formData.password.length < 8) {
      newErrors.password = t.errMin;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = t.errComplex;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.errConfirm;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.errMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = await sealPasswordInRequestBody(
        { token, newPassword: formData.password },
        formData.password,
        "newPassword"
      );

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setErrors({ general: data.message || t.errFailed });
      }
    } catch (error) {
      setErrors({ general: t.errNetwork });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link
              href={`/${lang}/auth/login`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backLogin}
            </Link>
          </div>

          {/* 成功卡片 */}
          <Card className="shadow-xl">
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.successTitle}</h1>
              <p className="text-gray-600 mb-6">{t.successDesc}</p>

              <Button as={Link} href={`/${lang}/auth/login`} color="primary" size="lg" className="w-full font-medium">
                {t.loginNow}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.invalidLink}</h1>
              <p className="text-gray-600 mb-6">{t.invalidDesc}</p>

              <Button
                as={Link}
                href={`/${lang}/auth/forgot-password`}
                color="primary"
                size="lg"
                className="w-full font-medium"
              >
                {t.applyAgain}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href={`/${lang}/auth/login`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backLogin}
          </Link>
        </div>

        {/* 重置密码卡片 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
          </CardHeader>

          <CardBody className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 通用错误提示 */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              {/* 新密码输入 */}
              <div className="space-y-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  label={t.newPassword}
                  placeholder={t.newPasswordPlaceholder}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  startContent={<Lock className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                      {showPassword ? (
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
                />
              </div>

              {/* 确认密码输入 */}
              <div className="space-y-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  label={t.confirmPassword}
                  placeholder={t.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  isInvalid={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword}
                  startContent={<Lock className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none"
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
                />
              </div>

              {/* 密码要求提示 */}
              <div className="bg-blue-50 border blog-border-y-box-shadowlue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">{t.passwordReq}</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• {t.req1}</li>
                  <li>• {t.req2}</li>
                  <li>• {t.req3}</li>
                  <li>• {t.req4}</li>
                </ul>
              </div>

              {/* 重置按钮 */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-medium"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? t.resetting : t.resetBtn}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
