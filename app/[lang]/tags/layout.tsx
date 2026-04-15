export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* 与首页内容区容器一致，避免列表页两侧留白偏窄 */}
      <div className="container relative mx-auto px-4 py-8 sm:px-6">{children}</div>
    </section>
  );
}
