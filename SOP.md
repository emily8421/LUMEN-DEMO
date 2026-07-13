# SOP 索引

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 `ai-project-template` 的标准操作流程导航——**命令速查**（「我知道做啥 → 找命令 / 文档 / Prompt」），只回答“当前场景应该看哪里”，不重复完整命令。

> **与 `scenario-guides` 的分工（场景码对齐，互补不重复）**：
> - 本文件 = **命令速查**（找快捷命令 / 权威文档 / Prompt）。
> - `template-docs/scenario-guides.md` = **场景剧本**（「AI 带我做」：引导计划 + 做什么 / 为什么 / 机器执行）。
> - 两边用**同一套场景码**：A0–A21（使用者）/ C1–C8（维护者）/ M0–M1（元场景）。找命令看本文件；看完整剧本看 scenario-guides 对应码。

## 使用原则

- 不确定该走哪个场景、或想让 AI 先给引导计划再执行：用 `/run scenario`（见 `template-docs/scenario-guides.md` M1）。
- 若 PowerShell 下的 Git Bash 入口报错：先看 `template-docs/env-setup.md` 的脚本边界说明，不要默认判断为模板规则缺失。
- 操作步骤权威来源：`git-guide.md`；可复制给 AI 的 Prompt：`ai/prompts/README.md`；首次启动入口：`INIT-PROMPT.md`。
- 模板治理（提案 / PR / 版本）：`CONTRIBUTING.md`；版本记录：`CHANGELOG.md`；项目入口：`README.md`。
- 「要看什么 → 看哪」见下方**文档入口**表；「我做 X 该用什么命令」见**场景索引**，口语化决策见**常见选择**。

## 场景索引

### 操作场景（带场景码；完整剧本见 `scenario-guides.md` 对应码）

| 场景码 | 场景 | 快捷命令 | 权威操作文档 | 详细 Prompt | 备注 |
|---|---|---|---|---|---|
| M0 | 帮助 / 能力索引 / 角色选择 | `/run scenario` | `template-docs/scenario-guides.md` M0 | 无 | 不知道怎么问、想看能力列表时入口 |
| M1 | 任意场景意图 / 新手首次打开 AI CLI | `/run scenario` | `template-docs/scenario-guides.md` M1 | 无 | 先产出「做什么+为什么」引导计划，确认后再路由到具体 command |
| A0 | 冷启动（只有仓库链接） | 无 | `template-docs/scenario-guides.md` A0 | 无 | 零本地资产先 clone / new-project 拿到项目 |
| A1 | 第一次准备开发环境 | 无 | `template-docs/env-setup.md` | 无 | 先 `scripts/check-prereqs.ps1`，再决定 `scripts/bootstrap-dev-env.ps1` |
| A2 | 新建派生项目 | `/run new-project` | `git-guide.md` §6 | `ai/prompts/setup/14-new-project.md` | 推荐 `scripts/new-project.sh` 从 GitHub `main` 派生；不要手工复制模板目录 |
| A3 | 采集本机环境 | `/run collect-env` | `docs/env/README.md` | `ai/prompts/setup/13-collect-env.md` | 生成 `docs/env/local-env.md`，人工补齐确认项 |
| A4 | 准备输入材料 | `/run review-inputs` | `ai/document-lifecycle-rules.md` §3 | `ai/prompts/docs/01-review-inputs.md` | 原始材料统一放 `docs/inputs/` |
| A5 | 评审输入材料 | `/run review-inputs` | `ai/prompts/docs/01-review-inputs.md` | 同左 | Product Vision 就绪评估；不足先补齐复评 |
| A5.5 | 需求探索原型 | `/run ui-prototype-exploration` | `ai/prompts/docs/22-ui-prototype-exploration.md` | 同左 | 正式 `00-03` 定稿前用低保真原型澄清需求 |
| A6 | 生成文档骨架 | `/run generate-docs` | `README.md` 快速开始 | `ai/prompts/docs/00-generate-or-complete-docs.md` | 先说明阶段路线，再铺 `00-09` 骨架 |
| A7 | PLM 文档精修（含 A7.1–A7.7） | `/run edit-single-doc` | `ai/document-lifecycle-rules.md` §5 | `ai/prompts/docs/04-edit-single-doc.md` | 按 PLM 阶段精修；只改目标文档，不顺手扩需求 |
| A7.5 | UI 原型策略 / 实现前原型 | `/run edit-single-doc` | `ai/doc-standards/ui-prototype-strategy.md` | `ai/prompts/docs/04-edit-single-doc.md` | 已有需求链后、前端实现前确认可视化原型门禁 |
| A7.7 | 文档反向同步 | `/run sync-docs-from-code` | `ai/global-rules.md` §1 / §8 | `ai/prompts/docs/07-sync-docs-from-code.md` | 代码事实与 docs 不一致时，先补文档事实 |
| A8 | 文档评估 / 审计 / 检查 | `/run docs-evaluation` / `docs-system-audit` / `docs-checklist` | `ai/document-lifecycle-rules.md`、`ai/doc-standards/` | `ai/prompts/review/19-docs-evaluation.md` / `16-docs-system-audit.md` / `10-docs-checklist.md` | 评估判阶段、审计找断点、checklist 拦编码；旧项目可 fallback 到 `docs/_scaffold/` |
| A8.5 | 技术路线与环境支撑评估 | `/run tech-env-evaluation` | `ai/prompts/review/20-tech-env-evaluation.md` | 同左 | 真实运行依赖进入 Sprint 前评估本机环境 |
| A9 | 阶段规划与路线图 | 无 | `ai/implementation-lifecycle-rules.md` §3 | `ai/prompts/planning/19-plan-phases-and-sprints.md` | 分阶段 + 路线图（Demo → MVP → 产品） |
| A10 | 执行 Sprint / 任务 | `/run run-dev-task` | `ai/global-rules.md` §3、`docs/08-dev-plan.md` | `ai/prompts/dev/02-run-task.md` | 一个任务只做一个功能；编码后可做实现合规审查（`/run project-review`） |
| A10/C4 | 生成提交信息 | `/run commit-message` | `git-guide.md` §3 | `ai/prompts/git/06-commit-message.md` | 基于实际 diff 生成清晰 commit message |
| A10/C4 | GitHub 远端操作前预检 | 无 | `git-guide.md` §1.1 | 无 | push / PR / merge 前运行 `scripts/check-github-context.ps1` |
| A11 | Bug 修复 | `/run fix-bug` | `docs/08-dev-plan.md`、对应任务说明 | `ai/prompts/dev/05-fix-bug.md` | 先定位原因，再做最小修复 |
| A12 | Sprint 验收总结 | `/run sprint-summary` | `docs/08-dev-plan.md`、`docs/09-verification.md` | `ai/prompts/dev/09-sprint-summary.md` | 对照验收标准总结是否完成 |
| A13 | 派生项目同步模板 | `/run sync-methodology` | `git-guide.md` §5 | `ai/prompts/maintainers/12-sync-template.md` | 旧派生项目首次同步先 bootstrap 同步脚本；已同步没跑后续走同步后续接模式；根 `README.md` 不参与下行同步；同步后只做派生边界检查，不跑模板自检，用 `derived-sync-report-template.md` 留记录 |
| A13 | 同步后项目整理 | `/run post-sync-cleanup` | `docs/README.md`、`ai/project-rules.md`、`docs/env/local-env.md` | `ai/prompts/maintainers/15-post-sync-cleanup.md` | 同步方法论后，先出迁移计划，确认后再执行 |
| A13/C6 | 派生同步运行记录 | 无 | `template-docs/derived-sync-report-template.md` | `ai/prompts/maintainers/12-sync-template.md` | 记录命令、结果、问题、提案回流收口；长期记录存 `sync-records/template-sync/` |
| A14 | Phase 升级评估 | `/run phase-upgrade` | `docs/03-prd.md`、`ai/project-rules.md` §1 | `ai/prompts/planning/08-phase-upgrade.md` | 评估当前完成度，再草拟下一 Phase 边界 |
| A15 | 回流提案/反馈到模板 | `/run submit-proposal` / `/run submit-feedback` | `scenario-guides.md` A15 | `ai/prompts/maintainers/17-submit-proposal.md` / `18-submit-feedback.md` | 派生→模板开 issue（免 fork）；先去项目化+标来源 |
| A16 | 会话续接 / 中断恢复 | `/run resume` | `ai/session-rules.md` | 无 | 先读 `.ai/session-handoff.md` + Git 状态恢复；跨 CLI 一致 |
| A17 | 待确认事项总览 | `/run docs-open-items` | `ai/prompts/docs/21-docs-open-items.md` | 同左 | 汇总 open items；检查阶段 / 编码 / 升级门禁 |
| A18 | 专题方案讨论 | 无 | `ai/document-lifecycle-rules.md` §10.3 | `ai/prompts/docs/21` / `04` | 需求交互 / 技术选型 / 交互设计先多方案确认再回填 |
| A19 | 文档定稿门禁 | `/run docs-evaluation` / `docs-system-audit` / `docs-open-items` | `ai/prompts/review/19` / `16`、`ai/prompts/docs/21` | 同左 | 完整生成后做评估 + 审计 + open items 收口再编码 |
| A20 | 领域模板派生 | 无 | `template-docs/scenario-guides.md` A20、`template-docs/domain-templates.md` | 无 | 母模板 → 领域模板（可选中间层） |
| A21 | 查看演示效果 | `/run show-demo` | `ai/commands/show-demo.md`、`template-docs/demo-runbook-template.md` | 无 | 路由到项目演示 SOP；不替代 `09` 验收 |
| C1 | 模板优化提案汇总 | `/run template-proposal-summary` | `CONTRIBUTING.md` §4、`_proposals/README.md` | `ai/prompts/maintainers/11-template-proposal-summary.md` | 先提案，后改模板；完成后归档到 `_archive/proposals/` |
| C2 | 版本 bump 与发布 | 无 | `MAINTAINERS.md` §3、`CONTRIBUTING.md` §4 | 无 | VERSION / CHANGELOG + check + tag / Release |
| C3 | 模板自检 | 无 | `scripts/check-template.sh` | 无 | `check-template` 全过 |
| C4 | 维护分支→PR→合并→归档 | 无 | `git-guide.md` §3-4、`CONTRIBUTING.md` | 无 | 模板改动走分支 PR；合并后归档提案 |
| C4/C7 | 直接修改模板 | `/run template-proposal-summary` | `CONTRIBUTING.md` §3 / §7 | `ai/prompts/maintainers/11-template-proposal-summary.md` | 必须判断版本影响并更新 `VERSION` / CHANGELOG |
| C5 | 维护下行同步机制 | 无 | `git-guide.md` §5、`template-sync.json` | 无 | 改同步清单 / 脚本 + 加自检断言 |
| C6 | 派生同步验收（跨仓） | 无 | `scripts/check-derived-sync.sh`、`template-docs/derived-sync-report-template.md` | 无 | 跨仓验收派生同步；留运行记录 |
| C8 | 批量同步所有派生项目 | `bash scripts/sync-all-derived.sh` | `template-docs/scenario-guides.md` C8 | 无 | 发版后一条指令更新父目录下所有派生（先 `--dry-run`） |
| M1 | 新窗口续接任务 | `/run resume` | `ai/session-rules.md` | 无 | 先读 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`，再结合 Git 状态恢复 |

### 文档入口（要看什么 → 看哪；非操作场景）

| 要做什么 | 看哪 |
|---|---|
| 第一次使用模板 | `README.md`、`template-docs/beginner-guide.md`（先建立最小路径、文件边界和初始化顺序） |
| 第一次准备开发环境（A1） | `template-docs/env-setup.md`（先 check-prereqs 再 bootstrap） |
| 安装 AI CLI 工具（A1 的一部分） | `template-docs/ai-cli-setup.md`（`Claude CLI` / `Codex CLI` 安装 + 公司中转站衔接顺序） |
| 运行新手烟测 | `template-docs/smoke-test.md`（验证 Windows 下新手最小链路） |
| 记录新手烟测结果 | `template-docs/smoke-test-report-template.md`（统一格式记录结果与归因） |
| 想理解模板为什么这样设计 | `template-docs/template-methodology.md`（设计原则与边界） |
| 查术语什么意思 | `template-docs/glossary.md`（核心术语短定义 + 权威源指针） |

## 常见选择

> 纯文档路由（看什么）见上方**文档入口**表；本节只列带分支判断的常见决策。

- “我要开一个新项目” → 用 `/run new-project`。
- “我要把已有项目同步到最新模板” → 用 `/run sync-methodology`；旧派生项目先按 `git-guide.md` §5.2 bootstrap，拿到新版同步流程后继续完整 A13 闭环，不要停在同步提交；同步后用 `/run post-sync-cleanup`。
- “我已经同步了模板，只想补完后续闭环” → 用 `/run sync-methodology` 的同步后续接模式；不要重新 dry-run / commit，从 `check-derived-sync`、workflow 检查、`post-sync-cleanup`、`docs-system-audit`、项目验证建议和同步运行记录开始。
- “我已同步模板，想检查之前回流到模板 issue 的提案是否已处理并可归档” → 用 `/run sync-methodology` 的提案回流收口检查；扫描 `_proposals/`、`.ai/session-handoff.md`、`sync-records/template-sync/` 和 issue 链接后再判断。
- “我要 push / 创建 PR / 合并 PR，但不确定当前账号或仓库对不对” → 先运行 `powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1`，确认后再执行远端操作。
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
# push / PR / merge 前只读检查当前 GitHub 上下文
powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1
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

**权威性说明**：
- `.sh` 文件是**主实现 / 权威逻辑**，适用于 CI、Git Bash 和类 Unix 环境
- `.ps1` 文件是 **Windows 友好包装入口**，优先委托 Git Bash
- **完整权威检查**：Bash `check-template.sh` + CI（模板仓）
- **结构性兜底检查**：PowerShell native fallback（Git Bash 无法启动时最低保障）
- **等价性**：fallback 通过 ≠ 完整自检通过；发布前仍应以 CI 或 Bash 自检为准

远端建仓默认优先使用当前 `gh` 已登录账号；只有需要切换账号时，才显式传 `--account`。
