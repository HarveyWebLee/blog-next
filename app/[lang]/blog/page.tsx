import { BlogPageContent } from "@/components/blog/blog-page-content";

type BlogPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 解析 URL 中的正整数查询参数（categoryId / tagId 等） */
function parsePositiveIntParam(raw: string | string[] | undefined): number | undefined {
  if (raw == null) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || String(s).trim() === "") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

/**
 * 博客列表：支持 ?categoryId=、?tagId=（与首页分类、侧栏分类/标签入口一致），可组合（少见）。
 * 查询串由服务端读取并传入客户端，首屏请求即带筛选条件。
 */
export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const sp = await searchParams;
  const initialCategoryId = parsePositiveIntParam(sp.categoryId);
  const initialTagId = parsePositiveIntParam(sp.tagId);

  return <BlogPageContent lang={lang} initialCategoryId={initialCategoryId} initialTagId={initialTagId} />;
}
