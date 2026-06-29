# Command: docs-system-audit

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run docs-system-audit`
- 文档体系审核
- 文档全链路审计
- PLM 链路审计

## 适用场景

项目文档成型后，需要回溯审计 Scenario → 验证闭环的完整性、一致性和可行性。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/prompts/review/16-docs-system-audit.md`
- `docs/00-scenario.md` 至 `docs/09-verification.md`（按项目形态存在则读取）
- `ai/doc-standards/00-09`（如存在，作为当前规范镜像）
- `docs/_scaffold/00-09`（旧项目 fallback 路径，如存在）

## 执行流程

1. 读取文档生命周期规则和 16 号审计 Prompt。
2. 盘点项目 `docs/00-09`、`docs/design/`、`docs/env/` 等相关文档。
3. 对照追溯链、阶段标签、交付物形态、可验证性和规范基线。
4. 输出审计报告和回梳计划。
5. 不直接修改文件；如需修复，另行确认并使用文档修订 Prompt。

## 写入风险

默认只读；不得在审计阶段直接修改文件。

## 续接要求

若审计发现多项待回梳问题，应把回梳计划和待确认项写入续接文件。
