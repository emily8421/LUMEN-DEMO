# CONTRIBUTING —— 模板变更治理流程

本仓库 `ai-project-template` 是**活模板**：它的方法论（`ai/global-rules.md`、文档骨架、脚本等）会持续演进，并被各派生项目复用。为保证「一处改、处处可同步」且不污染派生项目的专属内容，所有模板改动都走统一的**分支 → PR → 评审 → 合并**流程。

## 0. 一句话原则

> 模板的方法论只在本仓库改；派生项目里发现的可通用优化，回流到本仓库走 PR，而不是就地改后手动回抄。

## 1. 什么算「模板改动」

需要回流 / 同步到所有派生项目的，才算模板改动。判断标准（与 `ai/global-rules.md` 通用层一致）：换到完全不同的项目上是否还成立——成立就属于模板，不成立就属于派生项目的 `ai/project-rules.md`。

典型模板改动：`ai/global-rules.md` 原则、`docs/` 骨架编号 / 结构、`INIT-PROMPT.md`、`ai/project-rules.md` 的**模板骨架**、`scripts/`、本治理流程、`git-guide.md`。

## 2. 禁止

- ❌ 直接 push 到 `main`（`main` 已开启分支保护，强制走 PR）。
- ❌ 在派生项目里修改 `ai/global-rules.md` 后手动回抄到模板——这会让两边版本漂移、无法审计。
- ❌ 把项目专属内容（具体技术栈 / REQ / 表 / 接口）写进模板。

## 3. 上行流程 A：直接改模板

```text
1. 从最新 main 切分支：change/<主题> 或 feat/<主题>
   （如 change/verification-09、feat/git-guide）
2. 改文件
   - 改 ai/global-rules.md：必须递增顶部「模板版本 vX.Y」，并在 README 版本记录登记
   - 非 global-rules 改动不触发版本号
3. 本地自测（脚本可跑、文档自洽）
4. push 分支，提 PR（自动套用 .github/pull_request_template.md 核对清单）
5. 评审要点：
   - 是否含项目专属内容（应剔除或留在 project-rules）
   - 是否触发版本号（global-rules 改动须已递增）
   - 是否影响下游、需下行同步哪些项目
6. 合并到 main（squash）
7. 下行同步到各进行中派生项目（见 §5）
```

## 4. 上行流程 B：派生项目归纳回流

在派生项目开发中沉淀出的可通用优化（积累规则、文档骨架改进、新支柱等），按此回流，**不要把方案长期留在派生项目根目录**：

```text
1. 在派生项目里把优化写成「去项目化」的提案（动机 / 拟改文件 / 是否触发版本号 / 影响面）
2. 到【模板仓库】开分支，把提案落成实际改动（不是把提案文档丢进模板）
3. 走 §3 的 PR 流程评审、合并
4. 合并后下行同步回原派生项目（及其他项目）
5. 删除派生项目里临时的提案文档（如 *-UPGRADE-*.md），改由「模板版本 vX.Y + git log」作为变更事实来源
```

> 示例：LUMEN 的 `TEMPLATE-UPGRADE-v1.4.md` 即按此回流——它在 LUMEN 里起草，最终以 PR 形式合入模板，同步后从 LUMEN 移除。

## 5. 下行同步（模板 → 项目）

见 README「方法论同步（模板 ⇄ 项目）」的文件清单。手动逐文件覆盖，或用 `bash scripts/sync-template.sh --commit`（先 `--dry-run`）。提交信息：`sync template vX.Y`。审计：在各项目 `grep「模板版本」` 比对。

## 6. 分支命名约定

| 前缀 | 用途 |
|---|---|
| `change/` | 方法论修订（如 global-rules 改动、骨架调整） |
| `feat/` | 新增（新脚本、新文档、新支柱） |
| `chore/` | 治理 / 基建本身（流程、模板、CI） |
| `fix/` | 修正模板自身错误 |

## 7. 版本号纪律

- 只有 `ai/global-rules.md` 内容变更才递增「模板版本 vX.Y」。
- 递增后在 README「版本记录」写一行（global-rules 改动点 + 同期非 global-rules 改动）。
- 脚本、文档骨架、本流程等改动**不**递增版本号，记录在下方「变更记录」。

## 8. 变更记录（模板治理类）

> 区别于 README 的 global-rules 版本记录，这里记治理 / 基建类变更。

- 2026-06-19：建立模板治理基建——`CONTRIBUTING.md`、`docs/git-guide.md`、`scripts/new-project.sh`、`scripts/sync-template.sh`、`.github/` PR / issue 模板；README 快速开始补「初始化 git」步、同步节扩为双向；`main` 开启分支保护。
- 2026-06-19：docs 结构修正——新增 `docs/vision/product-vision.md` 桩（v1.4 §5/§0 引用的愿景输入位，此前只有约定无脚手架）；`docs/git-guide.md` → 根目录 `git-guide.md`（与 CONTRIBUTING/INIT-PROMPT 同级，不再与 00-09 项目开发文档平级）。
