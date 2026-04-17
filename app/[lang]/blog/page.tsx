import { BlogPageContent } from "@/components/blog/blog-page-content";

type BlogPageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 解析 URL 中的正整数查询参数（tagId 等） */
function parsePositiveIntParam(raw: string | string[] | undefined): number | undefined {
  if (raw == null) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || String(s).trim() === "") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

/**
 * 博客列表：支持 ?tagId=（与侧栏热门标签入口一致）。
 * 查询串由服务端读取并传入客户端，首屏请求即带筛选条件。
 */
export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const sp = await searchParams;
  const initialTagId = parsePositiveIntParam(sp.tagId);

  return <BlogPageContent lang={lang} initialTagId={initialTagId} />;
}
