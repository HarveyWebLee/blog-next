import type { NextConfig } from "next";

// standalone 在 Windows 上常因 pnpm symlink 触发 EPERM；Docker/Linux 构建时通过 NEXT_STANDALONE=true 开启（见 Dockerfile）
const useStandalone = process.env.NEXT_STANDALONE === "true";

function resolvePasswordTransportRequired(): boolean {
  const raw = process.env.PASSWORD_TRANSPORT_REQUIRED?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV === "production";
}

function isPasswordTransportKeyConfigured(): boolean {
  const b64 = process.env.PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64?.trim();
  const pem = process.env.PASSWORD_TRANSPORT_RSA_PRIVATE_KEY?.trim();
  return Boolean((b64 && b64.length > 0) || (pem && pem.length > 0));
}

function logPasswordTransportStartupStatus(): void {
  const required = resolvePasswordTransportRequired();
  const configured = isPasswordTransportKeyConfigured();
  const ready = !required || configured;
  const mode = process.env.NODE_ENV || "development";
  const requiredSource = process.env.PASSWORD_TRANSPORT_REQUIRED == null ? "default" : "env";
  const reason = ready ? (required ? "required+configured" : "not-required") : "required-but-missing-key";
  // 启动时打印一次，便于本地与部署环境快速确认加固状态（不输出敏感值）。
  console.log(
    `[password-transport][startup] mode=${mode} required=${required} configured=${configured} ready=${ready} source=${requiredSource} reason=${reason}`
  );
}

logPasswordTransportStartupStatus();

/**
 * 从 MinIO 对外基址生成 next/image 允许的远程图规则。
 * 线上若只用 127.0.0.1 配在 remotePatterns 里，而库里/前端存的是公网 IP 或域名，优化器会拒绝 URL，图片会裂。
 * 构建/启动前须已加载与运行时一致的 NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL（Docker build args 等）。
 */
function remotePatternFromMinioPublicBaseUrl():
  | {
      protocol: "http" | "https";
      hostname: string;
      port: string;
      pathname: string;
    }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const protocol = u.protocol === "https:" ? "https" : "http";
    // 与仓库内其它 remotePatterns 一致：无显式端口时用空串（匹配该协议默认端口）
    const port = u.port || "";
    return {
      protocol,
      hostname: u.hostname,
      port,
      pathname: "/**",
    };
  } catch {
    return undefined;
  }
}

const minioFromEnv = remotePatternFromMinioPublicBaseUrl();

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      // 与 NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL 同步，避免线上公网 IP/域名未列入白名单导致 next/image 拒绝
      ...(minioFromEnv ? [minioFromEnv] : []),
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "13001",
        pathname: "/**",
      },
      // MinIO 默认映射（path-style 图片 URL；生产请按域名增配或改用 CDN）
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "19000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "haowallpaper.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.music.126.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 国际化配置
  serverExternalPackages: ["@formatjs/intl-localematcher", "negotiator"],
};

export default nextConfig;
