# SOP 索引

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `ai-project-template` 的标准操作流程导航——**命令速查**（「我知道做啥 → 找命令 / 文档 / Prompt」），只回答“当前场景应该看哪里”，不重复完整命令。

> **与 `scenario-guides` 的分工（场景码对齐，互补不重复）**：
> - 本文件 = **命令速查**（找快捷命令 / 权威文档 / Prompt）。
> - `template-docs/scenario-guides.md` = **场景剧本**（「AI 带我做」：引导计划 + 做什么 / 为什么 / 机器执行）。
> - 两边用**同一套场景码**：A0–A14（使用者）/ C1–C7（维护者）/ M1（元场景）。找命令看本文件；看完整剧本看 scenario-guides 对应码。

## 使用原则

- 不确定该走哪个场景、或想让 AI 先给引导计划再执行：用 `/run scenario`（见 `template-docs/scenario-guides.md` M1）。
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

### 操作场景（带场景码；完整剧本见 `scenario-guides.md` 对应码）

| 场景码 | 场景 | 快捷命令 | 权威操作文档 | 详细 Prompt | 备注 |
|---|---|---|---|---|---|
| M1 | 任意场景意图 / 新手首次打开 AI CLI | `/run scenario` | `template-docs/scenario-guides.md` | 无 | 先产出「做什么+为什么」引导计划，确认后再路由到具体 command |
| A1 | 第一次准备开发环境 | 无 | `template-docs/env-setup.md` | 无 | 先运行 `scripts/check-prereqs.ps1`，再决定是否运行 `scripts/bootstrap-dev-env.ps1` |
| A2 | 新建派生项目 | `/run new-project` | `git-guide.md` §6 | `ai/prompts/setup/14-new-project.md` | 推荐 `scripts/new-project.sh` 从 GitHub `main` 派生；不要手工复制模板目录 |
| A3 | 采集本机环境 | `/run collect-env` | `docs/env/README.md` | `ai/prompts/setup/13-collect-env.md` | 生成 `docs/env/local-env.md`，人工补齐确认项 |
| A5/A6 | 新项目初始化 docs | `/run review-inputs` / `/run generate-docs` | `README.md` 快速开始 | `ai/prompts/docs/01-review-inputs.md` / `ai/prompts/docs/00-generate-or-complete-docs.md` | 输入不确定先评审，再生成 / 补齐文档体系 |
| A7 | 单文档修订 | `/run edit-single-doc` | `ai/global-rules.md` §8 | `ai/prompts/docs/04-edit-single-doc.md` | 只改目标文档，不顺手扩需求 |
| A7.7 | 文档反向同步 | `/run sync-docs-from-code` | `ai/global-rules.md` §1 / §8 | `ai/prompts/docs/07-sync-docs-from-code.md` | 代码事实与 docs 不一致时，先补文档事实 |
| A8 | 项目文档成型后回溯审计 | `/run docs-system-audit` | `ai/document-lifecycle-rules.md`、`ai/doc-standards/` | `ai/prompts/review/16-docs-system-audit.md` | 回溯审视 PLM 链路合理性、可行性与一致性，先出报告不改文件；旧项目可 fallback 到 `docs/_scaffold/` |
| A8/A10 | 项目 / 实现审查 | `/run project-review` / `/run docs-checklist` | `ai/global-rules.md` §4 | `ai/prompts/review/03-project-review.md` / `ai/prompts/review/10-docs-checklist.md` | 前者用于通用审查；后者用于 docs/03-09 生成后验收 |
| A10 | 执行单个 Sprint / 任务 | `/run run-dev-task` | `ai/global-rules.md` §3、`docs/08-dev-plan.md` | `ai/prompts/dev/02-run-task.md` | 一个任务只做一个功能，避免跨范围改动 |
| A10/C4 | 生成提交信息 | `/run commit-message` | `git-guide.md` §3 | `ai/prompts/git/06-commit-message.md` | 基于实际 diff 生成清晰 commit message |
| A11 | Bug 修复 | `/run fix-bug` | `docs/08-dev-plan.md`、对应任务说明 | `ai/prompts/dev/05-fix-bug.md` | 先定位原因，再做最小修复 |
| A12 | Sprint 验收总结 | `/run sprint-summary` | `docs/08-dev-plan.md`、`docs/09-verification.md` | `ai/prompts/dev/09-sprint-summary.md` | 对照验收标准总结是否完成 |
| A13 | 派生项目同步模板 | `/run sync-methodology` | `git-guide.md` §5 | `ai/prompts/maintainers/12-sync-template.md` | 先判定同步路径；根 `README.md` 不参与下行同步；同步后只做派生边界检查，不跑模板自检，并用 `template-docs/derived-sync-report-template.md` 留运行记录 |
| A13 | 同步后项目整理 | `/run post-sync-cleanup` | `docs/README.md`、`ai/project-rules.md`、`docs/env/local-env.md` | `ai/prompts/maintainers/15-post-sync-cleanup.md` | 同步方法论后，先出迁移计划，确认后再执行 |
| A13/C6 | 派生同步运行记录 | 无 | `template-docs/derived-sync-report-template.md` | `ai/prompts/maintainers/12-sync-template.md` | 真实同步后记录命令、结果、问题和可回流优化点；项目事实留在派生项目，回流提案必须去项目化 |
| A14 | Phase 升级评估 | `/run phase-upgrade` | `docs/03-prd.md`、`ai/project-rules.md` §1 | `ai/prompts/planning/08-phase-upgrade.md` | 评估当前完成度，再草拟下一 Phase 边界 |
| A15 | 回流提案/反馈到模板 | `/run submit-proposal` / `/run submit-feedback` | `scenario-guides.md` A15 | `ai/prompts/maintainers/17-submit-proposal.md` / `18-submit-feedback.md` | 派生→模板开 issue（免 fork）；先去项目化+标来源 |
| C1 | 模板优化提案汇总 | `/run template-proposal-summary` | `CONTRIBUTING.md` §4、`_proposals/README.md` | `ai/prompts/maintainers/11-template-proposal-summary.md` | 先提案，后改模板；完成后归档到 `_archive/proposals/` |
| C4/C7 | 直接修改模板 | `/run template-proposal-summary` | `CONTRIBUTING.md` §3 / §7 | `ai/prompts/maintainers/11-template-proposal-summary.md` | 必须判断版本影响并更新 `VERSION` / README 版本记录 |
| C8 | 批量同步所有派生项目 | `bash scripts/sync-all-derived.sh` | `scenario-guides.md` C8 | 无 | 发版后一条指令更新父目录下所有派生（先 `--dry-run` 预览） |
| M1 | 新窗口续接任务 | 无 | `ai/session-rules.md` | 无 | 先读 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`，再结合 Git 状态恢复 |

### 文档入口（要看什么 → 看哪；非操作场景）

| 要做什么 | 看哪 |
|---|---|
| 第一次使用模板 | `README.md`、`template-docs/beginner-guide.md`（先建立最小路径、文件边界和初始化顺序） |
| 安装 AI CLI 工具（A1 的一部分） | `template-docs/ai-cli-setup.md`（`Claude CLI` / `Codex CLI` 安装 + 公司中转站衔接顺序） |
| 运行新手烟测 | `template-docs/smoke-test.md`（验证 Windows 下新手最小链路） |
| 记录新手烟测结果 | `template-docs/smoke-test-report-template.md`（统一格式记录结果与归因） |
| 想理解模板为什么这样设计 | `template-docs/template-methodology.md`（设计原则与边界） |

## 常见选择

- “我不确定该用哪个命令 / 我想让 AI 带我一步步做” → 用 `/run scenario`，AI 按 `template-docs/scenario-guides.md` 先给引导计划再执行。
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

## 常用命令

### 派生项目使用者

```bash
# 检查新手环境前置项
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
# 一键安装基础开发环境
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1
# 新建正式项目（默认创建远端仓库；需要 gh auth login）
bash scripts/new-project.sh my-demo --visibility private
bash scripts/new-project.sh my-demo --account <GitHub账号> --visibility private
# 派生项目同步模板方法论（在派生项目仓库运行；v1.6.8+ 后续同步）
powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit
powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
```

旧项目首次同步见 `git-guide.md` §5；派生项目同步验收使用 `check-derived-sync`，不要用完整模板自检替代。真实派生同步完成后，建议用 `template-docs/derived-sync-report-template.md` 记录同步运行结果。

### 模板维护者

```bash
# 新建本地烟测项目（只用于验证模板链路，不是正式项目起步默认命令）
bash scripts/new-project.sh smoke-demo --local --no-remote
# 模板仓库完整性自检（仅在 ai-project-template 模板仓库运行）
powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1
# Bash 完整自检入口（CI 使用同类路径）
bash scripts/check-template.sh
```

### Windows 脚本入口选择

| 入口 | 运行位置 | Git Bash 依赖 | 失败时优先排查 |
|---|---|---|---|
| `scripts/check-template.ps1` | 模板仓库 | 可 fallback 到 PowerShell 结构检查 | 若 Bash 启动失败，先看输出中的 fallback 结果 |
| `scripts/sync-template.ps1` | 派生项目仓库 | 优先 Git Bash；失败时可 PowerShell fallback | 输出中的 fallback 标识；若 fallback 也失败再修 Git for Windows / MSYS |
| `scripts/check-derived-sync.ps1` | 派生项目仓库 | 优先 Git Bash；失败时可 PowerShell fallback | 输出中的 fallback 标识；若 fallback 也失败再修 Git for Windows / MSYS |

远端建仓默认优先使用当前 `gh` 已登录账号；只有需要切换账号时，才显式传 `--account`。
