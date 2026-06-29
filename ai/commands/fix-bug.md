# Command: fix-bug

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run fix-bug`
- 修 Bug
- 修复缺陷
- 排查问题

## 适用场景

已有明确异常、失败测试、错误日志或复现步骤，需要做最小修复。

## 必读文件

- `ai/index.md`
- `ai/prompts/dev/05-fix-bug.md`
- 相关任务、代码、测试、日志和 docs

## 执行流程

1. 先复现或定位问题，不直接改代码。
2. 说明根因、影响范围和最小修复方案。
3. 用户确认后修改。
4. 运行针对性验证。
5. 若代码事实与 docs 不一致，建议使用 `docs-sync-from-code` 流程。

## 写入风险

会修改代码或测试；执行前必须确认修复范围。

## 续接要求

记录复现结果、根因假设、修复文件和验证命令。
