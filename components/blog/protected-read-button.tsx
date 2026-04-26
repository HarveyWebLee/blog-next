"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-context";
import { sealPasswordInRequestBody } from "@/lib/crypto/password-transport/body";

type ProtectedReadButtonProps = {
  lang: string;
  slug: string;
  postId: number;
  postAuthorId?: number;
  isPasswordProtected: boolean;
  label: string;
  className?: string;
};

export default function ProtectedReadButton({
  lang,
  slug,
  postAuthorId,
  isPasswordProtected,
  label,
  className,
}: ProtectedReadButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = Boolean(user?.id && postAuthorId && user.id === postAuthorId);
  if (!isPasswordProtected || isAuthor) {
    return (
      <Button variant="ghost" size="sm" className={className} asChild>
        <Link href={`/${lang}/blog/${slug}`}>{label}</Link>
      </Button>
    );
  }

  const handleUnlock = async () => {
    try {
      setSubmitting(true);
      setError("");
      const payload = await sealPasswordInRequestBody({ password }, password, "password");
      const response = await fetch(`/api/posts/slug/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.message || "密码错误");
        return;
      }
      const unlockToken = (result?.data as { unlockToken?: string } | undefined)?.unlockToken;
      setOpen(false);
      router.push(
        unlockToken ? `/${lang}/blog/${slug}?unlock=${encodeURIComponent(unlockToken)}` : `/${lang}/blog/${slug}`
      );
    } catch (e) {
      console.error("密码校验失败:", e);
      setError("密码校验失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => {
          setPassword("");
          setError("");
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Modal isOpen={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-warning" />
            需要密码
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">该文章已开启密码保护，请先输入密码。</p>
            <Input
              type="password"
              value={password}
              onValueChange={setPassword}
              placeholder="请输入文章密码"
              isInvalid={Boolean(error)}
              errorMessage={error || undefined}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleUnlock} disabled={submitting}>
              {submitting ? "校验中..." : "解锁并阅读"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
