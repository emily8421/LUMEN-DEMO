# Command: sprint-summary

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run sprint-summary`
- Sprint 总结
- 验收总结
- 总结当前任务

## 适用场景

一个 Sprint 或任务完成后，需要对照验收标准总结是否完成。

## 必读文件

- `ai/index.md`
- `ai/prompts/dev/09-sprint-summary.md`
- `docs/08-dev-plan.md`
- `docs/09-verification.md`（如存在）
- 当前 diff 和验证输出

## 执行流程

1. 对照任务目标、修改范围、验收标准和禁止事项。
2. 生成 Sprint 完成包：改动文件、验证命令 / 人工步骤、验证结果、关联提交 / PR、`09` 验收记录、残留风险和下一步。
3. 明确需要回写 `docs/08-dev-plan.md` 的进度摘要 / Sprint 状态，以及需要写入 `docs/09-verification.md` 的验收记录、Sprint 验收包、风险与未验证项；若暂不落盘，说明原因、风险和补做时点。
4. 给出是否可提交 / 是否需补修 / 是否可进入下一 Sprint 的建议。

## 写入风险

默认只读；若需要更新文档状态或任务记录，需先确认。

## 续接要求

将已完成、未完成和下次优先项写入续接文件；handoff 只做临时续接，不替代正式 `08/09` 进度和验收记录。
