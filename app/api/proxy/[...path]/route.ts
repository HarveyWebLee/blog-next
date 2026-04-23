import { NextRequest, NextResponse } from "next/server";

import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";

async function handleProxyGET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = requireInMemorySuperRoot(req);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: auth.message,
      },
      { status: auth.status }
    );
  }

  // 拼接目标 URL
  const targetUrl = `https://haowallpaper.com/${(await params).path.join("/")}`;

  // 代理请求
  const res = await fetch(targetUrl, {
    headers: {
      // 去掉 Referer，避免触发防盗链
      Referer: "",
      Origin: "",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "图片获取失败" }, { status: res.status });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const { GET } = defineApiHandlers({ GET: handleProxyGET });
