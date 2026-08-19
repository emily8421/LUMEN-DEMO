# 交叉评审：04-07 与详细设计语义交叉审计（docs-system-audit 同步后批次）

> 定位：本文是 `docs-system-audit`（同步后审计模式）在 v1.66.0 模板同步后的**批次交叉评审记录**，只读审计产物。它不是权威规格，不替代 `docs/04-07`、`docs/design/*` 或 `ai/doc-standards/*`。
> 批次范围：`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/06-db-design.md`、`docs/07-api-spec.md` 的相互一致性与对 `docs/design/*`（18 份活动设计文档）的语义交叉一致性；旧设计结构性候选复核。
> 权威基线：`ai/doc-standards/04/05/06/07/design-doc`（v1.66.0 同步刷新）+ `docs/03-prd.md` §3 + `docs/09-verification.md` §2/§6 + 后端代码（`backend/model/entities.py` 等，仅作契约事实核对）。
> 审计方式：只读 + 三路并行代理（子系统组 1 / 子系统组 2 / 前端辅助组）逐份核对引用；04-07 由主会话直接交叉验证。未在审计阶段修改任何文件。

## 0. 触发与前置

- 触发：`sync-records/template-sync/2026-08-19-sync-template-v1.66.0.md` 记载 docs-system-audit 仅轻量执行，完整语义审计按批次补做。
- 前置已完成（续接自 `.ai/session-handoff.md` v1.66.0 收尾 checkpoint）：`02 SRS` 51 REQ 全部进入 `03 PRD`；109 份活动文档链接目标与字面标题检查通过；`extract-diagrams.mjs --check` 通过（68 镜像）；详细设计索引覆盖 15 份子系统设计。
- 本批次是剩余项：「04-07 与详细设计的语义交叉审计 + 旧设计的结构性候选复核」。
- 已知前置问题（本批次前已确认、另案处理，不在本批次修复范围）：`docs/01-user-requirements.md` REQ-013a/014/039 状态过期、`docs/03-prd.md` §4.1 Phase2B 证据行过期、`docs/09-verification.md` 四条安全 TC 预期表述 + 元信息滞后——见 `.ai/session-handoff.md` 对应 checkpoint。

## 1. 链路健康度总览（本批次）

| 层 | 结论 | 主要发现数 |
|---|---|---|
| 04 架构 | ✅ 结构完整（概述章 / 上下文 / 容器 / 分层 / 概设类图 / WSG / ADR / Flow / 追溯矩阵齐全，图 ID 合规） | 3 |
| 05 技术方案 | ✅ 结构完整（栈 / 决策 / 依赖 / RG / 安全齐全），内部陈旧措辞 | 3 |
| 06 DB 设计 | ✅ 契约完整（概念 / 物理 ERD / 字段级 / 索引 / 安全 / 追溯） | 1 |
| 07 API 设计 | ✅ 契约完整（endpoint matrix / 错误码 / 权限 / 时序 / 追溯） | 1 |
| docs/design（18 份） | 11 份对齐标准布局 ✅；1 份结构不合规（permissions）；1 份契约级事实错误（term-management） | ~12 |
| 契约引用健康度 | 全部 API-ID / 表 / REQ / Flow / DIAG 均有来源，无越权新增表 / 接口（仅 1 处索引级 + 1 处接口未回写 07 §2） | 2 |

## 2. 问题清单

### A. 契约事实断点（P1 · 会误导实现 / 验收）

| ID | 位置 | 问题 | 权威源 | 修复状态 |
|---|---|---|---|---|
| A1 | `docs/design/term-management.md` §0.5 注释（L23）/ §4 数据契约（L170） | `lumen_terms.status` 写 `active/archived`，且字段列 `created_by`——与 06 §2（`confirmed/pending`、`owner_id`）、07 API-012、`backend/model/entities.py`（`CONFIRMED/PENDING`）三方冲突；§0.5 还错误声称「见 entities.py」 | `docs/06-db-design.md` §2 lumen_terms；`backend/model/entities.py` `TermStatus` | **本批次已修复**（C-001） |

### B. 状态冲突 / 陈旧（P2 · 会误导读者以为能力未实现）

| ID | 位置 | 问题 | 修复状态 |
|---|---|---|---|
| B1 | `docs/design/ingestion.md` §3.3 L157 / §6 readiness gate L265 | Vault 模式 B 标「Phase2C·已设计…不代表当前已实现」「已设计」，与 §7（已完成）、03（Phase2C 2026-08-06 完成）、09（TC-P2-VAULT-001/003/004 通过）矛盾 | **已修复**（C-003） |
| B2 | `docs/design/ingestion.md` §7 L279 / §0 流程 ID 行 | 「前端文件管理器待实现」「Flow-D-012…Phase2B 候选」与自身 §0/§6、04 MOD-003、06 lumen_folders（task-029 已补齐）矛盾 | **已修复**（C-003） |
| B3 | `docs/design/frontend-interaction.md` §9.2.2 / §9.2.3 | 仍写「TC-P2-AI-001（待 Sprint-19 实现）」，与同文 §0/§9.4 及 09（2026-08-05 收口）冲突 | **已修复**（C-003） |
| B4 | `docs/design/permissions.md` 正文 | 未反映 Phase2D 演进（空间角色 / owner 跨用户过滤 / 成员 API），正文停 P1 视角（元信息 2026-07-09，18 份中最旧） | 待 SC-1 单独确认 |
| B5 | `docs/05-tech-spec.md` §1 技术栈表 | 「api/service/model **三层**运行」——repository 独立成层后未同步（04 §1.2.1 / 05 §4.2 / project-rules §4 均为四层） | **未授权 · 登记后续**（1 词可改，待用户点头） |
| B6 | `docs/04-architecture.md` §7 待确认项（L603） | 「Phase2B 团队 MVP 候选…需重新确认范围 / 进入退出标准 / UI-WSG 门禁」与 04 自身 §0.1/§2（Phase2B 已收口 08-05）及 09 收尾记录冲突 | **已修复**（C-003） |
| B7 | `docs/design/accounts-auth.md` §0 元信息「状态 / 验收」行 | 只反映 Sprint-26（漏 TC-P2-ACC-001/002、TC-P2-AUTH-002），与文首「三 slice 收口」及 §17/18/19 冲突 | **已修复**（C-003） |
| B8 | `docs/design/batch-maintenance-2026-08-08.md` §6 | REQ-050 建议列「后端零新接口」未随实现修正（实际新增 API-054），与 §3.4 自相矛盾 | **已修复**（C-003） |

### C. 契约收录缺口（P2/P3 · 定义存在但权威清单未收录）

| ID | 位置 | 问题 | 修复状态 |
|---|---|---|---|
| C1 | `docs/design/ai-assistant.md` §4 ↔ `docs/07-api-spec.md` §2 | `GET /api/llm-configs` 完整定义，07 仅在 API-010 用途列 + §3.7 示例出现，07 §2 API-ID 清单未收录编号 | **未授权 · 登记后续**（待裁决：补独立 API-ID 或并入 API-010） |
| C2 | `docs/design/accounts-auth.md` §19.3 ↔ `docs/06-db-design.md` §3 | `idx_lumen_users_reset_token` 稀疏索引未回写 06 §3 索引清单（06 只列 idx_lumen_users_email） | **未授权 · 登记后续**（索引级回写） |

### D. 追溯 / 命名断点（P3）

| ID | 位置 | 问题 | 修复状态 |
|---|---|---|---|
| D1 | `docs/design/00-index.md` L20 | 引用「04 §5 Flow-013」→ 04 全文无 Flow-013（时间线正确流程为 Flow-009） | **未授权 · 登记后续** |
| D2 | `docs/04-architecture.md` §6 追溯表 | 用「REQ-013」，其余处及 06/07/09 用「REQ-013a」（03 定 013 为伞形 / 013a 时间线 / 013b 关联图） | **未授权 · 登记后续** |
| D3 | `docs/04-architecture.md` §2 vs §6 | §2 MOD-006 详细设计列含 folder-tree.md，§6 REQ-039 追溯行标 MOD-003+MOD-002（不含 MOD-006） | **未授权 · 登记后续** |
| D4 | `docs/design/ingestion.md` §2 | 称「04 已含 Flow-D-001/012/014」不精确——04 只定义 Flow-006，Flow-D-* 为 design 本地 ID | **未授权 · 登记后续** |

### E. 元信息滞后 / 轻量措辞（P3）

| ID | 位置 | 问题 | 修复状态 |
|---|---|---|---|
| E1 | `docs/05-tech-spec.md` / `docs/06-db-design.md` / `docs/07-api-spec.md` §0 | 「最后更新」停在 2026-08-17，未反映 2026-08-18 Wave 3 回写（05 RG-010 / 06 vault_mounts / 07 API-059）；04 无 08-18 内容 | **已修复**（C-005，且随 B6 编辑顺带更新 04） |
| E2 | `docs/05-tech-spec.md` §5.1 末尾 | 注释「待 09 补 Risk-ID 列后双向链接」过时——09 §6 已有 Risk-ID 列 | **已修复**（C-005） |
| E3 | `docs/design/rag-retrieval.md` §7 | 「条件通过」vs 07 API-009「已实现（hybrid）」措辞差异 | **未授权 · 登记后续** |
| E4 | `docs/design/export-delivery.md` §0.5 | 交叉引用写「§3.2」实际状态机在 §3.3 | **未授权 · 登记后续** |
| E5 | `docs/design/timeline.md` §0 | 详细类图豁免理由未写入元信息（00-index 已登记豁免） | **未授权 · 登记后续** |
| E6 | `docs/design/intelligence-analysis.md` | 豁免引用「design-doc §3 末段」措辞不精确（§3 指旧项目增量补） | **未授权 · 登记后续** |
| E7 | `docs/design/00-index.md` L17 | term-management 行只列 REQ-036 漏 REQ-048 | **未授权 · 登记后续** |

## 3. 结构性候选复核（SC-1..SC-6）

> 用途：评估旧设计文档是否需要结构重组，区分「规范基线缺口 / 可接受兼容差异」。逐项给出建议与状态。

| 候选 | 现状 | AI 建议 | 状态 |
|---|---|---|---|
| SC-1 permissions.md 结构 | 缺 4 大必填版块（上游追溯 / 失败降级 / readiness gate / 待确认项），章节编号错位，18 份中最旧 | 完整重构对齐 design-doc 11 节（权限是底线）或补 2026-08 对齐 pass | **待用户单独确认**（本次未执行） |
| SC-2 ingestion.md Vault 段膨胀 | Vault 内容（双模式 + Wave3 元数据 + 自动重扫）跨 MOD-003/MOD-008 | 独立成 `vault-local-mount.md`（同步 04 MOD-008 + 00-index）或留原位 | 未授权 · 登记后续 |
| SC-3 ingestion §3.3/3.4 内容错位 | Flow-D-014 步骤 + 流程图落在「导入任务状态机」小节内而非 §3.3 标题下 | 重排归位 | **本批次已执行**（顺手） |
| SC-4 accounts-auth §19 归类 | Sprint-30（REQ-051）与同批 REQ-050（batch-maintenance）归类不一致，572 行最大单文件 | §19 迁 batch-maintenance 或刷新 §0 元信息 | 未授权 · 登记后续（本次已刷 §0 元信息） |
| SC-5 frontend-interaction 历史稿 | 689 行混合基线 + §9.1-9.3 候选稿（ID 被引用不可删） | 拆 research/ 或标注历史归档 | 未授权 · 登记后续 |
| SC-6 角色×页面×权限矩阵 | MOD-011 角色体系已落地，但 frontend-interaction / permissions 无系统化矩阵 | 补 role×page×operation×backend 矩阵 | 未授权 · 登记后续 |

## 4. 本批次已执行修复记录

> 执行于独立分支 `docs/fix-audit-04-07-design-2026-08-19`，仅改权威源（镜像随源再生成），遵循 `ai/prompts/docs/04-edit-single-doc.md` 最小变更回梳。

| 修复项 | 文件 | 变更摘要 |
|---|---|---|
| C-001（A1） | `docs/design/term-management.md` | `lumen_terms.status` 枚举 active/archived → confirmed/pending（§0.5 注释 + §4 契约）；`created_by` → `owner_id`（§4 lumen_terms 行；lumen_term_categories 的 created_by 为正确，未动） |
| C-003（B1/B2） | `docs/design/ingestion.md` | §3.3 Flow-D-014 标题与 §6 readiness gate 的「已设计 / 不代表当前已实现」→ Phase2C·已完成；§7 前端文件管理器「待实现」→ 已实现；§0 流程 ID 行 Flow-D-012 候选 → 已实现 |
| C-003（B3） | `docs/design/frontend-interaction.md` | §9.2.2 / §9.2.3「TC-P2-AI-001（待 Sprint-19 实现）」→ 已实现（Sprint-19 闭环） |
| C-003（B6） | `docs/04-architecture.md` | §7 过时待确认项「Phase2B 团队 MVP 候选需重新确认」→ 更新为已收口口径；§0 最后更新顺带刷新 |
| C-003（B7） | `docs/design/accounts-auth.md` | §0 元信息「状态 / 验收」行 → 补三 slice + 维护态已实现、验收行补 TC-P2-ACC-001/002、TC-P2-AUTH-002 |
| C-003（B8） | `docs/design/batch-maintenance-2026-08-08.md` | §6 REQ-050 建议列「后端零新接口」→ 修正为实际新增 API-054 |
| C-005（E1） | `docs/05/06/07` §0 | 「最后更新」→ 2026-08-19（注明 docs-system-audit 回梳） |
| C-005（E2） | `docs/05-tech-spec.md` §5.1 | 「待 09 补 Risk-ID 列」→ 09 §6 已有 Risk-ID 列，05↔09 可双向核验 |
| SC-3 | `docs/design/ingestion.md` | Flow-D-014 步骤 1-5 + 流程图从 §3.4 重排归位到 §3.3 标题下 |

验证：`git diff --check`、`node scripts/extract-diagrams.mjs --check`（不通过则重生成）、针对性 `rg` 旧措辞无残留。

## 5. 待人工确认 / 后续登记

- **SC-1（permissions.md 结构重构）**：用户单独确认后执行；未纳入本批次。
- C-002（llm-configs API-ID 裁决）、C2（reset 索引回写 06）、D1-D4、B5（05 §1 三层→四层）、E3-E7：未授权，登记后续候选。
- 前置已知问题（01/03/09 四项）另案处理，不在本批次。

## 6. 同步后回梳建议（三类区分）

- **规范基线缺口**（新标准要求、旧文档未对齐）：SC-1 permissions 结构、SC-6 权限矩阵。
- **可接受兼容差异**：多数 design 文档按 Sprint 增量组织而非 11 节标准布局（accounts-auth / export-delivery §6 gate 简化表等）——语义等价，不逐字重排，仅刷新元信息。
- **项目事实风险（必须修）**：A1、B 组、C1——「已实现能力被写成未实现 / 错误契约」，影响验收判断；本批次已修 A1 + B 组 + E 组，C1 待裁决。
