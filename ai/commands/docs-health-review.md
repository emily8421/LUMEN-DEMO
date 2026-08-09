# Command: docs-health-review

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run docs-health-review`
- 文档健康度检查 / 文档健康度复核
- 收尾梳理文档 / 收尾整理文档
- 文档瘦身
- 检查文档可读性
- 周期性文档整理

## 适用场景

一轮工作（Sprint / Phase 收口，或连续多轮文档修改）收尾时，对文档体系做一次**轻量健康度复核**：识别臃肿、重复、结构退化和状态滞后等「积累式演进」副作用，输出可整理清单。区别于 `docs-system-audit` 的全链路追溯审计，本命令聚焦**可读性与信息密度**，不重走追溯链 / 规范基线检查。

## 不适用场景

- 全链路追溯断点 / 规范基线缺口 / 阶段可行性审计 → 用 `docs-system-audit`(16)。
- 阶段转换 `Go / Conditional Go / No Go` 判断 → 用 `docs-evaluation`(19)。
- 编码前边界复查 → 用 `docs-checklist`(10)。

## 必读文件

- `ai/index.md`
- `ai/global-rules.md` §8（积累式演进）与 §8.4（整理例外）
- `ai/prompts/review/24-docs-health-review.md`
- 本轮受影响的项目文档（`docs/00-09`、`docs/design/*`、`docs/research/*` 等）

## 执行流程

1. 读取 24 号健康度复核 Prompt 与 `global-rules §8 / §8.4`。
2. 盘点本轮受影响的文档范围（避免全仓漫扫；优先本轮改动 + 头部元信息 + 状态标记密集区）。
3. 按四类信号核查：内容重复 / 章节臃肿 / 结构退化 / 状态滞后。
4. 每项给出 `文件:行`、类型、严重度、建议处理方式，并区分「**可安全整理**」（纯过程性残留）与「**需人工确认**」（涉历史事实 / 追溯锚点 / 阶段结论）。
5. 输出健康度报告 + 整理计划（按文档分组）+ 待人工确认项总览。
6. 不直接改文件；整理需另行确认，确认后按 `edit-single-doc`(04) 或 `sync-docs-from-code`(07) 做最小变更。

## 写入风险

默认只读；不得在复核阶段直接修改文件。整理动作（删除 / 合并 / 移入 `docs/archive/`）必须经人工确认，且遵守 `global-rules §8.4` 整理例外：历史事实与追溯锚点保留或进 archive，不得删除。

## 续接要求

若复核发现多项待整理问题，应把整理计划、可安全整理清单、待人工确认项写入续接文件。
