# Command: docs-open-items

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run docs-open-items`
- 汇总待确认事项
- 生成 open items
- 还有哪些没确认
- 编码前自检未决项
- 阶段任务前检查待确认项

## 适用场景

文档生成、文档评估、体系审计、任务执行或验证过程中出现多处待人工确认项，需要汇总为一个可检查、可回填、可续接的待确认事项总览。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md`
- `ai/prompts/docs/21-docs-open-items.md`
- `docs/README.md`
- `docs/00-scenario.md` 至 `docs/09-verification.md`（按项目形态存在则读取）
- `docs/design/`、`docs/research/`、`tasks/`、`.ai/session-handoff.md`（如存在）

## 执行流程

1. 先说明本次默认只读；若用户要求落盘，需先确认路径和影响范围。
2. 扫描正式文档、设计文档、研究 / 评估报告、任务单和续接文件中的待确认项。
3. 去重合并同一事项，并为每项补齐提出时间、来源、需确认节点、阻塞关系、回填位置、状态和关闭依据。
4. 输出门禁结论：是否阻塞生成 03 / 04 / 08、编码、Phase 升级或发布。
5. 默认建议落盘到 `docs/research/YYYY-MM-DD-docs-open-items.md`；若项目选择长期固定入口，才建议 `docs/open-items.md` 并同步 `docs/README.md` 定位说明。

## 写入风险

默认只读。落盘总览、更新 `docs/README.md`、回填正式文档、修改任务单或续接文件前必须确认。open items 总览不是权威事实源；用户确认后必须回填对应 `docs/`、`tasks/`、`ai/project-rules.md` 或 README。

## 续接要求

若存在阻塞项、条件阻塞项或用户暂不确认的事项，应写入 `.ai/session-handoff.md`，并标明下一次恢复时应先检查的 open item ID。
