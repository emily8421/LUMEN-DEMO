# 00 多入口生成 / 补齐完整文档体系（inputs → docs）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：从已评审通过的 `docs/inputs/`、产品愿景、00 场景、用户需求清单、SRS、PRD、任务单、现有系统说明或外部接入文档出发，生成或补齐完整 `docs/` 文档体系。

**目的**：把可审计上游输入转成可开发、可审查、可验收的工程文档，并给出 Phase 路线图建议与追溯链。

**适用场景**：项目已有通过 `ai/prompts/docs/01-review-inputs.md` 评审的输入包、愿景文档、00 场景、用户需求清单、SRS、PRD、任务单、现有系统说明或外部输入，需要生成或补齐 docs 文档体系。若从非愿景入口开始，必须按 `ai/document-lifecycle-rules.md` 声明入口模式、文档剖面和需反向补齐的最小上游摘要。

**不适用场景**：输入材料尚未评审、入口模式不清或缺口不明；这种情况先用 `ai/prompts/docs/01-review-inputs.md`。已经进入单任务开发时，用 `ai/prompts/dev/02-run-task.md`。

**使用前准备**：准备至少一个可审计上游输入，并先完成输入材料评审与愿景就绪评估；若评审结论为 Not Ready，不得使用本 Prompt。建议先用 `ai/prompts/setup/13-collect-env.md` 生成 `docs/env/local-env.md`，并确认 `ai/project-rules.md` 的项目名称、Phase 边界、技术栈、运行环境与项目形态能被初步填写或由 AI 提出待确认项。

**预期产出**：`docs/00-09`、必要的 `docs/design/*` 子系统 / 前端交互详细设计、阶段建议、验证计划、项目化 README。

**使用后下一步**：人工确认 `docs/03-prd.md` §3 阶段路线图；确认后进入 `ai/prompts/dev/02-run-task.md` 执行 Sprint-1。

```text
请基于可审计上游输入生成 / 补齐完整 docs/ 文档体系（含阶段建议）。如果用户要求“生成整个文档体系 / 补齐全部文档 / 铺完整 docs”，不得直接写文件；先按 `ai/document-lifecycle-rules.md` §10.1 输出阶段路线和生成模式选择。

上游输入：docs/inputs/ 中已评审通过的输入摘要 + docs/vision/product-vision.md（可替换为 00 / 01 / 02 / 03 / task / 现有系统说明 / 外部接入文档）
先阅读：ai/index.md 列出的全部规则文件（尤其 `ai/document-lifecycle-rules.md`）+ 该上游输入 + docs/env/local-env.md（如存在）。
按范围读取标准：生成整个文档体系时读取已存在的 `ai/doc-standards/00-09` 与 `ai/doc-standards/design-doc.md`；只生成需求阶段时读取 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md`；生成 DB / API 详细设计时读取 `ai/doc-standards/06-db-design.md`、`07-api-spec.md`；生成或补齐 `docs/design/*` 时读取 `ai/doc-standards/design-doc.md`；生成或补齐前端交互设计时还必须读取 `ai/doc-standards/frontend-interaction.md`，若上游已有 UI brief、需求探索原型、视觉效果探索或 experience brief，先检查用户确认依据和 open items；触发 UI 原型策略 / 实现前原型时还必须读取 `ai/doc-standards/ui-prototype-strategy.md`，必要时引用 `template-docs/ui-prototype-strategy-template.md`；触发复杂 Web / 全栈交互结构门禁时还必须引用 `template-docs/web-fullstack-profile.md`，并在 `04/05/08/09` 中补 App Shell、目录边界、vertical slice、文件膨胀阈值和 API / browser smoke；生成计划 / 验证阶段时读取 `ai/doc-standards/08-dev-plan.md`、`09-verification.md`；精修单文档时读取对应 `ai/doc-standards/<doc>.md`。

【前置门槛】
- 先说明文档体系生成阶段路线：输入材料评审 → 需求确认 → 需求分析 → 总体设计 → 技术选型 / 技术路线评估 → 详细设计 → 验证用例设计 → 执行计划 / Sprint 规划 → 完整文档体系评估与审计 → 待确认事项总览与编码前门禁。
- 先提供两种模式并等待用户确认：分阶段确认模式（默认推荐）/ 输入充分后批量生成模式（必须先做输入充分性评估，生成后必须做完整评估 / 审计）。若用户已在同一轮明确授权某种模式，可继续执行但仍需记录选择。
- 分阶段确认模式下，每阶段结束前必须输出：阶段产物、待确认事项总览更新、进入下一阶段条件和用户需确认的问题。
- 输入充分后批量生成模式下，批量起草前必须说明输入充分性依据；生成后必须运行或建议运行 `docs-evaluation`、`docs-system-audit` 和 `docs-open-items`。
- 必须先确认 `ai/prompts/docs/01-review-inputs.md` 已输出 Product Vision 就绪度。
- 若结论为 Not Ready：停止生成，输出最小补充清单和评估报告建议路径（`docs/inputs/input-review-report.md` 或 `docs/inputs/<topic>/input-review-report.md`）。
- 若结论为 Conditionally Ready：允许生成 / 更新 `docs/vision/product-vision.md`，但必须把不确定项标为“待人工确认”，不得伪装成事实。
- 若结论为 Ready：先生成 / 更新 `docs/vision/product-vision.md`，再由 product-vision 与输入来源锚点生成 `00-09`。
- 若用户尚未运行输入评审，先转用 `ai/prompts/docs/01-review-inputs.md`，不要直接生成 00-09。

【心智模型，务必遵守】
- 两层分离：需求层(00-03)完整描述系统、跨阶段稳定、不按阶段裁剪；
  执行层(project-rules §1 + 04-09 + docs/design/* + 09-verification)描述"现在建什么"。
- 积累式(global-rules §8)：设计文档「完整骨架 + 功能范围 + 交付物形态 + 状态」，只增不删、不建分阶段文档。
- 阶段是 AI 提议、非决定：在 03 §3 提议路线图并标"待人工确认"；每个 Phase 必须同时声明功能范围与交付物形态，所有阶段标签取自该提议。
- 交付物递进：愿景最终交付物默认为产品；阶段交付物可为 Demo / MVP / 产品，Demo 不得被声称为 MVP 或产品。
- 文档生命周期：每份文档必须按 `ai/document-lifecycle-rules.md` 说明上游输入、输出职责、追溯关系和下游影响；愿景场景锚点 / 输入来源 → U-ID → REQ-ID → Phase → 设计 / Sprint / 验证必须可追溯。
- 标准分层：`ai/doc-standards/<doc>.md` 是细粒度规范标准，`docs/<doc>.md` 是项目事实大纲模板；生成时用标准判断字段和禁止项，用 docs 大纲承载项目事实。
- 需求链健康度：`00-03` 必须能形成 `SC-ID → U-ID → REQ-ID → Phase → AC / TC`；当前 Phase 的 REQ 必须有可观察验收或测试入口，远期 REQ 可保留骨架并标待该阶段细化。
- 多入口：默认从 `docs/inputs/` 评审闭环开始，不强制所有项目一开始就已有愿景文档；若从 00 / 01 / 02 / 03 / task / 现有系统事实 / 外部文档开始，必须声明入口模式与文档剖面，并为缺失的上游文档生成“轻量摘要·待人工确认”，不得伪装成原始输入。
- 模板骨架：生成或补齐 `docs/00-09` 时必须保留模板中的“文档定位 / 上游输入 / 下游输出 / 文档元信息 / 撰写提要 / 追溯矩阵 / 待人工确认项”等结构；可以用项目事实替换占位内容，但不得删掉追溯、状态、阶段和下游影响栏目。
- Product Vision 处置：派生项目必须替换 `docs/vision/product-vision.md` 的模板占位内容；真实原始输入默认放入 `docs/inputs/`。若输入评审已达到 Ready / Conditionally Ready，先生成或更新 product-vision，并保留来源锚点与待确认项；若暂不启用 product-vision，必须在该文件“启用状态”写明未启用，不得把模板愿景当作项目事实。
- 待确认项结构：写入正式文档的待人工确认项必须使用表格，至少包含 `ID / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`；AI 建议不得伪装成用户已确认事实。
- 专题讨论优先：需求层人机交互、总体设计 / 技术选型、交互设计方案若尚未确认，应先作为专题方案讨论输出多方案、依据、AI 推荐、待确认项和回填位置；人工确认前不得直接写成正式事实。

【按依赖顺序生成，可分批但须全部产出】

1) 需求层（完整）
   - product-vision：保留“启用状态与替换说明”，确认是否 Vision-first / Inputs-first 提炼；不要保留模板占位当项目事实；若由 `docs/inputs/` 提炼，写明输入评审结论、来源锚点和待确认项
   - 00-scenario：按 `ai/doc-standards/00-scenario.md` 和 docs 大纲写文档元信息、背景与问题、角色、场景、边界 / 非目标、来源映射和下游影响；无来源场景不得进入 01
   - 01-user-requirements：按 `ai/doc-standards/01-user-requirements.md` 和 docs 大纲写 U-ID、操作流、用户可观察验收口径（AC-ID）、优先级建议、排除需求和 `SC-ID → U-ID → REQ-ID` 追溯矩阵
   - 02-srs：按 `ai/doc-standards/02-srs.md` 和 docs 大纲写功能需求、非功能需求、约束假设、边界异常、验证入口和 `U-ID → REQ-ID → AC / TC` 追溯矩阵

2) 阶段建议 → 写入 03-prd §3（标"AI建议·待确认"）
   - 03-prd：按 `ai/doc-standards/03-prd.md` 和 docs 大纲聚合功能、Phase 路线图、优先级取舍、非目标、REQ 覆盖和证据 / 验收引用
   - 每个 Phase 同时写：功能范围（覆盖哪些 REQ）+ 交付物形态（Demo/MVP/产品）+ 为什么这样切 + 演示/上线/生产化口径 + 进入/退出标准 + 状态 + 证据 / 验收引用
   - Phase1 通常优先 Demo：能独立演示核心价值的最小连贯子集；不得默认称为 MVP
   - 后续 Phase 可递进为 MVP 或产品；高风险/待技术验证项单列为远期愿景
   - 据此给 project-rules §1 允许/禁止草稿，并明确当前 Phase 的交付物形态

3) 总体设计（完整框架）
   - 04-architecture：按模板结构和 `ai/doc-standards/04-architecture.md` 写架构目标、上下文图、COMP / MOD / Flow ID、异常 / 降级 / 权限拒绝路径、部署拓扑、ADR 和 REQ → 模块矩阵
   - 05-tech-spec：按模板结构和 `ai/doc-standards/05-tech-spec.md` 写技术栈、关键技术决策、依赖配置、敏感性、资源评估、Phase 技术约束、编码约定、安全合规、Risk-ID、readiness gate 和风险验证

4) 详细设计（完整骨架 + 当前阶段细节）
   - 06-db-design：若保留，按模板结构和 `ai/doc-standards/06-db-design.md` 写保留/省略决策、数据需求、概念模型、目标结构与当前实现对照、字段级契约、索引关系、迁移 / seed / 回滚、数据安全留存、DB / API 交叉追溯和 REQ → 表 / 字段矩阵
   - 07-api-spec：若保留，按模板结构和 `ai/doc-standards/07-api-spec.md` 写保留/省略决策、接口形态、统一约定、API-ID、endpoint contract matrix、输入输出契约、错误码、权限安全、异步状态机、版本演进、API ↔ DB / Service / Test 追溯和 REQ → 接口矩阵
   - docs/design/<子系统>.md：每个非平凡子系统一份（框架 + 当前阶段细节），按 `ai/doc-standards/design-doc.md` 写文档元信息、职责边界、上游追溯、流程 / 状态机、数据 / 接口 / 权限契约引用、失败 / 降级路径、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项；UI 型项目前端交互设计还要按 `ai/document-lifecycle-rules.md §5.2.1 / §5.3` 判断是否存在 UI brief、参考分析、需求探索原型、视觉效果探索、experience brief 和 UI 原型策略，记录已确认体验原则、默认 UI 标准基线、推荐原型形式、权威位置、覆盖范围、UI / 后端 / 双轨顺序判断与豁免理由；若因简单项目豁免，必须在 `ai/project-rules.md` §3 或 `docs/05-tech-spec.md` 说明原因
   - 08-dev-plan：按模板结构和 `ai/doc-standards/08-dev-plan.md` 写当前 Phase 目标、Sprint 总览、Sprint 详情、验证包、完成包、依赖里程碑、任务拆分规则和进度记录
   - 09-verification：按模板结构和 `ai/doc-standards/09-verification.md` 写验证策略、REQ → TC 矩阵、TC 用例详情、TC 状态、分阶段验证范围、本机资源验证、验收记录、Sprint 验收包、缺陷 / 回归记录和未验证风险

5) 项目 README
   - 将根 README 项目化：根据愿景与阶段建议生成项目简介、当前能力、快速开始、文档入口、模板关系与当前进度
   - 不得保留模板仓库 README 的 `# ai-project-template` 说明作为项目 README

6) 运行环境与资源评估
   - 若 `docs/env/local-env.md` 不存在，提示先运行 `ai/prompts/setup/13-collect-env.md` 的环境采集 Prompt
   - 04-architecture：说明本地单机 / 公司服务器 / 远程服务的运行拓扑约束
   - 05-tech-spec：必须输出本机 Demo 可行性、资源瓶颈、依赖配置敏感性、Risk-ID、readiness gate、降级 / Mock 策略和服务器资源预案
   - 09-verification：必须包含本机资源验证项
   - 若项目保留 backend / frontend / docker / 数据库 / 本机模型 / 外部 API / LLM / 重型 SDK / 真实数据 / 权限安全等真实运行依赖，应建议生成或补做 `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`；评估结果必须映射回 `05` Risk-ID / readiness gate、`09` 验证项和 `08` Sprint 解锁条件；未评估时不得把依赖安装、导入、最小运行写成已通过

【硬约束】
1. 完整不裁剪：01/02 装下整个愿景，每条可回锚点为证；不得因阶段而删功能
2. 阶段是提议非决定：03 §3 路线图标"待确认"，阶段标签据此打；每个 Phase 必须声明功能范围 + 交付物形态
3. 框架一次完整：04-09 + docs/design/* 铺全部要素（含 P2/愿景骨架），不只写当前阶段
4. 新增文档必须遵守 `docs/README.md`：根目录只放 00-09 和 README；调研、决策、会议、详细设计等必须进入对应子目录
5. 只增不删、原位增量（global-rules §8）
6. 全链追溯：上游输入锚点 → U-ID → REQ-ID → 03 §3 阶段 → 04/05 模块与技术决策 → 06/07 表字段 / API-ID / 错误码 / 权限契约 → docs/design/* Design Point / readiness gate → 08 Sprint / task → 09 验收用例；生成后自检无悬空 U-ID / REQ / 设计要素 / Sprint / 验证用例
7. 当前阶段 REQ 可验证；远期粗粒度，不硬凑
8. 产品红线永久有效：不编造事实；Demo 阶段也必须用检索原文 / 明确 Mock / 明确占位保护红线，不得因演示而输出无依据结论
9. 高风险 AI 项（跨文档推理/矛盾检测/证据地图等）标"愿景·待技术验证"，不进当前阶段
10. 演示形态：据 ai/project-rules.md §3「演示形态」推导 `frontend/` 是否启用、docs/04-05 是否体现前端；解析愿景文档，若含「页面 / 界面 / 点击 / 手机 / 打开」等界面交互词且 §3 标为无前端或不需演示，必须警告并提示人工复核
11. 前端交互设计与 UI 原型策略：若交付形态包含独立 Web / 移动端 / 小程序 / 桌面端，或存在多页面、多角色、复杂表单、状态流、管理页、搜索 / 问答 UI、验收依赖点击路径，应生成或建议生成 `docs/design/frontend-interaction.md`（或按入口拆分 `docs/design/*interaction*.md`）；若 UI brief、参考分析、需求探索原型、视觉效果探索已有用户确认，可先生成或建议生成 `docs/design/frontend-experience-brief.md` 承接已确认体验原则。若不生成前端交互设计或 experience brief，必须在 `ai/project-rules.md` §3 或 `docs/05-tech-spec.md` 写明豁免理由。满足 UI 原型策略触发条件时，还必须在 `ai/project-rules.md` §2.7、`docs/05-tech-spec.md` 或前端交互设计中选择原型策略或写明豁免，说明默认 UI 标准基线、原型形式、权威位置、主流程 / 状态 / 响应式 / 权限与降级覆盖范围、UI / 后端 / 双轨顺序判断，以及与 `08/09` 的追溯
12. Web App Structure Profile：若项目同时启用 `frontend/` 与 `backend/`、需要浏览器演示、多页面 / 多状态 / 多角色 / 数据密集界面，或首个前端 Sprint 可能堆入单个主应用文件，应引用 `template-docs/web-fullstack-profile.md`，在 `04/05/08/09` 中补 App Shell、目录边界、API client ↔ API-ID、vertical slice、文件膨胀阈值、Sprint 0 / Walking Skeleton 和 API / browser smoke；若豁免，必须写明理由、风险和补做时点
12. 技术方案必须受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束；Demo / MVP 优先本机可运行，若本机资源不足，必须明确所需公司服务器资源与触发条件；真实运行依赖项目在生成 / 修订 05 或进入首个编码 Sprint 前，应补技术路线与环境支撑评估或记录跳过理由，并在 `05` 建立 Risk-ID / readiness gate 与 `09`、`08` 的映射
13. 声称据实：技术栈/实现状态必须区分「已启用 / 已验证 / 候选 / 默认关闭 / Mock / 降级 / 禁止」；不得把候选、预留、默认关闭、Mock 或降级写成已启用，无法核实时列为待确认
14. 横切状态：按 `ai/document-lifecycle-rules.md` §7.1 使用「目标设计 / 草案 / 候选 / 待人工确认 / 待技术验证 / Mock / 降级 / 默认关闭 / 预留·未启用 / 已验证 / 已启用 / 禁止」等状态词；不得把低确定性状态写成已验证或已启用
15. 每份文档生成前用 1-2 句说结构；全部生成后用 `ai/prompts/review/10-docs-checklist.md` 自查，单列"需人工确认项"，并为每项补齐 AI 建议、建议依据、备选方案、取舍影响和阻塞关系
16. 多文档生成后必须输出“待确认事项总览”，字段采用 `ID / 提出时间 / 来源 / 待确认事项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 需确认节点 / 阻塞关系 / 回填位置 / 当前状态 / 关闭依据`
17. 完整文档体系生成完成后，必须触发完整文档体系评估 / 审计，并输出 Go / Conditional Go / No Go 或报告落盘建议
18. 文档模板结构是最低要求：不得只输出标题和简单列表；每份核心文档必须包含撰写提要所对应的实际内容、表格或待确认项。

【人工确认后】
确认/调整 03 §3 路线图 → 若调整，按 `ai/prompts/docs/04-edit-single-doc.md` 把阶段标签同步到各文档（需求不变，只动标签）→ 用 `ai/prompts/dev/02-run-task.md` 执行 Sprint-1，进入编码。
```
