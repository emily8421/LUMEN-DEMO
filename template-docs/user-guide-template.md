# <项目> 用户操作手册（user guide）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 定位：本文件是项目 how-to 操作任务的**单一导航入口**，把「要做什么 → 权威入口在哪」汇总成表，**不重复逐步细节**（细节在 scenario-guides / commands / prompts / SOP）。与 `template-docs/beginner-guide.md`（心智模型）互补：beginner-guide 回答「是什么 / 为什么」，本手册回答「怎么做某任务 → 去哪看」。复杂项目按需实例化到 `docs/`（如 `docs/guides/user-guide.md`）；Lean 项目可不用。

## 1. 任务 → 权威入口导航

| 任务 | 权威入口 | 备注 |
|---|---|---|
| 新建派生项目 | `scripts/new-project.sh` + `ai/commands/new-project.md` | 决策记 `ai/project-rules.md` §3 |
| 采集本机环境 | `scripts/collect-env.ps1` + `ai/commands/collect-env.md` | 输出 `docs/env/local-env.md` |
| 准备输入材料 | `ai/prompts/docs/01-review-inputs.md` | 先放 `docs/inputs/` |
| 生成 / 补齐文档体系 | `ai/prompts/docs/00-generate-or-complete-docs.md` | 按剖面裁剪 06/07 |
| 规划阶段 / Phase | `docs/03-prd.md` §3 + `ai/commands/scenario.md` | |
| 执行 Sprint / 任务 | `ai/commands/run-dev-task.md` + `docs/08-dev-plan.md` | |
| 修 Bug | `ai/commands/fix-bug.md` | |
| 跑演示 / 看效果 | `ai/commands/show-demo.md` + `docs/env/local-demo-runbook.md` | 演示 ≠ 验收 |
| 文档体系审核 | `ai/commands/docs-system-audit.md` | |
| 文档评估 | `ai/commands/docs-evaluation.md` | Go / Conditional Go / No Go |
| 同步模板方法论 | `scripts/sync-template.sh` + `ai/commands/sync-methodology.md` | 派生项目侧 |
| 同步后整理 | `ai/commands/post-sync-cleanup.md` | |
| 提 PR / 合并 / 看 CI | `ai/commands/README.md` + `template-docs/remote-ci-sop-profile.md` | |
| 提交模板优化提案 | `ai/commands/submit-proposal.md` | 回流模板 |

## 2. 卡住时去哪看

- 不知道整体心智 → `template-docs/beginner-guide.md`。
- 不知道当前做什么场景 → `template-docs/scenario-guides.md`（A0–A28 使用者 / C1–C8 维护者）。
- 不知道规则依据 → `ai/index.md` 任务路由 → 对应 `ai/*-rules.md`。
- 不知道命令 → `ai/commands/README.md`。
- 续接上次会话 → `/run resume`（`ai/session-rules.md` §3.1）。

## 3. 维护约定

- 本手册只做**导航**，不复制逐步细节；命令 / Prompt / SOP 变化时更新入口指针。
- 新增高频任务时，在 §1 加导航行；避免在本手册重写步骤。
- 派生项目实例化时，按项目实际保留 / 删减任务行。
