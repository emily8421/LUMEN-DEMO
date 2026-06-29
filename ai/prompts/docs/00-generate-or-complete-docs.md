# 00 多入口生成 / 补齐完整文档体系（inputs → docs）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：从产品愿景、00 场景、用户需求清单、SRS、PRD、任务单、现有系统说明或外部接入文档出发，生成或补齐完整 `docs/` 文档体系。

**目的**：把可审计上游输入转成可开发、可审查、可验收的工程文档，并给出 Phase 路线图建议与追溯链。

**适用场景**：项目已有愿景文档、00 场景、用户需求清单、SRS、PRD、任务单、现有系统说明或外部输入等任一上游输入包，需要生成或补齐 docs 文档体系。若从非愿景入口开始，必须按 `ai/document-lifecycle-rules.md` 声明入口模式、文档剖面和需反向补齐的最小上游摘要。

**不适用场景**：输入材料尚未评审、入口模式不清或缺口不明；这种情况先用 `ai/prompts/docs/01-review-inputs.md`。已经进入单任务开发时，用 `ai/prompts/dev/02-run-task.md`。

**使用前准备**：准备至少一个可审计上游输入；建议先用 `ai/prompts/setup/13-collect-env.md` 生成 `docs/env/local-env.md`，并确认 `ai/project-rules.md` 的项目名称、Phase 边界、技术栈、运行环境与项目形态能被初步填写或由 AI 提出待确认项。

**预期产出**：`docs/00-09`、必要的 `docs/design/*` 子系统设计、阶段建议、验证计划、项目化 README。

**使用后下一步**：人工确认 `docs/03-prd.md` §3 阶段路线图；确认后进入 `ai/prompts/dev/02-run-task.md` 执行 Sprint-1。

```text
请基于可审计上游输入生成 / 补齐完整 docs/ 文档体系（含阶段建议）。

上游输入：docs/vision/product-vision.md（可替换为 00 / 01 / 02 / 03 / task / 现有系统说明 / 外部接入文档）
先阅读：ai/index.md 列出的全部规则文件（尤其 `ai/document-lifecycle-rules.md`）+ 该上游输入 + docs/env/local-env.md（如存在）。

【心智模型，务必遵守】
- 两层分离：需求层(00-03)完整描述系统、跨阶段稳定、不按阶段裁剪；
  执行层(project-rules §1 + 04-09 + docs/design/* + 09-verification)描述"现在建什么"。
- 积累式(global-rules §8)：设计文档「完整骨架 + 功能范围 + 交付物形态 + 状态」，只增不删、不建分阶段文档。
- 阶段是 AI 提议、非决定：在 03 §3 提议路线图并标"待人工确认"；每个 Phase 必须同时声明功能范围与交付物形态，所有阶段标签取自该提议。
- 交付物递进：愿景最终交付物默认为产品；阶段交付物可为 Demo / MVP / 产品，Demo 不得被声称为 MVP 或产品。
- 文档生命周期：每份文档必须按 `ai/document-lifecycle-rules.md` 说明上游输入、输出职责、追溯关系和下游影响；愿景场景锚点 / 输入来源 → U-ID → REQ-ID → Phase → 设计 / Sprint / 验证必须可追溯。
- 多入口：不强制所有项目从愿景文档开始；若从 00 / 01 / 02 / 03 / task / 现有系统事实 / 外部文档开始，必须声明入口模式与文档剖面，并为缺失的上游文档生成“轻量摘要·待人工确认”，不得伪装成原始输入。
- 模板骨架：生成或补齐 `docs/00-09` 时必须保留模板中的“文档定位 / 上游输入 / 下游输出 / 文档元信息 / 撰写提要 / 追溯矩阵 / 待人工确认项”等结构；可以用项目事实替换占位内容，但不得删掉追溯、状态、阶段和下游影响栏目。
- Product Vision 处置：派生项目必须替换 `docs/vision/product-vision.md` 的模板占位内容；若不启用 Vision-first，必须在该文件“启用状态”写明未启用，并把真实输入放入 `docs/inputs/`，不得把模板愿景当作项目事实。

【按依赖顺序生成，可分批但须全部产出】

1) 需求层（完整）
   - product-vision：保留“启用状态与替换说明”，确认是否 Vision-first；不要保留模板占位当项目事实
   - 00-scenario：按模板结构写文档元信息、背景与问题、角色、场景、来源映射和下游影响
   - 01-user-requirements：按模板结构写 U-ID、操作流、验收口径、优先级建议、排除需求和 U-ID 追溯矩阵
   - 02-srs：按模板结构写功能需求、非功能需求、约束假设、边界异常和 U-ID → REQ-ID 追溯矩阵

2) 阶段建议 → 写入 03-prd §3（标"AI建议·待确认"）
   - 每个 Phase 同时写：功能范围（覆盖哪些 REQ）+ 交付物形态（Demo/MVP/产品）+ 为什么这样切 + 演示/上线/生产化口径 + 进入/退出标准
   - Phase1 通常优先 Demo：能独立演示核心价值的最小连贯子集；不得默认称为 MVP
   - 后续 Phase 可递进为 MVP 或产品；高风险/待技术验证项单列为远期愿景
   - 据此给 project-rules §1 允许/禁止草稿，并明确当前 Phase 的交付物形态

3) 总体设计（完整框架）
   - 04-architecture：按模板结构写架构目标、上下文图、组件视图、模块划分、关键流程、部署拓扑、架构决策和 REQ → 模块矩阵
   - 05-tech-spec：按模板结构写技术栈、关键技术决策、依赖配置、资源评估、Phase 技术约束、编码约定、安全合规和风险验证

4) 详细设计（完整骨架 + 当前阶段细节）
   - 06-db-design：若保留，按模板结构写保留/省略决策、数据需求、概念模型、表清单、表结构、索引关系、迁移、安全留存和 REQ → 表矩阵
   - 07-api-spec：若保留，按模板结构写保留/省略决策、接口形态、统一约定、接口清单、输入输出契约、错误码、权限安全、版本演进和 REQ → 接口矩阵
   - docs/design/<子系统>.md：每个非平凡子系统一份（框架 + 当前阶段细节）
   - 08-dev-plan：按模板结构写当前 Phase 目标、Sprint 总览、Sprint 详情、依赖里程碑、任务拆分规则和进度记录
   - 09-verification：按模板结构写验证策略、REQ → 用例矩阵、用例详情、分阶段验证范围、本机资源验证、验收记录和未验证风险

5) 项目 README
   - 将根 README 项目化：根据愿景与阶段建议生成项目简介、当前能力、快速开始、文档入口、模板关系与当前进度
   - 不得保留模板仓库 README 的 `# ai-project-template` 说明作为项目 README

6) 运行环境与资源评估
   - 若 `docs/env/local-env.md` 不存在，提示先运行 `ai/prompts/setup/13-collect-env.md` 的环境采集 Prompt
   - 04-architecture：说明本地单机 / 公司服务器 / 远程服务的运行拓扑约束
   - 05-tech-spec：必须输出本机 Demo 可行性、资源瓶颈、降级 / Mock 策略和服务器资源预案
   - 09-verification：必须包含本机资源验证项

【硬约束】
1. 完整不裁剪：01/02 装下整个愿景，每条可回锚点为证；不得因阶段而删功能
2. 阶段是提议非决定：03 §3 路线图标"待确认"，阶段标签据此打；每个 Phase 必须声明功能范围 + 交付物形态
3. 框架一次完整：04-09 + docs/design/* 铺全部要素（含 P2/愿景骨架），不只写当前阶段
4. 新增文档必须遵守 `docs/README.md`：根目录只放 00-09 和 README；调研、决策、会议、详细设计等必须进入对应子目录
5. 只增不删、原位增量（global-rules §8）
6. 全链追溯：上游输入锚点 → U-ID → REQ-ID → 03 §3 阶段 → 04/05 模块与技术决策 → 06/07 表与接口 → 08 Sprint / task → 09 验收用例；生成后自检无悬空 U-ID / REQ / 设计要素 / Sprint / 验证用例
7. 当前阶段 REQ 可验证；远期粗粒度，不硬凑
8. 产品红线永久有效：不编造事实；Demo 阶段也必须用检索原文 / 明确 Mock / 明确占位保护红线，不得因演示而输出无依据结论
9. 高风险 AI 项（跨文档推理/矛盾检测/证据地图等）标"愿景·待技术验证"，不进当前阶段
10. 演示形态：据 ai/project-rules.md §3「演示形态」推导 `frontend/` 是否启用、docs/04-05 是否体现前端；解析愿景文档，若含「页面 / 界面 / 点击 / 手机 / 打开」等界面交互词且 §3 标为无前端或不需演示，必须警告并提示人工复核
11. 技术方案必须受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束；Demo / MVP 优先本机可运行，若本机资源不足，必须明确所需公司服务器资源与触发条件
12. 声称据实：技术栈/实现状态必须区分「已用 / 预留·未启用 / 默认关闭」；不得把候选、预留或默认关闭写成已用，无法核实时列为待确认
13. 每份文档生成前用 1-2 句说结构；全部生成后用 `ai/prompts/review/10-docs-checklist.md` 自查，单列"需人工确认项"
14. 文档模板结构是最低要求：不得只输出标题和简单列表；每份核心文档必须包含撰写提要所对应的实际内容、表格或待确认项。

【人工确认后】
确认/调整 03 §3 路线图 → 若调整，按 `ai/prompts/docs/04-edit-single-doc.md` 把阶段标签同步到各文档（需求不变，只动标签）→ 用 `ai/prompts/dev/02-run-task.md` 执行 Sprint-1，进入编码。
```
