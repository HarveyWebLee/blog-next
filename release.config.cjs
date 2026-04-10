/**
 * semantic-release 配置
 *
 * 触发条件：GitHub Actions 在 push 到 `main` 时调用；仅当自上次 tag 以来存在
 * **可发布**的提交（如 Angular 约定的 feat / fix / perf 等）时才打 tag、改版本、写 CHANGELOG、发 Release。
 *
 * 本仓库为 `private: true` 的 Next 应用，不向 npm 发布，仅更新根目录 `package.json` 的 version。
 * 工作区仅含根包 `"."`，无多包并发版本；若日后拆 workspace 子包，需改用 monorepo 专用方案。
 *
 * 本地预演：pnpm run release:dry-run（需已配置 git 远程、建议网络可访问 GitHub 以便校验）。
 *
 * @see https://semantic-release.gitbook.io/semantic-release/
 */
module.exports = {
  branches: ["main"],
  plugins: [
    // 按 Angular 预设解析 type(scope): subject，决定下一语义化版本
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
      },
    ],
    // 生成 Release Notes（供 GitHub Release 与 CHANGELOG 使用）
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
      },
    ],
    // 维护根目录 CHANGELOG.md
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    // 递增 package.json 中的 version；private 包不执行 npm publish
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    // 创建 GitHub Release（需 CI 中的 GITHUB_TOKEN）
    [
      "@semantic-release/github",
      {
        // 不在相关 Issue/PR 上自动留言，避免通知噪音（可按需改为 true）
        successComment: false,
        failComment: false,
      },
    ],
    // 将 version、CHANGELOG 等变更提交回 main；[skip ci] 避免与本次 release 提交形成死循环
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
