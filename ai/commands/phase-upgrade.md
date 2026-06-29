# Command: phase-upgrade

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run phase-upgrade`
- Phase 升级评估
- 进入下一阶段
- 评估下一 Phase

## 适用场景

当前 Phase 接近完成，需要评估是否进入下一 Phase，并草拟阶段边界更新。

## 必读文件

- `ai/index.md`
- `ai/prompts/planning/08-phase-upgrade.md`
- `docs/03-prd.md`
- `docs/08-dev-plan.md`
- `docs/09-verification.md`
- `ai/project-rules.md`

## 执行流程

1. 对照当前 Phase 进入 / 退出标准和验证结果。
2. 判断是否满足升级条件。
3. 输出阶段边界更新建议和待确认项。
4. 人工确认后再修改 PRD、project-rules 或开发计划。

## 写入风险

默认先只读评估；修改 Phase 边界前必须确认。

## 续接要求

记录评估结论、待确认项和拟修改文档。
