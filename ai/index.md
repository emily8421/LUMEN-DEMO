# AI 规则入口与任务路由

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

进入项目后，先读取本文件和 `ai/rules-core.md`，再按任务类型读取对应规则包。规则读取必须覆盖即将执行的动作；若无法判断任务类型或规则覆盖范围，回退读取“完整规则回退包”。

## 1. 启动必读

- ai/rules-core.md
- ai/session-rules.md

## 2. 快速续接例外

快速续接例外：当用户只要求“读取续接点 / 继续上次 / 恢复上下文 / resume”，且没有要求继续执行远端 issue / PR、同步、合并、关闭、清理、分析、设计、编码或写入任务时，先按 `ai/session-rules.md` §3.1 快速续接模式做最小本地只读恢复即可，不需要展开任务规则包。快速摘要输出后，只要用户要求继续执行具体任务，必须回到本文件完成规则路由读取；无法判断时读取完整规则回退包。

## 3. 任务路由表

| 任务类型 | 触发示例 | 必读规则包 |
|---|---|---|
| 快速续接 | 读取续接点 / resume，且不继续执行任务 | `ai/session-rules.md` §1 / §3.1；必要时 `ai/commands/resume.md` |
| 命令路由 | 用户使用 `/run ...` 或明显命令意图 | `ai/commands/README.md`、对应命令文件、命令文件列出的权威文档 / Prompt / 脚本说明 |
| PR / CI / Git 收尾 | 闭环 PR、看 checks、修 CI、amend / push / merge closure | `template-docs/remote-ci-sop-profile.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md`、`ai/commands/README.md`；涉及 Git 流程时读取 `git-guide.md` 相关章节 |
| 编码 / 修 bug / Sprint 执行 | 实现任务、修缺陷、执行当前 Sprint | `ai/global-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md`、`ai/commands/run-dev-task.md` 或 `ai/commands/fix-bug.md` |
| 文档 / 需求 / 设计 / 计划 | 生成或审计 docs、精修单文档、阶段规划、同步代码事实到文档 | `ai/global-rules.md`、`ai/document-lifecycle-rules.md`、相关 `ai/doc-standards/`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` |
| UI 探索 / 原型 / 交互设计 | UI brief、需求探索原型、实现前原型、前端交互设计 | `ai/document-lifecycle-rules.md`、相关 `ai/doc-standards/`、`ai/commands/ui-prototype-exploration.md`、`ai/project-rules.md` |
| 模板维护 / 规则改造 / 同步机制 | 修改 `ai/` 规则、入口镜像、同步清单、自检脚本、模板发布 | 完整规则回退包、`MAINTAINERS.md`、`CONTRIBUTING.md`、`template-sync.json`、相关脚本 |

## 4. 完整规则回退包

以下情况必须读取完整规则回退包：任务类型不明确；规则文件 / 入口文件被修改或同步；跨仓库 / 跨角色后规则来源不确定；续接记录与 Git 事实冲突；即将执行的动作不在已读规则覆盖范围内。

- ai/rules-core.md
- ai/global-rules.md
- ai/document-lifecycle-rules.md
- ai/implementation-lifecycle-rules.md
- ai/session-rules.md
- ai/commands/README.md
- ai/project-rules.md

> 规则增多需要拆分时，优先在本文件维护任务路由和完整回退包；AGENTS.md / CLAUDE.md / .cursor/rules/project-rules.mdc 只保留入口说明，不复制完整清单。
