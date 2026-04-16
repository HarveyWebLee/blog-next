"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { KeyRound, LogIn, RefreshCw } from "lucide-react";

import { message } from "@/lib/utils";
import type { ApiResponse, LoginResponse } from "@/types/blog";
import { useApiDocsTester } from "./api-docs-tester-context";

/**
 * 文档页专用：快速调用登录接口并把 token 写入「接口测试」上下文，便于联调需鉴权的 API。
 * 仅超级管理员可进入本页；此处仍可对任意账号测登录（用于验证普通用户 JWT）。
 */
export function ApiDocsAuthPanel({
  lang,
  onAfterLoginTest,
}: {
  lang: string;
  /** 登录测试成功写入 Token 后回调（用于重新拉取 /api/api-docs） */
  onAfterLoginTest?: () => void;
}) {
  const { setBearerToken, syncBearerFromStorage, bearerToken } = useApiDocsTester();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const prefix = `/${lang}`;

  const handleLoginTest = async () => {
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      message.warning("请输入用户名和密码");
      return;
    }
    setLoading(true);
    setLastMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const json = (await res.json()) as ApiResponse<LoginResponse>;
      if (!json.success || !json.data?.token) {
        setLastMessage(json.message || "登录失败");
        message.error(json.message || "登录失败");
        return;
      }
      setBearerToken(json.data.token);
      setLastMessage(`登录成功，已写入文档测试 Token（role=${json.data.user?.role ?? "?"})`);
      message.success("已获取 Token 并填入下方测试上下文");
      onAfterLoginTest?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "网络错误";
      setLastMessage(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-primary/20 bg-primary/[0.03]">
      <CardHeader className="flex flex-row items-center gap-2 pb-0">
        <KeyRound className="h-5 w-5 text-primary" />
        <div>
          <p className="text-base font-semibold">登录鉴权测试</p>
          <p className="text-small text-default-500">
            调用 <code className="rounded bg-default-100 px-1">POST /api/auth/login</code>，将返回的 accessToken
            写入文档内「测试接口」默认 Authorization。
          </p>
        </div>
      </CardHeader>
      <CardBody className="gap-4 pt-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="用户名"
            placeholder="超级管理员账号或普通用户"
            value={username}
            onValueChange={setUsername}
            autoComplete="username"
          />
          <Input
            label="密码"
            type="password"
            placeholder="密码"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            color="primary"
            startContent={<LogIn className="h-4 w-4" />}
            isLoading={loading}
            onPress={() => void handleLoginTest()}
          >
            测试登录并写入 Token
          </Button>
          <Button
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={() => {
              syncBearerFromStorage();
              message.success("已从 localStorage 同步 accessToken");
            }}
          >
            同步全站已登录 Token
          </Button>
          <Button variant="light" as={Link} href={`${prefix}/auth/login`}>
            前往登录页
          </Button>
        </div>
        {lastMessage && (
          <p className="text-sm text-default-600" role="status">
            {lastMessage}
          </p>
        )}
        <Divider />
        <div>
          <p className="text-xs font-medium text-default-500 mb-1">当前文档测试上下文 Token（前缀预览）</p>
          <code className="block truncate rounded bg-default-100 px-2 py-1 text-xs">
            {bearerToken ? `${bearerToken.slice(0, 24)}…` : "（空）请先登录测试或同步全站 Token"}
          </code>
        </div>
      </CardBody>
    </Card>
  );
}
