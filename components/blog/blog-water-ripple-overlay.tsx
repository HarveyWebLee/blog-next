"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-water-ripple-overlay.scss";

/** 滤镜 id 需与 SCSS 中 `filter: url(#...)` 一致 */
const RIPPLE_FILTER_ID = "blog-water-ripple-overlay-filter";

/**
 * 可复用的暗色水波叠加层：
 * - 不渲染柱子本体，仅保留流动扭曲感；
 * - 适合作为内容区上方的氛围层展示；
 * - 容器默认禁用点击，不影响页面交互。
 */
export function BlogWaterRippleOverlay() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

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

    let frame = 0;
    let rafId = 0;
    const rad = Math.PI / 180;

    const tick = () => {
      frame += 0.6;
      const bfx = 0.0036 + 0.0016 * Math.cos(frame * rad);
      const bfy = 0.011 + 0.004 * Math.sin((frame + 28) * rad);
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
    <div className="blog-water-ripple-overlay" aria-hidden>
      <svg className="blog-water-ripple-overlay__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={RIPPLE_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0038 0.011"
              numOctaves={3}
              result="noise"
              seed={13}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={24} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-water-ripple-overlay__surface" />
    </div>
  );
}
