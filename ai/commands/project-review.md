# Command: project-review

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run project-review`
- 项目审查
- 实现合规审查
- 做一次项目 review

## 适用场景

需要按需求、架构、技术、数据库、API 和 Phase 边界审查项目或实现是否合规。

## 必读文件

- `ai/index.md`
- `ai/prompts/review/03-project-review.md`
- `docs/03-prd.md` 至 `docs/09-verification.md`（按项目形态存在则读取）
- 本次审查涉及的代码、任务或 diff

## 执行流程

1. 确定审查对象和范围。
2. 读取相关 docs 与实现文件。
3. 按统一审查维度输出合规项、问题项、风险项和修复建议。
4. 不直接修改文件；修复需另行确认。

## 写入风险

默认只读；不得在审查阶段直接修改文件。

## 续接要求

若形成修复计划，应写入续接文件。
