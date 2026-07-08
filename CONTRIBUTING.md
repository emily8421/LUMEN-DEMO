# CONTRIBUTING —— 模板变更治理流程

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本仓库 `ai-project-template` 是**活模板**：它的方法论（`ai/global-rules.md`、文档骨架、脚本等）会持续演进，并被各派生项目复用。为保证「一处改、处处可同步」且不污染派生项目的专属内容，所有模板改动都走统一的**提案 → 分支 → PR → 评审 → 合并 → 归档**流程。本文件面向**所有使用者与维护者**。

## 1. 什么算「模板改动」

> 一句话原则：模板的方法论只在本仓库改；任何模板修改先落提案，完成后归档；派生项目里发现的可通用优化，回流到本仓库走 PR，而不是就地改后手动回抄。

需要回流 / 同步到所有派生项目的，才算模板改动。判断标准（与 `ai/global-rules.md` 通用层一致）：换到完全不同的项目上是否还成立——成立就属于模板，不成立就属于派生项目的 `ai/project-rules.md`。

典型模板改动：`ai/global-rules.md` 原则、`docs/` 骨架编号 / 结构、`INIT-PROMPT.md` / `ai/prompts/`、`ai/project-rules.md` 的**模板骨架**、`scripts/`、本治理流程、`git-guide.md`。

补充：

- 模板维护一律先切维护分支，再改文件、再提交；不允许先在本地 `main` 提交后再补分支。
- 模板修改来源分两类：① `_proposals/` 中已有提案驱动的修改；② 人工或对话中临时提出、需要主动修改模板的内容。无论哪种来源，最终都必须形成可审计提案记录，并在处理完成后归档。

## 2. 模板 ↔ 派生：双向闭环

模板方法论在「模板仓库」与「派生项目」间双向流动，两方向互补、构成闭环：

- **上行·改进**：派生项目发现可通用优化 → 在本项目 `_proposals/` 起草 `TEMPLATE-UPGRADE-*.md` → 通过 `submit-proposal` / `submit-feedback` 提交到模板仓 GitHub issue，或回到模板仓库提交到 `_proposals/` 文件收件箱 → 模板维护者在 C1 中统一 triage → 模板 PR 合并 → issue 关闭 / 提案归档 → 模板演进。
- **下行·对齐**：派生项目执行 `scripts/sync-template.sh` → 拉取模板最新方法论覆盖本地同步清单 → 按项目提交记录审计版本。
- **观察·回流**（闭环已内建在同步流程里）：派生项目同步时，`/run sync-methodology` 按 `template-docs/derived-sync-report-template.md` 生成**同步运行记录**（记问题 + 「可优化点归纳表」），`/run post-sync-cleanup` 再从运行记录归纳**可回流模板的建议**；只有可通用于多个项目的问题，才去项目化转写为 `_proposals/TEMPLATE-UPGRADE-*.md`。运行记录可含派生项目事实，但回流提案必须去项目化。

只有上行没有下行，模板改了但派生项目拿不到；只有下行没有上行，模板不会吸收派生项目经验。两者缺一不可。

## 3. 改模板流程（直接改 · 上行 A）

```text
1. 先从最新 main 切维护分支：change/<主题> / feat/<主题> / chore/<主题> / fix/<主题>
   （如 change/verification-09、feat/git-guide）
2. 再新增或确认已有 TEMPLATE-UPGRADE-*.md 提案，说明动机、拟改、版本影响、影响面和验证方式。
3. 若修改来源是"对话中新增建议"，应先把建议整理进提案，再继续改模板；不要改完再回忆补提案。
4. 改文件，并按 §4 判断是否递增根目录 VERSION。
5. 本地自测（脚本可跑、文档自洽）。
6. 将已处理提案移动到 `_archive/proposals/`；未处理或延后处理的提案留在 `_proposals/`。
7. push 分支，提 PR（自动套用 .github/pull_request_template.md 核对清单）。
8. 评审要点：
   - 是否含项目专属内容（应剔除或留在 project-rules）
   - 是否有提案记录与归档计划
   - 是否按三段式规则更新 VERSION 与 CHANGELOG
   - 是否影响下游、需下行同步哪些项目
9. 合并到 main（squash）。
10. 下行同步到各进行中派生项目（见 §6）。
```

### 3.1 主动修改模板时的提案记录要求

如果不是 `_proposals/` 中已有提案驱动，而是人工在当前会话中陆续提出多条模板修改建议，则：

- 应在本次维护分支里同步维护一份 `TEMPLATE-UPGRADE-*.md` 提案。
- 提案不是必须"每条建议一份"；如果这些建议属于同一轮目标、同一批版本变更、同一条 PR，可以合并到同一份提案中持续追加。
- 如果建议主题明显不同、影响面不同、版本节奏不同，才拆成多份提案。
- 判断标准：是否适合由同一个 PR 落地。如果适合一个 PR，就优先合并到同一份提案中。
- 提案应在修改过程中持续补充，而不是全部改完后再回忆补录。
- PR 合并后，再把本轮已处理的提案移到 `_archive/proposals/`。

## 4. 版本号纪律

- 模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。
- **版本是发布边界，不是提案数量或编辑次数边界**：提案收件箱增长不触发版本递增；只有合并到同步范围内、会改变模板行为或下游同步判断的 PR，才判断 `PATCH / MINOR / MAJOR`。
- 每个会影响下游同步判断的模板 PR 合并前，都必须判断是否递增 `VERSION`；多个同主题小改可聚合为同一个版本发布。
- 新增或更新 `_proposals/TEMPLATE-UPGRADE-*.md`、本地续接文件、未纳入同步清单的候选池 / 草案 / 分析记录，默认 `Release impact = none`，不改 `VERSION`。
- 新提案建议在头部声明：`Release impact：none / patch / minor / major（AI 建议，待维护者确认）` 与 `Release strategy：单独发布 / 同主题聚合 / 延后候选池`。

| Release impact | 适用情况 | 是否改 `VERSION` | 示例 |
|---|---|---|---|
| `none` | 仅更新 `_proposals/`、本地续接、未纳入同步清单的草案或分析记录 | 否 | 新增候选提案、补充未执行候选池 |
| `patch` | 不新增能力、不改变核心流程，仅文案澄清、Prompt 小修、自检增强、兼容性脚本修复或治理说明补强 | 是，PATCH | 修错别字、补断言、修同步脚本 bug、补版本治理说明 |
| `minor` | 新增模板能力、初始化流程新增必填项、新增同步文件、文档骨架新增章节、用户入口新增场景 | 是，MINOR | 新增 `docs-scaffold`、新增 command / prompt |
| `major` | 文档编号体系、核心流程、同步机制发生不兼容变化 | 是，MAJOR | 改 `00-09` 编号、重写同步协议 |

- 同一提案、同一 PR、同一维护主题下的多个 Batch，默认聚合为一个版本；若后续 Batch 尚未开始实现，留在提案候选池，不阻塞当前版本发布。
- 如果一个 PR 中途发现同主题缺口，可继续归入当前版本，但必须同步更新提案和 `CHANGELOG.md`，避免版本描述只覆盖早期 Batch。
- 不同主题、不同风险、不同验证方式的变更，应拆提案 / 拆 PR / 拆版本。
- 阻塞派生项目同步、安全 / 数据 / 权限 / 同步脚本风险、CI 或模板不可用问题，走即时发布；文档模板补强、README 导航、自检断言、术语表、示例增强等可按同主题维护窗口聚合。
- 递增版本后，必须在 `CHANGELOG.md` 新增对应条目，并保持 `VERSION`、CHANGELOG、同步脚本输出一致。
- `ai/global-rules.md` 顶部只记录全局规则自身版本；改动全局规则时，除更新 `VERSION` 外，也要按需更新全局规则版本。

## 5. 派生项目归纳回流（上行 B）

在派生项目开发中沉淀出的可通用优化（积累规则、文档骨架改进、新支柱等），按此回流，**不要把方案长期停留在派生项目根目录**：

```text
1. 在派生项目 `_proposals/` 中把优化写成「去项目化」提案：TEMPLATE-UPGRADE-*.md
   （动机 / 拟改文件 / 版本影响 / 影响面 / 验证方式），可选附 TEMPLATE-UPGRADE-*-patch.md
2. 优先用 `/run submit-proposal` / `/run submit-feedback` 在【模板仓库】创建 GitHub issue（label `proposal` / `feedback` + 来源标识）；也可到模板仓开分支，把提案文件提交到模板仓库 `_proposals/` 文件收件箱（临时记录）。
3. 模板维护者使用 C1 / `ai/prompts/maintainers/11-template-proposal-summary.md` 读取 `_proposals/` 全部提案、带 `proposal` / `feedback` 标签的 issue，以及标题为 `TEMPLATE-UPGRADE:` 的 open issue，输出去重 / 冲突 / 依赖分析与优化计划
4. 按优化计划修改模板文件，走 §3 的 PR 流程评审、合并
5. 合并后下行同步回原派生项目（及其他项目）
6. 派生项目里已处理的提案可移动到项目历史记录或删除；模板仓库 `_proposals/` 中已处理提案必须归档到 `_archive/proposals/`；GitHub issue 已处理后应关闭，未处理则保留标签 / 状态说明；变更事实以根目录 `VERSION`、CHANGELOG 和 git log 为准
```

提案与 patch 的分工：

- **`TEMPLATE-UPGRADE-*.md`** = WHY / WHAT：去项目化说明动机、拟改、版本影响与影响面，给评审者决策。
- **`TEMPLATE-UPGRADE-*-patch.md`** = HOW：可选但推荐，记录基于当前模板版本的 old→new 修改建议，给执行者合并落地。

## 6. 下行同步（模板 → 项目）

操作 SOP 以 `git-guide.md` §5 为准；同步文件清单见 `template-sync.json`，`ai/prompts/maintainers/12-sync-template.md` 提供可复制给 AI 执行的 Prompt。提交信息：`sync template vX.Y.Z`。审计：比对各项目根目录 `VERSION`。

> 注：`sync-template.sh` 是**下行获取**：派生项目拉取模板最新方法论并覆盖本地同步清单；派生项目是接收方，不会修改模板仓库。模板的改进只通过 §3 / §5 的模板仓库 PR 产生。

## 7. 分支命名约定

| 前缀 | 用途 |
|---|---|
| `change/` | 方法论修订（如 global-rules 改动、骨架调整） |
| `feat/` | 新增（新脚本、新文档、新支柱） |
| `chore/` | 治理 / 基建本身（流程、模板、CI） |
| `fix/` | 修正模板自身错误 |

维护纪律补充：

- 先切分支，再创建 / 更新提案，再开始修改。
- 不允许在本地 `main` 产生模板维护提交后，再切分支补救。
- `.ai/session-handoff.md` / `NEXT-STEPS.md` 这类临时续接文档只用于本地会话衔接，不纳入模板版本库；如需长期保留，应转写为正式提案、README、SOP 或维护文档中的稳定内容。
- `ai/commands/` 只做快捷命令路由，不应复制大段 Prompt 正文；新增高频 Prompt 或 SOP 时，应同步评估命令入口，避免用户仍需手工找文件复制。

## 8. 禁止事项

- ❌ 直接 push 到 `main`（`main` 已开启分支保护，强制走 PR）。
- ❌ 在本地 `main` 先提交，再补切维护分支。
- ❌ 在派生项目里修改 `ai/global-rules.md` 后手动回抄到模板——这会让两边版本漂移、无法审计。
- ❌ 把项目专属内容（具体技术栈 / REQ / 表 / 接口）写进模板。
- ❌ 未形成 `TEMPLATE-UPGRADE-*.md` 提案就直接修改模板文件。
- ❌ 把临时续接 / 会话便签类文档（如 `NEXT-STEPS.md`、`.ai/session-handoff.md`）作为模板正式文档提交。

## 9. 治理变更记录（历史）

> 自 v1.6.5 起，治理 / 基建类变更统一记入 `CHANGELOG.md`（按版本归档）；本节保留 v1.6.5 之前的早期基建记录，不再追加。

- 2026-06-23：版本治理升级为根目录 `VERSION` 三段式；所有模板修改必须先形成 `TEMPLATE-UPGRADE-*.md` 提案，完成后归档到 `_archive/proposals/`。
- 2026-06-23：下行同步安全增强——派生项目同步前先 bootstrap 最新 `scripts/sync-template.sh`；脚本自身会对比远端版本，不一致时停止并提示更新，避免旧脚本漏同步。
- 2026-06-22：新增模板优化提案收件箱工作流——模板仓库 `_proposals/` 收集派生项目去项目化提案，Prompt Library 增加模板优化汇总 Prompt，`scripts/new-project.sh` 为派生项目创建本地提案起草区并项目化 README。
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
