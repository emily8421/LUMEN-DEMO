# Document Standards（文档规范镜像）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录用于保存每份核心文档的细粒度规范标准，供 AI 生成、精修、审计和评估时作为只读规则依据。

## 定位

- `ai/doc-standards/00-09` 与 `ai/doc-standards/design-doc.md` 是 AI 使用的文档标准 / 审计基线，不是项目事实文档。
- 派生项目自己的需求、设计、计划和验证事实仍写在 `docs/00-09` 与 `docs/design/*`。
- 本目录由 `scripts/sync-template.*` 下行同步刷新；派生项目不应手工修改镜像文件。
- AI 做文档体系审计、生成回梳或章节完整性检查时，可将本目录作为规范对照。


## 三层分工

| 层级 | 文件 | 职责 |
|---|---|---|
| 生命周期总控 | `ai/document-lifecycle-rules.md` | 阶段链路、输入输出职责、追溯、状态传播、变更传播、评估门禁 |
| 细粒度标准 | `ai/doc-standards/00-09.md`、`ai/doc-standards/design-doc.md` | 每份核心文档与 `docs/design/*` 的章节、字段、ID、矩阵、状态、审计项、禁止项 |
| 大纲模板 | `docs/00-09.md` | 派生项目实际填写内容的大纲、占位表格、`【撰写提要：……】` |

路由规则：生成整个文档体系时读取 lifecycle + 已存在的全部 doc-standards；生成 / 审计需求阶段时读取 `ai/doc-standards/00-03`；精修单文档时读取对应 `ai/doc-standards/<doc>.md` 和上下游事实文档；生成、精修、审计或评估 `docs/design/*` 时必须读取 `ai/doc-standards/design-doc.md`。

## 当前覆盖状态

| 范围 | 标准状态 | 后续计划 |
|---|---|---|
| `00-03` 需求阶段 | 已有独立细粒度标准 | 随需求链规则演进维护 |
| `04-05` 总体设计 | 已有独立细粒度标准 | 随风险验证和 readiness gate 演进维护 |
| `06-07` DB / API | 已有独立细粒度标准 | 随契约状态和升阶段门槛演进维护 |
| `08-09` 计划 / 验证 | 已有独立细粒度标准 | 随完成包、证据留痕和回写闭环演进维护 |
| `docs/design/*` | 已有通用独立标准 | 随详细设计分类、readiness gate 和实现偏差回写演进维护 |
| 前端交互设计 | 已有独立细粒度标准 | 见 `ai/doc-standards/frontend-interaction.md` |
| UI 原型策略 / 实现前原型 | 已有独立细粒度标准 | 见 `ai/doc-standards/ui-prototype-strategy.md` |

## 待人工确认项基线

`docs/00-09` 和 `docs/design/*` 的“待人工确认项”应采用结构化表格，而不是纯问题列表。最低字段为：`ID`、`待确认项`、`AI 建议`、`建议依据`、`备选方案`、`取舍影响 / 阻塞关系`。AI 建议只用于辅助判断，用户确认前不得写成已确认事实；确认后应回填到权威文档或续接文件。

## 00-03 需求链基线

`00-03` 是需求链权威入口。同步后派生项目会得到 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md` 四份独立细粒度标准；这些文件用于生成、精修、审计和补齐，不替代派生项目自己的事实文档。

最低追溯链为：`SC-ID → U-ID → REQ-ID → Phase → AC / TC`。

- `00` 必须保留场景、边界、非目标、来源锚点和下游影响。
- `01` 必须保留用户操作流、用户可观察验收口径、优先级依据和 `U-ID → REQ-ID` 映射。
- `02` 必须保留功能需求、NFR、约束 / 假设、异常场景和验证入口。
- `03` 必须保留 Phase 功能范围、交付物形态、进入 / 退出标准、状态、证据 / 验收引用和非目标追溯。

需求链健康度矩阵默认由 `docs-evaluation` / `docs-system-audit` 输出，不强制每个项目写入正式 `03` 或 `09`；若项目选择落盘，应放入 `docs/research/*docs-evaluation*.md` 或审计报告。

## docs/design/* 通用详细设计基线

`docs/design/*` 是从 `04-07` 总体设计 / 契约进入 `08-09` 实现计划 / 验证前的详细设计承接层。同步后派生项目会得到 `ai/doc-standards/design-doc.md`，用于生成、精修、审计和补齐非平凡子系统、复杂 UI、权限边界、AI / 外部服务、导入 / 异步任务、策略规则、配置和高风险愿景能力的详细设计；它不替代派生项目自己的 `docs/design/*` 事实文档。

最低追溯链为：`REQ / NFR → Phase → COMP-ID / MOD-ID / Flow-ID → Table / Field → API-ID / Permission / Error → Design Point → Sprint / Task → TC-ID / 验收证据`。无 DB / API 的项目可裁剪 `Table / Field` 或 `API-ID`，但必须保留裁剪原因。

- 非平凡子系统、复杂 UI、多角色权限、AI / 外部服务、导入 / 异步任务、跨模块状态机或高风险能力，应新增或补齐 `docs/design/*`；简单项目可豁免，但需说明理由。
- design 文档必须保留元信息、职责边界、上游依据、流程 / 状态机、数据 / 接口 / 权限契约、失败 / 降级路径、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项。
- design 文档不得新增 `03` 未批准需求、`06` 未同步表字段、`07` 未同步接口、未批准验收目标或 Phase 外能力；缺口应回写上游文档。
- Mock / 降级 / Demo、候选、默认关闭、禁止当前阶段实现和高风险愿景能力必须写清状态、解锁条件、验证证据、降级路径和对验收的影响。

## 前端交互设计基线

UI 型项目的前端交互设计属于条件性 `docs/design/*` 详细设计，推荐路径为 `docs/design/frontend-interaction.md`。其职责是承接 `03/04/05/07/08/09`，细化页面信息架构、路由清单、核心用户流、组件职责、状态 / 空态 / 错误态、表单校验、文案、接口依赖、响应式与可访问性、UI 原型与可视化证据、验收路径和阶段增量。该文档必须满足 `ai/doc-standards/design-doc.md` 与 `ai/doc-standards/frontend-interaction.md` 的元信息、追溯、验收、readiness gate、实现偏差和待确认项要求；不得新增未授权需求、接口或验收目标；前端隐藏入口、按钮禁用或路由守卫只能作为可见性控制，不能替代后端接口和服务层权限边界。

UI 原型策略是前端交互设计的前置 / 配套可视化门禁：UI 型项目应在 `ai/project-rules.md` §2.7、`docs/05-tech-spec.md` 或 `docs/design/frontend-interaction.md` 记录是否需要开发前可视化原型、原型形式、权威位置、覆盖页面 / 主流程 / 状态 / 设备范围、未覆盖项和豁免理由。生成、精修、审计或评估该策略时必须对照 `ai/doc-standards/ui-prototype-strategy.md`；需要独立记录时可使用 `template-docs/ui-prototype-strategy-template.md`。原型形式可为 Figma、Penpot、Balsamiq、Axure、Storybook、代码原型、截图标注或其他工具；模板不强制绑定 Figma，也不要求所有 UI 项目做高保真视觉设计。原型只表达已授权需求的界面与交互，不替代 `00-09`、不替代前端交互设计、不替代 `09` 验收；原型发现的新需求、接口、权限或验收目标必须回到正式文档链路修订。

## 04-05 总体设计基线

`04-05` 是从需求进入详细设计、计划和验证前的总体设计基线。同步后派生项目会得到 `ai/doc-standards/04-architecture.md`、`05-tech-spec.md` 两份独立细粒度标准；这些文件用于生成、精修、审计和补齐，不替代派生项目自己的事实文档。

最低追溯链为：`REQ / NFR → Phase → COMP-ID → MOD-ID → Flow-ID → Risk-ID → TC / Sprint`。

- `04` 必须保留架构约束、系统上下文、组件 / 模块 / Flow ID、部署拓扑、ADR 和 REQ / 功能追溯。
- `05` 必须保留技术状态、依赖配置、环境评估、安全隐私、技术风险矩阵和 readiness gate。
- 真实外部服务、数据库、LLM、Docker / 部署、重型 SDK 或权限安全能力进入 Sprint 前，必须有 `05` 风险验证或 readiness gate 结论。
- `候选`、`已验证`、`已启用`、`默认关闭`、`Mock`、`降级`、`禁止` 等状态必须绑定到依赖、风险、验证证据和启用阶段，不得混用。

## 06-07 DB / API 契约基线

`06-07` 是从总体设计进入实现计划和验证前的详细契约基线。同步后派生项目会得到 `ai/doc-standards/06-db-design.md`、`07-api-spec.md` 两份独立细粒度标准；这些文件用于生成、精修、审计和补齐，不替代派生项目自己的事实文档。

最低追溯链为：`REQ / NFR → Phase → COMP-ID / MOD-ID / Flow-ID → Table / Field → API-ID → Error / Permission → TC / Sprint`。

- `06` 必须保留数据对象、概念模型、字段级契约、目标结构与当前实现对照、迁移 / seed / 回滚、数据安全留存和 DB / API 字段映射。
- `07` 必须保留 API-ID、endpoint contract matrix、请求 / 响应 / 错误 / 权限 / 兼容契约、异步状态机和 API ↔ DB / Service / Test 追溯。
- `目标设计`、`当前实现`、`Mock`、`已验证`、`草案`、`候选`、`默认关闭`、`禁止` 等契约状态必须说明是否可作为实现依据。
- 当前 Phase 或即将进入 Phase 的表 / API 必须具备足以实现和验证的字段级 / endpoint 级契约；远期只保留骨架和状态。
- API 输出敏感字段、DB 约束映射错误码、权限隔离和 Mock → 真实能力切换必须在 `06/07/09` 或相关任务中可追溯。

## 08-09 计划 / 验证证据基线

`08-09` 是从详细设计进入实现、验收和 Phase 升级前的执行闭环基线。同步后派生项目会得到 `ai/doc-standards/08-dev-plan.md`、`09-verification.md` 两份独立细粒度标准；这些文件用于生成、精修、审计和补齐，不替代派生项目自己的事实文档。

最低追溯链为：`REQ / NFR → Phase → Sprint / Task → TC-ID / 验证包 → Commit / PR → Sprint 验收包 → Phase 验收 / 回写`。

- `08` 必须保留当前 Phase 目标、Sprint 总览、输入设计 / 契约、验证包、完成包、任务拆分规则和当前进度记录。
- `09` 必须保留 REQ → TC 追溯、TC 用例详情、TC 状态、资源验证、Mock / 降级口径、Sprint / Phase 验收记录、缺陷 / 回归记录和风险与未验证项。
- Sprint 完成事实不得只留在 `.ai/session-handoff.md`、聊天或 PR 中；长期进度写 `08`，验证证据 / 验收记录写 `09`。
- Phase 升级前必须检查 `03/08/09/ai/project-rules.md/README/.ai/session-handoff.md` 状态一致性；未经人工确认不得自动升级 Phase。

## 与旧路径的关系

旧路径 `docs/_scaffold/00-09` 是 v1.18.x 的规范镜像位置。迁移期内，审计提示词和边界检查可兼容旧路径；长期主路径为 `ai/doc-standards/00-09`。
