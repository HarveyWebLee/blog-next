/**
 * 评论反垃圾启发式（纯函数，便于单测）。
 * 命中任一组规则即视为 spam；具体阈值按误杀优先偏严于人工审核排队。
 */

export type CommentSpamResult = {
  isSpam: boolean;
  reasons: string[];
};

/** 单独命中即判 spam 的高风险词 */
const STRONG_KEYWORDS = ["viagra", "cialis", "casino", "porn", "cryptocurrency giveaway", "double your money"];

/** 累计命中 ≥2 时判 spam 的中风险词 / 诱导外链渠道 */
const SOFT_KEYWORDS = ["loan", "bitcoin", "crypto", "telegram", "whatsapp", "http://", "https://"];

export function detectSpamContent(content: string): CommentSpamResult {
  const reasons: string[] = [];
  const normalized = content.toLowerCase();

  const strongHits = STRONG_KEYWORDS.filter((kw) => normalized.includes(kw));
  if (strongHits.length > 0) {
    reasons.push("命中高风险关键词");
  }

  const softHits = SOFT_KEYWORDS.filter((kw) => normalized.includes(kw));
  if (softHits.length >= 2) {
    reasons.push("命中多个可疑关键词或渠道");
  }

  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount >= 2) {
    reasons.push("包含过多链接");
  }

  const emailCount = (content.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).length;
  if (emailCount >= 3) {
    reasons.push("包含过多邮箱地址");
  }

  if (content.length > 2000) {
    reasons.push("内容长度异常");
  }

  // 同一字符连续刷屏（如 "aaaaaaaaaa"）
  if (/(.)\1{9,}/u.test(content)) {
    reasons.push("疑似刷屏重复字符");
  }

  // 链接占比过高（短评塞满 URL）
  if (content.length > 0 && urlCount > 0) {
    const urlChars = (content.match(/https?:\/\/\S+/gi) || []).reduce((sum, u) => sum + u.length, 0);
    if (urlChars / content.length >= 0.4 && urlCount >= 1) {
      reasons.push("链接占比过高");
    }
  }

  return { isSpam: reasons.length > 0, reasons };
}
