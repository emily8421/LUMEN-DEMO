# Command: sync-docs-from-code

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run sync-docs-from-code`
- 代码反向同步文档
- 根据代码更新 docs
- 文档与代码对齐

## 适用场景

代码实现已经成为事实，但 docs 与代码不一致，需要先把事实差异同步回文档。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/prompts/docs/07-sync-docs-from-code.md`
- 相关代码、测试、配置和 docs
- `ai/doc-standards/design-doc.md`（差异涉及 `docs/design/*`、子系统流程、权限、Mock / 降级或实现偏差时）

## 执行流程

1. 先识别代码事实与文档描述的差异。
2. 判断哪些差异是实现偏离、哪些是文档滞后。
3. 输出文档同步计划。
4. 用户确认后修改对应文档。

## 写入风险

会修改项目文档；执行前必须确认。

## 续接要求

记录差异清单、待修改文档和验证方式。
