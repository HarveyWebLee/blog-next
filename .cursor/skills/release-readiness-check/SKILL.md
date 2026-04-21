---
name: release-readiness-check
description: 检查 semantic-release 发版准备度与版本变更预期。用于用户提到发版、release、main 合并前检查、workflow、CHANGELOG 自动生成、版本升级级别时。
---

# Release Readiness Check

## 适用场景

- 准备合并到 `main` 前。
- 用户询问版本是否会自动发布、CHANGELOG 是否会更新。
- 检查 `.github/workflows/release.yml` 与提交类型是否匹配。

## 不处理范围

- 不生成 commit message（交给 `commit-message-angular-cn`）。
- 不处理功能代码实现。
- 不处理接口或数据库文档同步。

## 执行步骤

1. 检查发版工作流关键配置
   - 校验 `.github/workflows/release.yml` 是否可用。
2. 审核待合并提交类型
   - 检查是否符合 semantic-release 语义规则。
3. 评估版本变化级别
   - 输出 major/minor/patch 的预期判断及依据。
4. 标记风险
   - 无有效类型提交、潜在破坏性变更未声明、流程配置缺失等。

## 完成标准

- 能明确回答“是否具备发版条件”以及“预期版本变更级别”。
- 结论可追溯到工作流配置与提交语义。

## 最小使用示例

- 示例触发语句：`这批提交合并 main 后会不会自动发版，版本会怎么涨`
- 预期行为：给出可发版结论、major/minor/patch 预期与风险点。
