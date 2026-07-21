# RESEARCH LUMEN inputs 架构评估与 Phase2A 漂移发现（2026-07-20）

> **定位声明**：本文是 `docs/research/` 调研记录，评估 2026-07-20 新增的 5 份 `docs/inputs/` 材料，并交叉核实两份 AI 评估结论。**不是权威规格，不直接约束代码**；条目采纳后需回填 `01/03/04/05/06` 等权威文档才具约束力。参照「完整骨架 + 阶段增量」演进方式，本文建议项均标注建议阶段，不默认进入当前 Phase。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 文档类型 | 调研记录（Research）/ 输入材料评审 + 架构评估 |
| 评估对象 | 2026-07-20 新增的 5 份 `docs/inputs/`：`2026-07-20-doc-system-architecture-evaluation.md`、`2026-07-20-obsidian-design-reference-suggestions.md`、`ref-obsidian-overview.md`、`软件系统面向对象开发方法的过程要点及关系.md`、`软件系统面向过程开发方法的过程要点及关系.md` |
| 评估角色 | 系统架构专家视角——评估输入材料的性质、可信度、与 LUMEN 现状 / 阶段边界的一致性、可采纳性与归位 |
| 评估者构成 | 两份 AI 评估交叉：① 本会话 Claude 评估；② 用户提供的另一 AI 评估。两者论断均已与 Git 客观事实、`docs/00-09`、`docs/design/*`、`frontend/` 代码逐条核实 |
| 输入来源 | 上述 5 份 inputs；`docs/02-srs.md` / `04-architecture.md` / `05-tech-spec.md` / `06-db-design.md` / `docs/design/frontend-interaction.md` / `docs/vision/product-vision.md`；`frontend/package.json`、`frontend/src/features/DocumentsFeature.tsx`、`frontend/src/components/MarkdownBlock.tsx`；`ai/project-rules.md` §1/§2.8、`ai/global-rules.md` §8、`ai/document-lifecycle-rules.md` |
| 当前状态 | 已落盘；P0 Phase2A 漂移同步已提交 v0.2.4（91817d3）；P1 文档归位 / 索引建设已落盘；OB-01 架构裁决已形成 ADR-010 |
| 最后更新 | 2026-07-21（补 P0/P1/OB-01 执行状态） |

---

## 1. 结论摘要

5 份新增 inputs **不是直接进入开发的需求单**，而是「文档治理 + 外部参考 + 方法论参考」的输入包。逐条核实后：

- **B 组（3 份针对 LUMEN 的项目输入）质量较高、可用**：1 份文档体系评估（B-1）、1 份 Obsidian 架构建议 OB-01~06（B-2）、1 份 Obsidian 外部调研（B-3）。
- **A 组（2 份通用方法论）为外部教材式参考**，与 LUMEN 无强绑定，且存在转录风险，正式引用前需校对原图。
- **最重大发现不在 inputs 本身，而在核实过程中暴露的 Phase2A closure 文档漂移**：v0.2.3 已 close Phase2A，但 `02/04/05/design` 多处状态字段仍停在 `骨架 / Phase2A-已设计 / 候选`（见 §5）。这是**项目事实准确性问题，优先级高于 inputs 归位**。
- **OB-01（数据层"可重建"不变式）是唯一需要架构裁决的项**：原文与 LUMEN 当前 DB 权威模型冲突，不应原样采纳，应改写并走 ADR（见 §6）。

**评估码**：对 inputs 评审本身 = `Go`（材料足以分类与归位）；对"立即吸收 OB 建议 / 进入 Phase2B" = `Conditional Go`（前提：先做 P0 漂移同步 + OB-01 架构裁决）。

---

## 2. 5 份 inputs 性质分类

| 组 | 文档 | 性质 | 与 LUMEN 绑定 |
|---|---|---|---|
| **A 通用方法论** | 面向对象开发方法、面向过程开发方法 | 外部 SE 教材式知识（从流程图转录） | 无特定绑定，是"教科书"非"项目输入" |
| **B-1 项目元评估** | doc-system-architecture-evaluation | 针对 LUMEN **文档体系本身**的成熟度评估（v2） | 强 |
| **B-2 架构建议** | obsidian-design-reference-suggestions | 基于 Obsidian 调研的 6 条产品架构建议（OB-01~06） | 强 |
| **B-3 外部调研** | ref-obsidian-overview | B-2 的背景依据（Obsidian 技术调研） | 间接（被 B-2 引用） |

---

## 3. B 组逐组评估

### 3.1 B-1 文档体系评估报告

**质量**：结构专业（元信息 / 现状 / 优点 / 缺陷 / 优先级清单 / 总评）、问题分级合理、核心结论「问题不在内容而在元管理（归档 / 索引 / 追溯结构化）」准确。

**⚠️ 与 Git 事实冲突（须修正后才能落 research/）**：
- §4.1【高优先级】建议"新建 `docs/archive/`，迁移 **kb-\* 四份草稿**"。但 `docs/**/kb-*.md` 在仓库中**已不存在**（Glob 核实，2026-07-20）。该条迁移动作建立在一个已过时的前提上。
- 但 §4.1 的另一半"补全 `docs/vision/product-vision.md` 的『转正自 kb-scenario-v19』溯源"**仍有效**：核实 `product-vision.md:4` 仍带 `版本：v19.0`、`:6` `关联文档：URS-KB-001 v2.0`，顶部无转正声明。即 kb-\* 文件虽不在，product-vision 的溯源缺口仍需补。
- §4.5 建议"00-09 补版本号字段"，但 `ai/project-rules.md §2.8` 已定义项目级版本管理（`VERSION` + `CHANGELOG.md` + CI 校验）。单文档版本号与项目级版本如何协调，报告未提，需补一致化说明。

**有效且未落地的建议**（Glob 核实这些索引 / 目录均不存在）：
- `docs/research/00-index.md`、`docs/design/00-index.md`（§4.2 / §4.7）——合理，建议采纳。
- 拆分 `docs/references/`（外部调研）与 `docs/research/`（内部审计）（§4.3）——合理，且正好指导本批 inputs 归位。
- `frontend-interaction.md` 与 `frontend-workspace-redesign.md` 的交叉引用（§4.6）——合理。

### 3.2 B-2 / B-3 Obsidian 建议 + 调研

OB 六条逐条评估（阶段标注已与 `project-rules §1` 核对）：

| OB-ID | 建议 | 评估 | 现状关系 |
|---|---|---|---|
| **OB-01** | 数据层"可重建"不变式 | ⚠️ **架构裁决项，见 §6** | 与 DB 权威模型冲突 |
| OB-02 | 编辑器 Live Preview（CM6 Decoration） | 合理，但**前置依赖未满足** | `05-tech-spec` 无编辑器选型记录；frontend 实际为 textarea+react-markdown（见 §5.2），落地 = 换编辑器内核，需先 Spike |
| OB-03 | 本地图谱 | 合理，已标 [P2] | 触及 Phase2A 禁止的"关联图视图"，阶段标注一致 ✅ |
| OB-04 | 图谱过滤器 | 合理，已标 [P2]/[愿景] | 依赖 Phase4 `relation_type`，阶段一致 ✅ |
| OB-05 | 编辑器统一"标注层"扩展点 | 工程质量建议，合理 | 同 OB-02，依赖编辑器选型先确认 |
| OB-06 | 团队协作差异化定位写入 03-prd | 纯文档补充 | 无冲突 ✅，建议采纳 |

**小瑕疵（P1 已修正）**：`obsidian-suggestions §0` 原引用旧 research 路径，但迁移前文件实际位于 inputs 旧位置；P1 已将外部参考归位到 `docs/references/ref-obsidian-overview.md`，并同步修正建议文档输入来源。

### 3.3 A 方法论两份

- **定位**：经典 OOA/OOD 与结构化分析设计五阶段法。可作"对照参考"检验 LUMEN 文档体系完整性（04↔概设类图、06↔ERD、design↔详设），但**不应套用为 LUMEN 开发流程强制规范**——LUMEN 已有自有 PLM 链路（`document-lifecycle-rules §2`）。
- **转录风险**：两份文末均自声明"图中部分小字标注受限于图片清晰度，可能存在个别转录偏差，建议对照原图核对"。**正式引用前必须人工校对原图**，当前版本只能当草稿参考。
- **归位**：外部通用知识，宜进 `docs/references/`（若 §3.1 拆分建议采纳），或长期留 `docs/inputs/`——待人工定夺。

---

## 4. 评估者交叉结论

本会话评估与另一 AI 评估**方向一致、无冲突**。另一 AI 在三处核得更扎实，本报告已采纳其结论：

1. **Phase2A closure 文档漂移**（本会话首轮漏掉，见 §5）。
2. **编辑器 = textarea + react-markdown**（本会话首轮仅 Grep `05-tech-spec` 未查 frontend；另一 AI 定位了 `frontend/package.json:14`、`DocumentsFeature.tsx:122` 实际实现，把 OB-02/05 成本从"补选型"修正为"换内核"）。
3. **OB-01 改写为"衍生数据可从权威文档内容 / 元数据重建"**（比本会话首轮"双写 frontmatter"更贴合 LUMEN 正文在 PG 的现实）。

本报告相对另一 AI 的增量补充：① 漂移范围更全（补 `02:84` REQ-026 标"骨架"、`04:240` 追溯表）；② OB-01 即便改写仍应走 ADR 而非塞 04 小节；③ P0 是横切状态变更需一致性检查 + 先核查 `08/09` 验收落点；④ 方法论转录风险与 obsidian-suggestions 路径瑕疵。

---

## 5. ⚠️ Phase2A closure 文档漂移（重大发现）

v0.2.3（commit `c980857` "close Phase2A verification"）已 close Phase2A，REQ-012/025/026 验收通过（TC-P2-TAG/QUICK/LINK，见 handoff 与 `project-rules §1`）。但下游正式文档状态字段**未同步**：

| 位置 | 现状（漂移） | 应为 | 核实 |
|---|---|---|---|
| `02-srs.md:76` | REQ-012 标签视图 = `Phase2A-已设计` | `P2-已实现` | 已核实 |
| `02-srs.md:83` | REQ-025 快速录入 = `Phase2A-已设计` | `P2-已实现` | 已核实 |
| `02-srs.md:84` | REQ-026 内链反链 = `骨架` | `P2-已实现` | 已核实（漂移最明显） |
| `04-architecture.md:106` | MOD-006 = `Phase2A-骨架（REQ-012/025/026）` | `P2-已实现` | 已核实 |
| `04-architecture.md:240` | §4 追溯表 REQ-012/025/026 = `Phase2A-骨架` | 同步更新 | 已核实 |
| `05-tech-spec.md:90` | Phase2A 描述为"候选、需在 P1.5A/B 后补契约" | "已完成（TC-P2-\* 验收）" | 已核实（前瞻约束文字，漂移较轻） |
| `design/frontend-interaction.md:4` | `Phase2A/B 尚未正式启动` | Phase2A 已 close | 已核实 |
| `design/frontend-interaction.md:16` | `Phase2A/B 与实现任务仍待人工确认` | 同步更新 | 已核实 |
| `design/frontend-interaction.md:19` | 最后更新 2026-07-15（Phase2A 编码前） | 刷新 | 已核实 |

**不要误改**（这些 `骨架` 是正确的，属后续阶段）：
- `02-srs` REQ-013/014/015/016/017/024（Phase2B 候选）= `骨架` ✅
- `02-srs` REQ-018/019/020/021（愿景）= `骨架` ✅
- `05-tech-spec:91` Phase2B 描述 ✅

### 5.1 P0 执行前必须核查（决定改动边界）

handoff 称 TC-P2-LINK/TAG/QUICK 已验收，但需确认这些是否已**落进 `08-dev-plan.md` / `09-verification.md`**：
- 若已落 → `02/04/05/design` 漂移纯属"状态字段滞后"，直接改；
- 若未落 → 漂移范围更大，P0 还要补 `08/09` 验收记录。

### 5.2 编辑器现状（OB-02/05 前置事实）

核实 `frontend/`：`package.json:14` `react-markdown^10.1.0`；`DocumentsFeature.tsx:122` `<textarea>`；`MarkdownBlock.tsx` 用 `ReactMarkdown` 渲染；**全仓无 codemirror/tiptap/monaco/slate**。当前编辑器 = **textarea（编辑）+ react-markdown（渲染）**。OB-02（CM6 Decoration Live Preview）/ OB-05（标注层扩展点）均依赖 CM6 `Decoration`/`ViewPlugin`，当前架构不具备，落地 = 换编辑器内核（中等重构），**必须先 Spike，不可直接排开发**。

---

## 6. OB-01 数据层架构裁决（独立重点）

OB-01 原文建议："数据库中的 chunks、向量、`document_relations` 等衍生数据必须能通过重新扫描 `.md` 文件全量重建；**frontmatter 是关系型字段唯一权威来源，数据库为索引缓存**。"

**核实结论**：
- `04-architecture.md` / `06-db-design.md` **均无** frontmatter / 可重建 / 索引缓存 / derived 任何表述（Grep 全无匹配）。
- LUMEN 实际是 **DB 权威模型**：文档 / 版本历史（REQ-005/006）、空间隔离与权限三级（MOD-001）、术语表（MOD-005）、chunks / 向量全部入库；`.md` 只是导入源 + 导出格式（Flow-006/007），**不是运行时唯一真相源**。
- **权限与版本无法用纯 .md frontmatter 表达**（谁能看哪篇、历史第几版——天然属于 DB）。

**两条架构路线**：
- **路线 A（Obsidian 式）**：`.md` 唯一权威，DB 纯索引可丢弃——数据可移植性极强，但 LUMEN 现有权限 / 版本 / 空间模型需重设计为"可从 frontmatter 重建"。
- **路线 B（LUMEN 现状 DB 权威）**：DB 为权威，`.md` 为导入 / 导出载体——权限 / 版本天然落地，但"丢库即丢权限 / 历史"。

**AI 建议（待人工确认）**：
- **不采纳** OB-01 原文"DB 为可丢弃缓存、frontmatter 唯一权威"——与现状冲突。
- **采纳改写版**（另一 AI 提出）：**衍生数据（chunks / embedding / 反链索引 / document_count 计数等）必须可从权威文档内容 / 元数据重建**；DB 仍是权威运行态，但衍生索引具备可重建性，为灾备 / 迁移 / 导出（U-43）提供正当性。
- **治理形式**：已记入 `docs/decisions/ADR-010-db-authority-derived-data-rebuildability.md` 架构决策记录，并由 `04/06` 引用，**而非埋在 04 某小节**——因为它会约束未来所有新功能的数据落地位置（术语关联、矛盾标记等）。
- **阶段**：原则性建议，不占 Phase 排期；已于 2026-07-21 形成 ADR-010，不声明当前已有全量重建脚本。

---

## 7. 归位建议

按 `document-lifecycle-rules §5` 矩阵，`docs/inputs/` 是暂存位，评审后应各归其位：

| 文档 | 建议归位 | 前提 |
|---|---|---|
| doc-system-architecture-evaluation | `docs/research/2026-07-20-doc-system-architecture-evaluation.md`（内部审计） | P1 已归位；§4.1 kb-\* 冲突以归位说明修正 |
| obsidian-design-reference-suggestions | `docs/research/2026-07-20-obsidian-design-reference-suggestions.md`（内部建议） | P1 已归位；OB-01 标记为待 ADR 裁决；§0 路径已修正 |
| ref-obsidian-overview | `docs/references/ref-obsidian-overview.md`（外部调研） | P1 已归位 |
| 方法论 ×2 | `docs/references/`（外部方法论参考） | P1 已归位；正式引用前仍需校对原图 |

> `docs/references/` 已于 2026-07-21 的 P1 文档治理中建立；索引见 `docs/references/00-index.md`。

---

## 8. 综合行动顺序

| 优先级 | 行动 | 性质 | 前置 |
|---|---|---|---|
| **P0** | Phase2A closure 文档漂移同步：`02/04/05/design` 状态字段 → `P2-已实现`；回填 `product-vision` v19 溯源 | 横切状态变更，改 4+ 份正式文档 | ✅ 已完成并提交 v0.2.4（91817d3） |
| **P1** | 建 `docs/design/00-index.md` + `docs/research/00-index.md` | 文档治理，低风险 | ✅ P1 执行中 / 已落盘 |
| **P1** | 建 `docs/references/`，迁移 ref-obsidian + 方法论；修正 obsidian-suggestions §0 路径 | 文档治理 | ✅ P1 执行中 / 已落盘 |
| **P2** | 评审吸收 OB-06（→ 03-prd）+ OB-01 改写版（→ ADR，被 04/06 引用） | 架构补强 | OB-01 已形成 ADR-010；OB-06 仍待后续 |
| **P3** | OB-02/05 编辑器 Spike（textarea→CM6 可行性）；OB-03/04 留 Phase2B / 图谱阶段 | 技术预研 | 不阻塞当前 |

---

## 9. 待确认项总览

| ID | 提出时间 | 来源 | 待确认项 | AI 建议 | 建议依据 | 备选 | 取舍影响 | 需确认节点 | 阻塞 | 回填位置 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C-001 | 2026-07-20 | OB-01 / 本报告 §6 | 数据层模式方向（路线 A vs B） | 采纳改写版"衍生数据可重建"，记 ADR | 04/06 无原原则；与权限 / 版本 DB 模型冲突 | 全量迁 .md 权威（路线 A，成本高） | 影响 U-43 灾备 / 未来术语 / 矛盾标记数据落地 | 04/06 修订前 / Phase 升级前 | 阻塞 OB-01 落地 | `docs/decisions/ADR-010-db-authority-derived-data-rebuildability.md` + 04/06 引用 | ✅ 已接受（ADR-010） |
| C-002 | 2026-07-20 | B-1 §4.1 | kb-\* 草稿实际去向 | 确认已删除 / 在根目录 / 已归档 | `docs/**/kb-*.md` 无结果 | — | 决定 §4.1 迁移条是否保留 | P1 归位前 | 条件阻塞 §4.1 | B-1 报告 §4.1 | 部分明（不在 docs/；product-vision 溯源仍缺） |
| C-003 | 2026-07-20 | OB-02/05 / 本报告 §5.2 | 编辑器选型 | 先在 `05-tech-spec` 补选型 + Spike | 05 无记录；frontend 现状 textarea+react-markdown | 保留 textarea / 换 Monaco 等 | 决定 OB-02/05 是否可行 | OB-02/05 编码前 | 阻塞 OB-02/05 | `05-tech-spec` + Spike 报告 | 待确认 |
| C-004 | 2026-07-20 | 本报告 | 评估报告落盘位置 | 落 `docs/research/2026-07-20-inputs-architecture-review.md` | document-lifecycle §2 | — | — | — | 不阻塞 | 本文件 | ✅ 已完成（v0.2.4） |
| C-005 | 2026-07-20 | 本报告 §5 | Phase2A 漂移同步授权 | 授权后执行 P0（先核查 08/09） | v0.2.3 已 close，下游状态滞后 | 仅改状态字段 / 连带补 08/09 | 改 4+ 份正式文档，横切变更 | P0 执行前 | 阻塞 02/04/05/design 状态修正 | `02/04/05/design` + 可能 `08/09` | ✅ 已完成（91817d3 / v0.2.4） |
| C-006 | 2026-07-20 | B-1 §4.3 | 是否建立 `docs/references/` | 建立，承接外部调研 | 与 research/ 分层 | 暂留 inputs | 影响 ref-obsidian + 方法论归位 | P1 归位前 | 条件阻塞归位 | `docs/references/00-index.md` | ✅ P1 已落盘 |

---

## 10. 评估者声明与可信度

- 本报告所有行号引用（`02:76/83/84`、`04:106/240`、`05:90`、`frontend-interaction:4/16/19`、`product-vision:4/6`、`package.json:14`、`DocumentsFeature.tsx:122`）均经 Git / 文件**直接核实**（2026-07-20）。
- OB 评估中的"阶段一致 ✅"判断依据 `ai/project-rules.md §1` 现行阶段边界（Phase2A 已完成、未进 Phase2B）。
- 本报告为 **AI 辅助分析**，不替用户决策；C-001 已由 ADR-010 关闭，C-003 仍待人工确认，其他 OB 建议采纳与否以 `01/03/04/05/06` 权威文档修订结果为准。
- 本报告不替代 `docs/00-09` 正式修订；Phase2A 漂移同步（P0）已单独授权并提交，P1 文档治理只处理索引 / 归位 / 路径修正。

---

*本报告基于 2026-07-20 两份 AI 评估交叉核实整理；P0 / P1 / OB-01 ADR-010 执行记录补于 2026-07-21。*
