---
name: i18n-consistency-guard
description: 保证前台多语言键、语言路由与词典一致。用于用户提到 i18n、国际化、字典、dictionaries、app/[lang]、locale、middleware 语言配置、翻译缺失、语言前缀时。
---

# I18n Consistency Guard

## 适用场景

- 修改 `app/[lang]/...` 页面组件中的用户可见文案。
- 修改 `dictionaries/*.json` 语言词典。
- 修改 `middleware.ts` 的语言配置。

## 不处理范围

- 不处理 API 契约同步（交给 `api-contract-sync`）。
- 不处理数据库结构同步（交给 `db-schema-sync`）。
- 不处理功能专题文档沉淀（交给 `feature-doc-closure`）。

## 执行步骤

1. 检查可见文案来源
   - 优先通过词典读取，不在组件里硬编码多语言文案。
2. 保证三语键一致
   - `zh-CN`、`en-US`、`ja-JP` 对应键应齐全且语义一致。
3. 校验路由语言前缀
   - 前台内部链接保持 `/{lang}/...` 形式。
4. 语言配置联动检查
   - 若改 `middleware.ts` 中 locales/defaultLocale，检查是否同步影响 `generateStaticParams` 与词典加载逻辑。

## 完成标准

- 不出现漏翻、键缺失、错误语言前缀。
- 新增或调整语言配置后，前台路由和词典加载行为一致。

## 最小使用示例

- 示例触发语句：`把分类页新增按钮文案补齐中英日三语，并检查语言路由`
- 预期行为：只处理词典键和语言路径一致性，不处理 API/DB 文档。
