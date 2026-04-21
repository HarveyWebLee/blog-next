"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-water-ripple-overlay-classic.scss";

/** 经典水波纹滤镜 ID（仅供 classic 组件使用） */
const CLASSIC_FILTER_ID = "blog-water-ripple-overlay-classic-filter";

/**
 * 经典水波纹叠加层（焦散改造前的条纹型底图）：
 * - 使用双层 repeating-linear-gradient 作为纹理源；
 * - 通过 turbulence + displacement 形成动态扭曲；
 * - 适合与新方案做视觉对比。
 */
export function BlogWaterRippleOverlayClassic() {
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
      frame += 0.48;
      const bfx = 0.0041 + 0.00105 * Math.cos(frame * rad);
      const bfy = 0.012 + 0.0024 * Math.sin((frame + 28) * rad);
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
    <div className="blog-water-ripple-overlay-classic" aria-hidden>
      <svg className="blog-water-ripple-overlay-classic__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={CLASSIC_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0038 0.011"
              numOctaves={3}
              result="noise"
              seed={13}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={20} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-water-ripple-overlay-classic__surface" />
    </div>
  );
}
