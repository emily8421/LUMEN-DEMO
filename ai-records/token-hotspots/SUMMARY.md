# Token Hotspot Summary（2026-07-13 至 2026-08-13）

> 记录类型：AI 协作观察材料的阶段性汇总；不属于项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。
> 隐私口径：不记录 token、密钥、账号密码、客户敏感数据或完整对话正文；仅汇总任务类型、文件路径类别、上下文热点、质量影响和优化建议。

## 0. 覆盖边界

- **已覆盖（`ai-records/token-hotspots/` 入库）**：2026-07-13 ~ 07-19（5 份单条，阶段 A）
- **已覆盖（`.ai/token-hotspots/` 本地，本次纳入汇总）**：2026-07-31 ~ 08-13（30 份单条 + 1 份会话级分析，阶段 B）
- **未覆盖**：无（截至 2026-08-13 全部纳入）
- **下一次 rollup 起点**：2026-08-14 起，只统计 `汇总状态：未汇总` 的本地 `.ai/token-hotspots/` 记录（已纳入本次 SUMMARY 的本地单条建议补标 `已纳入 SUMMARY.md（2026-07-13~08-13）`，逐步补齐）

## 1. 阶段 A：2026-07-13 ~ 07-19（5 份，前端体验 / UI Gate / REQ vertical slice / 用户手册）

| 日期 | 记录 | 任务类型 | 主要热点 |
|---|---|---|---|
| 2026-07-13 | `2026-07-13-frontend-experience-brief.md` | 中断续接后的文档 / 设计回填 | 规则全读、文档标准链、多份前端探索材料、中断日志核对 |
| 2026-07-14 | `2026-07-14-frontend-ui-gate-doc-refresh.md` | UI Gate 原型收敛与 08/09 门禁回填 | 规则全读、长交互设计文档、长 HTML 原型、多轮结构校验 |
| 2026-07-16 | `2026-07-16-req026-frontend.md` | REQ-026 前端 vertical slice + 文档回写 | 编码规则包、`document-lifecycle` 全读、大前端文件、07/08/09 回写 |
| 2026-07-17 | `2026-07-17-req012-tags-vertical-slice.md` | REQ-012 后端 + 前端 + 文档全链路 | 后端参照链 10+ 文件、前端大文件、api 拆分、全量回归 + smoke |
| 2026-07-19 | `2026-07-19-user-guide.md` | 用户操作手册撰写 | 规则全读、事实源文档全文、12 个前端文件核对 |

## 2. 阶段 B：2026-07-31 ~ 08-13（30 份本地 + 1 份会话级分析，Phase2D 收口 + 工程治理 + E4 拆分 + 模板同步）

### 2.1 样本范围（按类别归纳，30 份本地单条）

| 类别 | 份数 | 代表记录 |
|---|---:|---|
| 工程治理 CQ-P1-001~008 | ~13 | error-contract-migration / scoped-query（隐含）/ response_model / fail-fast / uow / mypy / eslint / ruff-debt / log-unification / config（隐含）/ repository 契约 / p1-005-closure / cq-p1-001-slice-d |
| 前端文件膨胀拆分 E4 | ~5 | frontend-split-slices / slice-e-frontend-split / app-state-split（隐含）/ hooks-split（隐含）/ css-split（隐含） |
| 模板同步 / 提案 | ~4 | template-proposal-status-recheck / proposal-reflow-archive / web-fullstack-r135-split / handoff-rollup |
| Phase2D / Phase2C 收口 | ~3 | phase2d-closure / sprint-23c-vault-local-mount / sprint18-pdf-export-closeout |
| 文档 / 结构治理 | ~3 | docs-health-review-p2-b / p2a-docs-structure-cleanup / next-step-suggestion |
| 其余（import / wikilink / llm-config / folder-tree 等） | ~2 | import-preserve-structure / wikilink-alias-anchor-fix 等 |
| 会话级分析（非单条 hotspot） | 1 | `2026-08-13-session-token-analysis.md`（本汇总阶段 B 主要素材） |

### 2.2 重复热点（阶段 B 新增 / 强化）

| 热点 | 频率 | 表现 | 影响 / 处置 |
|---|---|---|---|
| handoff 全读 | 高（阶段 B 后期） | 845 行 handoff 每次续接全读（~25k，单文件最大成本） | **已 rollup 修复**（848→174，2026-08-13） |
| 大文件探索（前端拆分） | 高 | 6 个 ~2200 行大文件全读，多轮（精确重构需看原文） | 读法不稳定；ratchet + 拆分本身就是缓解 |
| 验证长链路 | 高 | build（单任务 3 轮）/ CI 等待（Monitor ~6min）/ browser smoke 环境启动（~2min） | 质量收益高；成功日志应摘要化 |
| 文档回写多文件 | 高 | 08/09/05/project-rules §1/rollout §8/CHANGELOG 三件套 + task-NNN | 回写必要；可固化「Slice 回写模板」减重复编排 |
| smoke 环境调试往返 | 中 | PG down / vite 端口 / Node 版本 / 登录契约失效，6+ 轮 | 已记 pitfall；建议复用 sliceD smoke（真实凭证 + localStorage 注入） |
| 规则重读（跨会话） | 持续 | 快速续接升级执行必须重读规则包（~8-12k/次） | §3.2 复用边界部分缓解（回写收尾不重读） |
| tsc / lint 类型坑往返 | 低-中 | ref 类型（`RefObject<T\|null>` interface 标注）、hooks 顺序等多轮 build | 候选 pitfall 单条（可通用） |

### 2.3 阶段 A 共性热点（仍成立，5/5 → 持续）

规则全读 / `document-lifecycle` 过量读取 / 长文档长原型反复展开 / 大前端文件探索 / 后端参照链重复 / 验证 smoke 长链路 / 状态词与文档事实门禁——阶段 A §2 归纳的 7 个热点在阶段 B 持续出现，无新增类别（阶段 B 的新增是 handoff 全读 + 文档回写多文件，属强度变化）。

## 3. 为什么 07-19 → 08-13 这么久才汇总（触发根因）

基于 `2026-08-13-session-token-analysis.md` §3 交叉评估：

1. **07-19 SUMMARY §4 已诊断**「只有单条触发、无累计汇总触发」——当时是真实机制缺口。
2. **缺口已修复**：模板提案 #312（token-hotspot-trigger-nudge，v1.60.3）+ #314（handoff-rollup，v1.61.0）落地。
3. **LUMEN 2026-08-13 v1.61.4 同步**才拿到 `session-rules §4.2 / §4.3 / §6.1`（累计汇总触发 + pitfall + handoff rollup）。
4. 07-19 → 08-13 的未汇总记录**绝大部分是机制落地前的自然积累，非执行遗漏**。
5. **§4.2 落地后首次触发** = 2026-08-13（Slice D / E 收尾自检命中「未汇总 ≥3 份建议生成 SUMMARY」）。

## 4. 改进建议

| 优先级 | 动作 | 状态 / 归属 |
|---|---|---|
| P0 | handoff rollup（压缩 + 归档，缓解「全读付全价」） | **已执行**（2026-08-13，848→174，归档 `.ai/session-handoff-archive/2026-08-11-to-2026-08-13.md`） |
| P1 | 文档回写按章节读取 `document-lifecycle`（只读状态词 / 反向同步 / 变更传播 / 自检） | 模板规则候选（阶段 A 已提，未落地） |
| P1 | vertical slice 最小参照清单（避免每个 slice 全链路重读） | 项目或模板 profile 候选 |
| P1 | browser smoke 一键启动脚本（demo 后端 + 前端 + CDP，减手动编排） | 项目优先 |
| P2 | 成功验证日志摘要化（build / CI / smoke 成功输出只留结论） | 规则自觉（§4.1 验证证据摘要约定已覆盖，执行强化） |
| P2 | 规则路由复用（§3.2，回写 + bump 收尾不重读规则包） | 规则已支持，执行强化 |

## 5. 回流模板判断

**暂不发起新提案**（基于 `2026-08-13-session-token-analysis.md` §4）：

- 机制缺口已由 #312 / #314 修复并于 2026-08-13 v1.61.4 同步落地（三边界：阈值主动提示 + 不得静默写入 + 无自检门禁）。
- 立即二次提案「硬化触发（加命令入口 / 收尾计数清单）」违背「避免过度治理」——机制刚落地、刚触发一次，尚未观察是否持续执行。
- **观察点**：未来 2-3 个会话收尾是否稳定触发 §4.2 提示；若仍不触发，再议轻量补充（候选：收尾自检输出「未汇总计数 + 清单」/ 新增 `token-hotspot-rollup` 命令入口）。

## 6. 已落地改进（历史索引）

- 2026-08-13：handoff rollup（848→174）。
- 2026-08-13：`session-rules §4.2 / §4.3 / §6.1` 经 v1.61.4 同步落地（#312 / #314）。
- 阶段 A（07-13~07-19）原 5 份单条已入库 `ai-records/token-hotspots/`；阶段 B（07-31~08-13）30 份单条留本地 `.ai/token-hotspots/`（gitignored），本 SUMMARY 为其阶段性提炼。
