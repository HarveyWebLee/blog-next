#!/usr/bin/env node
/**
 * 从 blog 相关组件 inline t 提取三语，写入 dictionaries/*.json 的 blog.* 节。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SOURCES = [
  { key: "listPage", file: "components/blog/blog-page-content.tsx", anchor: "const \\[searchValue" },
  { key: "sidebar", file: "components/blog/blog-sidebar.tsx", anchor: "const \\{ user" },
  { key: "postCard", file: "components/blog/post-card.tsx", anchor: "const \\[isHovered" },
  { key: "manage", file: "app/[lang]/blog/manage/page.tsx", anchor: "const \\[posts" },
  { key: "manageCreate", file: "app/[lang]/blog/manage/create/page.tsx", anchor: "const \\[" },
  { key: "manageEdit", file: "app/[lang]/blog/manage/edit/[id]/page.tsx", anchor: "const \\[" },
];

function parseBlock(text) {
  const out = {};
  let current = out;
  const stack = [out];
  for (const line of text.split("\n")) {
    const nest = line.match(/^\s*(\w+):\s*\{\s*$/);
    if (nest) {
      const child = {};
      out[nest[1]] = child;
      current = child;
      stack.push(child);
      continue;
    }
    if (/^\s*\},?\s*$/.test(line) && stack.length > 1) {
      stack.pop();
      current = stack[stack.length - 1];
      continue;
    }
    const m = line.match(/^\s*(\w+):\s*"(.*)",?\s*$/);
    if (m) current[m[1]] = m[2].replace(/\\"/g, '"');
  }
  return out;
}

function extractLocaleBlock(src, locale) {
  const varName = "lang";
  if (locale === "en-US") {
    const m = src.match(
      new RegExp(`${varName} === "en-US"\\s*\\?\\s*\\{([\\s\\S]*?)\\n\\s*\\}\\s*:\\s*${varName} === "ja-JP"`)
    );
    if (!m) throw new Error("en-US block not found");
    return parseBlock(m[1]);
  }
  if (locale === "ja-JP") {
    const m = src.match(new RegExp(`${varName} === "ja-JP"\\s*\\?\\s*\\{([\\s\\S]*?)\\n\\s*\\}\\s*:\\s*\\{`));
    if (!m) throw new Error("ja-JP block not found");
    return parseBlock(m[1]);
  }
  const idx = src.indexOf(`${varName} === "en-US"`);
  const tail = src.slice(idx);
  const m = tail.match(/:\s*\{([\s\S]*?)\n\s*\};\s*\n/);
  if (!m) throw new Error("zh-CN block not found");
  return parseBlock(m[1]);
}

const localeFiles = {
  "zh-CN": path.join(ROOT, "dictionaries/zh-CN.json"),
  "en-US": path.join(ROOT, "dictionaries/en-US.json"),
  "ja-JP": path.join(ROOT, "dictionaries/ja-JP.json"),
};

const dicts = Object.fromEntries(
  Object.entries(localeFiles).map(([loc, f]) => [loc, JSON.parse(fs.readFileSync(f, "utf8"))])
);

for (const src of SOURCES) {
  const filePath = path.join(ROOT, src.file);
  if (!fs.existsSync(filePath)) {
    console.warn("skip missing", src.file);
    continue;
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes('"en-US"')) {
    console.warn("skip no ternary", src.file);
    continue;
  }
  for (const loc of ["zh-CN", "en-US", "ja-JP"]) {
    try {
      const block = extractLocaleBlock(content, loc);
      dicts[loc].blog = dicts[loc].blog || {};
      dicts[loc].blog[src.key] = block;
    } catch (e) {
      console.error(src.key, loc, e.message);
    }
  }
  console.log("synced blog.", src.key);
}

// 补充 profile / commentReview / common 键
const extras = {
  "zh-CN": {
    profileFollowers: { followBackOk: "已回关", followBackFail: "回关失败" },
    profileFollowing: { unfollowOk: "已取消关注", unfollowFail: "取消关注失败" },
    settingsExtra: {
      emailCodeSent: "验证码已发送",
      retry: "重试",
      uploadWechat: {
        hint: "支持 JPEG、PNG、GIF、WebP，最大 10MB",
        emptyDropHint: "点击或拖拽图片到此处上传",
        uploadButton: "上传图片",
        removeButton: "移除",
        uploading: "上传中…",
        needLogin: "请先登录",
        uploadFailed: "上传失败",
      },
    },
    commentReviewExtra: {
      moderationReasonPrompt: "审核理由（可选）:",
      deleteFailed: "删除失败",
      allAuthors: "全部作者",
    },
    listPageExtra: {
      tagHeading: "含「{name}」标签的文章",
      tagHeadingEn: "Posts tagged “{name}”",
      tagHeadingJa: "「{name}」の記事一覧",
      tagNameFallback: "标签 #{id}",
      authorHeading: "作者 #{id} 的文章",
      authorHeadingEn: "Posts by author #{id}",
      authorHeadingJa: "投稿者 #{id} の記事一覧",
    },
    postCardRoles: {
      super_admin: "超级管理员",
      admin: "管理员",
      author: "作者",
      user: "用户",
    },
    passwordTag: "密码保护",
  },
  "en-US": {
    profileFollowers: { followBackOk: "Followed", followBackFail: "Follow back failed" },
    profileFollowing: { unfollowOk: "Unfollowed", unfollowFail: "Unfollow failed" },
    settingsExtra: {
      emailCodeSent: "Code sent",
      retry: "Retry",
      uploadWechat: {
        hint: "JPEG, PNG, GIF or WebP, max 10MB",
        emptyDropHint: "Click or drag to upload",
        uploadButton: "Upload",
        removeButton: "Remove",
        uploading: "Uploading...",
        needLogin: "Please sign in first",
        uploadFailed: "Upload failed",
      },
    },
    commentReviewExtra: {
      moderationReasonPrompt: "Optional moderation reason:",
      deleteFailed: "Delete failed",
      allAuthors: "All authors",
    },
    listPageExtra: {
      tagHeading: "Posts tagged “{name}”",
      tagNameFallback: "Tag #{id}",
      authorHeading: "Posts by author #{id}",
    },
    postCardRoles: {
      super_admin: "Super Admin",
      admin: "Admin",
      author: "Author",
      user: "User",
    },
    passwordTag: "Password",
  },
  "ja-JP": {
    profileFollowers: { followBackOk: "フォローしました", followBackFail: "フォローに失敗しました" },
    profileFollowing: { unfollowOk: "フォロー解除しました", unfollowFail: "フォロー解除に失敗しました" },
    settingsExtra: {
      emailCodeSent: "コードを送信しました",
      retry: "再試行",
      uploadWechat: {
        hint: "JPEG / PNG / GIF / WebP、最大 10MB",
        emptyDropHint: "クリックまたはドラッグでアップロード",
        uploadButton: "アップロード",
        removeButton: "削除",
        uploading: "アップロード中...",
        needLogin: "先にログインしてください",
        uploadFailed: "アップロードに失敗しました",
      },
    },
    commentReviewExtra: {
      moderationReasonPrompt: "審査理由（任意）:",
      deleteFailed: "削除に失敗しました",
      allAuthors: "すべての作者",
    },
    listPageExtra: {
      tagHeading: "「{name}」の記事一覧",
      tagNameFallback: "タグ #{id}",
      authorHeading: "投稿者 #{id} の記事一覧",
    },
    postCardRoles: {
      super_admin: "スーパー管理者",
      admin: "管理者",
      author: "著者",
      user: "ユーザー",
    },
    passwordTag: "パスワード保護",
  },
};

for (const loc of ["zh-CN", "en-US", "ja-JP"]) {
  const e = extras[loc];
  Object.assign(dicts[loc].profile.followers, e.profileFollowers);
  Object.assign(dicts[loc].profile.following, e.profileFollowing);
  Object.assign(dicts[loc].profile.settings, e.settingsExtra);
  dicts[loc].profile.settings.uploadWechat = e.settingsExtra.uploadWechat;
  Object.assign(dicts[loc].profile.commentReview, e.commentReviewExtra);
  dicts[loc].blog.listPage = { ...dicts[loc].blog.listPage, ...e.listPageExtra };
  dicts[loc].blog.postCard = { ...dicts[loc].blog.postCard, roles: e.postCardRoles, passwordTag: e.passwordTag };
}

for (const [loc, file] of Object.entries(localeFiles)) {
  fs.writeFileSync(file, JSON.stringify(dicts[loc], null, 2) + "\n");
}
console.log("done");
