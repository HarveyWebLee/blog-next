"use client";

/**
 * 浅色主题首页专用：朦胧雾气动效（无固定形态，仅渐变层缓慢漂移）。
 * 深色主题不挂载；纯 CSS 动画，无 Canvas、全屏慎用 filter: blur。
 */
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function HomeLightMist() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || resolvedTheme !== "light") {
    return null;
  }

  return (
    <div
      className="home-light-mist-root pointer-events-none absolute inset-0 z-[1] min-h-full overflow-hidden"
      aria-hidden
    >
      {/* 均匀薄雾：先铺一层可见冷灰，避免仅靠 multiply 在极浅底上「消失」 */}
      <div className="home-light-mist-veil absolute inset-0" />
      {/* 方向性渐变底：与 veil 叠加形成体积感 */}
      <div className="home-light-mist-base absolute inset-0" />

      {/* 三层无状雾团：径向渐变模拟体积，仅 transform/opacity 动画（尺寸略大以覆盖更多视区） */}
      <div className="home-light-mist-cloud home-light-mist-cloud-a absolute -left-[22%] top-[2%] h-[min(52rem,110vw)] w-[min(52rem,110vw)] rounded-[50%]" />
      <div className="home-light-mist-cloud home-light-mist-cloud-b absolute -right-[18%] bottom-[-2%] h-[min(46rem,105vw)] w-[min(46rem,105vw)] rounded-[50%]" />
      <div className="home-light-mist-cloud home-light-mist-cloud-c absolute left-[28%] top-[32%] h-[min(34rem,82vw)] w-[min(34rem,82vw)] -translate-x-1/2 rounded-[50%]" />

      {/* 极淡横向雾带平移（background-position），与深色页 sheen 同源思路、更柔 */}
      <div className="home-light-mist-haze absolute inset-0" />
    </div>
  );
}
