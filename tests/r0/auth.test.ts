import assert from "node:assert/strict";
import test from "node:test";

const authModuleUrl = new URL("../../lib/utils/auth.ts", import.meta.url).href;
const authEnvironmentKeys = ["NODE_ENV", "JWT_SECRET", "JWT_REFRESH_SECRET"] as const;
const mutableEnv = process.env as Record<string, string | undefined>;

async function withAuthEnvironment(
  values: Partial<Record<(typeof authEnvironmentKeys)[number], string>>,
  run: () => Promise<void>
): Promise<void> {
  const original = new Map(authEnvironmentKeys.map((key) => [key, mutableEnv[key]]));

  try {
    for (const key of authEnvironmentKeys) {
      const value = values[key];
      if (value === undefined) {
        delete mutableEnv[key];
      } else {
        mutableEnv[key] = value;
      }
    }
    await run();
  } finally {
    for (const key of authEnvironmentKeys) {
      const value = original.get(key);
      if (value === undefined) {
        delete mutableEnv[key];
      } else {
        mutableEnv[key] = value;
      }
    }
  }
}

async function loadAuthModule(caseName: string) {
  return import(`${authModuleUrl}?case=${caseName}-${Date.now()}-${Math.random()}`);
}

test("生产环境拒绝默认 JWT 密钥", { concurrency: false }, async () => {
  await withAuthEnvironment(
    {
      NODE_ENV: "production",
      JWT_SECRET: "your-secret-key",
      JWT_REFRESH_SECRET: "your-refresh-secret-key",
    },
    async () => {
      await assert.rejects(() => loadAuthModule("default-secret"), /JWT_SECRET must be configured/);
    }
  );
});

test("next build 阶段允许缺省 JWT（Docker 构建不注入密钥）", { concurrency: false }, async () => {
  await withAuthEnvironment(
    {
      NODE_ENV: "production",
      JWT_SECRET: undefined,
      JWT_REFRESH_SECRET: undefined,
    },
    async () => {
      const previousPhase = process.env.NEXT_PHASE;
      try {
        process.env.NEXT_PHASE = "phase-production-build";
        const auth = await loadAuthModule("build-phase-no-secret");
        assert.equal(typeof auth.generateAccessToken, "function");
      } finally {
        if (previousPhase === undefined) delete (process.env as Record<string, string | undefined>).NEXT_PHASE;
        else process.env.NEXT_PHASE = previousPhase;
      }
    }
  );
});

test("生产环境使用已配置的 JWT 密钥", { concurrency: false }, async () => {
  await withAuthEnvironment(
    {
      NODE_ENV: "production",
      JWT_SECRET: "r0-test-access-secret-7e9ca2bf-3e68-4d8e-bb1c-508b5c43e50f",
      JWT_REFRESH_SECRET: "r0-test-refresh-secret-755edcc3-4385-4b03-9d19-ff93c9d30bdd",
    },
    async () => {
      const auth = await loadAuthModule("configured-secret");
      const token = auth.generateAccessToken({
        userId: 7,
        username: "r0-user",
        role: "user",
      });
      const payload = auth.verifyAccessToken(token) as {
        userId: number;
        username: string;
      };
      assert.equal(payload.userId, 7);
      assert.equal(payload.username, "r0-user");
    }
  );
});
