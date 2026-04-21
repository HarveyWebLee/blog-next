"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import "./blog-water-ripple-overlay-vortex.scss";

/** 漩涡型滤镜 ID（独立命名，防止与其它叠加层串扰） */
const VORTEX_FILTER_ID = "blog-water-ripple-overlay-vortex-filter";

/**
 * 漩涡型水纹叠加层：
 * - 保留锥形渐变作为“旋心”结构；
 * - 提高旋涡层对比并叠加柔光斑，让流体旋转感更明显；
 * - 仍然复用 turbulence+displacement 作为动态驱动。
 */
export function BlogWaterRippleOverlayVortex() {
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
      frame += 1.25;
      const bfx = 0.0045 + 0.0026 * Math.cos(frame * rad);
      const bfy = 0.0126 + 0.0059 * Math.sin((frame + 30) * rad);
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
    <div className="blog-water-ripple-overlay-vortex" aria-hidden>
      <svg className="blog-water-ripple-overlay-vortex__svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <filter id={VORTEX_FILTER_ID} colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbulenceRef}
              baseFrequency="0.0038 0.011"
              numOctaves={3}
              result="noise"
              seed={29}
              type="fractalNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={52} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="blog-water-ripple-overlay-vortex__surface" />
    </div>
  );
}
