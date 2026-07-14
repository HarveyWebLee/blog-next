import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";

import {
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenCookieMaxAgeSeconds,
  parseDurationToSeconds,
  readRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from "../../lib/server/auth-session-cookie";
import { isMutationOriginAllowed } from "../../lib/server/request-origin-guard";

test("时长字符串解析为 Cookie maxAge 秒数", () => {
  assert.equal(parseDurationToSeconds("30d"), 30 * 24 * 60 * 60);
  assert.equal(parseDurationToSeconds("12h"), 12 * 3600);
  assert.equal(parseDurationToSeconds("90"), 90);
  assert.equal(parseDurationToSeconds("bad", 42), 42);
  assert.equal(getRefreshTokenCookieMaxAgeSeconds("7d"), 7 * 24 * 60 * 60);
});

test("refresh Cookie 写入与清除使用 HttpOnly / SameSite=Lax / 限定 Path", () => {
  const request = new NextRequest("http://localhost:3000/api/auth/login");
  const response = NextResponse.json({ success: true });
  attachRefreshTokenCookie(response, "sample-refresh-token", request);

  const setCookie = response.cookies.get(REFRESH_TOKEN_COOKIE_NAME);
  assert.ok(setCookie);
  assert.equal(setCookie.value, "sample-refresh-token");
  assert.equal(setCookie.path, REFRESH_TOKEN_COOKIE_PATH);
  assert.equal(setCookie.httpOnly, true);
  assert.equal(setCookie.sameSite, "lax");
  assert.equal(setCookie.secure, false);

  clearRefreshTokenCookie(response, request);
  const cleared = response.cookies.get(REFRESH_TOKEN_COOKIE_NAME);
  assert.ok(cleared);
  assert.equal(cleared.value, "");
  assert.equal(cleared.maxAge, 0);
});

test("HTTP 生产请求不强制 Secure Cookie；HTTPS 或 AUTH_COOKIE_SECURE=true 才启用", () => {
  const originalSecure = process.env.AUTH_COOKIE_SECURE;
  try {
    delete process.env.AUTH_COOKIE_SECURE;

    const httpReq = new NextRequest("http://127.0.0.1:13001/api/auth/login");
    const httpRes = NextResponse.json({ ok: true });
    attachRefreshTokenCookie(httpRes, "http-token", httpReq);
    assert.equal(httpRes.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.secure, false);

    const httpsReq = new NextRequest("https://blog.example.com/api/auth/login");
    const httpsRes = NextResponse.json({ ok: true });
    attachRefreshTokenCookie(httpsRes, "https-token", httpsReq);
    assert.equal(httpsRes.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.secure, true);

    const forwardedHttps = new NextRequest("http://blog-web:3000/api/auth/login", {
      headers: { "x-forwarded-proto": "https" },
    });
    const fwdRes = NextResponse.json({ ok: true });
    attachRefreshTokenCookie(fwdRes, "fwd-token", forwardedHttps);
    assert.equal(fwdRes.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.secure, true);

    process.env.AUTH_COOKIE_SECURE = "true";
    const forced = NextResponse.json({ ok: true });
    attachRefreshTokenCookie(forced, "forced", httpReq);
    assert.equal(forced.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.secure, true);
  } finally {
    if (originalSecure === undefined) delete process.env.AUTH_COOKIE_SECURE;
    else process.env.AUTH_COOKIE_SECURE = originalSecure;
  }
});

test("可从请求 Cookie 读取 refresh token", () => {
  const request = new NextRequest("http://localhost:3000/api/auth/refresh", {
    headers: {
      cookie: `${REFRESH_TOKEN_COOKIE_NAME}=cookie-refresh-value`,
    },
  });
  assert.equal(readRefreshTokenCookie(request), "cookie-refresh-value");
});

test("同站 Origin 与 CORS 白名单 Origin 允许写操作", () => {
  const sameSite = new NextRequest("http://localhost:3000/api/auth/refresh", {
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    },
  });
  assert.equal(isMutationOriginAllowed(sameSite), true);

  const originalCors = process.env.CORS_ORIGIN;
  try {
    process.env.CORS_ORIGIN = "https://app.example.com";
    const cross = new NextRequest("https://api.example.com/api/auth/refresh", {
      headers: {
        host: "api.example.com",
        origin: "https://app.example.com",
      },
    });
    assert.equal(isMutationOriginAllowed(cross), true);

    const blocked = new NextRequest("https://api.example.com/api/auth/refresh", {
      headers: {
        host: "api.example.com",
        origin: "https://evil.example.com",
      },
    });
    assert.equal(isMutationOriginAllowed(blocked), false);

    const missing = new NextRequest("https://api.example.com/api/auth/refresh", {
      headers: {
        host: "api.example.com",
      },
    });
    assert.equal(isMutationOriginAllowed(missing), false);
  } finally {
    if (originalCors === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCors;
    }
  }
});
