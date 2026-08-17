# docs/design 详细设计索引

> 定位：本文是**详细设计节点**的入口清单，帮助从「子系统 → 详细设计文档」一眼定位。它不新增需求、接口、数据表或验收目标。
> **详细设计节点总清单** = `docs/06-db-design.md`（数据契约）+ `docs/07-api-spec.md`（接口契约）+ 本文所列 `docs/design/*`（逐子系统 / 前端详细设计）。
> 子系统 ↔ 设计文档的权威映射见 `docs/04-architecture.md` §2 MOD 表「详细设计」列；本文按子系统分组复核。
> 首版建立于 2026-07-21；2026-08-17 重建为「按子系统分组」清单（区分文档类型）。

## 1. 子系统详细设计（对应 04 §2 MOD）

| 文档 | 对应 MOD · 子系统 | 承接 REQ | 状态 | 图 |
|---|---|---|---|---|
| `permissions.md` | MOD-001 空间与权限 | REQ-001/002/003 | P1-已实现 | flowchart + DIAG-CLS-PERM-01 |
| `ingestion.md` | MOD-003 内容导入 | REQ-009/010/037（+ Flow-D-014 REQ-018） | P1 降级 / Phase1.5A·2B 已实现 | flowchart ×3 + DIAG-CLS-INGEST-01 |
| `rag-retrieval.md` | MOD-004 检索问答 | REQ-007/008 | P1-已实现 | flowchart + DIAG-CLS-RAG-01 |
| `ai-assistant.md` | MOD-004 扩展（AI 助手） | REQ-008 | 已实现（维护态批3） | — |
| `term-management.md` | MOD-005 术语管理 | REQ-036 | P1-已实现 | flowchart |
| `frontend-interaction.md` | MOD-006 个人知识组织（前端交互） | REQ-001..011、P1/P2 UI | P1-P2 已实现 | sequenceDiagram + flowchart |
| `folder-tree.md` | MOD-006 文档目录树 | REQ-039 | Phase2B 已实现 | flowchart |
| `timeline.md` | MOD-006 主题时间线 | REQ-013a/024 | Phase2B 已实现 | — |
| `export-delivery.md` | MOD-007 导出交付 | REQ-038/027 | Phase1.5A/B 已实现 | flowchart |
| `ai-polish.md` | MOD-007 写作增强（AI 润色 / 引用） | REQ-014 | Phase2B 已实现 | stateDiagram |
| `intelligence-analysis.md` | MOD-009 情报分析 | REQ-029..034 | 愿景骨架 | flowchart |
| `accounts-auth.md` | MOD-011 账户与认证（多人权限） | REQ-040..047/050/051 | Phase2D 已实现 | DIAG-CLS-AUTH-01 |

> MOD-002（文档管理）逻辑简单，无独立 design，见 06/07；MOD-010（情报交付）待技术验证，骨架见 06 §1。

## 2. 前端交互与设计层（COMP-001/002）

| 文档 | 类型 | 承接范围 | 状态 |
|---|---|---|---|
| `frontend-workspace-redesign.md` | COMP-001 工作台 UI/UX 重设计 | REQ-011（P1B 落地） | P1B-已实现 |
| `frontend-design-system.md` | COMP-001 前端设计系统规范（CSS 令牌） | 全站观感（v3.10.0） | 已成文 |
| `frontend-experience-brief.md` | 前端体验原则与信息架构方向 | P1.5A / P2 / 愿景候选 | 候选待确认 |
| `help-onboarding.md` | COMP-002 帮助与引导体系 | REQ-011 可用性收口 | 已实现（Sprint-25） |

## 3. 索引 / 立项 / 原型（非详细设计，辅助材料）

| 文档 | 类型 | 用途 |
|---|---|---|
| `req-implementation-index.md` | REQ 实现证据索引 | REQ-001..051 → 表 / API / migration / TC 单点索引（承接 03/04 收敛） |
| `batch-maintenance-2026-08-08.md` | 维护态使用反馈立项 | REQ-049..051 + 部署方案（已实现） |
| `frontend-workspace-redesign-prototype.html` | 已确认落地版 HTML 原型 | 配套 `frontend-workspace-redesign.md`（P1B 证据） |

## 4. 维护规则

- 新增 `docs/design/*.md` 时：登记文档类型（子系统 / 前端交互 / 设计系统 / 体验原则 / 索引 / 立项）、对应 MOD·COMP、承接 REQ、状态、图 ID。
- 子系统新增详细设计时，同步更新 `docs/04-architecture.md` §2 MOD 表「详细设计」列。
- `docs/design/*` 可以承接已确认需求和架构，不得把 research 建议直接写成已确认事实。
