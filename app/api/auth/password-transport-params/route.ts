/**
 * GET /api/auth/password-transport-params
 * 下发 RSA 公钥（SPKI DER Base64）与应用层时钟容忍参数；未配置私钥时 enabled=false。
 */

import { NextRequest, NextResponse } from "next/server";

import {
  getPasswordTransportKeyId,
  getPasswordTransportMaxSkewMs,
  getPasswordTransportPublicSpkiB64,
  isPasswordTransportConfigured,
} from "@/lib/crypto/password-transport/server";
import type { PasswordTransportPublicParams } from "@/lib/crypto/password-transport/types";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import type { ApiResponse } from "@/types/blog";

async function handlePasswordTransportParamsGET(_request: NextRequest) {
  const configured = isPasswordTransportConfigured();
  const spki = getPasswordTransportPublicSpkiB64();

  const data: PasswordTransportPublicParams = {
    enabled: configured && Boolean(spki),
    keyId: getPasswordTransportKeyId(),
    publicKeySpkiB64: spki ?? "",
    maxClockSkewMs: getPasswordTransportMaxSkewMs(),
  };

  return NextResponse.json<ApiResponse<PasswordTransportPublicParams>>({
    success: true,
    message: data.enabled ? "password-transport 已启用" : "password-transport 未配置（将使用明文密码回退）",
    data,
    timestamp: new Date().toISOString(),
  });
}

export const { GET } = defineApiHandlers({
  GET: handlePasswordTransportParamsGET,
});
