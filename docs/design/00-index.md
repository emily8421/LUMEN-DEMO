# docs/design 详细设计索引

> 定位：本文是 `docs/design/` 的目录索引，帮助从 `docs/04-architecture.md` 快速定位详细设计。它不新增需求、接口、数据表或验收目标。
> 首版建立于 2026-07-21（P1 文档治理），状态来自各详细设计文档头部元信息；后续修改详细设计时同步维护本索引。

## 1. 索引表

| 设计文件 | 设计对象 | 覆盖范围 | 当前状态 | 备注 |
|---|---|---|---|---|
| `permissions.md` | 空间与权限子系统（MOD-001） | REQ-001 / 002 / 003 | P1-已实现 | 权限逻辑与 PostgreSQL 查询过滤已接入；`DemoRepository` 仅作单测 fake |
| `ingestion.md` | 内容导入子系统（MOD-003） | REQ-009 / 010 / 037 | P1 已降级实现；Phase1.5A 批量 / 文件夹导入已实现；Phase2B `preserve_structure` 已实现 | 真实 Word/PDF/OCR 解析未实现 |
| `rag-retrieval.md` | 检索问答子系统（MOD-004） | REQ-007 / 008 | P1-已实现 | RAG 走真实 LLM + pgvector；`zhparser` 不可用时回退 `simple` |
| `term-management.md` | 术语管理子系统（MOD-005） | REQ-036 | P1-已实现 | 术语存储已切 PostgreSQL，问答口径注入真实 LLM |
| `frontend-interaction.md` | 前端交互与桌面端界面（COMP-001） | P1、Phase1.5A/B、Phase2A/B UI Gate 草案 | P1/P1A/P1B、Phase1.5A/B、Phase2A 已完成；Phase2B 部分实现 | 页面职责、用户流、接口依赖仍以本文为主 |
| `frontend-experience-brief.md` | 前端体验原则与信息架构方向 | P1 保持现状；P1.5A / P2 / 愿景候选方向 | 候选体验方向，待人工确认 / 正式交互设计细化 | 体验原则输入，不直接授权编码 |
| `frontend-workspace-redesign.md` | LUMEN React 前端工作台系统化 UI / UX 重设计（COMP-001） | REQ-011；承载 REQ-001..010、REQ-036 页面能力 | P1B-已实现 | 视觉密度、组件拆分和工作台布局的已实现口径 |
| `export-delivery.md` | 导出交付子系统（MOD-007） | REQ-038 / REQ-027 | Phase1.5A `.md` / ZIP 导出已实现；Phase1.5B PDF 导出已实现并通过 TC-P1-017 | Sprint-17/18 已实现设计 |
| `intelligence-analysis.md` | 情报分析子系统（MOD-009，i2 精神） | REQ-029..034 | 愿景骨架，待技术验证 | P1/P2 不实现，升 Phase 前再评估 |

## 2. 原型与辅助材料

| 文件 | 类型 | 关系 |
|---|---|---|
| `frontend-workspace-redesign-prototype.html` | 已确认落地版 HTML 原型 | 配套 `frontend-workspace-redesign.md`，用于 P1B 工作台重设计 |
| `../research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html` | 探索期 HTML 原型 | 作为 `frontend-interaction.md` 的早期参考，不是 P1B 落地版 |
| `../research/prototypes/2026-07-14-frontend-ui-confirmation-prototype.html` | 探索期 HTML 原型 | 用于 UI 方向确认留痕，不替代正式详细设计 |

## 3. 维护规则

- 新增 `docs/design/*.md` 时，同步登记设计对象、覆盖 REQ、状态和是否授权编码。
- 若某设计从候选推进到已实现，应同步更新本文、对应设计文档、`docs/08-dev-plan.md` 和 `docs/09-verification.md`。
- `docs/design/*` 可以承接已确认需求和架构，不得把 research 建议直接写成已确认事实。
