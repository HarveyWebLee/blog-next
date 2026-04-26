import { decryptPasswordTransportV1, isPasswordTransportConfigured } from "./server";
import type { PasswordTransportEnvelopeV1 } from "./types";

function isEnvelopeV1(value: unknown): value is PasswordTransportEnvelopeV1 {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.keyId === "string" &&
    typeof o.ts === "number" &&
    typeof o.nonce === "string" &&
    typeof o.ivB64 === "string" &&
    typeof o.aesKeyWrappedB64 === "string" &&
    typeof o.cipherB64 === "string" &&
    typeof o.signB64 === "string"
  );
}

export type ResolveSecretOptions = {
  /** JSON body */
  body: Record<string, unknown>;
  /** 明文字段名，如 password / newPassword */
  plainField: string;
  /** 是否允许明文（未配置强制封装时可关闭）；默认 true */
  allowPlaintext?: boolean;
  /**
   * 为 true 时：无 passwordTransport 且无明文字段则返回空串（用于文章 body 中可选的访问密码）。
   */
  treatMissingAsEmpty?: boolean;
};

/**
 * 强制策略：
 * - 显式配置 PASSWORD_TRANSPORT_REQUIRED=true 时始终强制；
 * - 未显式配置时，生产环境默认强制，开发/测试默认非强制（便于灰度与联调）。
 */
function isPasswordTransportRequired(): boolean {
  const raw = process.env.PASSWORD_TRANSPORT_REQUIRED?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV === "production";
}

let misconfigWarned = false;

/**
 * 运行时配置自检：
 * - 当策略要求强制传输，但服务端未配置 RSA 私钥时，返回 misconfigured=true；
 * - 仅打印一次高优先级日志，避免刷屏。
 */
function checkRequiredButMissingKey(required: boolean, configured: boolean): boolean {
  const misconfigured = required && !configured;
  if (misconfigured && !misconfigWarned) {
    misconfigWarned = true;
    console.error(
      "[password-transport] CRITICAL: PASSWORD_TRANSPORT_REQUIRED 生效，但未配置 RSA 私钥（PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64 / PASSWORD_TRANSPORT_RSA_PRIVATE_KEY）。所有密码相关接口将返回 503，需立即修复部署配置。"
    );
  }
  return misconfigured;
}

/**
 * 从请求体解析敏感字段：优先 passwordTransport 信封，其次明文字段。
 */
export async function resolveSecretFromBody(
  options: ResolveSecretOptions
): Promise<{ ok: true; plaintext: string } | { ok: false; message: string; status: number }> {
  const { body, plainField, allowPlaintext = true, treatMissingAsEmpty = false } = options;
  const transportRaw = body.passwordTransport;
  const plainRaw = body[plainField];

  const requireTransport = isPasswordTransportRequired();
  const configured = isPasswordTransportConfigured();
  const misconfigured = checkRequiredButMissingKey(requireTransport, configured);

  if (misconfigured) {
    return {
      ok: false,
      message: "服务端密码传输配置缺失，请联系管理员",
      status: 503,
    };
  }

  if (isEnvelopeV1(transportRaw)) {
    if (!configured) {
      return { ok: false, message: "服务端未配置密码传输密钥，无法接受加密包", status: 503 };
    }
    const dec = await decryptPasswordTransportV1(transportRaw);
    return dec;
  }

  if (requireTransport) {
    return {
      ok: false,
      message: "必须使用加密方式提交密码字段",
      status: 400,
    };
  }

  if (typeof plainRaw === "string") {
    if (!allowPlaintext && configured) {
      return { ok: false, message: "此接口不接受明文密码，请升级客户端", status: 400 };
    }
    return { ok: true, plaintext: plainRaw };
  }

  if (treatMissingAsEmpty) {
    return { ok: true, plaintext: "" };
  }

  return { ok: false, message: "缺少密钥或密码字段", status: 400 };
}

/**
 * 文章创建/更新：仅在 body 含 passwordTransport 或 password 时解析；两者皆无则不返回 password 字段（避免误清空 DB）。
 */
export async function resolveOptionalPasswordForPostBody(
  raw: Record<string, unknown>
): Promise<{ ok: true; password?: string } | { ok: false; message: string; status: number }> {
  const requireTransport = isPasswordTransportRequired();
  const configured = isPasswordTransportConfigured();
  const misconfigured = checkRequiredButMissingKey(requireTransport, configured);
  const hasTransport = isEnvelopeV1(raw.passwordTransport);
  const hasPlain = "password" in raw && typeof raw.password === "string";
  const hasExplicitNonPasswordVisibility = typeof raw.visibility === "string" && raw.visibility !== "password";

  // 当请求显式声明可见性不是 password 时，访问密码字段（明文/封装）应被忽略。
  // 这样可避免客户端误带空 passwordTransport 时触发无意义解密链路并报错。
  if (hasExplicitNonPasswordVisibility) {
    return { ok: true };
  }

  if (misconfigured && (hasTransport || hasPlain)) {
    return {
      ok: false,
      message: "服务端密码传输配置缺失，请联系管理员",
      status: 503,
    };
  }

  if (!hasTransport && !hasPlain) {
    return { ok: true };
  }

  if (hasTransport) {
    if (!configured) {
      return { ok: false, message: "服务端未配置密码传输密钥，无法接受加密包", status: 503 };
    }
    const dec = await decryptPasswordTransportV1(raw.passwordTransport as PasswordTransportEnvelopeV1);
    if (!dec.ok) {
      return dec;
    }
    return { ok: true, password: dec.plaintext };
  }

  if (requireTransport) {
    return {
      ok: false,
      message: "必须使用加密方式提交访问密码",
      status: 400,
    };
  }

  return { ok: true, password: raw.password as string };
}
