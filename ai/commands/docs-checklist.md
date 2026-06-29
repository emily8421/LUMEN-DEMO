# Command: docs-checklist

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run docs-checklist`
- 开发前文档检查
- 检查 docs 是否能进入开发
- 文档 checklist

## 适用场景

`docs/03-09` 已生成或更新，准备进入 Sprint 开发前做拦截检查。

## 必读文件

- `ai/index.md`
- `ai/prompts/review/10-docs-checklist.md`
- `docs/03-prd.md` 至 `docs/09-verification.md`（按项目形态存在则读取）
- `ai/project-rules.md`

## 执行流程

1. 按 docs checklist 检查阶段边界、需求追溯、设计完整性和验证闭环。
2. 列出通过项、问题项、风险项和修复建议。
3. 未通过时先修文档，不进入编码。

## 写入风险

默认只读；修正文档需另行确认。

## 续接要求

若检查未通过，应把修复清单写入续接文件。
