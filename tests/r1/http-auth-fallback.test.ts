import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { isPasswordTransportRequired } from "../../lib/crypto/password-transport/resolve-secret";

test("明文 HTTP 请求即使 PASSWORD_TRANSPORT_REQUIRED=true 也不强制封装", () => {
  const originalRequired = process.env.PASSWORD_TRANSPORT_REQUIRED;
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    process.env.PASSWORD_TRANSPORT_REQUIRED = "true";

    const httpReq = new NextRequest("http://192.168.1.10:13001/api/auth/login");
    assert.equal(isPasswordTransportRequired(httpReq), false);

    const httpsReq = new NextRequest("https://blog.example.com/api/auth/login");
    assert.equal(isPasswordTransportRequired(httpsReq), true);

    const fwdHttp = new NextRequest("http://blog-web:3000/api/auth/login", {
      headers: { "x-forwarded-proto": "http" },
    });
    assert.equal(isPasswordTransportRequired(fwdHttp), false);
  } finally {
    if (originalRequired === undefined) delete process.env.PASSWORD_TRANSPORT_REQUIRED;
    else process.env.PASSWORD_TRANSPORT_REQUIRED = originalRequired;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
