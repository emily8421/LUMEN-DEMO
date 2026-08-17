# 待确认事项总览（Open Items · 2026-08-17）

> 本报告为 `/run docs-open-items` 只读扫描汇总，用于集中展示阻塞项、条件阻塞项、风险接受项和回填位置；不替代 `docs/00-09`、`docs/design/*`、`tasks/*` 或 `ai/project-rules.md` 的权威事实。用户确认后必须回填对应权威文档或任务单。
> 承接：历史总览 `docs/research/2026-07-14-docs-open-items.md`（Phase2 时代，OI-001..010 已由 `docs/09-verification.md` §5/§6 收口，2026-08-07 项目收尾定性「无未决 open items」）。最新阶段事实以 `ai/project-rules.md`、`docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 为准。

## 1. 汇总范围与读取依据

- 规则：`ai/index.md`、`ai/document-lifecycle-rules.md`、`ai/prompts/docs/21-docs-open-items.md`、`ai/commands/docs-open-items.md`。
- 正式文档：`docs/02-srs.md`、`docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`（待确认段 + §6 风险与未验证项）。
- 设计：`docs/design/00-index.md`、`req-implementation-index.md`、7 份 design 文档待确认段。
- 研究与续接：`docs/research/2026-07-14-docs-open-items.md`、`2026-08-16-ui-visual-exploration.md`、`2026-08-17-docs-evaluation-oo-methodology-03-04.md`、`2026-08-17-docs-system-oo-methodology-redesign.md`、`2026-08-17-docs-evaluation-e3-design-review.md`、`.ai/session-handoff.md`。

## 2. 去重规则和合并说明

- 同一事项在 handoff / 评估报告 / 08-09 重复出现时，以最新权威文档为主锚点，其他来源作佐证。
- 本次新产生的待确认项编号 `OI-101` 起（沿用总览递增），与 07-14 总览 `OI-001..010` 隔离；历史项已关闭的不再列出。
- REDESIGN-C-001/002 决策已随 2026-08-17 Batch A2 落地（DIAG-CLS 9/12），记为已执行；REDESIGN-C-003/004 为可选增强，合并入 OI-111。
- 真实 Word/PDF 提取、zhparser、真实 OCR 从 08 Sprint-14/15 与 09 §6 合并为 OI-106。

## 3. 待确认事项总览

| ID | 提出时间 | 来源 | 待确认事项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 | 需确认节点 | 阻塞关系 | 回填位置 | 当前状态 | 关闭依据 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OI-101 | 2026-08-17 | E3 评审（P2-02） | P1 期 design（ingestion / rag-retrieval / term-management）旧版结构对齐 design-doc 标准 | 排后续维护批按标准补齐 | 结构统一便于审计 | 维持现状 | 非阻塞 | 后续维护批 | 不阻塞 | `docs/design/*` | 待确认 | — |
| OI-102 | 2026-08-17 | E3 评审 | 06 §6 REQ-018 行字段/索引列与表头（TC-ID/Sprint）错位 | 最小格式修正 | 表头一致 | 不改 | 极低 | 任意时点 | 不阻塞 | `docs/06-db-design.md` §6 | 待确认 | — |
| OI-103 | 2026-08-08 | handoff / 08 | 部署执行（#176 遗留，笔记本侧人工） | 按部署手册人工执行 | 部署就绪 C-001 已落盘 | — | 人工操作 | 发布前 | 条件阻塞发布 | `docs/env/deploy-guide.md`、08 | 待确认 | — |
| OI-104 | 2026-08-17 | handoff | hotspot rollup 已达阈值（5 份本地未汇总） | 会话收尾汇总入 SUMMARY.md | token-hotspot 规则 | — | 治理 | 下次会话收尾 | 不阻塞 | `ai-records/token-hotspots/SUMMARY.md` | 待确认 | — |
| OI-105 | 2026-08-17 | handoff / 跨仓 | 模板仓 7 份提案 issue triage | 模板维护者另行处理 | 跨仓协作 | — | 治理 | 任意时点 | 不阻塞 | 模板仓 | 待确认 | — |
| OI-106 | 2026-07-30 | 08 Sprint-14/15、09 §6 | 真实 Word/PDF 文本提取、zhparser 中文分词、真实 OCR（REQ-009/010 真实化） | 保持候选 / 待 RG，不阻塞维护态 | 已降级实现并有 TC | 维持降级 | 候选能力 | 立项时 | 不阻塞 | `docs/05`、08、09 | 待确认（候选） | — |
| OI-107 | 2026-07-30 | 02 / design/timeline TL-C-013 | 关联图 REQ-013b 立项评估（主题时间线试用反馈后） | 待反馈后评估 | 依赖时间线子集能力 + 图算法可解释性 | 不立项 | 愿景 | 试用反馈后 | 不阻塞 | `docs/02`、`docs/design/timeline.md` | 待确认（愿景） | — |
| OI-108 | 2026-07-14 | 02 / 06 | 愿景 REQ-019..023 / 028..035 技术验证后细化字段与索引 | 保持骨架，立项时细化 | 06 §1 骨架 | — | 愿景 | 立项时 | 不阻塞 | `docs/02`、`docs/06-db-design.md` | 待确认（愿景） | — |
| OI-109 | 2026-08-06 | 09 TC-P2-VAULT-004 | vault 跨设备元数据 `lumen_vault_mounts`（migration 015）落地 | 账户体系稳定后编码 | 09 已登记顺延（014 被占用） | — | 增强 | 后续批 | 不阻塞 | `docs/06`、09 | 待确认 | — |
| OI-110 | 2026-08-16 | research/ui-visual-exploration C-RA-004 | local-mount 54 处硬编码清零（token 化） | 实现期动作，纳入首期 | 视觉探索报告 | — | 视觉一致性 | 实现期 | 不阻塞本次确认 | `docs/design/frontend-design-system.md` | 已裁决（实现期动作） | 探索报告 §5 |
| OI-111 | 2026-08-17 | research/oo-methodology | OO 图纸可选增量（前端组件树 / 状态图；E-E 表不补） | 可选增强，不阻塞维护态 | REDESIGN-C-003/004 | 不做 | 增强 | 任意时点 | 不阻塞 | `docs/design/*` | 待确认（可选） | — |
| OI-112 | 2026-07-14 | `docs/design/frontend-experience-brief.md` | 前端体验原则 / 信息架构方向（候选） | 维持候选，确认后入正式设计 | brief 明标候选待确认 | 不采纳 | UI 方向 | 设计前 | 不阻塞 | `docs/design/frontend-experience-brief.md` | 待确认（候选） | — |

## 4. 门禁结论

- **Go（维护态）**：无阻塞项、无条件阻塞项。文档 / 编码 / 维护态推进均不被本总览阻塞。
- OI-103（部署执行）为人工待办，条件阻塞发布，不影响文档与代码维护；OI-104（hotspot rollup）为治理动作，下次会话收尾处理。

## 5. 回填建议

- OI-102：`docs/06-db-design.md` §6 最小格式修正（`edit-single-doc`）。
- OI-104：会话收尾时汇总入 `ai-records/token-hotspots/SUMMARY.md`。
- OI-106 / 107 / 108 / 109 / 112：维持候选 / 愿景 / 待技术验证状态，立项时回填对应 `02/05/06/08/09`。
- OI-101 / 111：排后续维护批，执行时按 `ai/doc-standards/design-doc.md` 与 OO 图纸标准回填 `docs/design/*`。

## 6. 落盘建议

- 已按用户确认写入 `docs/research/2026-08-17-docs-open-items.md`；本总览不替代权威文档。如需长期固定入口再议 `docs/open-items.md`（需同步 `docs/README.md` 定位说明）。

## 7. 需要用户立即确认的问题

- 无阻塞项需立即确认。可选：OI-102 是否顺手修正；OI-101 是否排入下一维护批。
