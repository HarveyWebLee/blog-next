---
name: commit-message-angular-cn
description: 生成符合 Angular 规范的中文 commit message，并保证英文 scope 与 semantic-release 兼容。用于用户提到 commit、提交信息、提交标题、Angular 规范、changelog、语义化版本时。
---

# Commit Message Angular CN

## 适用场景

- 用户请求生成 commit message。
- 准备提交前需要整理提交标题与正文。

## 不处理范围

- 不执行代码改动或文档同步。
- 不做发布流程检查（交给 `release-readiness-check`）。
- 不做 lint/format/test 执行（交给 `precommit-quality-gate`）。

## 执行步骤

1. 判定变更类型
   - `feat`、`fix`、`docs`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`。
2. 确定英文 scope
   - 示例：`web`、`admin`、`utils`、`config`、`root`。
3. 生成提交信息
   - 格式：`<type>(<scope>): <subject>`。
   - `subject/body/footer` 使用中文，简洁表达“为什么改”。
4. 判断是否破坏性变更
   - 使用 `!` 或 `BREAKING CHANGE:` 明确标识。
5. 检查 semantic-release 影响
   - `feat` 触发 minor，`fix/perf` 触发 patch，破坏性变更触发 major。

## 完成标准

- 满足 Angular 提交格式与中文表达要求。
- scope 为英文且语义准确。

## 最小使用示例

- 示例触发语句：`根据当前改动帮我生成一条符合规范的提交信息`
- 预期行为：输出 `<type>(<scope>): <subject>` 结构，中文正文，英文 scope。
