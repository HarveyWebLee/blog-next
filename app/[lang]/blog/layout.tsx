import { BlogAmbientEffects } from "@/components/blog/blog-ambient-effects";

/**
 * 博客前台布局：与首页 main 类似，整段渐变铺底 → 半透明 WebGL 氛围 → 正文（z-10）。
 * 切勿在子页面再套一层不透明满屏 bg-gradient，否则会盖住 fixed 的水波纹/极光。
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative isolate min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-primary/5 py-8 md:py-10">
      {/* z-[2]：叠在 section 渐变之上、正文之下；浅色 blog-water-ripples / 深色 blog WebGL 极光 */}
      <BlogAmbientEffects />
      {/* 与首页内容区统一：2xl(1536px) 起增加横向留白 */}
      <div className="container relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">{children}</div>
    </section>
  );
}
