# CONTRIBUTING —— 模板变更治理流程

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


本仓库 `ai-project-template` 是**活模板**：它的方法论（`ai/global-rules.md`、文档骨架、脚本等）会持续演进，并被各派生项目复用。为保证「一处改、处处可同步」且不污染派生项目的专属内容，所有模板改动都走统一的**提案 → 分支 → PR → 评审 → 合并 → 归档**流程。

## 0. 一句话原则

> 模板的方法论只在本仓库改；任何模板修改先落提案，完成后归档；派生项目里发现的可通用优化，回流到本仓库走 PR，而不是就地改后手动回抄。

## 1. 什么算「模板改动」

需要回流 / 同步到所有派生项目的，才算模板改动。判断标准（与 `ai/global-rules.md` 通用层一致）：换到完全不同的项目上是否还成立——成立就属于模板，不成立就属于派生项目的 `ai/project-rules.md`。

典型模板改动：`ai/global-rules.md` 原则、`docs/` 骨架编号 / 结构、`INIT-PROMPT.md`、`ai/project-rules.md` 的**模板骨架**、`scripts/`、本治理流程、`git-guide.md`。

## 2. 禁止

- ❌ 直接 push 到 `main`（`main` 已开启分支保护，强制走 PR）。
- ❌ 在派生项目里修改 `ai/global-rules.md` 后手动回抄到模板——这会让两边版本漂移、无法审计。
- ❌ 把项目专属内容（具体技术栈 / REQ / 表 / 接口）写进模板。
- ❌ 未形成 `TEMPLATE-UPGRADE-*.md` 提案就直接修改模板文件。

## 2.5 模板 ↔ 派生：双向闭环

模板方法论在「模板仓库」与「派生项目」间双向流动，两方向互补、构成闭环：

- **上行·改进**：派生项目发现可通用优化 → 在本项目 `_proposals/` 起草 `TEMPLATE-UPGRADE-*.md` → 回到模板仓库提交到 `_proposals/` 收件箱 → 模板 PR 合并 → 提案归档 → 模板演进。
- **下行·对齐**：派生项目执行 `scripts/sync-template.sh` → 拉取模板最新方法论覆盖本地同步清单 → 按项目提交记录审计版本。

只有上行没有下行，模板改了但派生项目拿不到；只有下行没有上行，模板不会吸收派生项目经验。两者缺一不可。

## 3. 上行流程 A：直接改模板

```text
1. 先新增或确认已有 TEMPLATE-UPGRADE-*.md 提案，说明动机、拟改、版本影响、影响面和验证方式。
2. 从最新 main 切分支：change/<主题> 或 feat/<主题>
   （如 change/verification-09、feat/git-guide）
3. 改文件，并按 §7 判断是否递增根目录 VERSION。
4. 本地自测（脚本可跑、文档自洽）。
5. 将已处理提案移动到 `_archive/proposals/`；未处理或延后处理的提案留在 `_proposals/`。
6. push 分支，提 PR（自动套用 .github/pull_request_template.md 核对清单）
7. 评审要点：
   - 是否含项目专属内容（应剔除或留在 project-rules）
   - 是否有提案记录与归档计划
   - 是否按三段式规则更新 VERSION 与 README 版本记录
   - 是否影响下游、需下行同步哪些项目
8. 合并到 main（squash）
9. 下行同步到各进行中派生项目（见 §5）
```

## 4. 上行流程 B：派生项目归纳回流

在派生项目开发中沉淀出的可通用优化（积累规则、文档骨架改进、新支柱等），按此回流，**不要把方案长期停留在派生项目根目录**：

```text
1. 在派生项目 `_proposals/` 中把优化写成「去项目化」提案：TEMPLATE-UPGRADE-*.md
   （动机 / 拟改文件 / 版本影响 / 影响面 / 验证方式），可选附 TEMPLATE-UPGRADE-*-patch.md
2. 到【模板仓库】开分支，把提案文件提交到模板仓库 `_proposals/` 收件箱（临时记录）
3. 模板维护者使用 INIT-PROMPT.md「模板优化汇总」读取 `_proposals/` 全部提案，输出去重 / 冲突 / 依赖分析与优化计划
4. 按优化计划修改模板文件，走 §3 的 PR 流程评审、合并
5. 合并后下行同步回原派生项目（及其他项目）
6. 派生项目里已处理的提案可移动到项目历史记录或删除；模板仓库 `_proposals/` 中已处理提案必须归档到 `_archive/proposals/`，变更事实以根目录 `VERSION`、README 版本记录和 git log 为准
```

提案与 patch 的分工：

- **`TEMPLATE-UPGRADE-*.md`** = WHY / WHAT：去项目化说明动机、拟改、版本影响与影响面，给评审者决策。
- **`TEMPLATE-UPGRADE-*-patch.md`** = HOW：可选但推荐，记录基于当前模板版本的 old→new 修改建议，给执行者合并落地。

> 示例：LUMEN 的 `TEMPLATE-UPGRADE-v1.4.md` 即按此回流——它在 LUMEN 里起草，最终以 PR 形式合入模板，同步后从 LUMEN 移除。

## 5. 下行同步（模板 → 项目）

操作 SOP 以 `git-guide.md` §5 为准；README「方法论同步（模板 ⇄ 项目）」记录同步文件清单，`INIT-PROMPT.md` §12 提供可复制给 AI 执行的 Prompt。提交信息：`sync template vX.Y.Z`。审计：比对各项目根目录 `VERSION`。

> 注：`sync-template.sh` 是**下行获取**：派生项目拉取模板最新方法论并覆盖本地同步清单；派生项目是接收方，不会修改模板仓库。模板的改进只通过 §3 / §4 的模板仓库 PR 产生。

## 6. 分支命名约定

| 前缀 | 用途 |
|---|---|
| `change/` | 方法论修订（如 global-rules 改动、骨架调整） |
| `feat/` | 新增（新脚本、新文档、新支柱） |
| `chore/` | 治理 / 基建本身（流程、模板、CI） |
| `fix/` | 修正模板自身错误 |

## 7. 版本号纪律

- 模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。
- 每个会影响下游同步判断的模板 PR 合并前，都必须判断是否递增 `VERSION`；多个小改可合并为同一个版本发布。
- `MAJOR`：文档编号体系、核心流程、同步机制发生不兼容变化。
- `MINOR`：新增模板能力、初始化流程新增必填项、新增同步文件、文档骨架新增章节。
- `PATCH`：文案修正、Prompt 小修、自检增强、兼容性脚本修复。
- 递增版本后，必须在 README「版本记录」新增对应条目，并保持 `VERSION`、README、同步脚本输出一致。
- `ai/global-rules.md` 顶部只记录全局规则自身版本；改动全局规则时，除更新 `VERSION` 外，也要按需更新全局规则版本。

## 8. 变更记录（模板治理类）

> 区别于 README 的模板版本记录，这里记治理 / 基建类变更。

- 2026-06-23：版本治理升级为根目录 `VERSION` 三段式；所有模板修改必须先形成 `TEMPLATE-UPGRADE-*.md` 提案，完成后归档到 `_archive/proposals/`。
- 2026-06-23：下行同步安全增强——派生项目同步前先 bootstrap 最新 `scripts/sync-template.sh`；脚本自身会对比远端版本，不一致时停止并提示更新，避免旧脚本漏同步。
- 2026-06-22：新增模板优化提案收件箱工作流——模板仓库 `_proposals/` 收集派生项目去项目化提案，`INIT-PROMPT.md` 增加模板优化汇总 Prompt，`scripts/new-project.sh` 为派生项目创建本地提案起草区并项目化 README。
- 2026-06-21：增强示例完整性自检——`scripts/check-template.sh` 增加 `_examples` 检查，固定验证 `vision-to-product`、`quick-script`、`todo-api` 三个入口及旧示例目录已清理。
- 2026-06-21：清理旧示例项目——删除 `_examples/text-cleaner-cli/`、`_examples/text-normalizer-lib/`、`_examples/md-notes-frontend/`，保留 `vision-to-product`、`quick-script`、`todo-api` 三个清晰入口。
- 2026-06-21：更新 Todo API 示例验证闭环——`_examples/todo-api/` 补 `OVERVIEW.md` 与 `docs/09-verification.md`，并同步新版 `project-rules.md` 结构，用作 DB + REST API 完整参考。
- 2026-06-21：新增轻量愿景样例——`_examples/quick-script/` 展示小脚本如何从愿景文档走轻量路径，省略 `docs/06`、`docs/07`，保留 `docs/09` 验证闭环。
- 2026-06-21：新增模板自检脚本——`scripts/check-template.sh` 检查 AI 入口、规则索引、核心文档骨架、同步清单与模板版本号；同步清单、README 与 PR checklist 补充自检脚本说明。
- 2026-06-21：模板初始化体验改进——`ai/project-rules.md` 增加生成 `docs/03-09` 前的必填检查；`docs/03-09` 增加最小示例区块；`scripts/new-project.sh` 支持 `ACCOUNT`、`VISIBILITY` 环境变量及 `--visibility` 参数，README 补充脚本覆盖用法。
- 2026-06-21：模板可用性改进——`scripts/sync-template.sh --dry-run` 改为真正只预览差异、不修改工作区、不 stage，并为 `--commit` 增加无差异不提交保护；README 增加轻量项目路径与同步预览说明；`ai/project-rules.md` 增加 AI 修改前确认规则。
- 2026-06-19：建立模板治理基建——`CONTRIBUTING.md`、`docs/git-guide.md`、`scripts/new-project.sh`、`scripts/sync-template.sh`、`.github/` PR / issue 模板；README 快速开始补「初始化 git」步、同步节扩为双向；`main` 开启分支保护。
- 2026-06-19：docs 结构修正——新增 `docs/vision/product-vision.md` 桩（v1.4 §5/§0 引用的愿景输入位，此前只有约定无脚手架）；`docs/git-guide.md` → 根目录 `git-guide.md`（与 CONTRIBUTING/INIT-PROMPT 同级，不再与 00-09 项目开发文档平级）。
- 2026-06-19：同步清单补 `INIT-PROMPT.md`（逐字复用，此前遗漏——v1.4 改 INIT-PROMPT 时下游不得不手动同步）。
