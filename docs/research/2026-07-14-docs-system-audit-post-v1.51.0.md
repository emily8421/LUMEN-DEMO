# 文档体系全链路回溯审计报告（同步后审计 · v1.51.0）

## 0. 元信息

| 项 | 内容 |
|---|---|
| 审计日期 | 2026-07-14 |
| 审计模式 | 同步后完整审计模式（`/run docs-system-audit`） |
| 当前 Git 状态 | `main...origin/main`，审计前工作区干净 |
| 当前项目版本 | `VERSION = v1.47.1` |
| 当前模板基线 | `TEMPLATE-BASE.md` 记录 `Current synced template version: v1.51.0` |
| 最近同步报告 | `sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md` |
| 审计范围 | `docs/00-09`、`docs/design/*.md`、`docs/env/*.md`、`docs/research/*` 关键 UI / 同步记录、`ai/doc-standards/*` |
| 审计边界 | 本报告只读输出；不直接修改项目事实文档；回梳需另行确认并走 `edit-single-doc` 或对应命令 |

## 1. 执行依据

- 命令入口：`ai/commands/docs-system-audit.md`，要求盘点 `docs/00-09`、`docs/design/`、`docs/env/`，对照追溯链、阶段标签、交付物形态、详细设计和规范基线。
- 审计 Prompt：`ai/prompts/review/16-docs-system-audit.md`，要求输出链路健康度总览、分组问题清单、回梳计划、审计新发现、待人工确认项和同步报告回写建议。
- 生命周期规则：`ai/document-lifecycle-rules.md`，重点对照 §5 生成矩阵、§6 追溯链、§6.2 待确认总览、§7 状态词典、§9 变更传播、§13 图表规范。
- 实现规则：`ai/implementation-lifecycle-rules.md`，重点对照 Sprint / Task / TC / 提交 / 验收闭环，以及 v1.51 新增 Web App Structure Profile + Walking Skeleton Gate。
- 规范基线：`ai/doc-standards/00-scenario.md` 至 `09-verification.md`、`ai/doc-standards/design-doc.md`、`frontend-interaction.md`、`ui-prototype-strategy.md`。

## 2. 链路健康度总览

| 维度 | 结论 | 严重度 | 证据 | 说明 |
|---|---|---|---|---|
| 输入 / 场景 → U-ID | 基本健康 | Low | `docs/00-scenario.md:77`、`docs/01-user-requirements.md:25` | 00 已给出 SC → U / REQ / 设计 / TC / Sprint 映射；01 以 U 主表覆盖 U-01..U-42。 |
| U-ID → REQ-ID | 健康 | Low | `docs/02-srs.md:56`、`docs/02-srs.md:97` | 02 REQ 主表和 U→REQ 矩阵覆盖 P1 / P2 / 愿景；P1 降级项状态明确。 |
| REQ-ID → Phase / 交付物形态 | 健康 | Low | `docs/03-prd.md:62`、`docs/03-prd.md:68`、`docs/03-prd.md:76` | 03 明确 Phase1=Demo、Phase2=MVP、愿景=产品；未将 Demo 误称 MVP。 |
| Phase → 架构 / 技术 / DB / API | 条件健康 | Medium | `docs/04-architecture.md:207`、`docs/05-tech-spec.md:104`、`docs/06-db-design.md:193`、`docs/07-api-spec.md:202` | P1 追溯基本闭合；Phase2 DB/API 仍为骨架，符合未启动状态，但阻塞直接进入 Phase2 实现。 |
| 计划 → 验证 → 完成包 | 基本健康 | Medium | `docs/08-dev-plan.md:287`、`docs/09-verification.md:104` | Sprint-1..10 有完成包 / 验证证据；Sprint-11 明确为草案未执行。 |
| UI 探索到交付链 | 条件健康 | Medium | `docs/design/frontend-experience-brief.md:126`、`docs/design/frontend-interaction.md:409`、`docs/09-verification.md:77` | UI 链路已显著补强，但仍有 Conditional Go / 草案未执行项，不可直接编码。 |
| Web App Structure Profile / WSG | 缺口 | High | `docs/README.md:107`、`sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:75` | v1.51 新增 WSG；项目事实 04/05/08/09 尚未落地 WSG-ID、Sprint 0 / 豁免或文件阈值。 |
| 待确认事项总览 | 缺口 | Medium | `docs/08-dev-plan.md:308`、`docs/09-verification.md:146` | 多处待确认项分散，未见统一 `docs-open-items` 总览；Phase2 前建议补齐。 |

## 3. 00-03 需求链健康度矩阵

| SC-ID | U-ID | REQ-ID | Phase | 用户 AC / 验证入口 | 状态 | 断点 | 修复建议 |
|---|---|---|---|---|---|---|---|
| SC-001 | U-01 / U-02 | REQ-001 / 002 | P1 Demo | TC-P1-001 / 002 | 闭合 | 无 | 保持。 |
| SC-002 | U-03 / U-12 | REQ-003 | P1 Demo | TC-P1-003 | 闭合 | 无 | 保持后端权限边界为权威。 |
| SC-003 | U-04 / 05 / 06 | REQ-004 / 005 / 006 | P1 Demo | TC-P1-004..006 | 闭合 | 无 | 保持。 |
| SC-004 | U-07 / 08 / 42 | REQ-007 / 008 / 036 | P1 Demo | TC-P1-007 / 008 / 012 | 闭合 | 无 | 保持 RG-001/002/004 与 09 风险映射同步。 |
| SC-005 | U-09 / U-10 | REQ-009 / 010 | P1 Demo 降级 | TC-P1-009 / TC-P1-010 后续 | 条件闭合 | 真实 PDF / OCR 不在 P1 必过；MVP 前需重新评估。 | Phase2 / MVP 前补真实解析 / OCR readiness gate 与 TC。 |
| SC-006 | U-11 | REQ-011 | P1 Demo | TC-P1-011 / 013 / 014 | 闭合 | 无 | Phase2 UI 前需补 WSG / browser smoke 新门禁。 |

结论：00-03 主链没有 P0 断裂；Phase2 仍停在“进入前需人工确认 + 契约 / 验证补齐”的正确状态。

## 4. 04-05 总体设计风险矩阵

| REQ / NFR | COMP / MOD / Flow | Risk / RG | TC / Sprint | 状态 | 断点 | 修复建议 |
|---|---|---|---|---|---|---|
| REQ-001..011 / 036 | 04 §6、Flow-001/002 | RG-001/002/004/005 | TC-P1-001..014 / Sprint-1..10 | 基本闭合 | 05 明示 “待 09 补 Risk-ID 列” | 在 09 风险表增加 RG-ID / Risk-ID 列，闭合 `05 ↔ 09` 双向映射。 |
| REQ-009 / 010 | MOD-003 / 导入 | RG-003 | TC-P1-009 / 010 | 条件闭合 | OCR No-Go、PDF/Word 未真实化；09 已记录未验证项 | 保持为 P2 / MVP 前置；进入 Phase2 前做 tech-env-evaluation。 |
| REQ-012 / 014 / 025 / 026 / 027 | MOD-006/007 等 P2 设计 | RG-006 等 | TC-P2 草案 | 未就绪 | 03 要求 Phase2 进入前 04/05 补强 + tech-env-eval + 06/07 契约齐备；目前仅 UI Gate 草案 | 不得直接进入 Phase2 实现；先补 Phase2 详细契约与 readiness gate。 |
| 复杂 Web / UI | App Shell / API client / browser smoke | WSG-001..006 | Sprint 0 / browser smoke | 缺口 | v1.51 WSG 尚未进入项目事实文档 | 在 04/05/08/09 增加 WSG 矩阵，或记录不触发 / 豁免依据。 |

## 5. 06-07 DB / API 契约健康度矩阵

| 范围 | Table / API | 契约状态 | 当前实现 / Mock 差异 | 断点 | 修复建议 |
|---|---|---|---|---|---|
| P1 文档 / 权限 / 检索 / 问答 / 术语 | `lumen_*` P1 表、`/api/documents`、`/api/search`、`/api/query`、`/api/terms` | 基本稳定 | P1 已实现，09 有 TC | 未发现 P0 断点 | 保持字段级契约和 endpoint matrix。 |
| REQ-009 / 010 导入 | `lumen_imports`、`POST /api/import` | 条件稳定 | 仅 `.md` / `.txt` 已提取文本；真实 PDF / OCR 未实现 | MVP 若要求真实解析则契约不足 | Phase2 / MVP 前补真实解析状态机、错误码、文件类型契约与回滚。 |
| P2 核心 5 项 | `lumen_tags` / `lumen_doc_links` 等、P2 API | 骨架 | 06 明确 P2 / 愿景表待细化；07 明确 P2 接口待细化 | 阻塞直接进入 Phase2 实现 | 按 03 Phase2 进入标准补字段级契约、endpoint contract、权限和 TC。 |

## 6. docs/design/* 详细设计健康度矩阵

| 文档 | 当前状态 | 主要缺口 | 严重度 | 建议 |
|---|---|---|---|---|
| `docs/design/frontend-interaction.md` | 已充分补强 | P2 UI Gate 仍为草案；未吸收 v1.51 WSG | High（Phase2 前） | 在 Phase2 实现前补 WSG、App Shell / API client / 文件阈值 / browser smoke。 |
| `docs/design/frontend-experience-brief.md` | 候选体验输入健康 | UI-G-003 / UI-G-005 为 Conditional Go，未达到实现 Gate | Medium | 用户确认后再把候选体验原则升级为正式设计输入。 |
| `docs/design/frontend-workspace-redesign.md` | P1B 设计已实现 | 与新版 design-doc 标准相比缺少完整“数据、接口与权限契约”显式矩阵 | Low | 可不机械重写；后续大改前补最小契约表。 |
| `docs/design/ingestion.md` | P1 子系统设计可用 | 结构较早期，缺少新版标准中的独立上游追溯 / 数据接口权限 / 待确认项结构 | Medium | 回梳时按语义最小补齐，不重写历史事实。 |
| `docs/design/permissions.md` | P1 权限设计可用 | 缺少新版标准中的完整失败 / 降级与待确认项区 | Medium | 与 04/07 权限边界交叉补齐。 |
| `docs/design/rag-retrieval.md` | P1 检索问答设计较完整 | 可补 Risk / RG / TC 双向映射到 09 | Low | 与 05 RG-001/002/004、09 TC-P1-007/008 统一引用。 |
| `docs/design/term-management.md` | P1 术语设计可用 | 可补接口 / 权限契约和状态机细节 | Low | 后续改术语功能前补齐。 |
| `docs/design/intelligence-analysis.md` | 愿景骨架 | 缺少待技术验证 gate、失败 / 降级、open item 结构 | Low（愿景） | 保持愿景骨架，不进入当前实现；进入任一 Phase 前补完整设计。 |

## 7. UI Exploration / Prototype Gate 矩阵

| 链路点 | 项目证据 | 状态 | 断点 | 修复建议 |
|---|---|---|---|---|
| 输入 / UI brief | `docs/inputs/*` + reference analysis | 已接入 | 无独立 `docs/inputs/ui-brief.md`，但已有输入材料与研究记录可等价承接 | 若后续新增 UI 方向，可补独立 UI brief。 |
| reference analysis | `docs/research/2026-07-13-frontend-ui-reference-analysis.md` | Go | 无 | 保持。 |
| exploration prototype | `docs/research/2026-07-13-ui-prototype-exploration.md` | Go | 无 | 保持候选 / 待确认状态。 |
| experience brief | `docs/design/frontend-experience-brief.md` | Conditional Go | UI-G-003 / UI-G-005 仍为 Conditional | 用户确认后再升级为已确认体验原则。 |
| frontend-interaction | `docs/design/frontend-interaction.md` §9 | Conditional Go | Phase2 尚未启动；P2-UI-G 为编码前草案 | 开实现任务前必须关闭 P2-UI-G-001..006。 |
| UI 原型策略 / 实现前原型 | HTML 原型 + 09 TC-P2-UI 草案 | 草案 | 09 明确 TC-P2-UI-001..005 未执行 | 进入 Phase2 代码前执行 Chrome / Edge smoke 并回写 09。 |
| UI-G-007 验证回写 | 09 Phase2 TC | 未完成 | 未实际验证；无 UI-G-007 明确行 | 实现后再补 UI-G-007 / TC 证据闭环。 |

## 8. Web App Structure Profile / Walking Skeleton Gate 矩阵

| 项 | 当前证据 | 状态 | 断点 |
|---|---|---|---|
| 是否触发 | LUMEN 是 React + FastAPI + 多页面 / 多状态 / 多角色 Demo | 触发 | 需正式写入项目事实或记录豁免。 |
| App Shell | P1B 已有 TopBar + Nav Rail + Context Pane + Workspace | 语义部分满足 | 未以 WSG / App Shell gate 形式记录到 04/05/08/09。 |
| 前端目录边界 | 08 / frontend-interaction 仍建议优先限制在 `frontend/src/App.tsx`、`styles.css` 和少量轻量组件 | 风险 | 与 v1.51 “避免继续堆单文件”目标存在潜在冲突。 |
| API client ↔ API-ID | 07 有 API-ID / endpoint matrix，frontend-interaction 有 API 追溯 | 部分满足 | 未明确 API client 与 API-ID 的前端实现边界。 |
| vertical slice | P1 已有多条业务纵切 | 语义满足 | 未作为 Sprint 0 / Walking Skeleton 记录。 |
| 文件膨胀阈值 | 未见阈值 | 缺口 | 进入 Phase2 前需明确 App / CSS / controller / service 文件阈值与拆分触发条件。 |
| API / browser smoke | P1A/P1B 有 smoke；P2 UI 仅草案 | 部分满足 | Phase2 UI smoke 未执行。 |

## 9. 08-09 执行闭环矩阵

| REQ / Sprint | 计划入口 | TC / 验证 | 完成包 | 状态 | 断点 |
|---|---|---|---|---|---|
| Sprint-1..8 / P1 后端核心 | `docs/08-dev-plan.md` Sprint 完成包 | `docs/09-verification.md` TC-P1-001..012 | 已记录提交 / PR / 验证结果 | 基本闭合 | 无 P0 断点。 |
| Sprint-9 / P1A | `docs/08-dev-plan.md:299` | TC-P1-013 | 已记录 build + browser smoke | 闭合 | 无。 |
| Sprint-10 / P1B | `docs/08-dev-plan.md:300` | TC-P1-014 | 已记录 build + browser smoke | 闭合 | 无。 |
| Sprint-11 / P2 UI Gate | `docs/08-dev-plan.md:252` | TC-P2-UI-001..005 | 草案 | 未执行 | 不可算完成 Sprint；不得直接编码。 |
| Phase2 MVP | `docs/03-prd.md:76` | 09 Phase2 用例待细化 | 未开始 | 未就绪 | 需 Phase2 范围确认、tech-env-eval、06/07 契约与 WSG gate。 |

## 10. 各维度问题清单

| ID | 类型 | 严重度 | 位置 | 问题 | 权威源 | 建议修复 | 是否改业务事实 |
|---|---|---|---|---|---|---|---|
| AUD-P1-001 | Web App Structure Profile 缺口 | High | `docs/README.md:107`、`sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:75` | v1.51 WSG 已成为新规范，但项目 04/05/08/09 尚未记录 WSG-001..006、Sprint 0 / Walking Skeleton、文件阈值或豁免。 | `template-docs/web-fullstack-profile.md`、`ai/implementation-lifecycle-rules.md` | Phase2 UI 实现前补 WSG 矩阵，或明确豁免理由。 | 不改需求；补设计 / 计划 / 验证门禁。 |
| AUD-P1-002 | UI 原型策略缺口 | High | `docs/design/frontend-experience-brief.md:132`、`docs/09-verification.md:77` | UI 链路仍为 Conditional Go / 草案未执行，不能直接进入 Phase2 实现。 | `ai/document-lifecycle-rules.md` UI-G-001..007 | 关闭 UI-G-003/005/006/007；执行 P2 UI smoke 后回写 09。 | 不改需求；补确认和证据。 |
| AUD-P1-003 | 05 ↔ 09 风险映射断点 | Medium | `docs/05-tech-spec.md:117`、`docs/09-verification.md:132` | 05 明确“待 09 补 Risk-ID 列”，09 风险表尚未按 RG-ID / Risk-ID 双向映射。 | `ai/doc-standards/05-tech-spec.md` §4 / §5、`ai/doc-standards/09-verification.md` | 在 09 §6 增加 RG-ID / Risk-ID 列，映射 RG-001..006 和 TC。 | 不改业务事实；补追溯。 |
| AUD-P1-004 | 待确认事项总览缺口 | Medium | `docs/08-dev-plan.md:308`、`docs/09-verification.md:146` | 多个待确认项分散于 08 / 09 / frontend-interaction / 同步报告，未见统一 docs-open-items 总览。 | `ai/document-lifecycle-rules.md` §6.2 | 执行 `/run docs-open-items`，落盘到 `docs/research/YYYY-MM-DD-docs-open-items.md` 或明确不落盘理由。 | 不改业务事实；整理 open items。 |
| AUD-P1-005 | Phase2 契约未就绪 | High | `docs/03-prd.md:82`、`docs/06-db-design.md:193`、`docs/07-api-spec.md:202` | 03 要求 Phase2 进入前 06/07 契约齐备，但 06/07 当前仍是 P2 骨架。 | `ai/document-lifecycle-rules.md` §5.5 | Phase2 启动前补 P2 核心 5 项字段级契约、endpoint contract、错误码、权限、迁移 / seed / 回滚和 TC。 | 不改 P1；补 P2 设计。 |
| AUD-P2-001 | 详细设计规范基线缺口 | Medium | `ai/doc-standards/design-doc.md:34`、`docs/design/ingestion.md:21` | 早期子系统详细设计未完全采用新版 design-doc 结构；部分缺独立上游追溯、契约、失败 / 降级、待确认项。 | `ai/doc-standards/design-doc.md` | 按语义最小补齐，不机械重写。 | 不改业务事实；补结构。 |
| AUD-P2-002 | 本地提案归档待办 | Low | `sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md:119` | 同步报告建议归档 4 个已被 v1.50/v1.51 覆盖的 UI / Web 提案，但尚未移动。 | `ai/global-rules.md` §9、同步报告 | 用户确认后移动到 `_archive/proposals/` 并更新 README。 | 不改业务事实；治理整理。 |

## 11. 待人工确认事项总览

| ID | 来源文档或位置 | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|---|
| AUD-C-001 | `docs/03-prd.md:76`、`docs/08-dev-plan.md:310` | 是否正式进入 Phase2 UI / MVP 实现 | 暂不直接编码，先关闭 WSG + UI-G + 06/07 契约门禁 | Phase2 进入标准尚要求 tech-env-eval 与契约齐备；Sprint-11 仅草案 | 只做继续原型探索 | 阻塞 Phase2 实现，不阻塞文档审计结束。 |
| AUD-C-002 | `docs/README.md:107` | LUMEN 是否采用 Web App Structure Profile，还是记录豁免 | 建议采用，至少补轻量 WSG 矩阵 | 项目是复杂 Web / 全栈交互系统，v1.51 明确触发条件 | 写豁免理由 | 阻塞首个 Phase2 Web 业务 Sprint。 |
| AUD-C-003 | `docs/09-verification.md:132` | 是否补 09 Risk-ID / RG-ID 列 | 建议补 | 05 已声明待 09 补映射 | 暂缓到 Phase2 前 | 不补会降低 readiness gate 可审计性。 |
| AUD-C-004 | 同步报告提案回流收口 | 是否归档 4 个 UI / Web 模板提案 | 建议归档 | v1.50 / v1.51 已覆盖核心诉求 | 保留到下次模板同步 | 不阻塞 Phase2，但影响治理整洁度。 |

## 12. 回梳计划

| 优先级 | 批次 | 范围 | 目标 | 建议命令 / 方式 |
|---|---|---|---|---|
| P1 | Batch A：Phase2 进入门禁 | `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`、`docs/design/frontend-interaction.md` | 补 WSG、UI-G、Phase2 进入标准和 smoke 证据路径 | `/run edit-single-doc` 分文件最小回梳；先设计后实现 |
| P1 | Batch B：P2 契约齐备 | `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/09-verification.md` | 为 Phase2 核心 5 项补字段 / API / 错误 / 权限 / TC | 先 tech-env-evaluation（PDF / AI 润色等）再补契约 |
| P1 | Batch C：Open Items 总览 | `docs/research/YYYY-MM-DD-docs-open-items.md` | 汇总所有 Phase2 前待确认项 | `/run docs-open-items` |
| P2 | Batch D：design-doc 兼容补齐 | `docs/design/ingestion.md`、`permissions.md`、`term-management.md`、`intelligence-analysis.md` | 按新版 design-doc 最小补结构 | 不重写历史内容，仅补缺失小节 / 矩阵 |
| P2 | Batch E：提案归档 | `_proposals/`、`_archive/proposals/README.md` | 移动已被模板覆盖的 UI / Web 提案 | 另行确认后执行归档 |

## 13. 同步报告回写建议

若后续需要更新 `sync-records/template-sync/2026-07-14-sync-template-v1.51.0.md`，建议补充：

- docs-system-audit 已完整执行，报告路径为本文件。
- 主要结论：同步主链健康；Phase2 实现前存在 WSG / UI-G / 06-07 契约 / open-items 四类前置门禁。
- 不需要回滚同步；不需要修改模板方法论。
- 下一步建议：先做 `docs-open-items`，再按 Batch A/B 回梳 Phase2 进入门禁。

## 14. 最终结论

- **当前 P1 / Demo 文档闭环：Conditional Go → Go 倾向**。P1 主链、Sprint-1..10 完成包和 TC 证据基本闭合；已知降级项（PDF / OCR）被正确标为后续阶段，不构成 P1 文档阻塞。
- **Phase2 UI / MVP 实现：No Go（当前不可直接编码）**。阻塞原因不是需求缺失，而是 v1.50/v1.51 新规范下的进入门禁尚未完全回填：WSG、UI-G、P2 DB/API 契约、09 风险映射与 open items 总览。
- **同步后兼容性：正常**。项目事实文档无需机械重写成 `ai/doc-standards` 示例骨架；应按最小回梳方式补关键矩阵和门禁。
