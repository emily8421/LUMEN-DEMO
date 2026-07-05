# MAINTAINERS

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件面向 `ai-project-template` 模板维护者——讲**维护者怎么干活**。普通派生项目使用者优先看 `README.md` 和 `template-docs/beginner-guide.md`，不用读本文件。

## 1. 你是谁

先分清角色，再动手：

- **模板维护者**（本文件读者）：维护 `ai-project-template` 仓库本身——方法论（`ai/`）、文档骨架（`docs/` 模板件）、脚本（`scripts/`）、治理与同步机制。改动走本仓库 PR。
- **使用者**：基于模板做派生项目开发。看 `README.md` + `template-docs/beginner-guide.md`，在派生项目里干活，不读本文件。
- **核心边界**：模板方法论只在**本仓库**修改。派生项目里发现的可通用优化，先在该项目 `_proposals/` 起草去项目化提案，再回流本仓库（派生项目同步时由 `/run sync-methodology` / `/run post-sync-cleanup` 自动归纳可回流点，机制见 `CONTRIBUTING.md` §2；上行流程见 §5），不在派生项目里改 `ai/global-rules.md` 后手动回抄。
- 所有模板改动走「提案 → 分支 → PR → 评审 → 合并 → 归档」，不直推 `main`，不在本地 `main` 先提交。

## 2. 改模板全流程（从想法到合并）

一个模板改动从提出到落地，固定走这几步：

```text
切维护分支 → 写/更新 TEMPLATE-UPGRADE-*.md 提案
  → 改文件 → 跑 check-template 自检
  → 更新 VERSION + CHANGELOG → push + 开 PR
  → 评审合并 → 归档提案 → 下行同步派生项目
```

要点：

- **先切分支再动手**：模板维护必须发生在维护分支上（`change/` / `feat/` / `chore/` / `fix/`），不得先在本地 `main` 提交后再补建分支。
- **提案先行**：先新增或更新 `TEMPLATE-UPGRADE-*.md`（动机 / 拟改 / 版本影响 / 影响面 / 验证），改的过程中持续补充，不要改完再回忆补。提案组织建议（沿用现有、同一 PR 合并一份）见 `CONTRIBUTING.md` §3.1。
- **影响下游就 bump 版本**：任何影响下游同步判断的合并都递增根目录 `VERSION` 并更新 `CHANGELOG.md`（版本规则见 `CONTRIBUTING.md` §4）。
- **长任务维护续接**：多提案或长任务按 `ai/session-rules.md` 维护本地续接文件（`.ai/session-handoff.md`）；真实续接文件不提交。
- **多会话并发**：多个 AI 会话同时操作本仓库时，各用独立 worktree（`git worktree add`），勿共用工作区——否则 commit 会落错分支。见 `git-guide.md` §4「多会话并发操作」。
- 完成后，已处理提案移到 `_archive/proposals/`，未处理或延后的留在 `_proposals/`。

## 3. 发布 Checklist

> **MINOR / MAJOR 发布前额外跑 L3 端到端回归**：`bash scripts/e2e-sync-check.sh` + 按 `template-docs/e2e-regression-checklist.md` 跑人工项（R4–R6）+ 用 `template-docs/e2e-report-template.md` 出报告确认。PATCH（仅文档 / 小修）可豁免。

每次发版前逐条过：

1. 先确认当前不在 `main` 直接改动；改动发生在维护分支上。
2. 创建或更新 `TEMPLATE-UPGRADE-*.md` 提案，完成后归档到 `_archive/proposals/`。
3. 判断版本影响，更新根目录 `VERSION`。
4. 更新 `CHANGELOG.md`，确保包含当前 `VERSION`。
5. 若新增 / 删除下行同步方法论文件，更新 `template-sync.json`；若改动 `docs/00-09` 撰写规范，确认 `check-template.sh` 的 doc-standards 镜像自检（`require_doc_standards_mirror`）通过。
6. 若改变用户入口，保持 `README.md` 的「快速开始」三入口可读，不塞入维护者细节。
7. 运行：`git diff --check`。
8. 运行：`bash scripts/check-template.sh`（或 `powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1`）。
9. push 分支并创建 PR，等待 GitHub Actions `Template Check` 通过后再合并。

## 4. 下行同步清单

`template-sync.json` 是下行同步清单的**事实来源**，`scripts/sync-template.sh` 优先读取它。维护规则：

- **只放跨项目复用的方法论文件**；不放项目专属内容（`ai/project-rules.md`、根 `README.md`、`docs/` 业务文档、业务代码）。
- **不放具体维护者账号**、个人邮箱、个人 Token 类型或本机私有备忘；这类内容只能留在本地忽略文件中。
- 同步 Markdown 文件必须在顶部包含 `Sync notice`，说明派生项目同步时可能被覆盖、不建议直接修改。
- 派生项目根 `README.md` 是项目专属文档，不参与模板下行同步；由 `scripts/new-project.sh` 初始化生成，项目自行维护。
- 新增方法论入口、脚本、规则文件时，必须同时更新 `template-sync.json` 和自检断言。
- `template-sync.json` 是完整清单权威；人读文档只维护分组摘要和维护规则，避免复制一份容易漂移的完整文件列表。
- 新增新手环境准备脚本或安装说明时，必须同时检查 `README.md`、`template-docs/` 下对应文档与 `SOP.md` 的入口是否一致。
- 删除同步文件时，必须确认派生项目旧版本同步脚本不会因此失败。
- `scripts/check-template.sh` / `.ps1` 只用于模板仓库完整性自检；派生项目同步验收用 `scripts/check-derived-sync.sh` / `.ps1`。
- `NEXT-STEPS.md` / `.ai/session-handoff.md` 是本地续接便签，不属于模板方法论文档；保持本地临时性，通过 `.gitignore` 排除，不进同步清单和正式提交。模板只同步 `ai/session-rules.md` 与 `template-docs/session-handoff.example.md`。
- 真实派生项目同步后的问题优先沉淀到 `template-docs/derived-sync-report-template.md` 运行记录；只有可通用于多个项目的问题，才去项目化转写为 `_proposals/TEMPLATE-UPGRADE-*.md` 回流。
- **批量同步**：维护者发新版后，可用 `scripts/sync-all-derived.sh <父目录> --dry-run|--commit` 一条指令更新父目录下所有派生项目（场景 C8）；默认 dry-run，工作区不干净 / 非派生 / 模板本体自动跳过。要 PR-per-project 可审计流程仍走 A13。

## 5. 自检与 CI

- **完整权威检查**：Bash `check-template.sh` + CI（模板仓）
- **结构性兜底检查**：PowerShell native fallback（Git Bash 无法启动时最低保障）
- **等价性**：fallback 通过 ≠ 完整自检通过；发布前仍应以 CI 或 Bash 自检为准

本地自检：
- 模板仓：`bash scripts/check-template.sh` 或 `powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1`
- 派生项目：`bash scripts/check-derived-sync.sh` 或 `powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1`

CI：`.github/workflows/template-check.yml` 在 PR 和 `main` push 上运行空白检查与模板自检。

`check-template.sh` 含 doc-standards 规范镜像自检（`require_doc_standards_mirror`）：在临时派生项目验证下行同步会生成 `ai/doc-standards/00-09`、项目事实 `docs/00-09` 不被覆盖、且 `check-derived-sync` 接受该同步提交。

自检可含结构性断言，不应过度绑定长文案；新增文案检查时优先选稳定关键词。

**新增关键机制时必须考虑防文档滞后断言**：脚本、Prompt、`README.md` / `SOP.md` / `MAINTAINERS.md` / `git-guide.md` 等人读入口中至少关键路径要有稳定关键词引用，避免「脚本已变、操作文档滞后」。

新增高频 Prompt 或 SOP 时，评估是否新增 / 更新 `ai/commands/` 快捷命令入口；命令文件只做路由，不复制大段 Prompt 正文。

Windows 下若 PowerShell 无法拉起 Git Bash，`check-template.ps1`、`sync-template.ps1`、`check-derived-sync.ps1` 都会明确标注 PowerShell fallback；fallback 也失败时，优先修本机 Git for Windows / MSYS 环境，不要把系统问题误判为模板同步缺口。

## 6. README 边界与派生 README 规范

### 模板仓库 README（根 `README.md`）

保持 `README.md` 轻量：回答项目是什么 + 它能做什么（能力）+ 快速开始（三入口）+ 当前版本 + 目录速览；不塞维护细节、完整版本历史、发布 checklist、同步清单维护细节、治理长说明。

### 派生项目 README（项目专属，**不同步**）

派生项目根 `README.md` 由 `scripts/new-project.sh` 生成初版，项目自行维护（不参与下行同步）。规范结构（对齐模板 README，但内容是派生项目自己的）：

1. 项目名称 + 简介（2-3 句：项目是什么、解决什么）
2. 它能做什么（**项目自己的能力**，不是模板的通用能力）
3. 快速开始（如何启动 / 运行本项目）
4. 当前阶段（Phase + 交付物形态 Demo/MVP/产品）
5. 目录速览（本项目关键路径）
6. 文档入口（`docs/00-09` 指针）
7. 模板关系（基于 `ai-project-template`，`VERSION`）

约束：

- 不照搬模板 README 的通用能力段（派生写自己的项目能力）。
- 保留「模板关系 + VERSION」（追溯同步版本）。
- `new-project.sh` 生成初版（含占位，提示项目填写）；sync 不覆盖（项目专属）。

### 派生项目 CI（项目专属，**不同步**）

模板仓 `.github/workflows/template-check.yml` 只用于模板仓自身，会运行 `scripts/check-template.sh`。派生项目普通 PR 不应继承该 workflow，否则可能被模板仓 README、占位文档或提案收件箱规则误拦截。

`scripts/new-project.sh` 会生成派生项目版 `.github/workflows/project-check.yml`：普通 PR / push 保留 `git diff --check`；仅当最新提交信息匹配 `sync template vX.Y.Z from ai-project-template` 时，运行 `scripts/check-derived-sync.sh HEAD`。旧派生项目若仍保留 `.github/workflows/template-check.yml`，应在同步后整理中迁移或禁用模板仓自检步骤。

## 7. 文档分区维护

`docs/README.md` 是派生项目内文档分区规则。维护该文件时遵守：

- `docs/` 根目录只放 `00-09` 核心文档和 `README.md`。
- 用户原始输入统一先放 `docs/inputs/`；经评审、补齐和确认后的产品愿景叙事放 `docs/vision/`。
- 子系统详细设计放 `docs/design/`。
- 决策记录放 `docs/decisions/`。
- 调研 / 实验 / 运行环境 / 会议记录分别放对应子目录。
- 历史归档放 `docs/archive/`。
- `ai/doc-standards/`（v1.20.0+）是模板 `00-09` 撰写规范的只读镜像，随模板同步刷新，不作为项目事实、不直接驱动开发；旧项目可能残留 `docs/_scaffold/`。
- AI 需要新增文档时，必须先判断文档类型；不确定则先提议路径并等待人工确认。
