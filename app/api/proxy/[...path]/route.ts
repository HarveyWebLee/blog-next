import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
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
