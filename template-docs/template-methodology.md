# TEMPLATE-METHODOLOGY

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件说明 `ai-project-template` 这套模板自身“为什么这样设计”。它不是派生项目的过程文档，也不是 AI 运行时规则正文；规则正文以 `ai/` 和 `docs/` 中的活文件为准。

## 1. 这页是什么 / 给谁看

- 面向模板维护者、进阶使用者和想理解方法论边界的人。
- 回答“为什么要这么分层、为什么文件放这里、为什么流程这样约束”。
- 不重复抄写规则条款；避免和 `ai/` 里的活规则形成双份维护。

## 2. 当前权威源

当前模板的方法论边界，以以下活文件为准：

| 文件 | 职责 |
|---|---|
| `README.md` | 5 分钟最小路径与总导航 |
| `template-docs/beginner-guide.md` | 面向第一次使用者的操作手册 |
| `template-docs/glossary.md` | 人读术语索引，不替代规则权威源 |
| `template-docs/docs-scaffold/` | `docs/inputs` / `docs/vision` / `docs/00-09` / `docs/design` / `docs/decisions` / `docs/research` 结构模板副本，不替代项目事实文档 |
| `SOP.md` | 场景索引与流程入口 |
| `ai/index.md` | AI 规则入口 |
| `ai/global-rules.md` | 跨项目通用规则 |
| `ai/document-lifecycle-rules.md` | 文档生命周期、追溯、裁剪与传播 |
| `ai/project-rules.md` | 项目专属边界与禁区模板 |
| `docs/README.md` | 派生项目文档分区规则 |
| `INIT-PROMPT.md`、`ai/prompts/` | 可复制给 AI 的 Prompt Library |
| `CONTRIBUTING.md`、`MAINTAINERS.md` | 模板治理与维护规则 |
| `template-sync.json` | 下行同步清单 |
| `VERSION`、`CHANGELOG.md` | 版本与发布记录 |

## 3. 解决什么问题 + 设计目标

### 当前模板已经超出早期规范文档的范围

相对 `_archive/` 中的早期设计文档，当前模板已经扩展出完整的方法论产品面：

- 从“规则说明”扩展为“文档生命周期体系”，明确多入口生成、追溯链、横切事实和变更传播。
- 从“`00-08` 骨架”扩展为“`00-09` 核心文档 + 标准子目录分区”。
- 从“简单 Phase 边界”扩展为“功能范围 + 交付物形态 + 状态标签”的双维度阶段模型。
- 从“默认本地开发”扩展为“本机环境采集 + 资源约束 + 降级 / Mock / 服务器预案”。
- 从“Prompt 附录”扩展为独立 Prompt Library。
- 从“规范文本”扩展为“同步清单、脚本、自检、发布纪律和治理流程”。

因此，本文件必须以当前活文件为基准重写，而不是把旧文档做简单改名或拼接。

### 这套模板要解决什么问题

- AI 自由发挥，擅自扩需求、扩技术栈、扩架构。
- 不同 AI 工具切换后，规则和实现方式不一致。
- 项目从一句想法直接跳到代码，缺少需求、设计和验收中间层。
- 文档、代码、测试和阶段计划脱节，后续无法审计。
- 模板仓库和派生项目之间长期漂移，无法安全同步。

### 设计目标

- 让 AI 遵守项目，而不是让项目迁就 AI。
- 让输入材料、需求、设计、任务、验证、代码之间可追溯。
- 让小项目可以轻量启动，大项目可以逐步长成完整体系。
- 让方法论可以在多个派生项目之间稳定同步。
- 让模板演进有版本、有提案、有审计，而不是口口相传。

## 4. 核心设计原则

- 规则分层：通用规则和项目专属规则分开。
- 入口指针化：各 AI 工具入口只指向 `ai/index.md`。
- 文档驱动开发：先有输入与设计，再有任务与代码。
- 单一权威源：一个事实只在一个位置定义，其他地方引用。
- 阶段双维度：功能范围和交付物形态分开表达。
- 横切事实集中治理：资源约束、技术禁令、合规结论不能散落。
- 模板与派生项目边界清晰：模板管方法论，派生项目管自身事实。

## 5. 各子系统的设计 why

### 信息架构与文件职责

| 区域 | 放什么 | 不放什么 |
|---|---|---|
| 根目录 `README.md` | 总导航、最小路径、版本摘要 | 维护者细节、长篇教程 |
| `template-docs/beginner-guide.md` | 初学者操作手册 | 规则正文、项目业务事实 |
| `template-docs/glossary.md` | 核心术语短定义与权威来源指针 | 规则正文、长篇流程、项目事实 |
| `template-docs/docs-scaffold/` | `docs/inputs`、`docs/vision`、`docs/00-09`、`docs/design`、`docs/decisions`、`docs/research` 原始大纲、占位表格、撰写提要 | 项目事实、规则审计基线 |
| `template-docs/template-methodology.md` | 模板设计说明 | 派生项目过程文档 |
| 根目录 `SOP.md` | 场景索引 | 大段重复命令、完整教程 |
| `ai/` | AI 运行时规则 | 解释性长文、模板历史叙事 |
| `docs/` | 派生项目事实、需求、设计、计划、验证 | 模板自身元设计 |
| `tasks/` | 复杂 Sprint 拆分的任务单 | 长期方法论文档 |
| `ai/prompts/` | 可复制 Prompt | 项目事实和规则权威源 |
| `CONTRIBUTING.md`、`MAINTAINERS.md` | 模板治理与维护 | 派生项目业务约束 |

### `docs/` 与 `ai/` 的分工（为什么各不承载对方内容）

为什么 `docs/` 不承载模板自身设计：

- `docs/` 的语义是派生项目事实文档，不是模板元文档。
- `docs/design/` 的语义是派生项目子系统详细设计，不是模板方法论说明。
- 如果把模板自身设计放进 `docs/`，会让“模板方法论”和“项目事实”混在一起，破坏分区规则，也让派生项目误把模板元文档当成项目设计文档。

为什么 `ai/` 不承载模板设计说明：

- `ai/` 是给 AI 读取的运行时规则区，要求短、准、可执行。
- 模板设计说明更适合写给人看，强调取舍、边界和原因。
- 如果把“why”混进 `ai/`，AI 规则正文会膨胀，维护时也更容易出现双份表述和漂移。

### 文档生命周期设计

当前模板不假设所有项目都从愿景起步，而是允许多入口进入：

- 愿景文档、客户 PRD / SRS、自由 brief、任务单、现有系统说明、外部输入包都可以成为上游输入。
- AI 先判断入口模式，再判断文档剖面，而不是机械套一套文档。
- `docs/00-09` 形成需求、设计、计划、验证主链。
- `docs/vision/`、`docs/inputs/`、`docs/design/`、`docs/decisions/`、`docs/research/`、`docs/env/`、`docs/meetings/`、`docs/archive/` 提供标准落位。
- 任何上游变更都必须做下游影响分析；任何横切事实都必须有唯一权威源。

这套设计的目标不是让文档变多，而是让项目事实可追溯、可裁剪、可传播。

### 阶段模型设计

当前模板把“阶段”拆成三个正交表达：

- 功能范围：`[P1]`、`[P2]`、`[愿景]`。
- 交付物形态：`Demo`、`MVP`、`产品`。
- 状态标签：`骨架`、`P{N}-已设计`、`P{N}-已实现`。

这样设计的原因是：

- 防止把“阶段顺序”和“交付物成熟度”混写成一个词。
- 防止把 Demo 误写成 MVP，或把愿景功能误写成当前阶段功能。
- 让同一份文档能在多个阶段积累演进，而不是每个阶段重写一套。

### 运行环境与资源约束设计

当前模板要求用 `scripts/collect-env.ps1` 生成 `docs/env/local-env.md`，并在 `ai/project-rules.md` §2.5 明确：

- 哪些能力必须在本机运行。
- 哪些能力允许降级、Mock 或远程运行。
- 哪些能力受资源限制，必须提前写服务器预案。

这个设计是为了防止技术方案脱离机器现实，只在文档里“想当然可行”。

### Prompt Library 与多 AI 工具适配

Prompt Library 设计：

- `INIT-PROMPT.md` 只做轻量索引。
- 完整 Prompt 按 docs / dev / review / planning / setup / git / maintainers 分类拆分到 `ai/prompts/`。
- Prompt 负责提供流程入口，不负责定义规则权威源。

这样拆分后，用户入口更清晰，维护时也不需要在一个超长附录里找段落。

多 AI 工具适配设计：

- `AGENTS.md`、`CLAUDE.md`、`.cursor/rules/project-rules.mdc` 都只指向 `ai/index.md`。
- 工具切换时会丢对话历史，但不应该丢规则体系。
- 入口文件尽量保持稳定；规则增减只发生在 `ai/index.md` 和被它引用的活文件里。

这能把“工具差异”限制在入口层，而不是扩散到方法论本身。

### 模板治理与同步边界

- 模板仓库负责跨项目复用的方法论、Prompt、脚本、治理和同步机制。
- 派生项目负责自己的 `ai/project-rules.md`、业务事实文档、代码和运行决策。
- `template-sync.json` 只同步跨项目复用的方法论文件，不同步派生项目根 `README.md` 或业务文档。
- 模板改动必须走提案、版本、PR、归档流程，避免派生项目各自演化成不同流派。
- 版本是发布边界，不是提案数量边界；提案收件箱增长不触发版本递增，只有合并到同步范围内并改变模板行为或下游同步判断的 PR 才判断 `PATCH / MINOR / MAJOR`。

## 6. 演进策略 + 历史来源

### 演进策略

模板的演进原则不是“推翻重来”，而是“在稳定骨架上扩能力”：

- 项目轻量时，用 Lean 或 Standard 剖面快速启动。
- 复杂度上升时，再逐步引入 `tasks/`、更多 `docs/design/`、更完整的验证矩阵。
- 规则真正膨胀时，再拆规则文件或增加 Prompt，不提前过度设计。
- 任何影响下游同步判断的发布，都通过 `VERSION`、`CHANGELOG.md` 和同步清单留痕；同主题小改可聚合为一个发布边界。

### 历史来源说明

`_archive/` 中的历史文档只用于保留早期设计背景、术语演化和方法论来源，不用于定义当前模板的能力边界、流程要求或同步策略。当前模板能力边界，以本文件 `§2` 列出的活文件为准。
