# 模板机制与专项使用说明

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文帮助模板维护者和使用者快速回答三个问题：

1. 模板里已经有哪些管理机制，各自负责什么。
2. 遇到特定任务时，应读取哪些规则和操作说明。
3. 多项机制同时适用时，谁负责协调，以哪份文件为准。

本文只做说明和导航，不新增规则。它不是 AI 每次任务的默认必读规则包，也不替代 `ai/index.md`、`ai/rules-core.md`、`ai/session-rules.md`、`docs/00-09`、`tasks/*`、Git 记录或 GitHub 远端事实。

## 1. 如何使用本文

### 1.1 先从任务入口开始

任何任务先按 `ai/index.md` 判断任务类型，再读取对应规则。只有以下情况需要查本文：

- 想了解模板现有机制及其负责人。
- 任务涉及多个工作分区，需要判断由谁协调。
- 任务命中某个专项场景，例如远端操作、复杂 Web 项目或领域模板。
- 准备新增机制或专项说明，需要先检查是否与现有内容重复。

### 1.2 本文中的几个固定称呼

- **专项说明（Profile）**：针对某一类任务整理的使用说明，例如远端操作或复杂 Web 项目。它说明适用条件、必读文件、产出和禁止事项，但不取代原规则。
- **负责人**：负责判断范围、组织执行和验收的人或角色。目前这是职责划分，不表示已经创建独立 Agent。
- **权威依据**：对某项要求有最终解释权的规则、文档、Git 记录或远端事实。本文与权威依据冲突时，以权威依据和用户最新授权为准。
- **检查点模式（Checkpoint Mode）**：长任务、批量搜索、命令失败或高风险操作时，先停下来汇报当前结果，再决定下一步。具体规则见 `ai/rules-core.md` 和 `ai/session-rules.md`。

## 2. 新增专项说明时要写什么

新增专项说明前，先确认现有规则和操作手册不能满足需求。确需新增时，至少写清以下内容：

```markdown
# <专项名称>

## 1. 什么时候使用
- 适用情况：
- 不适用情况：
- 相关场景或命令：

## 2. 执行前要读什么
- 核心规则：
- 本专项说明：
- 操作手册或模板：
- 可选参考：

## 3. 执行前要确认什么
- 事实来源：
- 必要输入：
- 前置状态：
- 不能从哪里推断：

## 4. 执行后要交付什么
- 必须产出：
- 可选产出：
- 不得写入或修改：

## 5. 谁会使用结果
- 下游文档：
- 代码和测试：
- 命令或操作流程：
- 同步或自检：

## 6. 如何确认完成
- 自动检查：
- 人工验收：
- 失败或尚未完成时如何处理：

## 7. 如何防止说明失效
- 必须保留的入口：
- 必须保持一致的内容：
- 不允许出现的偏差：

## 8. 禁止事项
- 不得新增哪些未授权内容：
- 不得替代哪些权威事实：
- 不得默认执行哪些高风险操作：
```

## 3. 工作分区

工作分区用于说明不同内容由谁负责，不要求项目建立同名目录或独立 Agent。

| 工作分区 | 负责什么 | 主要依据 | 主要产出 | 结果交给谁 |
|---|---|---|---|---|
| 任务协调 | 判断任务类型、选择规则、确认写入范围、处理会话续接 | `ai/index.md`、`ai/rules-core.md`、`ai/session-rules.md`、`ai/project-rules.md` | 规则读取范围、用户确认边界、续接信息 | 所有后续工作 |
| 文档 | 从输入材料生成或修改需求、设计和计划，并维护追溯关系 | `ai/document-lifecycle-rules.md`、`ai/doc-standards/*` | `docs/00-09`、`docs/design/*` | 实现、测试验收、README |
| 实现 | 按阶段、Sprint 和任务完成代码及实现记录 | `ai/implementation-lifecycle-rules.md`、`ai/commands/run-dev-task.md` | 代码、任务状态、自测和完成记录 | 测试验收、Git / PR |
| 测试验收 | 编写和执行测试，记录回归与验收结论 | `docs/09-verification.md`、`tests/*`、实现生命周期规则 | 测试证据、缺陷记录、验收结论 | 阶段升级、PR、维护者 |
| 知识记录 | 保存决策、调研、会议结论和可复用经验，并回写长期事实 | `template-docs/rd-data-chain.md`、`docs/decisions/*`、`docs/research/*`、`docs/meetings/*` | 有来源的结论、影响说明和记录索引 | 文档、实现、测试验收、维护者 |
| 专项说明 | 为特定任务补充适用条件、必读文件和最低检查项 | 各 `template-docs/*profile*`、`SOP.md`、`git-guide.md` | 针对特定场景的使用说明 | 任务协调、文档、实现、测试验收 |
| 模板维护 | 管理提案、版本、同步、发布和模板自检 | `MAINTAINERS.md`、`CONTRIBUTING.md`、`template-sync.json`、`scripts/check-template.*` | `VERSION`、两份 CHANGELOG、同步清单、归档记录 | 模板维护者、派生项目 |

## 4. 现有机制登记

下表登记模板中已经存在的 14 类机制。机制编号用于稳定引用；“负责人”只表示职责归属，不表示已经创建独立 Agent。

| ID | 机制 | 负责人 | 什么时候使用 | 主要依据 | 产出和边界 | 如何确认完成 |
|---|---|---|---|---|---|---|
| `MECH-CORE-001` | 判断任务类型并选择规则 | 任务协调 | 开始分析、设计、编码或任何会改变状态的任务时；只读取续接点时可走快速恢复 | `AGENTS.md`、`ai/index.md`、`ai/rules-core.md` | 选出本次必读规则；本机制本身不修改业务文件 | 入口链接有效，模板自检通过 |
| `MECH-CORE-002` | 写入确认与检查点模式 | 任务协调 | 写入前；批量搜索后；命令失败、超时或遇到高风险远端操作时 | `ai/rules-core.md`、`ai/project-rules.md`、`ai/session-rules.md` | 说明修改范围、风险和验证方式；需要暂停时先汇报，不得越权继续 | 人工确认已取得，检查点要求已执行 |
| `MECH-CORE-003` | 会话续接与历史整理 | 任务协调 | 多步骤任务、会话中断、切换工具或上下文可能不足时；单轮轻量问答可不建立续接文件 | `ai/session-rules.md`、`.ai/session-handoff.md` | 更新 `.ai/` 下的本地运行记录；不得用续接摘要替代 Git 和正式任务记录 | 新会话能按续接文件和 Git 状态恢复任务 |
| `MECH-DOC-001` | 文档生成、追溯和变更传播 | 文档负责人 | 新建文档体系、需求变化、设计落盘或跨文档影响时；不改变外部约定的代码内部重构可按规则裁剪 | `ai/document-lifecycle-rules.md`、`ai/doc-standards/*`、`docs/00-09` | 只修改已授权文档并维护上下游关系；不得虚构事实或新增未授权需求 | 文档检查通过，人工评审确认内容准确 |
| `MECH-DOC-002` | 文档评估和待确认事项处理 | 文档负责人 | 输入评审、文档审计、完成度评估或待确认事项处理时；未获写入确认时只分析 | `ai/commands/docs-system-audit.md`、`ai/prompts/review/19-docs-evaluation.md`、`ai/prompts/docs/21-docs-open-items.md` | 先列缺口、证据和待确认项；用户确认后再修改正式文档 | Markdown 检查通过，待确认项有明确状态和回填位置 |
| `MECH-IMPL-001` | 阶段、Sprint、任务和系统骨架执行 | 实现负责人 | 环境准备、系统骨架、编码、修复或任务收口时；仅做文档评估时不使用 | `ai/implementation-lifecycle-rules.md`、`ai/commands/run-dev-task.md`、`docs/08-dev-plan.md`、`tasks/*` | 修改已授权代码和任务记录；不得绕过进入条件或扩大任务范围 | 项目要求的测试、lint、build 和任务验收通过 |
| `MECH-VER-001` | 测试、验收和回归 | 测试验收负责人 | 实现完成、发布前、回归或用户要求验收时；没有可验证对象时只记录缺口 | `ai/implementation-lifecycle-rules.md`、`docs/09-verification.md`、`tests/*` | 记录实际执行的测试和结果；不得把未运行或仍在等待的检查写成通过 | 测试证据可复核，失败和未验证项已明确列出 |
| `MECH-KNOW-001` | 整理决策、调研和会议结论 | 知识记录负责人 | 出现新决策、研究证据、会议结论或需求依据时；临时推测不能直接写入权威文档 | `template-docs/rd-data-chain.md`、`docs/research/*`、`docs/decisions/*`、`docs/meetings/*` | 记录来源、结论、影响和引用关系；不得把摘要冒充原始材料 | 来源和链接可核对，长期事实已回写正确位置 |
| `MECH-KNOW-002` | 记录 AI 使用中的问题和可复用经验 | 知识记录负责人 | 出现重复错误、明显低效或高 token 消耗时；一次性且不可复用的问题可不沉淀 | `ai/session-rules.md`、`ai-records/*`、`.ai/token-hotspots/*`、`.ai/pitfalls/*` | 写入本地观察或受控汇总；观察记录不能自动升级为强制规则 | 记录已去重、有证据，并按规定检查是否需要汇总 |
| `MECH-GOV-001` | 模板提案、评审、PR 和归档 | 模板维护者 | 修改模板机制、规则入口、同步范围或广泛行为时；派生项目的局部实现按项目规则处理 | `CONTRIBUTING.md`、`MAINTAINERS.md`、`_proposals/*` | 记录提案和评审；合并后归档；远端状态变更必须单步确认 | diff、评审和 PR / CI 结果符合发布要求 |
| `MECH-GOV-002` | 版本和发布记录 | 模板维护者 | 下游可见的模板变更准备发布时；只新增提案或本地观察时不单独升版 | `VERSION`、`CHANGELOG.md`、`CHANGELOG-PLAIN.md`、`MAINTAINERS.md` | 同一批更新版本号、详细变更记录和大白话变更记录；发布前不得写成已经发布 | 版本号一致，模板自检通过 |
| `MECH-GOV-003` | 下行同步和派生项目检查 | 模板维护者 | 模板内容下行、派生项目升级或同步范围变化时；普通项目开发不使用 | `template-sync.json`、`scripts/sync-template.*`、`scripts/check-derived-sync.*`、`git-guide.md` | 默认预览差异；提交模式会覆盖、暂存并提交同步文件，必须单步确认 | 同步检查和派生项目边界检查通过 |
| `MECH-PROFILE-001` | 按场景读取专项说明 | 任务协调和对应分区负责人 | `ai/index.md` 判断任务命中某个专项场景时；未命中时不默认读取 | 本文件、`ai/index.md`、各 `template-docs/*profile*` | 只增加该场景需要的说明和检查，不另建一套全局规则 | 专项入口、引用和最低检查项有效 |
| `MECH-REMOTE-001` | 远端操作和 CI 检查 | 任务协调和模板维护者 | push、PR、issue、分支删除、release 或 CI 查询时；纯本地编辑不使用 | 本文件 §6、`template-docs/remote-ci-sop-profile.md`、`git-guide.md`、`SOP.md`、`scripts/check-github-context.ps1` | 先做只读预检，再逐项确认会改变远端状态的动作；不得绕过认证、权限或网络限制 | 预检结果明确；CI 结果按通过、失败或等待中如实记录 |

## 5. 多项机制同时适用时怎么处理

- **先在本分区内完成工作**：文档、实现、测试验收和知识记录各自只修改本分区负责的内容。
- **跨分区修改前重新确认**：例如需求变化影响代码和测试时，先由任务协调列出影响清单和修改顺序，再取得相应授权。
- **交接不等于自动触发**：文档完成后可以交给实现，实现完成后可以交给测试验收，但不表示一个分区的动作会自动修改另一个分区。
- **上层调用下层不算重复**：模板自检调用 Markdown 检查、批量同步调用单项目同步，都是组合使用，不是重复建设。
- **本文不是最终裁决来源**：若本表与规则正文、Git 记录、GitHub 事实或用户最新授权冲突，以后者为准，并修正本表。
- **当前没有五个独立 Agent**：这些负责人目前由执行任务的 Agent 按阶段承担。是否创建独立 Agent 属于后续决策，本文件不提前设定。
- **已知缺口**：工具登记位于 `scripts/README.md`，但该文件目前不在 `template-sync.json` 中。派生项目会同步脚本，却不会自动同步工具说明；是否调整同步范围需另行评估。

## 6. 远端操作与 CI 专项说明

正式速查入口是 `template-docs/remote-ci-sop-profile.md`。本节只保留概要，方便判断何时需要读取该文件。

### 6.1 什么时候使用

- 推送提交，创建或合并 PR，关闭 issue，删除远端分支，创建 tag 或 release。
- 查询 GitHub Actions / CI，处理仍在运行或已经失败的检查。
- 处理 GitHub CLI 登录、账号权限、网络受限、DNS 或软件源访问失败。
- 完成模板发布、派生同步或其他会改变远端状态的任务。

纯本地编辑、只读文档评估或无需远端信息的普通编码任务不使用本专项说明。

### 6.2 执行前要读什么

- 核心规则：`ai/rules-core.md`、`ai/session-rules.md` §3.3。
- 远端专项说明：`template-docs/remote-ci-sop-profile.md`。
- 操作手册：`git-guide.md` §1.1 / §1.2、`SOP.md` A10 / C4。
- 命令入口：`ai/commands/README.md`。
- 预检脚本：`scripts/check-github-context.ps1`。

### 6.3 执行前要确认什么

- 当前仓库根目录、分支和远端仓库地址。
- `git status --short --branch` 的结果。
- Git 提交身份：`user.name` 和 `user.email`。
- `gh auth status`、`gh repo view` 和当前账号的仓库权限。
- 用户确认的远端目标、具体动作和可接受风险。

不得根据 CLI 私有历史、记忆、未经复核的续接摘要或本地镜像，推断 GitHub 当前状态。

### 6.4 执行后要报告什么

- 预检结果：仓库、分支、远端、账号、权限和工作区状态。
- 需要确认的动作：具体命令、目标仓库或分支、是否会改变远端状态。
- CI 结果：通过、失败或仍在运行。仍在运行时如实报告，不长时间等待。
- 失败原因：登录、权限、运行环境限制、网络、超时、CI 失败或原因不明。
- 下一步：修复、重新登录、稍后重试、停止等待或转入新的修复任务。

### 6.5 如何验证

- 本地提交前：运行 `git diff --check`，并按任务需要运行项目验证。
- 远端操作前：运行 `powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1`。
- 创建 PR 后：运行一次或短时间轮询 `gh pr checks <number>`；仍在运行时停止等待并汇报。
- 修改模板规则、同步或自检时：运行 `scripts/check-template.*`。

### 6.6 必须保留的内容

- 本文件保留 `Remote / CI SOP Profile` 这一固定名称，供现有自检识别。
- `ai/session-rules.md` 保留检查点模式与风险分级确认。
- `git-guide.md` 和 `SOP.md` 保留远端操作前预检及失败后停止的要求。
- `template-docs/remote-ci-sop-profile.md` 继续作为详细速查入口。

### 6.7 禁止事项

- 未经确认不得 push、merge、关闭 issue、删除远端分支或发布 release。
- 不得绕过运行环境、登录、权限或网络限制继续操作。
- 不得无限等待 CI，也不得把仍在运行的检查写成通过。
- 不得把本地镜像或续接摘要当作 GitHub 当前事实。

## 7. 其他专项说明

### 7.1 复杂 Web 项目

现有说明：`template-docs/web-fullstack-profile.md`、`template-docs/web-app-scaffold-experiment.md`。

它们用于说明复杂 Web 或全栈项目的应用外壳、前后端目录边界、最小纵向功能链路和浏览器 / API 冒烟测试。是否采用真实脚手架，仍需在具体项目或独立实验中验证。

### 7.2 领域模板

现有说明：`template-docs/domain-templates.md`。

它用于说明母模板、领域模板和具体项目之间的继承与同步边界，避免领域专属代码或文档反向污染母模板。

### 7.3 UI 原型

相关说明：UI brief、UI 原型探索、前端交互设计、UI 原型策略等模板及 Prompt；参考分析落盘模板 `template-docs/frontend-ui-reference-analysis-template.md` 与设计知识核心层 `template-docs/ui-knowledge/`（视觉 / 交互模式 + 来源索引，按 scope 读取）。

这些内容用于区分需求探索原型、视觉效果探索和实现前原型，并说明原型结果如何回填 `docs/08-dev-plan.md` 和 `docs/09-verification.md`。

## 8. 目录调整与多 Agent

当前不建议仅为本文件重组目录，也不建议默认启用多个 Agent 并发工作。

只有同时满足以下条件，才评估目录调整：

1. 至少有 1 至 2 个真实专项使用案例。
2. 现有索引已经无法清楚表达职责和引用关系。
3. 已明确文件迁移、链接兼容、同步清单和自检修改方案。

短期内可先按四种职责分工：

- **任务协调**：判断任务类型、选择规则、确认风险。
- **内容修改**：只修改用户已授权的文件。
- **验证**：只运行检查、读取结果并汇总失败。
- **模板维护**：处理版本、同步清单和 PR / issue 收口。

如果以后确需并发执行，必须使用独立 `git worktree`。共享进度只依据 Git、续接文件、任务文件、验证记录和远端事实，不能依赖某个 Agent 的对话记忆。

## 9. 维护要求

- 本文是面向人的说明和导航，不是所有 AI 任务的默认必读规则。
- 新增专项说明前，先检查能否补充现有规则或操作手册，避免重复建设。
- 新增后按 §2 写清适用情况、输入、产出、负责人、验证和禁止事项。
- 修改权威规则后，检查本文是否需要同步更新；不得让本文保留失效路径或错误说明。
- 新增同步范围内的文件时，必须更新 `template-sync.json`、`scripts/sync-template.sh` 的备用清单和 `scripts/check-template.*` 的检查项。
- 只新增 `_proposals/` 分析时不递增版本；修改本文件并影响派生项目可见说明时，按实际发布影响更新版本和 CHANGELOG。
