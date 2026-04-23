import jwt from "jsonwebtoken";

type UnlockTicketPayload = {
  typ: "post_unlock";
  slug: string;
};

function getUnlockSecret(): string {
  return (
    process.env.POST_PASSWORD_UNLOCK_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "blog-next-post-unlock-dev-secret"
  );
}

/** 生成文章密码解锁票据（默认 10 分钟有效） */
export function generatePostUnlockTicket(slug: string): string {
  const payload: UnlockTicketPayload = { typ: "post_unlock", slug };
  const expiresSeconds = Number(process.env.POST_PASSWORD_UNLOCK_EXPIRES_SECONDS || "600");
  return jwt.sign(payload, getUnlockSecret(), {
    expiresIn: Number.isFinite(expiresSeconds) && expiresSeconds > 0 ? expiresSeconds : 600,
  });
}

/** 校验解锁票据是否匹配目标 slug */
export function verifyPostUnlockTicket(token: string, slug: string): boolean {
  try {
    const decoded = jwt.verify(token, getUnlockSecret()) as UnlockTicketPayload;
    return decoded?.typ === "post_unlock" && decoded.slug === slug;
  } catch {
    return false;
  }
}
