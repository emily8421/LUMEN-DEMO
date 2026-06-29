# Command: run-dev-task

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run run-dev-task`
- 执行当前 Sprint
- 执行任务
- 继续开发任务

## 适用场景

根据 `docs/08-dev-plan.md` 或 `tasks/task-*.md` 执行一个明确的小任务。

## 必读文件

- `ai/index.md`
- `ai/session-rules.md`
- `ai/prompts/dev/02-run-task.md`
- `docs/08-dev-plan.md` 或指定任务单
- 任务涉及的 docs/设计/API/DB 文档

## 执行流程

1. 确认任务范围、输入文档、修改范围、验收标准和禁止事项。
2. 输出实现方案和预计修改文件。
3. 用户确认后按最小范围修改。
4. 运行针对性验证，输出结果和后续建议。

## 写入风险

会修改代码或文档；执行前必须确认范围。

## 续接要求

执行计划、当前步骤和验证结果必须写入续接文件。
