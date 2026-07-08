# BEGINNER-GUIDE

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本手册面向第一次使用 `ai-project-template` 的人。它回答「这套模板是什么、怎么用、卡住时去哪看」，帮你建立完整心智模型；规则正文仍以 `ai/` 和 `docs/` 里的活文件为准。

如果你是第一次用，先看 `README.md`（它能做什么 + 快速开始），再把本手册当「理解模板设计 + 心智模型 + 常见错误」的参考。**具体操作走 `template-docs/scenario-guides.md` 场景引导**，本手册不重复操作步骤。

## 1. 这套模板是什么 / 能干啥

这套模板是**用 AI 按软件工程规范开发软件**的项目模板。它不让你「给 AI 一个想法、直接生成整个项目」，而是反过来：**先让 AI 按规范生成各阶段工程文档（需求 → 架构 → 设计 → 计划 → 验证），再让 AI 在这些文档约束下写代码**。这样你既得到完整的过程文档，又让代码符合设计、可审查、可维护。

它能帮你做什么（详细见 `README.md`「它能做什么」）：

- **生成工程文档体系**：给 AI 你的需求 / 愿景 / 想法，它按软件工程规范生成需求 → 架构 → 技术方案 →（数据库 → 接口）→ 开发计划 → 验证各阶段文档；支持多种输入起步（愿景 / PRD / SRS / 任务单 / 小工具 brief）。
- **文档约束代码 + 合规审查**：AI 按文档实现，不自由发挥；六维度审查（需求 / 架构 / 技术 / 数据库 / 接口 / 边界）保证代码符合设计、不越出当前阶段。
- **分阶段交付**：把完整设计拆成 Demo → MVP → 产品 增量实现；文档只增不删，随阶段积累演进。
- **场景引导**：在 AI CLI 里说一个具体场景，AI 给「做什么 + 为什么」分步引导计划，确认后执行。
- **跨项目复用 + 经验回流**：一套模板派生多个项目，方法论下行同步统一；派生项目发现的优化能回流模板。
- **多 AI 工具 + 会话续接**：支持 `Claude CLI` / `Codex CLI` / IDE 插件；切换工具或新开窗口不丢上下文。

适合谁：

- 第一次使用这套模板的新手。
- 会开发，但还不熟悉 AI 协作开发流程的人。
- 想先跑通一遍最小路径，再逐步理解完整体系的人。

先建立正确预期（关键心智）：

- 这不是「想法 → AI → 整个项目」的模板。
- 这是一套「确认机器可用 → 准备输入材料 → 采集本机环境 → 生成或补齐文档体系 → 按 Sprint 小步开发」的模板。
- AI 不能替代项目边界、需求来源和验收标准；这些要先由人提供或确认。
- 新手最容易卡住的不是文档编号，而是机器还没准备好就直接开干。

## 2. 开工前准备什么

开工前你要准备好三类东西。具体怎么装、怎么填，走场景引导（见 §3），细节看专门手册。

**(a) 工具和环境**

- 基础工具：Git for Windows、Git Bash、PowerShell。先跑 `scripts/check-prereqs.ps1` 看缺什么，缺了用 `scripts/bootstrap-dev-env.ps1` 一键补齐（详见 `template-docs/env-setup.md`）。
- AI CLI：至少装一种——按官方文档安装并登录 `Claude CLI` 或 `Codex CLI`（见 `template-docs/ai-cli-setup.md`）。
- 公司中转站 / LeMesh / CC-Switch：见内网手册（`lemesh_ai_model`），它处理代理接入，不替代 CLI 官方安装。
-（可选）验证新手链路：`template-docs/smoke-test.md` + `template-docs/smoke-test-report-template.md`。

> Keyword for template checks: newbie AI CLI onboarding path.

**(b) 输入材料**

至少要有一种明确的输入（它们如何变成代码，见 §4）：

- 产品愿景草稿 / 叙事 / 客户 PRD / SRS / 任务说明 / 现有系统说明（统一先放 `docs/inputs/`），或
- 只有一句想法 → 用 `docs/inputs/initial-brief.md` 填关键字段起步。

AI 会先评审 `docs/inputs/` 是否足以生成 `docs/vision/product-vision.md`；不足时给出 `docs/inputs/input-review-report.md` 和最小补充清单，补齐后再复评。

**(c) 项目决策**

生成设计文档前必须先定的边界（填 `ai/project-rules.md`）：

- 当前阶段的允许项 / 禁止项 / 下一阶段预告。
- 技术栈倾向和禁区，不要让 AI 猜。
- 项目形态裁剪：是否需要 `docs/06`、`docs/07`、`frontend/`、`backend/`、`tests/`、`docker/`。

## 3. 怎么用

用法很简单：在项目根目录打开 AI CLI（`Claude CLI` / `Codex CLI`），说一个具体场景，比如「帮我新建项目」「帮我准备输入材料」「帮我规划阶段」。AI 会读 `template-docs/scenario-guides.md`，先用人话告诉你「打算做什么、为什么」，你确认后它再执行——你不用记具体步骤。也可以直接 `/run scenario`。

- 完整场景目录（使用者 / 维护者 / 元场景，从零起步到 Phase 升级）：`template-docs/scenario-guides.md`。
- 知道要做什么、想找具体命令：`SOP.md` 场景索引 / `ai/commands/README.md` 命令表。

## 4. 输入材料 → 文档体系 → 实现代码（核心心智）

你准备的输入材料，AI 会按软件工程规范加工成文档，再用文档约束写代码。三者关系：

```text
你准备的输入材料            AI 生成的文档体系              AI 写的实现代码
──────────────         ─────────────────────         ────────────────
docs/inputs/ 原始输入  ──→  docs/vision/product-vision.md  ──→  docs/00-09（根·项目事实） ──→ frontend/ backend/
客户 PRD / SRS / brief      （整理后愿景锚点）                    docs/design/ 子系统设计       tests/ scripts/ docker/
补充清单 / 评估报告          ↑                                     （约束代码·可审计）
                            └ 不足则补齐后复评                        └ 代码事实可反向同步回文档
```

- **原始输入**（你提供，原料）：`docs/inputs/` 里的东西；不直接驱动开发。
- **整理后愿景**（AI / 团队提炼）：`docs/vision/product-vision.md`，由输入评审通过后生成或更新。
- **AI 输出**（项目事实，约束代码）：`docs/00-09` 根文档 + `docs/design/` 子系统设计。
- 加工是**单向链**（先文档后代码），但代码实现后的事实可以**反向同步**回文档（`/run sync-docs-from-code`）。

这条链按 PLM 阶段走（权威见 `ai/document-lifecycle-rules.md` §2）：

```text
输入材料 → 愿景就绪评估 → product-vision → 需求(00→01→02→03)
        → 总体设计(04→05) → 详细设计(06/07/design) → 开发计划(08) → 验证(09) → 代码
```

> 每一步都不许跳：禁止从想法直接生成代码。文档之间的追溯链（U-ID → REQ-ID → Phase → 设计 → Sprint → 测试 → 代码）让每行代码都能查到它对应哪条需求。输入/输出总体区分见 `docs/README.md` §1。

进入实现阶段后，执行闭环权威见 `ai/implementation-lifecycle-rules.md`：先用 A9 / `ai/prompts/planning/19-plan-phases-and-sprints.md` 规划 Phase、Sprint、Task 和验证包，再用 A10 小步执行任务，最后用 A12 / `sprint-summary` 把验证证据写回 `docs/09-verification.md`。不要只看“代码能跑”，还要有 Test Case、验收记录和未验证风险。

## 5. 目录结构（三层）

这个仓库分三层——模板方法层、文档事实层、代码骨架层。

| 层 | 放什么 | 关键内容 |
|---|---|---|
| 模板方法层 | 模板自身 + AI 行为规范 + 手册脚本（派生项目里是下行同步的只读件，除根 README） | `README.md`、`SOP.md`、`git-guide.md`、`ai/`、`template-docs/`、`scripts/`、`VERSION` |
| 文档事实层 | 你这个项目的需求 / 设计 / 计划 / 验证（AI 输出，见 §4） | `docs/00-09`、`docs/vision/`、`docs/inputs/`、`docs/design/`、`docs/decisions/` 等 |
| 代码骨架层 | 实现代码（按项目形态裁剪） | `frontend/`、`backend/`、`tests/`、`scripts/`、`docker/` |

**文档事实层的 `docs/00-09` 一览**（每个文档干什么，详见 `docs/README.md` §2）：

| 文件 | 一句话作用 |
|---|---|
| `docs/00-scenario.md` | 工程想定、背景、典型场景 |
| `docs/01-user-requirements.md` | 用户需求全集 + 来源 |
| `docs/02-srs.md` | 系统需求规格 + REQ |
| `docs/03-prd.md` | 当前阶段功能范围 + 路线图 |
| `docs/04-architecture.md` | 总体模块 / 边界 / 运行拓扑 |
| `docs/05-tech-spec.md` | 技术选型 / 依赖 / 降级 / 资源 |
| `docs/06-db-design.md` | 数据模型（无持久化可省） |
| `docs/07-api-spec.md` | 接口 / 命令契约（无对外接口可省） |
| `docs/08-dev-plan.md` | Sprint / task 拆分 + 验收 |
| `docs/09-verification.md` | 验证矩阵 + 验收 |

> 三个容易混淆的路径：`docs/inputs/*` / `docs/vision/*` / `docs/00-09` / `docs/design/*` / `docs/decisions/*` / `docs/research/*` 是你的项目事实；`template-docs/docs-scaffold/` 下的 `inputs/`、`vision/`、`00-09`、`design/`、`decisions/`、`research/` 是长期结构模板副本；`ai/doc-standards/` 是 AI 规则 / 审计基线。派生项目里：模板方法层是下行同步的只读件（改通用规则要回模板走 PR）；文档事实层和代码骨架层是你自己的。分区规则、裁剪、撰写规范见 `docs/README.md`。

## 6. 常见错误与常见问题

### 常见错误

- 只有一句想法、没有上游输入材料，就直接让 AI 生成代码。
- 没先跑环境检查就直接开干，把 Git Bash / PowerShell / PATH 问题误判成模板问题。
- 没填 `ai/project-rules.md` 就开始生成设计文档。
- 把愿景功能直接当当前阶段需求。
- 把模板自身文档和派生项目过程文档混在一起。
- 一次让 AI 改太多文件，最后无法验收。
- 没有验证记录，就认为任务已经完成。

### 常见问题

- 什么时候省略 `docs/06` / `docs/07`：看 `ai/project-rules.md` §3 和 `docs/README.md` 裁剪决策表。
- 什么时候需要 `tasks/`：当 `docs/08-dev-plan.md` 的某个 Sprint 复杂到要拆成多个独立任务。
- 什么时候需要 `docs/design/`：当某个子系统非平凡，光靠 `docs/04` / `docs/05` 不够表达内部逻辑。
- 什么时候需要服务器预案：本机资源撑不住当前阶段 Demo / MVP，且不能靠降级或 Mock 解决。
- 切换 AI 工具怎么办：规则不变，先记录当前进度（`.ai/session-handoff.md`），再让新工具从 `ai/index.md` 和当前 Sprint 继续。

## 7. 去哪看什么（导航）

| 想做的事 | 看哪 |
|---|---|
| 第一次整体上手 | 本手册 + `README.md` |
| 装工具 / 装环境 | `template-docs/env-setup.md` |
| 装 AI CLI | `template-docs/ai-cli-setup.md` |
| 具体场景怎么操作 | `template-docs/scenario-guides.md`（23 场景） |
| 找命令速查 | `SOP.md`、`ai/commands/README.md` |
| 理解模板为什么这么设计 | `template-docs/template-methodology.md` |
| 查术语是什么意思 | `template-docs/glossary.md` |
| docs/ 文档怎么放 / 怎么裁剪 | `docs/README.md` |
| 查看 `docs/inputs/*` / `docs/vision/*` / `docs/00-09` / `docs/design/*` / `docs/decisions/*` / `docs/research/*` 原始结构模板 | `template-docs/docs-scaffold/` |
