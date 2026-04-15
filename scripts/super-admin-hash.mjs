#!/usr/bin/env node
/**
 * 交互式生成 SUPER_ADMIN_PASSWORD_BCRYPT_BASE64：
 * 读取明文密码 → bcrypt(12 轮) → Base64，避免 .env 中 $ 被截断。
 *
 * 用法：
 *   pnpm super-admin:hash
 *   pnpm super-admin:hash -- "一次性传入的密码"   （勿进 shell 历史时可慎用）
 *
 * 也可管道传入（无回显风险由终端决定）：
 *   echo 你的密码 | pnpm super-admin:hash --stdin
 */
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

async function readPasswordFromStdin() {
  const chunks = [];
  for await (const chunk of input) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function promptPasswordInteractive() {
  const rl = readline.createInterface({ input, output });
  try {
    const p1 = await rl.question("请输入超级管理员明文密码: ");
    const p2 = await rl.question("请再次输入以确认: ");
    if (p1 !== p2) {
      console.error("\n错误：两次输入不一致。");
      process.exit(1);
    }
    if (!p1) {
      console.error("\n错误：密码不能为空。");
      process.exit(1);
    }
    return p1;
  } finally {
    rl.close();
  }
}

function printResult(plainForHash) {
  const hash = bcrypt.hashSync(plainForHash, SALT_ROUNDS);
  const b64 = Buffer.from(hash, "utf8").toString("base64");

  console.log("\n--- 复制到 .env（勿提交到 git）---\n");
  console.log(`SUPER_ADMIN_PASSWORD_BCRYPT_BASE64=${b64}`);
  console.log("\n说明：");
  console.log(`- bcrypt 哈希长度 ${hash.length}，已做 Base64 编码，不含字符 $，适合 Windows / Docker env。`);
  console.log("- 请同时设置 SUPER_ADMIN_ENABLED=true 与 SUPER_ADMIN_USERNAME=你的登录名。");
  console.log("- 生成后请尽快删除终端滚动记录中的敏感信息。\n");
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`用法:
  pnpm super-admin:hash
  pnpm super-admin:hash -- "一次性密码"
  echo 密码 | pnpm super-admin:hash --stdin
`);
    process.exit(0);
  }

  if (argv.includes("--stdin")) {
    const plain = await readPasswordFromStdin();
    if (!plain) {
      console.error("错误：stdin 为空。");
      process.exit(1);
    }
    printResult(plain);
    return;
  }

  const dash = argv.indexOf("--");
  if (dash !== -1 && argv[dash + 1] != null) {
    printResult(argv[dash + 1]);
    return;
  }

  const plain = await promptPasswordInteractive();
  printResult(plain);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
