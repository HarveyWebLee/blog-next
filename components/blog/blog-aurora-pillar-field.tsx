"use client";

/**
 * 「六根竖纹光柱」氛围层 —— 冻结快照备份（博客默认极光为 WebGL：`BlogAuroraBackgroundWebGl`）。
 *
 * 单独引用：`import { BlogAuroraPillarField } from "@/components/blog/blog-aurora-pillar-field"`。
 *
 * 配色依赖 `globals.scss` `.dark` 下 `--blog-aurora-curtain-*`、`--blog-aurora-star-glow`。
 */
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-aurora-pillar-field.scss";

/** 与 SCSS 中 `filter: url(#…)` 一致；若同页挂两份需改 id 避免冲突 */
const WAVE_FILTER_ID = "blog-aurora-pillar-field-wave-filter";

export function BlogAuroraPillarField() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark =
    mounted &&
    (resolvedTheme === "dark" ||
      theme === "dark" ||
      (typeof document !== "undefined" && document.documentElement.classList.contains("dark")));

  useEffect(() => {
    if (!isDark) {
      return;
    }

    const node = turbulenceRef.current;
    if (!node || typeof window === "undefined") {
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      return;
    }

    let frames = 0;
    let rafId = 0;
    const rad = Math.PI / 180;

    const tick = () => {
      frames += 0.5;
      const bfx = 0.005 + 0.0025 * Math.cos(frames * rad);
      const bfy = 0.005 + 0.0025 * Math.sin(frames * rad);
      node.setAttributeNS(null, "baseFrequency", `${bfx} ${bfy}`);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  if (!isDark) {
    return null;
  }

  return (
    <div className="blog-aurora-pillar-field" aria-hidden data-blog-aurora-pillar-field="">
      <svg className="blog-aurora-pillar-field__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={WAVE_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0048 0.0095"
              numOctaves={3}
              result="noise"
              seed={10}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={32} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-aurora-pillar-field__aurora">
        <div className="blog-aurora-pillar-field__wash" />
        <div className="blog-aurora-pillar-field__glow-veil" />
        <div className="blog-aurora-pillar-field__rays">
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--1" />
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--2" />
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--3" />
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--4" />
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--5" />
          <div className="blog-aurora-pillar-field__ray blog-aurora-pillar-field__ray--6" />
        </div>
      </div>
    </div>
  );
}
