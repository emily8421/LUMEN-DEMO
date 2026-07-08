# Command: edit-single-doc

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run edit-single-doc`
- 修订单个文档
- 修改一份 docs
- 更新指定文档

## 适用场景

只需要按明确依据修订一份目标文档，不扩展到整套文档体系。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/prompts/docs/04-edit-single-doc.md`
- 目标文档
- 目标文档的上游输入文档
- `ai/doc-standards/design-doc.md`（当目标是 `docs/design/*` 或用户说“补详细设计 / 补子系统设计”时）

## 执行流程

1. 明确目标文档、上游依据、允许修改范围和下游影响；若目标是 `docs/design/*`，同时判断触发 / 豁免条件与 `ai/doc-standards/design-doc.md` 的必填结构。
2. 先输出修改计划。
3. 用户确认后做最小修订。
4. 输出变更摘要和需要同步检查的下游文档。

## 写入风险

会修改文档；执行前必须确认目标文件和范围。

## 续接要求

记录目标文档、修改依据、已完成项和下游待检查项。
