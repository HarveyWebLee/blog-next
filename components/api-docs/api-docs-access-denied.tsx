"use client";

import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ShieldOff } from "lucide-react";

/**
 * 非超级管理员访问 API 文档页时的说明（数据接口另有 401/403）。
 */
export function ApiDocsAccessDenied({ lang }: { lang: string }) {
  const prefix = `/${lang}`;

  return (
    <Card className="max-w-lg mx-auto border-destructive/30">
      <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
        <ShieldOff className="h-12 w-12 text-destructive" aria-hidden />
        <div>
          <h2 className="text-xl font-semibold text-foreground">无权访问</h2>
        </div>
        <Button as={Link} color="primary" href={`${prefix}/auth/login`} variant="shadow">
          去登录
        </Button>
        <Button as={Link} href={prefix} variant="bordered">
          返回首页
        </Button>
      </CardBody>
    </Card>
  );
}
