import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";

import { applyApiCorsHeaders, getAllowedCorsOrigin, parseAllowedCorsOrigins } from "../../lib/server/api-cors";
import { getApiRateLimitConfig } from "../../lib/server/api-rate-limit";
import { defineApiHandlers, type AppRouteHandler } from "../../lib/server/define-api-handlers";

test("CORS 白名单只接受完整 HTTP(S) Origin", () => {
  assert.deepEqual(
    parseAllowedCorsOrigins("https://app.example.com, http://localhost:3000, *, https://bad.example/path"),
    ["https://app.example.com", "http://localhost:3000"]
  );
  assert.equal(getAllowedCorsOrigin("https://app.example.com", "https://app.example.com"), "https://app.example.com");
  assert.equal(getAllowedCorsOrigin("https://other.example.com", "https://app.example.com"), null);
});

test("允许的 CORS Origin 写入响应头并保留既有 Vary", () => {
  const headers = new Headers({ Vary: "Accept-Encoding" });
  applyApiCorsHeaders(headers, "https://app.example.com");

  assert.equal(headers.get("Access-Control-Allow-Origin"), "https://app.example.com");
  assert.equal(headers.get("Access-Control-Allow-Credentials"), "true");
  assert.equal(headers.get("Access-Control-Allow-Methods"), "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  assert.equal(headers.get("Vary"), "Accept-Encoding, Origin");
});

test("全局 API 限流配置使用有效环境值并拒绝非法值", () => {
  assert.deepEqual(
    getApiRateLimitConfig({
      RATE_LIMIT_WINDOW: "60000",
      RATE_LIMIT_MAX_REQUESTS: "25",
    }),
    { windowMs: 60000, maxRequests: 25 }
  );
  assert.deepEqual(
    getApiRateLimitConfig({
      RATE_LIMIT_WINDOW: "0",
      RATE_LIMIT_MAX_REQUESTS: "not-a-number",
    }),
    { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  );
});

test("API 包装器按全局限流配置拦截超额请求", { concurrency: false }, async () => {
  const originalWindow = process.env.RATE_LIMIT_WINDOW;
  const originalMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS;
  const clientIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  try {
    process.env.RATE_LIMIT_WINDOW = "60000";
    process.env.RATE_LIMIT_MAX_REQUESTS = "1";

    const { GET } = defineApiHandlers({
      GET: (async () => NextResponse.json({ success: true })) as AppRouteHandler,
    });
    const createRequest = () =>
      new NextRequest("http://localhost/api/r0-rate-limit", {
        headers: { "x-forwarded-for": clientIp },
      });

    assert.equal((await GET(createRequest())).status, 200);
    const limited = await GET(createRequest());
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("Retry-After"), "60");
  } finally {
    if (originalWindow === undefined) {
      delete process.env.RATE_LIMIT_WINDOW;
    } else {
      process.env.RATE_LIMIT_WINDOW = originalWindow;
    }
    if (originalMaxRequests === undefined) {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
    } else {
      process.env.RATE_LIMIT_MAX_REQUESTS = originalMaxRequests;
    }
  }
});
