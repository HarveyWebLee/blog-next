/** AES-GCM 推荐 IV 长度（字节） */
export const PASSWORD_TRANSPORT_IV_LENGTH = 12;

/** AES-256 密钥长度 */
export const PASSWORD_TRANSPORT_AES_KEY_LENGTH = 32;

/** GCM auth tag */
export const PASSWORD_TRANSPORT_GCM_TAG_LENGTH = 16;

/** 默认时钟偏移容忍（毫秒） */
export const PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS = 5 * 60 * 1000;

/** nonce 在 Redis / 内存中的 TTL（秒），应 ≥ 时钟容忍窗口 */
export const PASSWORD_TRANSPORT_NONCE_TTL_SECONDS = 10 * 60;
