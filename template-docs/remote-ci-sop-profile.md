# Remote / CI SOP Profile（PR / CI 闭环速查）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 **Remote / CI SOP Profile**：AI 做远端操作（push / PR / CI / issue 等）时，先读本契约定位"该读哪几份、怎么做"，**只读必读文件、不全量翻模板**。它是 PR / CI 闭环的速查入口，不替代 `git-guide.md`、`SOP.md`、`MAINTAINERS.md`、`CONTRIBUTING.md` 或 GitHub 远端事实。

目标：减少 PR / CI 收尾中重复全文读取长治理文档的成本，同时保留远端高风险动作单步确认、失败即停、CI pending 不长等。

## 1. 适用场景

- 触发：`push`、PR create / merge、issue close、Actions / CI 查询、远端分支处理、GitHub CLI 认证问题。
- 不适用：纯本地只读、本地编码 / 文档生成（走 Core / Implementation / Docs 层，见 `ai/index.md` 路由）。
- 相关命令：远端收尾、模板维护、派生同步、issue 关闭。

## 2. 必读文件（最小必读）

- `ai/rules-core.md`（硬规则 + 写入确认 + Checkpoint Mode 触发）
- `ai/session-rules.md` §3.3（Checkpoint Mode：远端短轮询、失败即停、高风险单步确认）
- `git-guide.md` §1.1 / §1.2（远端预检、分支 / worktree）
- `SOP.md` A10 / C4（远端常用命令）
- 可选：`scripts/check-github-context.ps1`（远端上下文预检）

这是分诊核心：做远端操作时只读这 4 份 + 可选 1 份，不预读全模板。

## 3. PR / CI 闭环 Checklist

以下 checklist 只做速查；具体命令和风险边界仍以 §2 的必读文件为准。

### A. 动作前预检

1. 读取 Git 事实：`git status --short --branch`，确认当前分支、staged / unstaged / untracked 范围。
2. 若准备 push / PR / merge / close / delete / release，运行只读预检：`powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1`。
3. 输出预检摘要：repo root、branch、origin、Git identity、`gh` auth、viewer permission、工作区是否含未确认改动。
4. 若预检失败、权限不明、remote 不符合预期或工作区混入无关改动，立即停止并请用户确认。

### B. 提交与推送

1. 只 stage 已确认范围内的文件。
2. 提交前运行 `git diff --check`；涉及 `_proposals/`、`ai-records/` 等 Markdown 记录时运行 `scripts/check-markdown-clean.ps1` 的窄范围检查。
3. 首次 push 前说明目标仓库、分支、命令和风险，等待用户确认。
4. push 失败若属于 network / sandbox / auth / permission，立即停止，不连续重试。

### C. 创建 PR

1. 创建 PR 前确认 branch 已推送且远端仓库正确。
2. 使用项目约定的 PR 模板；模板仓默认 `gh pr create --fill`。
3. PR 创建后汇报 PR 编号 / URL、base / head、是否 draft、初始 checks 状态。

### D. Checks / CI

1. 查询 checks 一次或短轮询；CI pending 即汇报 pending，不长时间挂起等待。
2. CI failed 时只摘失败 job / step、关键错误和链接；不要把完整长日志刷入上下文。
3. 若失败原因无法确认与本次改动相关，先标记不确定并请用户确认，不直接扩大修复范围。

### E. Merge / Close / Delete

1. merge、close issue、delete branch、tag / release 都是高风险动作，必须单步说明目标、命令、风险和回滚方式，等待用户确认。
2. 模板仓 PR 合并后同步本地 `main`，再清理已合并本地分支；是否删除远端分支以 PR / 用户确认和仓库策略为准。
3. 清理后复查 `git status --short --branch`，输出最终分支、HEAD、残留未跟踪文件和未复核远端项。
4. 需要续接时更新 `.ai/session-handoff.md`；长期发布事实仍写入 `VERSION`、`CHANGELOG.md`、PR 或正式文档，不写进 handoff 替代。

## 4. 输入契约

- 上游事实：当前 repo root、branch、origin、worktree status、`gh auth` 状态、viewer permission、目标远端动作。
- 必填前置：先 `git status --short --branch` 确认分支与未提交改动。
- 禁止从哪推断：不从 CLI 私有会话、memory、cache 推断远端 / CI 状态；以 Git 事实 + `gh` / Actions 查询为准。

## 5. 输出契约

- 必须产出：远端动作前预检摘要、高风险动作确认点、CI 状态摘要（或 pending 标注）、失败类别 + 下一步建议。
- 可选产出：PR / issue 链接、远端动作结果。
- 不得写入：不得把远端查询结果 / 候选方案写成已确认项目事实；只有 Git / PR / issue 事实可作权威。

## 6. 消费者

PR / CI 收尾、模板维护、派生同步、issue 关闭流程。

## 7. 验证方式

- `scripts/check-github-context.ps1`（远端上下文预检）。
- `gh pr checks`（一次或短轮询；CI pending 即汇报 pending，不长等）。
- `scripts/check-template.*`（模板维护改动涉及同步范围 / 规则 / 自检时）。

## 8. 自检断言

- 必须存在：本文件在 `template-docs/`，并被 `template-sync.json` 和 `scripts/sync-template.sh` fallback 纳入。
- 必须关键词：远端 / CI / push / PR / 预检 / 失败即停 / 最小必读 / PR / CI 闭环 Checklist。
- 必须禁止的漂移：不得删除"必读文件"最小集（rules-core / session-rules §3.3 / git-guide §1.1·§1.2 / SOP A10·C4）。

## 9. 禁止项

- 不绕过 sandbox / auth。
- 不无限等待 CI（pending 即汇报，短轮询）。
- 未确认不做 push / merge / close / delete / release。
- 不把候选、未确认、Mock / 降级写成已通过 / 已确认。

## 10. 维护说明

本 Profile 已从分诊实验转为同步范围内的正式速查入口。维护时遵守：

- 若 PR / CI 闭环权威流程变化，优先更新 `git-guide.md` / `SOP.md` 等权威文档，再同步调整本 Profile 的引用和 checklist。
- 本文件不复制完整 Git / GitHub SOP；只保留最小必读、确认点和闭环摘要。
- 新增或删除同步范围内入口时，同时更新 `template-sync.json`、`scripts/sync-template.sh` fallback 和 `scripts/check-template.sh` 断言。
