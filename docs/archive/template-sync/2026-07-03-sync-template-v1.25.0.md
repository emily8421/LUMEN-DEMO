# 派生同步运行记录 — sync template v1.25.0

## 基本信息

- 项目：LUMEN（KnowledgeBase Demo）
- 同步日期：2026-07-03
- 同步前模板版本：v1.23.6
- 目标模板版本：v1.25.0
- 同步分支：`chore/sync-template-v1.25.0`
- 操作入口：`/run sync-methodology`（走 `scripts/sync-template.sh` Git Bash 路径）
- AI 工具 / CLI：Claude Code

## 执行命令

- bootstrap（脚本自更新保护触发，本地 `sync-template.sh` 非远端最新版）：
  - `git checkout FETCH_HEAD -- scripts/sync-template.sh && git add && git commit -m "chore: bootstrap latest sync script"`（单独提交 `f71d24a`）
- dry-run：`bash scripts/sync-template.sh --dry-run`
- commit：`bash scripts/sync-template.sh --commit`（提交 `d8a5c0d`，message 由脚本生成 `sync template v1.25.0 from ai-project-template`）
- check-derived-sync：`bash scripts/check-derived-sync.sh`（HEAD = sync commit）
- 是否触发 PowerShell fallback（sync / check）：**否**，Git Bash 可用，全程走 `sync-template.sh` / `check-derived-sync.sh`
- post-sync-cleanup：审计完成，迁移计划见下文「后续动作」

## 同步结果

- 是否成功：✅ 成功；`check-derived-sync` 通过（所有变更在 `template-sync.json` 清单内或 `ai/doc-standards/*` 放行，无保护文件被碰）
- 新增 / 修改的方法论文件（Δ）：
  - 新增：`ai/commands/submit-{proposal,feedback}.md`、`ai/prompts/maintainers/{17-submit-proposal,18-submit-feedback}.md`、`scripts/{sync-all-derived,e2e-sync-check}.sh`、`template-docs/e2e-{regression-checklist,report-template}.md`（v1.25.0 `derived-feedback-channel` 落地产物 + v1.24.1 测试基础设施）
  - 更新：`VERSION`、`CHANGELOG.md`、`MAINTAINERS.md`、`ai/{global-rules,document-lifecycle-rules,session-rules}.md`、`ai/commands/README.md`、`SOP.md`、`INIT-PROMPT.md`、`ai/prompts/maintainers/11-template-proposal-summary.md`、`git-guide.md`、`scripts/{check-template.sh,check-derived-sync.{sh,ps1}}`、`template-docs/scenario-guides.md`、`template-sync.json`
- 项目专属文件是否被误改：**否**（`README.md` / `ai/project-rules.md` / `docs/00-09` / 业务代码均未出现在 sync commit）
- 是否新增 / 刷新 `ai/doc-standards/00-09`：是，commit 阶段对 10 份镜像全部 checkout；实际内容仅 `ai/doc-standards/03-prd.md` 有实质 delta（v1.24.2 phase-overview-table 双维度总览表推荐），其余无差异
- 是否残留旧 `docs/_scaffold/`：否（项目无该旧目录）

## 遇到的问题

- **脚本自更新保护**：dry-run 首次因本地 `sync-template.sh` 非远端最新版而停止；按提示 bootstrap 最新脚本单独提交后通过。属预期路径（git-guide §5.2 / §5.5）。
- **工作区不干净**：同步前工作区有 `NEXT-STEPS.md`（handoff，tracked+modified）+ 未跟踪提案。因 `check-derived-sync` 对 tracked 未提交改动会 FAIL，已 `git stash push -- NEXT-STEPS.md` 暂存 handoff；未跟踪提案被 check 忽略不阻塞，sync commit 用 `-- <files>` 限定不会误带。sync 后恢复 stash 重写 handoff。
- Git / gh / 网络：无异常（模板仓库 public，fetch 免认证）。
- LF→CRLF warning：Git 在 temp diff 与 doc-standards 镜像写入时提示，不影响 sync（遵循仓库 autocrlf 设置）。

## 可优化点归纳

| 问题 | 是否项目专属 | 是否建议回流模板 | 建议提案 |
|---|---|---|---|
| `check-derived-sync` 的 README 版本号告警已生效，但 sync 后仍需人工改 README（README 受保护、sync 不碰） | 否（所有派生通用） | 否（v1.24.3 已落地该告警，设计即「非阻断 + 人工核对」，属预期） | 无 |
| `sync-template.sh` commit 阶段对 `ai/doc-standards/00-09` 全部 checkout（即使无差异），diff stat 噪声 | 否 | 候选（可优化为仅写有 delta 的镜像） | 暂不（影响小，且保证镜像与模板一致） |

## 已生成的回流提案

- 本次无新模板回流提案（同步顺利，暴露的可优化点要么已落地、要么影响小暂不回流）。

## 已归档提案（SOP §13）

本次同步已拿到对应模板版本，归档 3 个已采纳提案到 `_archive/proposals/`：

| 提案 | 采纳版本 | 落地说明 |
|---|---|---|
| `TEMPLATE-UPGRADE-phase-overview-table.md` | v1.24.2 | global-rules §8.1 + docs/03 §3 双维度总览表推荐 |
| `TEMPLATE-UPGRADE-readme-version-check.md` | v1.24.3 | check-derived-sync 非阻断 README 版本号告警 |
| `TEMPLATE-UPGRADE-derived-feedback-channel.md` | v1.25.0 | §9 来源标识 + submit-proposal/submit-feedback + Issue 模板 |

## 后续动作

- **post-sync-cleanup**（按 git-guide §5.5 另开分支，不混入 sync 提交）：审计结论——项目结构干净，**唯一迁移项 = 根 `README.md` 3 处模板版本号 `v1.23.6` → `v1.25.0`**（第 5/87/90 行；check-derived-sync 已告警）。docs 分区、`docs/env/local-env.md`、`ai/project-rules.md §2.5/§2.6` 均合规，无骨架项需迁移。
- 推送 `chore/sync-template-v1.25.0` + 开 PR；合入后基于 main 开 cleanup 分支修 README 版本号。
- 可选：`/run docs-system-audit` 用刷新后的 `ai/doc-standards` 规范基线回溯审计 PLM 链路（非必须，G4/G5 文档工作另行规划）。
