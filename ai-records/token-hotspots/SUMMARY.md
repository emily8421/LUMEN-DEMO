# Token Hotspot Summary（2026-07-13 至 2026-08-17）

> 记录类型：AI 协作观察材料的阶段性汇总；不属于项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。
> 隐私口径：不记录 token、密钥、账号密码、客户敏感数据或完整对话正文；仅汇总任务类型、文件路径类别、上下文热点、质量影响和优化建议。

## 0. 覆盖边界

- **已覆盖（`ai-records/token-hotspots/` 入库）**：2026-07-13 ~ 07-19（5 份单条，阶段 A）
- **已覆盖（`.ai/token-hotspots/` 本地，首次汇总纳入）**：2026-07-31 ~ 08-13（30 份单条 + 1 份会话级分析，阶段 B）
- **已覆盖（历史追加）**：2026-08-13 codegen Slice B-2/B-3/B-4（3 份单条，阶段 C，见 §7）
- **已覆盖（本次追加）**：2026-08-14 ~ 08-17（5 份单条，阶段 D，见 §8）
- **未覆盖**：无（截至 2026-08-17 全部纳入）
- **下一次 rollup 起点**：2026-08-18 起，只统计 `汇总状态：未汇总` 的本地 `.ai/token-hotspots/` 记录（已纳入本次 SUMMARY 的 5 份本地单条已补标 `已纳入 SUMMARY.md（2026-07-13~08-17，阶段 D）`）

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
6. **本次（2026-08-17）触发**：08-13 汇总后本地累计 5 份未覆盖记录（08-14 ×2 / 08-16 / 08-17 ×2），收尾自检命中「≥3 份」阈值，用户确认执行 rollup。

## 4. 改进建议

| 优先级 | 动作 | 状态 / 归属 |
|---|---|---|
| P0 | handoff rollup（压缩 + 归档，缓解「全读付全价」） | **已执行**（2026-08-13，848→174，归档 `.ai/session-handoff-archive/2026-08-11-to-2026-08-13.md`） |
| P1 | 文档回写按章节读取 `document-lifecycle`（只读状态词 / 反向同步 / 变更传播 / 自检） | 模板规则候选（阶段 A 已提，未落地） |
| P1 | vertical slice 最小参照清单（避免每个 slice 全链路重读） | 项目或模板 profile 候选 |
| P1 | browser smoke 一键启动脚本（demo 后端 + 前端 + CDP，减手动编排） | **已落地待实测**（2026-08-14 A1 编排器） |
| P2 | 成功验证日志摘要化（build / CI / smoke 成功输出只留结论） | 规则自觉（§4.1 验证证据摘要约定已覆盖，执行强化） |
| P2 | 规则路由复用（§3.2，回写 + bump 收尾不重读规则包） | 规则已支持，执行强化 |
| P0 | project-rules §1 批次史压缩（近 3 批详写 + 早批一行指针指向 CHANGELOG） | 项目优先，实证后回流模板（08-14 提出，未落地） |
| P1 | CI 批量收口轮询优化（`gh run watch` / `--log-failed` / `gh pr checks --json` 汇总） | 规则 / 命令候选（08-16 提出，未落地） |
| P1 | docs/03 §4 覆盖矩阵补 REQ-043..051 行（消除跨 03/08 重复 grep） | 项目优先（08-17 提出，未落地） |
| P1 | mermaid 块坐标扫描脚本（一次输出 文件/块/章节/DIAG-ID 四元组） | 项目优先（08-17 提出，未落地） |
| P2 | 批量本地字段回填统一走 Python 自校验脚本 | 已实证（08-14，37 份零返工） |
| P2 | 提交前 `git diff --check`（防 whitespace 一次返工） | 规则自觉（08-17 教训） |

## 5. 回流模板判断

**暂不发起新提案**（基于 `2026-08-13-session-token-analysis.md` §4）：

- 机制缺口已由 #312 / #314 修复并于 2026-08-13 v1.61.4 同步落地（三边界：阈值主动提示 + 不得静默写入 + 无自检门禁）。
- 立即二次提案「硬化触发（加命令入口 / 收尾计数清单）」违背「避免过度治理」——机制刚落地、刚触发一次，尚未观察是否持续执行。
- **观察点**：未来 2-3 个会话收尾是否稳定触发 §4.2 提示；若仍不触发，再议轻量补充（候选：收尾自检输出「未汇总计数 + 清单」/ 新增 `token-hotspot-rollup` 命令入口）。
- **新增候选（观察中，未立提案）**：project-rules §1 批次史压缩（08-14 分析，本项目最高 ROI 固定成本项，按「先项目实证后回流模板」路径）；CI 批量收口轮询优化（08-16，模板命令 / SOP 候选，先项目内固化 `gh run watch` / `--log-failed` 用法，持续复现再立提案）；docs/03 覆盖矩阵补 REQ-043..051（08-17，项目文档修复，直接执行，不属模板回流）。

## 6. 已落地改进（历史索引）

- 2026-08-13：handoff rollup（848→174）。
- 2026-08-13：`session-rules §4.2 / §4.3 / §6.1` 经 v1.61.4 同步落地（#312 / #314）。
- 2026-08-14：token 优化候选 A1（一键 smoke 编排器）/ A2（project-rules §5 纪律）/ B4 落地。
- 2026-08-16：#171（A2 纪律）「CI 输出只留结论」执行实证；CI paths 过滤生效（#176 docs-only → 仅 project-check 7s；#177 单前端文件 → 仅 Frontend CI 3 job）。
- 阶段 A（07-13~07-19）原 5 份单条已入库 `ai-records/token-hotspots/`；阶段 B（07-31~08-13）30 份单条留本地 `.ai/token-hotspots/`（gitignored），本 SUMMARY 为其阶段性提炼。

## 7. 阶段 C：2026-08-13 深夜（codegen Slice B-2/B-3/B-4，3 份，前端 codegen 全量闭环）

| 记录 | 任务类型 | 主要热点 |
|---|---|---|
| `frontend-codegen-slice-b2` | 术语导入域编码 + PR 闭环 | 规则包全量加载（快速续接→编码）、generated.ts 分段定位、消费方核验 grep ×2 轮 |
| `frontend-codegen-slice-b3` | 账户空间域编码 + PR 闭环 | **§3.2 同会话规则复用首次完整生效（规则加载成本 0）**、grep-offset 模式定位（~300 行）、union/optionality 消费链 1 轮 grep |
| `frontend-codegen-slice-b4` | documents 梳理 + 编码 + PR 闭环（收口批） | **前置全景 grep 兑现收益**（plan→编码零返工）、smoke 调试 4 轮（脚本 bug ×2 + 既有应用行为未知 ×2）、CI ratchet 一次往返（本地漏跑 file-size） |

### 7.1 阶段 C 结论

- **有效模式沉淀**（后续批次沿用）：① 前置消费方全景 grep → plan 按消费方分类给改动面（B-4 验证，plan→编码零返工）；② generated.ts schema 先 grep offset 再批量读（B-3 起）；③ §3.2 同会话规则复用（B-3 验证，成本归零）。
- **待改进**：① 涉及登记基线文件（useAppState/useDocuments）的改动，本地验证包须加 `npm run check:file-size`（B-4 CI 一次往返教训）；② 写 UI smoke 前先读目标组件渲染条件（模式切换 / handler 挂载点），可省 1-2 轮试错（B-4 4 轮教训）。
- **机制层产出**：AI 代码问题记录机制讨论 → 模板提案（pitfall 触发口径扩展）+ 首次 pitfall SUMMARY rollup（见 `ai-records/pitfalls/SUMMARY.md`）。
- 热点强度趋势：规则加载与 schema 定位成本经 A/B/C 三阶段迭代**收敛**（全量 → 复用 → 定向），codegen 类任务的剩余主要成本为消费方核验与 smoke 调试（随域数线性，模式已稳定）。

## 8. 阶段 D：2026-08-14 ~ 08-17（5 份，token 优化落地 + 文档审计 / 批量修订 + PR/CI 收口）

| 日期 | 记录 | 任务类型 | 主要热点 |
|---|---|---|---|
| 2026-08-14 | `summary-backfill-and-token-analysis` | 本地观察材料回填 + token 成本分析 | 规则入口固定底座（~1000+ 行，project-rules §1 批次史为最大单块）；补标批量写 37 份（Python 自校验脚本，省 ~70 次工具调用）；覆盖边界交叉核对 |
| 2026-08-14 | `token-opt-a1-a2-b4` | 本地工具 + 规则增强（A1 一键 smoke 编排器 / A2+B4 纪律）+ 报告 | 规则完整回退包全读 ~2000 行；`run-sprint16-demo.ps1` 420 行全读 ×2；PS 数组 splat 调试 3 轮 |
| 2026-08-16 | `public-ci-recovery` | 仓库转 public 后 CI 全量恢复 + 6 PR 收口 | PR checks 全量反复拉取（5/6 全绿仍多轮轮询，占时 6-8 分钟）；`--log` tail 全文 vs `--log-failed`；paths 过滤生效实证 |
| 2026-08-17 | `docs-04-architecture-audit` | 文档审计 → 修订 → PR #181 | 规则链全读 + 多份大文档交叉验证（修订轮按 §3.2 未重读）；REQ-043..051 状态跨 03/08 多次窄 grep（文档间无单点索引） |
| 2026-08-17 | `oo-coverage-batches` | 文档批量修订 + 脚本开发 + 跨仓回流（四批 6 PR + 5 issue） | 31 个 mermaid 块逐块 sed 定位（~8 次调用）；规则包 ~9k 行单任务链内复用未重读；2 次 CI 失败定位（whitespace / 脚本 grep 缺陷） |

### 8.1 阶段 D 结论

- **重复热点强化**：规则入口固定成本持续（~1000-2000 行/次），跨类型混合任务不可避免；§3.2 同会话复用已生效（08-17 审计修订轮、OO 批次内均未重读规则包）。批量编辑脚本化（08-14 验证）：Python 自校验脚本一次完成 37 份 edit 零返工，与既有「中文编辑优先 Python」坑位一致，建议固化为批量回填默认方式。grep / offset 定向替代全文已成常态；mermaid 块坐标逐块 sed 定位可进一步脚本化。
- **新热点（PR/CI 批量收口轮询）**：多 PR checks 全量反复拉取 + sleep 轮询占时 6-8 分钟；同批操作应 `gh pr checks --json` 汇总、rerun 后查一次终态（`gh run watch`）、失败日志用 `--log-failed` 直接命中失败 step。
- **已落地**：A1 一键 smoke 编排器（下次验证类任务实测收益）；A2/B4 纪律 08-16 实证（CI 输出只留结论表格化 + paths 过滤生效）。
- **待办建议**：project-rules §1 批次史压缩（P0，最高 ROI 固定成本）；docs/03 §4 矩阵补 REQ-043..051（P1）；mermaid 块坐标扫描脚本（P1，省 ~50%+ 往返）；提交前 `git diff --check`（P2，防 whitespace 返工）。
