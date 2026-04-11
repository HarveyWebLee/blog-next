/**
 * 首页专用背景氛围层（极光光晕 + 胶片噪点 + 慢速光带）。
 * 纯展示、无交互；动效由 globals.scss 中的 @keyframes 驱动，并遵守 prefers-reduced-motion。
 */
export function HomeAmbientBackground() {
  return (
    <div className="home-ambient-root pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* 1：纯色大光斑 + blur；可见度只靠 keyframes 的 opacity，避免与 Tailwind /xx 透明度叠乘 */}
      <div className="home-ambient-blob home-ambient-blob-1 absolute -left-[20%] -top-[12%] h-[min(32rem,88vw)] w-[min(32rem,88vw)] rounded-full bg-primary blur-[72px] dark:bg-primary" />
      <div className="home-ambient-blob home-ambient-blob-2 absolute -bottom-[14%] -right-[16%] h-[min(30rem,82vw)] w-[min(30rem,82vw)] rounded-full bg-secondary blur-[68px] dark:bg-secondary" />
      <div className="home-ambient-blob home-ambient-blob-3 absolute left-1/2 top-[28%] h-[min(22rem,56vw)] w-[min(22rem,56vw)] rounded-full bg-primary blur-[56px] dark:bg-primary" />

      {/* 6：极淡高光带沿背景缓慢平移（background-position 动画，GPU 友好） */}
      <div className="home-ambient-sheen-layer absolute inset-0 mix-blend-screen dark:mix-blend-soft-light" />

      {/* 2：细微颗粒叠层，削弱渐变塑料感；透明度极低频脉动 */}
      <div className="home-ambient-noise-layer absolute inset-0" />
    </div>
  );
}
