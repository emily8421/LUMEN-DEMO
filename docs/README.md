# docs/ 项目文档体系与分区规则

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录保存项目事实、需求、设计、计划与验证材料。本文档说明三件事：**(1) 文档体系怎么构成**（输入 / 输出 + 00-09 主链）、**(2) 分区规则**（放哪）、**(3) 裁剪**（保留哪些）。文档生成、追溯链、横切事实、变更传播规则见 `ai/document-lifecycle-rules.md`。

## 1. 输入与输出：两类文档

`docs/` 里的文档分两类——你提供的原始输入，和 AI 生成的项目事实。

| 类型 | 目录 | 谁放 / 怎么来 |
|---|---|---|
| **原始输入**（统一入口） | `docs/inputs/` | 你提供：愿景草稿、客户 PRD/SRS、brief、现有系统说明、外部接入包 |
| **整理后愿景**（可选源文档） | `docs/vision/` | AI 或团队从输入评审中提炼：产品愿景叙事、完整场景与长期业务图景 |
| **AI 输出**（项目事实，约束代码） | `docs/`（根 `00-09`）、`docs/design/` | AI 根据输入评审后生成：需求 / 设计 / 计划 / 验证 |
| 辅助留痕 | `docs/decisions/`、`docs/research/`、`docs/env/`、`docs/meetings/`、`docs/archive/` | 决策记录 / 调研 / 环境 / 会议 / 归档 |

一句话：**人把原始材料放入 `docs/inputs/` → AI 评审是否足以生成 `product-vision` → AI 生成 `00-09` 与 `design/` → `00-09` 约束代码**。原始输入不直接驱动开发，必须先经评审（`ai/prompts/docs/01-review-inputs.md`）再进入 `docs/vision/product-vision.md` 或 `00-09`。

## 2. 核心文档 00-09 各自干什么

| 文档 | 阶段 | 一句话作用 | 何时省略 |
|---|---|---|---|
| `00-scenario.md` | 需求 | 工程想定、背景、典型场景、输入指针 | 必备 |
| `01-user-requirements.md` | 需求 | 用户需求全集，每条带来源锚点 + 阶段标签 | 必备 |
| `02-srs.md` | 需求 | 系统需求规格 + REQ 编号 | 必备 |
| `03-prd.md` | 需求 / 产品 | 功能范围、优先级、阶段路线图（阶段标签唯一来源） | 必备 |
| `04-architecture.md` | 总体设计 | 系统模块、边界、运行拓扑、子系统划分 | 必备 |
| `05-tech-spec.md` | 总体设计 | 技术选型、版本、资源评估、降级 / Mock | 必备 |
| `06-db-design.md` | 详细设计 | 表、字段、索引、约束，每张表追溯 REQ | 无持久化可省 |
| `07-api-spec.md` | 详细设计 | 接口契约、请求响应、权限、错误码 | 无对外接口可省 |
| `08-dev-plan.md` | 实现计划 | Sprint / task 拆分、验收标准、禁止事项 | 必备 |
| `09-verification.md` | 测试验证 | REQ → 用例追溯、资源验证、验收策略 | 必备 |

每个文档的完整生成关系（上游输入 / 输出职责 / 禁止项 / 下游影响）见 `ai/document-lifecycle-rules.md` §5 生成矩阵。

## 3. 规范约束（写 docs/ 时必须遵守）

- **编号固定**：`00-09` 编号不因项目而变；根目录只放 `README.md` 与 `00-09`，不堆其它文档（见 §4）。
- **追溯链**：`U-ID → REQ-ID → Phase → 设计 → Sprint → 测试 → 代码`，不留悬空 ID（权威见 `ai/document-lifecycle-rules.md` §6）。
- **阶段双维度标签**：功能范围 `[P1]/[P2]/[愿景]` × 交付物形态 `Demo/MVP/产品`；状态 `骨架 → P{N}-已设计 → P{N}-已实现`（权威见 `ai/global-rules.md` §8）。
- **只增不删**：设计类文档（03-09、design）按积累式演进，不删既有阶段内容（权威见 `ai/global-rules.md` §8.2-3）。
- **三层分工**：`docs/inputs/*`、`docs/vision/*`、`docs/00-09`、`docs/design/*`、`docs/decisions/*`、`docs/research/*` 是项目事实；`template-docs/docs-scaffold/` 是长期参考结构模板；`ai/doc-standards/00-09` 和相关标准是规则 / 审计基线。
- **撰写规范**：`00-09` 每份文档的撰写规范见 `ai/doc-standards/00-09`（只读、审计基线、不手改；由 `sync-template` 刷新）。如需查看模板原始大纲、占位表格和 `【撰写提要：...】`，参考 `template-docs/docs-scaffold/`。

## 4. 根目录只放核心文档

`docs/` 根目录只放：

- `README.md`：本文档。
- `00-scenario.md` ~ `09-verification.md`：核心工程文档；其中 `06` / `07` 可按项目形态省略。

> 模板 `00-09` 结构副本在 `template-docs/docs-scaffold/`，撰写规范 / 审计基线在 `ai/doc-standards/00-09`；两者都不属于 `docs/` 项目事实区。

除上述外，AI 不得在 `docs/` 根目录新增文档。确需新增时，必须先说明原因、建议路径和影响范围，等待人工确认。

## 5. 标准子目录

| 子目录 | 放什么 | 命名建议 |
|---|---|---|
| `docs/inputs/` | 用户原始材料的统一入口；尚未归类、尚未转成 `product-vision` 或 00-09 的输入包，如愿景草稿、小工具 brief、客户 PRD/SRS、外部需求包、现有系统说明 | `initial-brief.md`、`client-prd.md`、`input-review-report.md`、`<topic>/README.md` |
| `docs/vision/` | 可选的整理后产品愿景叙事 / 长期业务图景；通常由 AI 或团队从 `docs/inputs/` 评审、补齐、确认后生成 | `product-vision.md`、`market-notes.md` |
| `docs/design/` | 子系统 / 模块 / 前端交互详细设计，以及已确认体验原则等正式设计输入 | `<subsystem>.md`、`auth.md`、`workflow-engine.md`、`frontend-experience-brief.md`、`frontend-interaction.md` |
| `docs/decisions/` | 架构决策记录（ADR）和重要取舍 | `ADR-0001-title.md` |
| `docs/research/` | 技术调研、竞品 / 参考分析、实验结论、技术环境评估报告、需求探索原型记录、视觉效果探索记录 | `topic-summary.md`、`YYYY-MM-DD-tech-env-evaluation-<scope>.md`、`YYYY-MM-DD-frontend-ui-reference-analysis.md`、`YYYY-MM-DD-ui-prototype-exploration.md`、`YYYY-MM-DD-ui-visual-exploration.md` |
| `docs/env/` | 本机环境、资源约束、服务器预案、演示 SOP | `local-env.md`、`server-plan.md`、`local-demo-runbook.md` |
| `docs/meetings/` | 会议纪要、访谈记录、评审记录 | `YYYY-MM-DD-topic.md` |
| `docs/archive/` | 已废弃但需留痕的项目文档 | 保留原名或加日期前缀 |
| `template-docs/web-fullstack-profile.md` | 复杂 Web / 全栈交互项目的可选结构 Profile 与 Walking Skeleton Gate；**人读参考、非项目事实、不直接落入 docs/** | 触发后把 App Shell、目录边界、vertical slice、文件膨胀阈值和 smoke 验证回填到 `04/05/08/09` |
| `template-docs/docs-scaffold/` | 模板 `docs/inputs/*`、`docs/vision/*`、`docs/00-09`、`docs/design/*`、`docs/decisions/*`、`docs/research/*` 长期结构副本，保留原始大纲、占位表格和 `【撰写提要：...】`；**人读参考、非项目事实、不自动覆盖 `docs/` 项目事实** | 随模板同步；旧项目可能残留 `docs/_scaffold/` |
| `ai/doc-standards/` | 模板 `docs/00-09` 与详细设计的撰写规范 / 审计基线；**只读、非项目事实、不直接驱动开发**；改动须走 `_proposals/` 回流模板 | 由 `sync-template` 同步，勿手改 |

## 6. 子系统详细设计

非平凡子系统详细设计统一放入 `docs/design/`，不要放成 `docs/design-<子系统>.md`。

推荐：

```text
docs/design/auth.md
docs/design/workflow-engine.md
docs/design/reporting.md
```

不推荐：

```text
docs/design-auth.md
docs/workflow-engine-design.md
```

前端交互设计也是条件性详细设计文档，推荐放在 `docs/design/frontend-interaction.md`，或按入口拆成 `docs/design/customer-app-interaction.md`、`docs/design/admin-console-interaction.md`、`docs/design/mobile-app-interaction.md`。不要新增 `docs/10-ui-design.md`、`docs/ui-design.md` 或 `docs/design-ui.md`。

独立 Web、移动端、小程序、桌面端等 UI 型项目，若存在多页面、多角色、复杂表单、状态流、验收依赖点击路径，或 Sprint 修改范围包含页面 / 组件 / 管理页 / 搜索问答 UI，应在前端开发前补交互设计，或在 `ai/project-rules.md` §3 / `docs/05-tech-spec.md` 写明豁免理由。该文档只承接 `03/04/05/07/08/09` 已授权内容，写页面流、状态、文案、接口依赖和验收路径，不新增需求、接口或验收目标。

前端交互设计的细粒度标准见 `ai/doc-standards/frontend-interaction.md`。UI 原型策略 / 实现前原型的细粒度标准见 `ai/doc-standards/ui-prototype-strategy.md`；需要独立记录时可参考 `template-docs/ui-prototype-strategy-template.md`。

UI Brief Intake 是前端交互输入补齐材料，用于在输入评审、需求探索原型、正式前端交互设计或前端实现前补齐参考产品、演示主线、页面结构、信息密度、设备范围和视觉禁区。若属于用户原始输入补充，推荐写入 `docs/inputs/ui-brief.md`；若属于 AI 与用户共同探索形成的研究记录，推荐写入 `docs/research/YYYY-MM-DD-ui-brief-intake.md`。模板见 `template-docs/ui-brief-intake-template.md`。UI brief 不替代 `docs/design/frontend-interaction.md`、UI 原型策略、`08` 或 `09`。

需求探索原型是正式 `00-03` 定稿前的可视化澄清材料，默认放在 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`，模板见 `template-docs/ui-prototype-exploration-template.md`。它用于确认页面结构、主流程、信息密度和用户反馈，不替代 `00-09`、不决定架构 / 技术栈 / 接口 / 数据库 / 验收；用户确认后的内容必须回填到 `00-03` 后，才可进入正式设计和实现链路。

UI Exploration to Delivery Pipeline 建议按 `docs/inputs/*` → UI brief / 输入评审 → `docs/research/YYYY-MM-DD-frontend-ui-reference-analysis.md` → `docs/research/YYYY-MM-DD-ui-prototype-exploration.md` → 可选 `docs/research/YYYY-MM-DD-ui-visual-exploration.md` / prototype evidence → `docs/design/frontend-experience-brief.md` → `docs/design/frontend-interaction.md` → UI 原型策略 → `docs/08-dev-plan.md` / `docs/09-verification.md` 推进。`frontend-experience-brief.md` 只记录已确认体验原则、信息架构方向、视觉 / 密度 / 文案方向和阶段边界，不替代正式交互设计、UI 原型策略、`08` 或 `09`；模板见 `template-docs/frontend-experience-brief-template.md`。

视觉效果探索只产生视觉候选、已确认视觉方向或视觉验证失败记录；未确认前不得写入正式设计。可视化原型被用户确认后，也不得直接进入实现，必须先检查是否回填 `frontend-experience-brief`、`frontend-interaction`、UI 原型策略、`08` 和 `09`。

复杂 Web / 全栈交互项目若触发 `template-docs/web-fullstack-profile.md`，应在首个业务 Sprint 前完成或豁免 Web App Structure Profile + Walking Skeleton Gate，并把 App Shell、前后端目录边界、最小 vertical slice、文件膨胀阈值、API / browser smoke 回填到 `04/05/08/09`；该 profile 不替代 UI brief、前端交互设计、UI 原型策略或正式验收记录。

## 7. AI 新增文档规则

AI 判断需要新增文档时，必须按以下顺序处理：

1. 先判断是否能更新现有 `00-09` 或已有子目录文档。
2. 如果必须新增，先按上表选择子目录。
3. 在回复中说明：文档类型、建议路径、为什么不能写入现有文档。
4. 等待人工确认后再创建文件。
5. 新文档必须在标题下写明定位：输入材料 / 详细设计 / 决策记录 / 调研记录 / 会议记录 / 归档。

外部接入文档（策略、调研、决策、会议、接口或客户输入材料）必须先写明与本仓库 docs 的映射、定位声明和影响范围。尚未归类的原始输入先放 `docs/inputs/`；评审后，策略 / 决策类放 `docs/decisions/`，调研 / 实验类放 `docs/research/`，会议或访谈放 `docs/meetings/`。不要把未经评审的原始材料直接放入 `docs/vision/`；`docs/vision/` 只承载整理后的愿景叙事或兼容旧项目已有愿景文档。

## 8. 裁剪决策表

初始化时先按下表填写 `ai/project-rules.md` §3，再决定要保留哪些文档和代码目录：

| 判断条件 | 文档处理 | 目录处理 | 备注 |
|---|---|---|---|
| 无持久化存储 | 删除 `docs/06-db-design.md`，并在 §3 声明省略 | 不因 DB 预留目录 | 浏览器 `localStorage` / `IndexedDB` 写入 `docs/05-tech-spec.md`，不触发 06 |
| 有数据库 / 文件存储 | 保留 `docs/06-db-design.md` | 按技术栈保留 `backend/`、`docker/` 等 | 当前阶段写细，后续阶段可只保留骨架 |
| 无对外接口 | 删除 `docs/07-api-spec.md`，并在 §3 声明省略 | 不因 API 预留 `backend/` | 纯内部库 / 纯计算模块适用 |
| CLI / 本地脚本 | 保留 `docs/07-api-spec.md` | 通常保留 `scripts/`，按需保留 `tests/` | 07 用于描述命令、参数、输出契约 |
| 独立 Web / 移动端 / 小程序 / 桌面端演示 | `docs/04-05` 必须体现前端架构；复杂 UI 按触发条件补 `docs/design/frontend-interaction.md` | 保留 `frontend/`，按需保留 `backend/` | 若愿景含页面/点击/手机等交互词，需人工复核演示形态；前端隐藏不等于权限边界 |
| 消息通道内交互 / 不需演示 | `docs/04-05` 不强制写前端 | 通常删除 `frontend/` | 若后续变更演示形态，再补前端设计 |
| 暂无自动化测试 | `docs/09-verification.md` 仍保留 | 可暂删 `tests/` | 09 至少记录人工验证和本机资源验证 |
| 需要容器 / 外部服务 | `docs/04-05` 写明运行拓扑 | 保留 `docker/` | Demo 优先本机；资源不足再写服务器预案 |
| 需要真实运行依赖 | `docs/05` 前或首个相关 Sprint 前补 `docs/research/*tech-env-evaluation*.md`，或记录豁免理由 | 按技术栈保留依赖文件 / 启动脚本 | `collect-env` 只采集事实，不等于依赖安装 / 最小运行验证通过 |

## 9. 轻量项目路径

若项目是小脚本、一次性实验或纯工具库，仍保留基本边界与验证口径即可：

1. 把最小 brief 写入 `docs/inputs/initial-brief.md`，至少回答目标用户、问题 / 价值、核心场景、输入输出、非目标和验收方式。
2. 用 `ai/prompts/docs/01-review-inputs.md` 做输入评审；不足时先生成 `docs/inputs/input-review-report.md` 和最小补充清单，补齐后复评。
3. 评审通过后再生成或更新 `docs/vision/product-vision.md`，作为 `00-09` 的上游愿景锚点。
4. 运行 `scripts/collect-env.ps1`，确认本机可运行边界。
5. 按上面的裁剪表决定是否省略 `docs/06`、`docs/07` 和代码目录。
6. 保留最小版 `docs/03-prd.md`、`04-architecture.md`、`05-tech-spec.md`、`08-dev-plan.md`、`09-verification.md`。
7. 每次只实现一个小任务；验证结果记录到 `docs/09-verification.md` 或当前 Sprint。
