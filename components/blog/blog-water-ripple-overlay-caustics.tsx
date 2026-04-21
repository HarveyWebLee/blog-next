"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-water-ripple-overlay-caustics.scss";

/** 焦散型滤镜 ID（仅供本组件使用，避免与其它水纹组件冲突） */
const CAUSTICS_FILTER_ID = "blog-water-ripple-overlay-caustics-filter";

/**
 * 焦散型水纹叠加层（备份版）：
 * - 保留当前调好的“高可见焦散”效果；
 * - 组件与样式完全独立，便于与其它风格并行保留；
 * - 仅暗色主题渲染，且默认不拦截任何交互。
 */
export function BlogWaterRippleOverlayCaustics() {
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
      frame += 1.35;
      const bfx = 0.0048 + 0.003 * Math.cos(frame * rad);
      const bfy = 0.0138 + 0.0068 * Math.sin((frame + 28) * rad);
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
    <div className="blog-water-ripple-overlay-caustics" aria-hidden>
      <svg className="blog-water-ripple-overlay-caustics__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={CAUSTICS_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0038 0.011"
              numOctaves={3}
              result="noise"
              seed={13}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={58} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-water-ripple-overlay-caustics__surface" />
    </div>
  );
}
