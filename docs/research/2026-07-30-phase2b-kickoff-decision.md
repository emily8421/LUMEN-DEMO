# Phase2B 启动范围确认与数据外发风险接受决策（2026-07-30）

## 0. 元信息

| 项 | 内容 |
|---|---|
| 日期 | 2026-07-30 |
| 类型 | 阶段启动决策留痕（research，非事实文档） |
| 触发 | Phase2A closure 后，用户确认 Phase2B 启动范围与数据外发口径 |
| 输入依据 | `ai/project-rules.md` §1 / §2.5、`docs/03-prd.md` §3 / §4 / §6、`docs/05-tech-spec.md` §5.1、`docs/09-verification.md` §6 / §7、`docs/research/2026-07-30-docs-system-audit-post-v1.59.0.md`、`docs/research/2026-07-14-docs-open-items.md` |
| 定位 | 决策锚点，供审计追溯；**正式事实已回填 00-09 + project-rules，本文件不替代事实文档** |

## 1. 决策（用户确认 2026-07-30）

回应「Phase2B 启动范围确认稿」三件事 + 两边界：

| 项 | 决策 |
|---|---|
| 范围 ① | Phase2B 首批做 **REQ-014（AI 润色 / 写作引用）** |
| 范围 ② | 时间轴 **REQ-013 / 024 纳入首批**，作为紧随 REQ-014 的**第二 slice**（REQ-014 先行——契约草案已较成熟；时间轴为纯骨架，需从零设计，成本更高） |
| 边界 ①（数据外发） | **允许真实外发 + 权限护栏**（详见 §2） |
| 边界 ②（排序） | REQ-014 先行 · 时间轴紧随（Sprint-19 → Sprint-20） |
| 不进首批 | REQ-015 / 016 / 017（推送 / 协作 / 移动端）、REQ-027（属 Phase1.5B） |

## 2. 数据外发风险接受口径（→ RG-008）

- **允许**：用户显式触发润色 / 写作引用时，将真实文档片段（`selection_md` + citation 召回的 sources chunk）经公司内网中转 LLM（RG-004，GLM-5.2）外发处理。
- **护栏**：
  - sources 仅限当前用户有权限的 chunk（守住「不泄露越权」产品红线）；
  - `lumen_ai_drafts` 只存 `input_excerpt_hash` + `prompt_summary`，不存完整敏感原文 / 完整 prompt；
  - **不做**敏感字段自动过滤（由用户自判是否触发润色）；
  - LLM 不可用返回 5030 或 Mock 降级（不编造）；
  - 不携带 API key。
- **风险接受人**：用户（2026-07-30）。
- **非润色场景**（RAG 问答 / 术语注入）仍沿用既有「优先避免发送真实团队文档」口径，不受本决策放宽。

> 这是相对 `ai/project-rules.md §2.5` 原「优先避免发送到外部模型」的**口径放宽**（横切事实变更），已同步改写 project-rules §2.5、04 §1.1、05 §5.2、09 RISK-P2-005。

## 3. RG-008 Conditional Go 依据

- 数据外发风险已人工接受（§2）；
- sources 权限过滤**复用 Phase1 既有查询层过滤**（已验证：TC-P1-003 权限隔离、TC-P1-008 RAG 来源过滤）；
- LLM 通道 RG-004 已 Go（GLM-5.2 真实问答复测通过）；
- **升 Go 条件**：Sprint-19 首个 vertical slice 实跑 polish 外发——权限过滤、5030 降级、hash 留存均通过。

## 4. 本决策不做（边界）

- **不切阶段指针**：`project-rules.md §1` 保持「Phase2A 已完成；未进入 Phase2B」。
- **不编码**、不建 migration 010 实体、不跑 AI 润色外发 Spike（RG-008 实际验证是后续）。
- **不重跑 UI / WSG 门禁**（Sprint-11 smoke 重跑是编码前步骤）。
- 不并入 REQ-027；不实现 REQ-015 / 016 / 017。

> 切阶段指针、编码均按 `ai/implementation-lifecycle-rules.md §7.1`「未经人工确认不得自动切阶段」执行，留作后续单独确认。

## 5. 已回填的正式文档

| 文档 | 回填内容 |
|---|---|
| `ai/project-rules.md` | §1 下一阶段预告补范围确认；§2.5 数据外发口径升级 + 联网行补 RG-008 |
| `docs/03-prd.md` | §3 双维度表 Phase2B 行 + 详情进入/退出标准；§4 REQ-013/014/024 状态；§6 PRD-C-003 关闭 |
| `docs/04-architecture.md` | §1.1 数据外发边界同步；REQ 追溯 REQ-013/014/024 + design 引用更名（writing-export → ai-polish） |
| `docs/05-tech-spec.md` | 新增 TCD-010 + RG-008；§3 Phase2B 约束；§5.2 数据外发过滤；§6 待确认 |
| `docs/06-db-design.md` | `lumen_ai_drafts` 推进 MVP 级已设计；数据安全 / 追溯 / 待确认；REQ-013/024 时间轴数据来源候选 |
| `docs/07-api-spec.md` | API-028 推进 + vertical slice；新增 API-033 时间轴；§4 追溯；§6 待确认 |
| `docs/08-dev-plan.md` | 元信息；新增 Sprint-19 / Sprint-20（总览 + 依赖 + 验证包） |
| `docs/09-verification.md` | 元信息；TC-P2-AI-001 细化；新增 TC-P2-TL-001；RISK-P2-005；§7 待确认 |
| `docs/design/ai-polish.md` | 新建（REQ-014 详细设计） |
| `docs/design/timeline.md` | 新建（REQ-013/024 详细设计，第二 slice 骨架） |

## 6. 关闭 / 部分关闭的 open items

| ID | 位置 | 处置 |
|---|---|---|
| PRD-C-003 | `03-prd.md` §6 | **已确认**（REQ-014 首批 + 013/024 第二 slice；数据外发真实外发 + 权限护栏） |
| OI-001 | `2026-07-14-docs-open-items.md` | **部分关闭**：范围与数据外发已确认；Phase2B 编码门禁（RG-008 验证 + UI/WSG 重跑）仍待 |
| RISK-P2-005 | `09-verification.md` §6 | **Conditional Go**（风险已接受，待 Sprint-19 验证后关闭） |

## 7. 后续（单独确认，不在本决策内）

1. **RG-008 实际验证**：最小 vertical slice 实跑 AI 润色外发 → 升 Go。
2. **重跑 UI/WSG 门禁**：Sprint-11 的 TC-P2-WSG-001 + TC-P2-UI-001~005 + Chrome/Edge smoke。
3. **切阶段指针**：`project-rules.md §1` → Phase2B；03/08/09 阶段状态同步；VERSION bump（MINOR/MAJOR）。
4. **编码**：Sprint-19（REQ-014）→ Sprint-20（REQ-013/024）。
