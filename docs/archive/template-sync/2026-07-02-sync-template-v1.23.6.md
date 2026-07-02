# 派生同步运行记录 — LUMEN 同步模板 v1.23.6

> 派生项目完成 `ai-project-template` 方法论同步后的真实同步记录。模板见 `template-docs/derived-sync-report-template.md`。

## 基本信息

- 项目：LUMEN（KnowledgeBase Demo），`emily8421/LUMEN-DEMO`（私有）
- 同步日期：2026-07-02
- 同步前模板版本：v1.21.0
- 目标模板版本：v1.23.6
- 同步分支：`chore/sync-template-v1.23.6`（已合入并删除）
- 合并提交：`76a30bb sync template v1.23.6 from ai-project-template (#14)`（squash）
- 操作入口：`/run sync-methodology`
- AI 工具 / CLI：Claude Code

## 执行命令

- dry-run：`bash scripts/sync-template.sh --dry-run`
- commit：`bash scripts/sync-template.sh --commit`（commit `6323838`，29 文件）
- check-derived-sync：`bash scripts/check-derived-sync.sh`（exit 0）
- 是否触发 PowerShell fallback：否（sync / check 均直接用 Git Bash 跑 `.sh`，未走 PowerShell）
- bootstrap：`git checkout FETCH_HEAD -- scripts/sync-template.{sh,ps1}`（ps1 +323 含 fallback；sh 已最新无差异）

## 同步结果

- 是否成功：是
- 新增 / 修改的方法论文件：29 个（含新增 `template-docs/scenario-guides.md`、`ai/commands/scenario.md`）
- 项目专属文件是否被误改：否（见下「安全核验」）
- 是否新增 / 刷新 `ai/doc-standards/00-09`：处理但**无差异**，未进提交
- 是否残留旧 `docs/_scaffold/`：否

## 安全核验

`check-derived-sync` 通过（exit 0）：提交 29 文件全在 `template-sync.json` 清单内，未出现 `docs/00-09`、`ai/project-rules.md`、根 `README.md`、`frontend/backend/tests/docker` 业务代码。

## 本次同步引入的主要变化（v1.21.0 → v1.23.6）

- **v1.22.0**：场景引导层 `template-docs/scenario-guides.md`（23 场景）+ `ai/commands/scenario.md`（`/run scenario`）；`document-lifecycle-rules §13` 设计文档图表规范；**`project-rules §2.6` 新骨架项**
- v1.21.3 / v1.22.5：`sync-template.ps1` 原生 PowerShell fallback + Null bug 修复；`check-derived-sync` 放宽工作区检查（只看已跟踪改动）
- v1.22.1–v1.22.4：入口文档简化（README / INIT-PROMPT / beginner-guide）
- v1.23.0–v1.23.6：文档体系重构（beginner-guide / docs-README 输入输出二分 / MAINTAINERS / CONTRIBUTING / git-guide 按场景重构 / 手册可读性 + scenario 速查索引 + SOP↔scenario 场景码对齐）

## 遇到的问题

- **沙箱 PowerShell→Git Bash Win32 error 5**：本机从 PowerShell 启动 Git Bash 在沙箱内报 Win32 error 5（与历史一致）。解决：直接用 Git Bash 跑 `bash scripts/sync-template.sh`，绕过 PowerShell→Git Bash 启动链；v1.21.3 的 PowerShell fallback 未触发（`.sh` 一直是最新可直跑）。
- **目标版本读取**：首次 fetch 读到 v1.23.5，dry-run 内部再 fetch 升至 v1.23.6；分支名由 `chore/sync-template-v1.23.5` 重命名为 `chore/sync-template-v1.23.6`。
- 无同步脚本 / Prompt / 文档说明问题。

## 可优化点归纳

| 问题 | 是否项目专属 | 是否建议回流模板 | 建议提案 |
|---|---|---|---|
| sync 后根 README 版本号易过时（本次 v1.21.0 未自动更新） | 部分（项目有 README） | 是（模板可加校验） | `TEMPLATE-UPGRADE-readme-version-check.md`（已存在，价值再印证） |
| 沙箱 PowerShell→Git Bash Win32 error 5 | 是（本机环境） | 否（环境问题，非方法论） | 无 |
| v1.22.0 `project-rules §2.6` 新骨架项需人工迁移 | 否（sync 设计如此，project-rules 不在同步清单） | 否 | 无（post-sync 已迁移） |

## 已生成的回流提案

- 本次无新增。
- `_proposals/TEMPLATE-UPGRADE-readme-version-check.md`、`TEMPLATE-UPGRADE-phase-overview-table.md` 仍在（经 CHANGELOG 核对未被模板采纳，保留待回流）。

## 后续动作

- `/run post-sync-cleanup`：进行中（本记录即其产物之一）——README 版本号修正 + 补「它能做什么 / 快速开始」、`project-rules §2.6` 迁移。
- `/run docs-system-audit`：可选（`ai/doc-standards/00-09` 本次无差异，撰写规范基线未变；既有 G1–G4 回梳另行处理）。
- 是否需要人工清理旧目录：否。
- 是否需要同步回模板仓库：2 提案待回流（非本次动作）。
