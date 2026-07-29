# 研发数据链 Profile（rd-data-chain）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 定位：本文件是研发过程各类数据如何沉淀的**索引 / 分类**，把留痕载体与文档事实主链的关系、流转规则、生命周期统一说明，**不替代 `docs/00-09` 事实文档**。长期事实必须回写 00-09（`ai/implementation-lifecycle-rules.md` §7.1）。Lean 项目可不用；复杂项目按需引用。

## 1. 两条链

模板有两条性质不同的链：

- **文档事实链（强统一）**：`ai/document-lifecycle-rules.md` §2 / §5 / §6 把 `inputs → vision → 00-09 → design → 08 → 09 → code` 串成可追溯主链。这是项目事实权威。
- **辅助留痕（各自为政）**：ADR / 调研 / 会议 / CHANGELOG / handoff / ai-records，每个有定位但散落多处，无统一总览。本 Profile 给这张「辅助留痕」做索引。

## 2. 数据类别 → 载体 → 主链关系 → 生命周期

| 数据类别 | 沉淀载体 | 与主链关系 | 生命周期 |
|---|---|---|---|
| 架构决策 / 取舍 | `docs/decisions/`（ADR） | 约束 04/05 | 长期，版本演进留痕 |
| 技术调研 / 实验 / 评估 | `docs/research/` | 输入 05 readiness gate | 阶段性，结论回写 05 |
| 验证证据 / 验收记录 | `docs/09-verification.md` | 主链验收层 | 只增不删 |
| 会议 / 评审 / 访谈 | `docs/meetings/` | 输入 00-03 | 留痕，结论回写需求 |
| 版本变更 | `CHANGELOG.md` | 发布边界 | 长期 |
| AI 开发过程成本 | 单条 `.ai/token-hotspots/`（本地）/ 汇总 `ai-records/token-hotspots/`（入库） | meta（非领域知识） | 本地观察 / 提炼汇总入库 / 转提案 / 归档 |
| 派生项目谱系 / 同步 | `ai-records/project-registry/`（维护者侧）、`sync-records/`（派生侧） | 维护者侧 | 长期 |
| 会话续接 | `.ai/session-handoff.md` | 临时，须回写 08/09 | gitignored |

## 3. 流转规则

- **长期事实回写 00-09**：ADR 结论约束 04/05、调研结论回写 05、会议结论回写 00-03、验证证据入 09。辅助留痕是过程，不是事实权威。
- **token-hotspots → proposals 回流**：单条 `.ai/token-hotspots/` 记录只留本地；若其中出现可通用的模板优化建议，应先提炼为脱敏 summary（`ai-records/token-hotspots/`）或直接去项目化转写为 `_proposals/TEMPLATE-UPGRADE-*.md` 回流模板（已有机制，本 Profile 显式说明这条路径）。
- **handoff 不替代正式记录**：`.ai/session-handoff.md` 是临时续接，须回写 08/09；Sprint 完成 / 验证通过 / Phase 验收必须落 08/09（`implementation-lifecycle-rules.md` §7.1）。

## 4. 自检门禁现状

- **有门禁**：文档事实链（00-09 / doc-standards）、运行时机制、同步清单（`template-sync.json`）有 `scripts/check-template.sh` 守卫。
- **无内容门禁（依赖自觉）**：ADR / research / meetings / handoff / token-hotspots 无内容级 `check-template` 门禁。本 Profile 只做索引，**不为它们新增逐条内容断言或 CI 门禁**（避免过度治理；强制化另案讨论）。其中 token-hotspot 记录的「汇总状态」等字段级必填属写入时自觉（见 `ai/session-rules.md` §4.2），不构成自检门禁；模板自检只守 `.ai/token-hotspots/` 本地忽略与 `ai-records/token-hotspots/` summary 入库的路径边界，防止口径漂移。

## 5. 边界

- 本 Profile 是索引 / 导航，不替代 00-09 事实文档。
- 不为辅助留痕加强制必填或自检。
- 派生项目按需采用；Lean 项目可不用。
