# 自动发版（GitHub Actions + semantic-release）

## 行为摘要

- **触发**：向 **GitHub `main` 分支** 推送提交后，工作流 **Release** 会运行 **`semantic-release`**。
- **何时会真正发版**：自**上一次 git tag**（`v*`）以来，提交历史中存在 **可发布类型** 的 Angular 式提交（例如 **`feat`** → minor、**`fix` / `perf`** → patch，**`feat!` / `fix!` / `BREAKING CHANGE`** → major）。纯 `chore`、`docs`、`style` 等若无其它可发布提交，通常**不会**产生新版本。
- **产物**：
  - 递增根目录 `package.json` 的 **`version`**（本仓库 **`private: true`**，**不向 npm 发布**）；
  - 更新或生成根目录 **`CHANGELOG.md`**；
  - 创建 **GitHub Release** 与对应 **tag**；
  - 由 `@semantic-release/git` 将上述变更 **提交回 `main`**；提交说明中含 **`[skip ci]`**，避免 release 机器人提交再次触发无意义的 Release 工作流。

## 提交信息约定

须符合仓库 **Angular 风格**（与 `.cursorrules` 一致），例如：

```text
feat(blog): 支持文章草稿箱
fix(api): 修复分页总数错误
perf(tags): 减少标签列表查询次数
```

说明 subject 使用中文；**`scope` 英文**（可按模块自取，如 `blog`、`api`、`db`）。

## 本地预演

```bash
pnpm run release:dry-run
```

不会修改远程、不写 tag；会打印**将要**发布的版本与 release notes 等（仍需要完整 git 历史与可访问的 `origin`，以便对照已有 tag）。

**注意**：`@semantic-release/github` 会在校验阶段检查 **GitHub 凭证**。本地若未设置环境变量 **`GITHUB_TOKEN`** 或 **`GH_TOKEN`**（需具备该仓库 **`contents: write`** 等权限的 PAT），`pnpm run release:dry-run` 可能在 verify 阶段报错退出；这在 CI 中不存在问题（Actions 会自动注入 `GITHUB_TOKEN`）。完整本地预演示例：

```bash
# Windows(Git Bash) / macOS / Linux：将 ghp_xxx 换成你的 fine-grained 或 classic PAT
export GITHUB_TOKEN=ghp_xxxxxxxx
pnpm run release:dry-run
```

## 配置位置

| 文件                            | 作用                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `release.config.cjs`            | semantic-release 插件链（含 changelog、`exec` 对 CHANGELOG/package.json 跑 Prettier、npm、github、git） |
| `.github/workflows/release.yml` | CI：安装依赖后执行 `semantic-release`；该步骤带 **`HUSKY=0`** 与 **`GITHUB_TOKEN`**                     |

## 权限与排错

- **Husky / Prettier**：发布流程在 **`git commit`** 阶段若启用 husky，会对 **`CHANGELOG.md`** 做 **`format:check`**；changelog 插件默认生成样式与 Prettier 不一致。本仓库在 **`release.config.cjs`** 里用 **`@semantic-release/exec`** 在提交前 **`prettier --write CHANGELOG.md package.json`**，并在 CI 中对 **`semantic-release` 步骤设置 `HUSKY=0`**。
- **`pnpm/action-setup`**：请勿在工作流里再写 **`version`**，与 `package.json` 的 **`packageManager`** 重复会报错（_Multiple versions of pnpm specified_）；留空 `with` 即可从 `packageManager` 安装对应 pnpm。
- 默认使用 **`GITHUB_TOKEN`**，工作流已声明 `contents: write`（发版、打 tag、写 Release 需要）；当前 workflow 还声明了 `issues: write` 与 `pull-requests: write`，用于 GitHub 插件相关能力。
- 若 **`main` 受分支保护** 且禁止 GitHub Actions 推送到主分支，需在仓库 **Settings → Actions → General → Workflow permissions** 中允许写入，或为组织策略单独放行；否则 `semantic-release` 在 **git push** 阶段会失败。
- 首次发版前若仓库**没有任何 tag**，`semantic-release` 会基于**全部历史提交**计算首个版本；请保证历史中已有合规的 `feat`/`fix` 等，否则可能提示 **no new release**。

## 多包说明

当前 **pnpm workspace** 仅包含根目录 `"."`，因此只维护 **根 `package.json` 的单个 version**。若日后拆分为多包并需**同步提升多包版本**，需另行改用 monorepo 专用工具链（本配置不覆盖该场景）。
