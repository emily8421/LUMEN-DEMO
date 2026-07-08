# 19 文档评估机制（整体 / 阶段 / 单文档）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在关键阶段转换前后，对整体文档体系、某个 PLM 阶段转换或单个文档做正式评估，判断是否可进入下一阶段。

**目的**：把“为什么认为当前文档可以继续往下走”沉淀成可审计的评估结论；评估偏阶段判断与留痕，审计偏全链路回溯找问题。

**适用场景**：评估愿景到需求、需求到总体设计、总体设计到详细设计、详细设计到实现计划、实现计划到验证、实现结果到文档回写；或评估某一份核心文档是否履行输入、输出、追溯和下游影响职责。

**不适用场景**：需要全链路回溯审计旧项目或同步后差异时，优先用 `ai/prompts/review/16-docs-system-audit.md`；编码前最后一道检查用 `ai/prompts/review/10-docs-checklist.md`；需要直接修正文档时用 `ai/prompts/docs/04-edit-single-doc.md`。

**使用前准备**：明确评估粒度与范围；准备相关 `docs/00-09`、`docs/design/`、`docs/env/`、`ai/project-rules.md` 和输入材料。

**预期产出**：评估报告草稿，包含评估摘要、范围与依据、评估维度结果、`Go / Conditional Go / No Go` 结论、阻塞项、修复建议和结构化待人工确认项。

**使用后下一步**：若用户确认需要留痕，将报告写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`；若发现需修复项，再用 `ai/prompts/docs/04-edit-single-doc.md` 或对应流程最小变更修正。

```text
请对当前项目文档做一次文档评估，不要直接修改文件。

评估粒度（任选其一）：
1. 整体评估：判断当前 docs 文档体系是否能支撑下一阶段。
2. 阶段评估：按 E1-E6 判断某个阶段转换是否可进入下一步。
3. 单文档评估：只评估一份文档的输入来源、输出职责、追溯关系和下游影响。

阶段评估码：
- E1：输入 / 愿景 → 需求阶段（00-03）
- E2：需求阶段（00-03）→ 总体设计（04-05）
- E3：总体设计（04-05）→ 详细设计（06/07/docs/design，含触发条件下的前端交互设计）
- E4：详细设计 → 实现计划（08/tasks）
- E5：实现计划（08）→ 验证（09）
- E6：实现结果 → 文档回写

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/document-lifecycle-rules.md
- ai/implementation-lifecycle-rules.md
- ai/project-rules.md（如存在）
- docs/README.md
- 与本次评估范围相关的 docs/00-09、docs/design、docs/env、输入材料
- ai/doc-standards/README.md、ai/doc-standards/00-09 和 `ai/doc-standards/design-doc.md`（如存在；评估 `docs/design/*` 时必读）
- E1 / E2 或需求阶段评估时，额外逐份对照 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md`
- E2 / E3 或涉及真实依赖时，额外对照 `ai/doc-standards/04-architecture.md`、`ai/doc-standards/05-tech-spec.md`、`docs/research/*tech-env-evaluation*.md`（如存在）
- E3 / E4 或涉及 DB / API 详细设计时，额外对照 `ai/doc-standards/06-db-design.md`、`ai/doc-standards/07-api-spec.md`
- E3 / E4 或涉及 `docs/design/*` 时，额外对照 `ai/doc-standards/design-doc.md`
- E4 / E5 / E6 或涉及实现计划、验证证据、Sprint 总结、Phase 升级时，额外对照 `ai/doc-standards/08-dev-plan.md`、`ai/doc-standards/09-verification.md`

评估维度：

| 维度 | 判断问题 | 输出要求 |
|---|---|---|
| 完整性 | 必需文档、章节、矩阵、图表是否存在 | 列缺失项和影响 |
| 合理性 | 需求拆分、阶段归属、优先级是否符合项目目标 | 说明是否需要重分层 |
| 可行性 | 技术、资源、数据、Mock / 降级是否支撑目标 | 给出风险和验证建议 |
| 一致性 | 横切事实是否冲突或重复定义 | 指定权威源和残留位置 |
| 状态准确性 | 候选、待确认、待技术验证、Mock、降级、默认关闭、预留、已验证、已启用、禁止等状态是否按 `ai/document-lifecycle-rules.md` §7.1 使用 | 标出被错误升级、遗漏证据或状态传播残留 |
| 追溯性 | 是否能从输入追到需求、设计、计划、验证 | 列断点和悬空 ID |
| 需求链健康度 | `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 是否闭合 | 输出健康度矩阵或 P0 / P1 断点 |
| 架构视图健康度 | `04` 是否包含上下文图、COMP / MOD / Flow ID、运行拓扑、ADR 和 REQ / 功能追溯 | 输出 04 视图检查结果 |
| 技术风险闭环 | `05` 是否包含技术状态、依赖配置、敏感性、Risk-ID、readiness gate、`05 ↔ 09` 映射和 Sprint 解锁条件 | 输出风险验证矩阵或 P0 / P1 断点 |
| DB / API 契约健康度 | `06/07` 是否包含字段级契约、endpoint contract matrix、API-ID、错误码、权限边界、迁移 / seed / 回滚、DB / API / TC 追溯和契约状态 | 输出契约健康度矩阵或 P0 / P1 断点 |
| 执行闭环健康度 | `08/09` 是否包含 Sprint 验证包、完成包、TC 详情、验收证据、缺陷 / 回归记录和正式回写状态 | 输出执行闭环矩阵或 P0 / P1 断点 |
| docs/design/* 通用详细设计 | 触发条件下是否已补通用详细设计或写明豁免；是否具备元信息、职责边界、追溯、流程 / 状态机、失败 / 降级、readiness gate、验收追溯和实现偏差区 | 输出 design 健康度矩阵或 P0 / P1 断点 |
| 前端交互 | UI 型项目是否已补前端交互设计或写明豁免；是否越过 PRD / API / 验收边界；是否满足通用 design 标准 | 列缺口、越界和权限边界风险 |
| UI 原型策略 | UI 型项目是否已选择原型策略或写明豁免；原型证据是否可访问、可复核；是否足以支持前端 Sprint 和 `09` 验收路径 | 列原型形式、位置、覆盖缺口、越界和验收闭环风险 |
| 阶段边界 | 当前阶段是否混入后续功能 | 标出越界内容 |
| 可验证性 | 需求和设计是否有可验收口径 | 标出不可测条目 |
| 维护性 | 文档是否便于后续增量演进 | 标出结构化改进项 |

评估结论：
- Go：可以进入下一阶段；仅有不阻塞的 P2 优化项。
- Conditional Go：可以进入下一阶段，但必须先处理指定 P0 / P1 条件或保留明确风险接受口径。
- No Go：不得进入下一阶段；存在阻塞性缺口、追溯断点、越界或可行性风险。

状态与待确认项对结论的影响：
- Go：不得存在未关闭的 P0 / P1 待确认项；Mock、降级、默认关闭或预留能力不得支撑当前阶段核心验收，除非验收目标明确接受该状态。
- Conditional Go：允许存在已登记并被人工接受的 P1 风险、待技术验证项、Mock / 降级替代路径，但必须列出前置条件、到期点和验证入口。
- No Go：若核心需求仍是候选、待人工确认、待技术验证，或 Mock / 降级被误写成已验证 / 已启用，必须判为 No Go。

open items 门禁：
- 评估完整文档体系或编码前状态时，必须读取或建议生成 `docs-open-items` 总览。
- 阻塞项未关闭、未转任务、未回填权威文档或未被明确风险接受时，不得判为 Go。
- 专题方案讨论结果未确认但已写入正式事实时，应判为 No Go 或至少 Conditional Go，并列出回填 / 降级修复路径。

E1 / E2 阶段评估必须重点检查：
- `00` 场景是否有来源锚点、边界、非目标和下游 U-ID。
- `01` U-ID 是否有用户操作流、用户可观察 AC 和下游 REQ。
- `02` REQ 是否有来源 U-ID、NFR / 约束 / 异常场景和验证入口。
- `03` Phase 是否有功能范围、交付物形态、进入 / 退出标准、状态和证据 / 验收引用。

E2 / E3 阶段评估必须重点检查：
- `04` 是否把 `REQ / NFR → Phase → COMP-ID → MOD-ID → Flow-ID` 串起来，并覆盖异常、降级、权限拒绝和外部服务不可用路径。
- `05` 是否把真实依赖、数据库、外部服务、LLM、Docker / 部署、权限安全和资源约束落到技术状态、依赖配置、Risk-ID、readiness gate 和验证方式。
- `05 ↔ 09` 是否双向映射关键风险；No-Go 或阻塞 Risk-ID 未关闭时，不得给出无条件 Go。
- `04/05` 中候选、默认关闭、Mock、降级或禁止能力是否被 `08` / `09` 误写成当前必做或已启用。

E3 / E4 阶段评估必须重点检查：
- `06` 是否把 `REQ / NFR / Phase → COMP / MOD / Flow → 数据对象 → 表 / 字段 / 约束 → 迁移 / seed / 回滚 → TC / Sprint` 串起来，并区分目标设计、当前实现、Mock / Demo 差异和已验证范围。
- `07` 是否为当前 Phase API 提供稳定 API-ID、endpoint contract matrix、请求 / 响应 / 错误 / 权限 / 兼容契约、异步状态机和 API ↔ DB / Service / Test 追溯。
- API 输出敏感字段、DB 约束映射错误码、权限隔离、Mock → 真实调用或内部 API → 外部 API 是否有验证项和升阶段门槛。
- `06/07` 中草案、候选、目标设计、Mock、默认关闭或禁止能力是否被 `08` / `09` 误写成当前可实现、已验证或已启用。
- 触发 `docs/design/*` 时，是否按 `ai/doc-standards/design-doc.md` 补齐元信息、职责边界、上游依据、流程 / 状态机、数据 / 接口 / 权限契约引用、失败 / 降级路径、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项；缺失且无豁免时不得给出无条件 Go。
- `docs/design/*` 是否只承接上游已批准需求、架构、技术方案和 `06/07` 契约；是否孤立新增需求、接口、表、TC 或 Phase 外能力。
- 对于 UI 型项目，是否已有足以支持前端 Sprint 的可视化原型或明确豁免；若缺少原型策略、原型证据不可访问、覆盖主流程 / 关键状态 / 权限与降级不足，或原型把新需求 / 接口 / 权限 / 验收目标绕过正式文档链路，不得给出无条件 Go。

E4 / E5 / E6 阶段评估必须重点检查：
- `08` 是否为当前 Sprint / Task 写明 REQ / NFR、输入设计 / 契约（含触发的 `docs/design/*`）、修改范围、验证包、TC-ID、状态、完成包和任务拆分依据。
- `09` 是否为当前 Phase REQ 提供可复现 TC 详情、TC 状态、证据记录、Sprint / Phase 验收记录、缺陷 / 回归记录和风险与未验证项。
- Sprint 完成事实、验证结果、Mock / 降级条件通过、残留风险或 Phase 验收是否已从 handoff / 聊天 / PR 回写到正式 `08/09`，或明确暂不落盘原因。
- Phase 升级前 `03/08/09/ai/project-rules.md/README/.ai/session-handoff.md` 状态是否一致；未确认时不得给出无条件 Go。

问题优先级：
- P0：阻塞下一阶段或当前 Sprint。
- P1：应在相关 Sprint / Phase 前处理。
- P2：后续优化，不阻塞当前阶段。

请输出：

1. 评估摘要
   - 评估粒度、范围、结论（Go / Conditional Go / No Go）
   - 是否阻塞下一阶段
   - 最关键的 3-5 条理由

2. 评估范围与依据
   - 读取了哪些文档
   - 未读取 / 不存在 / 不适用的文档
   - 规范依据与项目事实依据

3. 评估结果
   - 整体评估 / 阶段评估 / 单文档评估三选一
   - 按评估维度逐项输出结论、证据、问题和影响

4. 合规项
   - 已满足的关键项
   - 说明证据来源

5. 问题项
   - 每项包含：ID、优先级、问题、位置、影响、建议修复方式
   - 不确定项不要写成事实

6. 风险项
   - 技术 / 资源 / 合规 / 阶段边界 / 追溯风险
   - 说明是否阻塞下一阶段

7. 修复建议
   - 按最小变更原则列出修复顺序
   - 指明应使用 `edit-single-doc`、`generate-docs`、`sync-docs-from-code`、`docs-system-audit` 或其他流程

8. 是否阻塞下一阶段
   - Go / Conditional Go / No Go
   - 若 Conditional Go，列必须满足的条件
   - 若 No Go，列停止原因和重新评估触发条件
   - 若结论依赖 open items，列出阻塞 / 条件阻塞的 open item ID 和回填位置

9. 待人工确认项
   - 使用结构化表格：`ID / 来源文档或位置 / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`
   - AI 建议不得写成已确认事实

10. 报告落盘建议
   - 默认不写文件
   - 若用户确认记录，建议路径：`docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`
   - 说明落盘报告不替代 00-09，也不得放到 docs 根目录

若发现模板通用缺口，请单列“可回流模板优化建议”，但不要直接创建 `_proposals/`，除非用户确认。
```
