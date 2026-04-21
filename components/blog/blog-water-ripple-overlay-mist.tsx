"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-water-ripple-overlay-mist.scss";

/** 水雾型滤镜 ID（与其它效果完全隔离） */
const MIST_FILTER_ID = "blog-water-ripple-overlay-mist-filter";

/**
 * 水雾型水纹叠加层：
 * - 使用多层大范围径向渐变，边缘柔和；
 * - 通过位移滤镜制造“云雾在水面上被轻微拉扯”的波动感；
 * - 适合 about 页这种需要持续氛围但不过分锐利的场景。
 */
export function BlogWaterRippleOverlayMist() {
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
      frame += 0.95;
      const bfx = 0.0036 + 0.0019 * Math.cos(frame * rad);
      const bfy = 0.0108 + 0.0046 * Math.sin((frame + 24) * rad);
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
    <div className="blog-water-ripple-overlay-mist" aria-hidden>
      <svg className="blog-water-ripple-overlay-mist__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={MIST_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0038 0.011"
              numOctaves={3}
              result="noise"
              seed={17}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={40} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-water-ripple-overlay-mist__surface" />
    </div>
  );
}
