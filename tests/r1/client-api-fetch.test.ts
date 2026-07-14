import assert from "node:assert/strict";
import test from "node:test";

import { isCredentialAuthApiPath } from "../../lib/utils/client-api-401-interceptor";
import { clientApiFetch, hasClientAccessToken, refreshClientAccessToken } from "../../lib/utils/client-api-fetch";
import {
  clearClientAuthStorage,
  CLIENT_ACCESS_TOKEN_KEY,
  clientBearerHeaders,
  getClientAccessToken,
  setClientAccessToken,
} from "../../lib/utils/client-bearer-auth";

test("clientBearerHeaders：无 token 时为空对象，有 token 时附带 Bearer", () => {
  const g = globalThis as typeof globalThis & { window?: unknown; localStorage?: Storage };
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  g.window = {};
  g.localStorage = memoryStorage;

  assert.equal(getClientAccessToken(), null);
  assert.deepEqual(clientBearerHeaders(), {});
  assert.equal(hasClientAccessToken(), false);

  setClientAccessToken("tok-abc");
  assert.equal(getClientAccessToken(), "tok-abc");
  assert.equal(store.get(CLIENT_ACCESS_TOKEN_KEY), "tok-abc");
  assert.deepEqual(clientBearerHeaders(), { Authorization: "Bearer tok-abc" });
  assert.equal(hasClientAccessToken(), true);

  clearClientAuthStorage();
  assert.equal(getClientAccessToken(), null);
  assert.deepEqual(clientBearerHeaders(), {});

  delete g.window;
  delete g.localStorage;
});

test("isCredentialAuthApiPath：登录等业务 401 不视为会话失效", () => {
  assert.equal(isCredentialAuthApiPath("/api/auth/login"), true);
  assert.equal(isCredentialAuthApiPath("/api/auth/register"), true);
  assert.equal(isCredentialAuthApiPath("/api/posts"), false);
  assert.equal(isCredentialAuthApiPath("/api/auth/refresh"), false);
});

test("refreshClientAccessToken：成功时写入 accessToken；失败返回 false", async () => {
  const g = globalThis as typeof globalThis & { window?: unknown; localStorage?: Storage };
  const store = new Map<string, string>();
  g.window = {};
  g.localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  const okFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ success: true, data: { token: "fresh-token" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  assert.equal(await refreshClientAccessToken(okFetch), true);
  assert.equal(getClientAccessToken(), "fresh-token");

  const failFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ success: false, message: "no" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  assert.equal(await refreshClientAccessToken(failFetch), false);

  delete g.window;
  delete g.localStorage;
});

test("clientApiFetch：默认附带 Bearer 与 credentials include，且不覆盖已有 Authorization", async () => {
  const g = globalThis as typeof globalThis & {
    window?: unknown;
    localStorage?: Storage;
    fetch?: typeof fetch;
  };
  const store = new Map<string, string>([[CLIENT_ACCESS_TOKEN_KEY, "session-tok"]]);
  g.window = {};
  g.localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  let seenInit: RequestInit | undefined;
  g.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    seenInit = init;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  await clientApiFetch("/api/profile");
  assert.equal(seenInit?.credentials, "include");
  const headers = new Headers(seenInit?.headers);
  assert.equal(headers.get("Authorization"), "Bearer session-tok");

  await clientApiFetch("/api/profile", {
    headers: { Authorization: "Bearer custom" },
  });
  const headers2 = new Headers(seenInit?.headers);
  assert.equal(headers2.get("Authorization"), "Bearer custom");

  delete g.window;
  delete g.localStorage;
  delete g.fetch;
});
