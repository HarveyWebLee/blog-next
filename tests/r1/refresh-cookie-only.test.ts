import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE_NAME } from "../../lib/server/auth-session-cookie";

const refreshRouteUrl = new URL("../../app/api/auth/refresh/route.ts", import.meta.url).href;

test("refresh 仅接受 Cookie：仅 Body.refreshToken 时返回 400", { concurrency: false }, async () => {
  const { POST } = await import(`${refreshRouteUrl}?case=body-only-${Date.now()}`);
  const request = new NextRequest("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify({ refreshToken: "legacy-body-token-must-be-ignored" }),
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { success: boolean; message?: string };
  assert.equal(payload.success, false);
});

test("refresh 缺少 Cookie 且无 Origin 时仍按缺失 Cookie 返回 400", { concurrency: false }, async () => {
  const { POST } = await import(`${refreshRouteUrl}?case=missing-cookie-${Date.now()}`);
  const request = new NextRequest("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    },
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
});

test("refresh 携带无效 Cookie 时返回 401 并清除 Cookie", { concurrency: false }, async () => {
  const { POST } = await import(`${refreshRouteUrl}?case=bad-cookie-${Date.now()}`);
  const request = new NextRequest("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      cookie: `${REFRESH_TOKEN_COOKIE_NAME}=not-a-valid-jwt`,
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    },
  });

  const response = await POST(request);
  assert.equal(response.status, 401);
  const cleared = response.cookies.get(REFRESH_TOKEN_COOKIE_NAME);
  assert.ok(cleared);
  assert.equal(cleared.value, "");
});
