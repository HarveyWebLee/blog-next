/**
 * 将 Markdown 转为适合列表/卡片展示的纯文本摘要（非完整解析，仅常见语法剥离）。
 * 用于 excerpt 等字段用户误写 `**粗体**` 或 `# 标题` 时避免原样露出。
 */
export function stripMarkdownForExcerpt(input: string): string {
  if (!input?.trim()) return "";

  let s = input.trim();

  // 围栏代码块
  s = s.replace(/```[\s\S]*?```/g, " ");
  // 行内代码
  s = s.replace(/`[^`]*`/g, " ");
  // 图片（保留 alt 若有）
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // 链接 [text](url) -> text
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // ATX 标题行首 # …
  s = s.replace(/^#{1,6}\s+/gm, "");
  // 引用行首 >
  s = s.replace(/^>\s?/gm, "");
  // 无序列表 - * +
  s = s.replace(/^[\s]*[-*+]\s+/gm, "");
  // 有序列表 1.
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  // 粗斜删除线（简单配对，不处理嵌套极限情况）
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");
  s = s.replace(/~~([^~]+)~~/g, "$1");
  // 残余星号/下划线
  s = s.replace(/[*_~`#]+/g, " ");
  // 换行与空白
  s = s.replace(/\s*\n+\s*/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}
