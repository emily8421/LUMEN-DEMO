# SOP 索引

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `ai-project-template` 的标准操作流程导航。它只回答“当前场景应该看哪里”，不重复完整命令。

## 使用原则

- 新手第一次使用模板：先看 `README.md` 与 `template-docs/beginner-guide.md`。
- 新手第一次准备开发环境：看 `template-docs/env-setup.md`，先检测再安装。
- 要单独安装 `Claude CLI` / `Codex CLI`：看 `template-docs/ai-cli-setup.md`。
- 要验证新手最小链路：看 `template-docs/smoke-test.md`。
- 要留痕一轮烟测结果：看 `template-docs/smoke-test-report-template.md`。
- 需要理解模板方法论与设计边界：看 `template-docs/template-methodology.md`。
- 若 PowerShell 下的 Git Bash 入口报错：先看 `template-docs/env-setup.md` 的脚本边界说明，不要默认判断为模板规则缺失。
- 操作步骤权威来源：`git-guide.md`。
- 可复制给 AI 执行的 Prompt：`INIT-PROMPT.md` 索引与 `ai/prompts/`。
- 模板治理规则：`CONTRIBUTING.md`。
- 项目快速入口：`README.md`；完整版本记录：`CHANGELOG.md`。

## 场景索引

| 场景 | 快捷命令 | 权威操作文档 | 详细 Prompt | 备注 |
|---|---|---|---|---|
| 第一次使用模板 | `/run new-project` | `README.md`、`template-docs/beginner-guide.md` | `ai/prompts/setup/14-new-project.md` | 先建立最小路径、文件边界和初始化顺序 |
| 第一次准备开发环境 | 无 | `template-docs/env-setup.md` | 无 | 先运行 `scripts/check-prereqs.ps1`，再决定是否运行 `scripts/bootstrap-dev-env.ps1` |
| 安装 AI CLI 工具 | 无 | `template-docs/ai-cli-setup.md` | 无 | 用于单独处理 `Claude CLI` / `Codex CLI` 安装，以及与公司中转站配置的衔接顺序 |
| 运行新手烟测 | 无 | `template-docs/smoke-test.md` | 无 | 用于验证 Windows 下的新手最小链路是否真的可跑通 |
| 记录新手烟测结果 | 无 | `template-docs/smoke-test-report-template.md` | 无 | 用统一格式记录每一步结果和问题归因 |
| 想理解模板为什么这样设计 | 无 | `template-docs/template-methodology.md` | 无 | 面向模板维护者或想理解方法论的人 |
| 新建派生项目 | `/run new-project` | `git-guide.md` §2 | `ai/prompts/setup/14-new-project.md` | 推荐 `scripts/new-project.sh` 从 GitHub `main` 派生；不要手工复制模板目录 |
| 新项目初始化 docs | `/run review-inputs` / `/run generate-docs` | `README.md` 快速开始 | `ai/prompts/docs/01-review-inputs.md` / `ai/prompts/docs/00-generate-or-complete-docs.md` | 输入不确定先评审，再生成 / 补齐文档体系 |
| 采集本机环境 | `/run collect-env` | `docs/env/README.md` | `ai/prompts/setup/13-collect-env.md` | 生成 `docs/env/local-env.md`，人工补齐确认项 |
| 执行单个 Sprint / 任务 | `/run run-dev-task` | `ai/global-rules.md` §3、`docs/08-dev-plan.md` | `ai/prompts/dev/02-run-task.md` | 一个任务只做一个功能，避免跨范围改动 |
| 项目 / 实现审查 | `/run project-review` / `/run docs-checklist` | `ai/global-rules.md` §4 | `ai/prompts/review/03-project-review.md` / `ai/prompts/review/10-docs-checklist.md` | 前者用于通用审查；后者用于 docs/03-09 生成后验收 |
| 单文档修订 | `/run edit-single-doc` | `ai/global-rules.md` §8 | `ai/prompts/docs/04-edit-single-doc.md` | 只改目标文档，不顺手扩需求 |
| Bug 修复 | `/run fix-bug` | `docs/08-dev-plan.md`、对应任务说明 | `ai/prompts/dev/05-fix-bug.md` | 先定位原因，再做最小修复 |
| 文档反向同步 | `/run sync-docs-from-code` | `ai/global-rules.md` §1 / §8 | `ai/prompts/docs/07-sync-docs-from-code.md` | 代码事实与 docs 不一致时，先补文档事实 |
| Phase 升级评估 | `/run phase-upgrade` | `docs/03-prd.md`、`ai/project-rules.md` §1 | `ai/prompts/planning/08-phase-upgrade.md` | 评估当前完成度，再草拟下一 Phase 边界 |
| Sprint 验收总结 | `/run sprint-summary` | `docs/08-dev-plan.md`、`docs/09-verification.md` | `ai/prompts/dev/09-sprint-summary.md` | 对照验收标准总结是否完成 |
| 派生项目同步模板 | `/run sync-methodology` | `git-guide.md` §5 | `ai/prompts/maintainers/12-sync-template.md` | 先判定同步路径；根 `README.md` 不参与下行同步；同步后只做派生边界检查，不跑模板自检，并用 `template-docs/derived-sync-report-template.md` 留运行记录 |
| 派生同步运行记录 | 无 | `template-docs/derived-sync-report-template.md` | `ai/prompts/maintainers/12-sync-template.md` | 真实同步后记录命令、结果、问题和可回流优化点；项目事实留在派生项目，回流提案必须去项目化 |
| 同步后项目整理 | `/run post-sync-cleanup` | `docs/README.md`、`ai/project-rules.md`、`docs/env/local-env.md` | `ai/prompts/maintainers/15-post-sync-cleanup.md` | 同步方法论后，先出迁移计划，确认后再执行 |
| 项目文档成型后回溯审计 | `/run docs-system-audit` | `ai/document-lifecycle-rules.md`、`ai/doc-standards/` | `ai/prompts/review/16-docs-system-audit.md` | 回溯审视 PLM 链路合理性、可行性与一致性，先出报告不改文件；旧项目可 fallback 到 `docs/_scaffold/` |
| 模板优化提案汇总 | `/run template-proposal-summary` | `CONTRIBUTING.md` §4、`_proposals/README.md` | `ai/prompts/maintainers/11-template-proposal-summary.md` | 先提案，后改模板；完成后归档到 `_archive/proposals/` |
| 直接修改模板 | `/run template-proposal-summary` | `CONTRIBUTING.md` §3 / §7 | `ai/prompts/maintainers/11-template-proposal-summary.md` | 必须判断版本影响并更新 `VERSION` / README 版本记录 |
| 生成提交信息 | `/run commit-message` | `git-guide.md` §3 | `ai/prompts/git/06-commit-message.md` | 基于实际 diff 生成清晰 commit message |
| 新窗口续接任务 | 无 | `ai/session-rules.md` | 无 | 先读 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`，再结合 Git 状态恢复 |

## 常见选择

- “我是第一次用这套模板” → 先看 `README.md` 与 `template-docs/beginner-guide.md`，再用 `/run new-project`。
- “我的机器还没装好开发环境” → 先看 `template-docs/env-setup.md`，再运行 `scripts/check-prereqs.ps1`。
- “我要单独安装 Claude CLI 或 Codex CLI” → 看 `template-docs/ai-cli-setup.md`。
- “我要验证一个新手能不能从零跑通这套模板” → 看 `template-docs/smoke-test.md`。
- “我要把烟测结果记下来，方便后续修模板” → 看 `template-docs/smoke-test-report-template.md`。
- “我想知道这套模板为什么这么分层” → 看 `template-docs/template-methodology.md`。
- “我要开一个新项目” → 用 `/run new-project`。
- “我要把已有项目同步到最新模板” → 用 `/run sync-methodology`；同步后用 `/run post-sync-cleanup`。
- “我要让 AI 生成文档体系” → 输入不确定先用 `/run review-inputs`；评审通过后用 `/run generate-docs`。
- “我要改模板本身” → 先看 `CONTRIBUTING.md`，先写 `TEMPLATE-UPGRADE-*.md` 提案；已有提案时用 `/run template-proposal-summary`。
- “我重新打开了 CLI 窗口” → 先按 `ai/session-rules.md` 读取 `.ai/session-handoff.md` / `NEXT-STEPS.md` 和 Git 状态。
