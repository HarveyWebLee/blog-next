export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* 与首页 `app/[lang]/page.tsx` 内容区一致：max-w-6xl + 小屏 px-4 / sm 起 px-6 */}
      <div className="container relative mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </section>
  );
}
