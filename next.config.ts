import type { NextConfig } from "next";

// standalone 在 Windows 上常因 pnpm symlink 触发 EPERM；Docker/Linux 构建时通过 NEXT_STANDALONE=true 开启（见 Dockerfile）
const useStandalone = process.env.NEXT_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
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
