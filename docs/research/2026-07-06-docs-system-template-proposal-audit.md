# Batch 0 文档体系模板提案审计报告

> 定位：本报告是只读审计与模板提案 backlog，不替代 `docs/00-09` 正式文档修订，不直接定义 LUMEN 项目需求。
> 评估日期：2026-07-06
> 范围：`docs/00-09`、`docs/design/*`、`ai/doc-standards/*`、既有 `_proposals/TEMPLATE-UPGRADE-*.md`

## 1. 评估摘要

本次 Batch 0 只读审计的目标，是判断当前项目文档体系暴露出的哪些问题属于可回流到 `ai-project-template` 的通用模板规范缺口，并形成后续提案拆分计划。

结论：建议将模板优化拆成多个独立提案，不建议一次性把 `00-09` 与 `docs/design/*` 的全部建议写进一个大提案。

关键判断：

- `docs/00-09` 已具备完整文档链，但不少文档仍低于最新 `ai/doc-standards/*` 的章节粒度。
- 多数问题并非 LUMEN 专属，而是模板规范需要更细化：来源映射、追溯矩阵、状态回写、Mock / 降级、验收证据、详细设计统一结构。
- 已有 `09` 独立提案 `_proposals/TEMPLATE-UPGRADE-09-verification-standard-detail.md`，后续不重复起草。
- 后续每个 Batch 都应先生成一份审计报告，再按确认范围起草对应模板提案，避免提案之间重复、冲突或遗漏。

## 2. 审计方法

本次审计采用以下方式：

1. 对照 `ai/doc-standards/00-scenario.md` 至 `ai/doc-standards/09-verification.md`，检查项目 `docs/00-09` 的章节、追溯、阶段标签和待确认项结构。
2. 扫描 `docs/design/*`，检查详细设计文档是否具备统一的定位、职责、边界、流程、失败处理、阶段增量、跨文档追溯和待确认项。
3. 对照既有 `_proposals/`，避免与已起草提案重复。
4. 仅记录可通用于多个派生项目的模板改进点；项目自身修订建议不在本报告直接执行。

## 3. 00-09 逐文档审计结论

| 文档 | 当前观察 | 建议方向 | 模板提案归属 |
|---|---|---|---|
| `docs/00-scenario.md` | 有背景、目标用户和典型场景，但缺少规范镜像要求的场景边界、上游来源映射、下游影响 | 模板应要求 `00` 输出“场景→来源→U-ID”锚点，并明确非目标与变更传播范围 | P-01 |
| `docs/01-user-requirements.md` | 按阶段列出 U-ID，但缺少用户操作流、用户验收口径、优先级理由和追溯矩阵 | 模板应允许阶段分组，但必须保留 U-ID 总览、Flow、验收口径、来源锚点和下游 REQ 映射 | P-01 |
| `docs/02-srs.md` | P1 功能 REQ 清楚，但非功能需求、约束假设、异常场景 / 边界条件不足 | 模板应要求 SRS 同时覆盖功能需求、NFR、约束、异常 / 边界场景和 U→REQ 追溯 | P-01 |
| `docs/03-prd.md` | 有阶段路线图和覆盖矩阵，但目标、取舍、进入 / 退出标准可更结构化 | 模板应要求 Phase 总览表、功能范围 + 交付物形态、进入 / 退出标准、非目标和取舍依据 | P-01 |
| `docs/04-architecture.md` | 有架构图、模块和关键流程，但缺少上下文图、容器 / 组件视图、ADR 式取舍记录 | 模板应细化架构视图、运行拓扑、数据流、架构决策和约束来源 | P-02 |
| `docs/05-tech-spec.md` | 技术栈和关键决策清晰，但缺少依赖配置、安全隐私、技术风险验证计划的独立章节 | 模板应强化依赖 / 配置矩阵、密钥 / 隐私边界、技术风险 → 09 验证映射 | P-02 |
| `docs/06-db-design.md` | 表结构较完整，但缺少数据需求概览、概念模型、迁移初始化、安全留存 | 模板应要求 ER / 概念模型、seed / migration、数据留存、敏感字段和索引 / 约束策略 | P-03 |
| `docs/07-api-spec.md` | 有接口清单与示例，但缺少 endpoint 级请求、响应、错误、权限、兼容性契约 | 模板应细化逐接口契约、错误码矩阵、鉴权 / 限流、版本兼容和 API → REQ 追溯 | P-03 |
| `docs/08-dev-plan.md` | Sprint 详情完整，但缺少 Phase 目标、Sprint 总览、依赖关系、当前进度记录 | 模板应要求 Sprint 总览表、依赖图、任务拆分规则、进度状态、TC / Task 追溯 | P-04 |
| `docs/09-verification.md` | 有 REQ 矩阵，但缺少 TC-ID、用例详情、验收包、回归记录 | 已起草独立提案 | P-05 |

## 4. `docs/design/*` 审计结论

| 文档 | 当前观察 | 建议方向 | 模板提案归属 |
|---|---|---|---|
| `docs/design/frontend-interaction.md` | 前端交互设计较完整，但缺少通用元信息、实现偏差记录、结构化待确认项 | 建立 `docs/design/*` 通用模板，要求元信息、职责边界、页面 / 流程、状态、验收追溯和待确认项结构 | P-06 |
| `docs/design/ingestion.md` | 写了真实 Word / PDF / OCR 流程，但 Mock / 降级与实现偏差需要更显式 | 详细设计模板应要求 Mock / 降级口径、失败状态表、资源约束和实现状态差异区 | P-06 / P-07 |
| `docs/design/intelligence-analysis.md` | 愿景骨架清晰，但高风险能力缺少进入 Phase 前的验证门槛模板 | 详细设计模板应支持高风险愿景能力的 readiness gate、Spike / PoC 条件和不得提前实现声明 | P-06 |
| `docs/design/permissions.md` | 权限过滤点明确，但缺少角色 × 动作矩阵、负向用例、泄露边界 | 可在通用 design 模板中加入权限 / 安全检查项，或单独形成权限设计 checklist | P-06 / P-08 |
| `docs/design/rag-retrieval.md` | RAG 流程清晰，但缺少评分参数、Prompt 合同、来源引用合同、质量评估 | Mock / AI 子系统设计规范应要求召回、Prompt、来源、失败降级、质量评估指标 | P-07 |
| `docs/design/term-management.md` | 核心流程清晰，但缺少冲突规则、字段 / API 对齐、权限动作、测试追溯 | 通用 design 模板应要求字段契约、状态机、权限动作、TC 映射 | P-06 |

## 5. 模板提案 Backlog

| ID | 建议文件名 | 主题 | 优先级 | 当前状态 |
|---|---|---|---|---|
| P-01 | `TEMPLATE-UPGRADE-00-03-requirements-chain-standard.md` | 00-03 需求链规范细化 | P0 | 待起草 |
| P-02 | `TEMPLATE-UPGRADE-04-05-architecture-tech-standard.md` | 架构与技术方案规范细化 | P0 | 待起草 |
| P-03 | `TEMPLATE-UPGRADE-06-07-db-api-contract-standard.md` | DB / API 契约规范细化 | P0 | 待起草 |
| P-04 | `TEMPLATE-UPGRADE-08-dev-plan-progress-standard.md` | 开发计划、Sprint 总览与进度规范 | P1 | 待起草 |
| P-05 | `TEMPLATE-UPGRADE-09-verification-standard-detail.md` | 09 验证规范细化 | P0 | 已起草，待提交 / 回流 |
| P-06 | `TEMPLATE-UPGRADE-design-doc-standard.md` | `docs/design/*` 通用详细设计规范 | P0 | 待起草 |
| P-07 | `TEMPLATE-UPGRADE-mock-degradation-design-standard.md` | Mock / 降级跨文档规范 | P1 | 待判断是否并入 P-02 / P-06 |
| P-08 | `TEMPLATE-UPGRADE-permission-security-design-checklist.md` | 权限 / 安全设计检查表 | P2 | 待判断是否并入 P-06 |

## 6. 推荐执行顺序

1. Batch 1：生成 Batch 1 审计报告，并起草 P-01（00-03 需求链规范）。
2. Batch 2：生成 Batch 2 审计报告，并起草 P-02（04-05 架构与技术方案规范）。
3. Batch 3：生成 Batch 3 审计报告，并起草 P-03（06-07 DB / API 契约规范）。
4. Batch 4：生成 Batch 4 审计报告，提交 / 回流 P-05，并起草 P-04（08 开发计划规范）。
5. Batch 5：生成 Batch 5 审计报告，并起草 P-06（design 通用规范）。
6. Batch 6：去重合并，判断 P-07 / P-08 是否需要独立回流，并形成回流顺序建议。

## 7. 每个 Batch 的报告要求

后续每个 Batch 都应先生成独立审计报告，建议路径：

```text
docs/research/YYYY-MM-DD-template-proposal-audit-batch-<N>-<scope>.md
```

每份报告至少包含：

1. 审计范围与输入文档。
2. 逐文档观察。
3. 可回流模板缺口。
4. 与既有提案的重复 / 依赖关系。
5. 建议起草的提案文件名。
6. 是否需要拆分或合并提案。
7. 待人工确认项。

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-B0-001 | 后续是否每个 Batch 都先落盘审计报告再起草提案 | 建议采用 | 可避免长任务中断和提案重复 / 漂移 | 只写提案，不写审计报告 | 节省文件数量，但后续难追溯为何拆分 |
| C-B0-002 | P-07 / P-08 是否独立成提案 | 建议先等 P-02 / P-06 起草后再决定 | Mock / 降级与权限安全可能跨多个文档，过早拆分容易重复 | 立即独立起草 | 可能更清晰，但会增加提案数量与维护成本 |
| C-B0-003 | 是否把本报告提交到仓库 | 建议提交 | 本报告是后续多个模板提案的依据 | 仅保留本地 | 不提交则跨会话 / 跨工具追溯能力弱 |

## 9. 后续动作

- 已完成：Batch 0 全量只读审计。
- 下一步：起草 P-01 `TEMPLATE-UPGRADE-00-03-requirements-chain-standard.md`。
- 后续：每个 Batch 先落盘审计报告，再起草提案；提案成熟后按 `/run submit-proposal` 回流到模板仓 issue。
