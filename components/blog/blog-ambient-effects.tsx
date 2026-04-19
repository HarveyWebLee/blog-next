"use client";

/**
 * 博客前台路由（列表 / 文章详情等）的氛围装饰入口：
 * - 浅色：`BlogWaterRipples` 动态水波纹；
 * - 深色：`BlogAuroraBackgroundWebGl` WebGL 极光（CSS 快照备份见 `BlogAuroraPillarField`）；
 * 二者由各自组件内部的 `resolvedTheme` 互斥挂载，此处仅并列渲染占位。
 *
 * 层级与首页一致：blog `layout` 的 section 内先铺整页渐变，再叠本层氛围（fixed、z-[2]；浅色水波纹 WebGL / 深色极光 WebGL），
 * 正文容器 z-10；子页面请勿再包一层不透明满屏 bg-gradient，否则会完全挡住 WebGL。
 *
 * `/blog/manage` 后台不写 WebGL 层，避免占用 GPU、干扰写作界面。
 */
import { usePathname } from "next/navigation";

import { BlogAuroraBackgroundWebGl } from "@/components/blog/blog-aurora-background";
import { BlogWaterRipples } from "@/components/blog/blog-water-ripples";

export function BlogAmbientEffects() {
  const pathname = usePathname();

  /* pathname 在首帧可能尚未就绪，勿整层 return null，否则水波纹/极光都不挂载 */
  if (pathname?.includes("/blog/manage")) {
    return null;
  }

  return (
    <>
      <BlogWaterRipples />
      <BlogAuroraBackgroundWebGl />
    </>
  );
}
