# EVAL LUMEN 项目文档体系架构评估报告

> P1 归位说明（2026-07-21）：本文已从 `docs/inputs/` 归位到 `docs/research/`，定位为内部文档体系评估。后续 Git 核实确认当前仓库无 `kb-*.md` 文件，故 §4.1 / §5 中“迁移 kb-* 四份草稿到 archive”的动作不执行；`docs/vision/product-vision.md` 的 v19 溯源已在 v0.2.4 补齐。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 评估对象 | `docs/00-scenario.md` ~ `docs/09-verification.md`（正式规格文档体系），及其与 `docs/vision/`、`docs/research/`、`docs/design/`、`docs/archive/`（原 kb-\* 系列）的关系；本轮新增纳入 `docs/design/frontend-experience-brief.md`、`docs/design/frontend-interaction.md`、`docs/design/frontend-workspace-redesign.md` 及配套原型 `frontend-workspace-redesign-prototype.html` |
| 评估角色 | 系统架构专家视角，评估文档体系本身的组织方式、可追溯性、可维护性，不评估产品需求或技术方案的对错 |
| 输入来源 | `docs/00-scenario.md` ~ `docs/09-verification.md` 全文、`kb-architecture-v2.md`/`kb-prd-v5.md`/`kb-urs-v2.md`/`kb-scenario-v19.md`、`docs/design/frontend-experience-brief.md`/`frontend-interaction.md`/`frontend-workspace-redesign.md`、对话确认结论（2026-07-20：kb-\* 系列为早期草稿，已分别转正为 00-09 对应文档，kb-scenario-v19 转正为 `docs/vision/product-vision.md`；`frontend-*` 系列为 `docs/design/` 下前端交互详细设计） |
| 当前状态 | 已归位为 research；v2 修订：新增 §3.5、§4.6~§4.8 覆盖 `docs/design/` 前端设计文档层；P1 已采纳索引 / references 分区建议 |
| 最后更新 | 2026-07-21（P1 归位说明；v2 内容保持 2026-07-20 评估结论） |

---

## 1. 结论摘要

LUMEN 的 00-09 文档体系整体处于**规格化项目文档中较为成熟的水平**：具备从场景到验收的单向追溯链路、阶段标签与实现状态分离管理、"完整骨架 + 阶段增量"的演进纪律。这套体系比大多数项目的文档管理更严谨。

主要风险不在于文档内容质量，而在于**文档体系的元管理（meta-management）尚不完整**：外部输入（research/vision）缺少统一索引、历史草稿（kb-\*）与正式文档的血缘关系此前未被文档化、追溯链路依赖人工阅读而非结构化索引、版本管理机制在两套文档间不一致。这些是体系规模变大后最先出问题的地方，建议尽早补齐。

---

## 2. 体系现状概览

```
docs/
├── vision/
│   └── product-vision.md          ← 转正自 kb-scenario-v19（叙事性场景源头）
├── 00-scenario.md                 ← 场景抽取
├── 01-user-requirements.md        ← 用户需求（U-ID 体系，U-01..U-43）
├── 02-srs.md                      ← 软件需求规格
├── 03-prd.md                      ← 产品需求文档（含阶段路线图）
├── 04-architecture.md             ← 系统架构（REQ 覆盖）
├── 05-tech-spec.md                ← 技术规格
├── 06-db-design.md                ← 数据库设计
├── 07-api-spec.md                 ← 接口规格
├── 08-dev-plan.md                 ← 开发计划（Sprint）
├── 09-verification.md             ← 验收
├── research/                      ← 输入性调研/审计文档（非权威，供下游采纳）
│   └── prototypes/                ← 探索期 HTML 原型（如 2026-07-14 前端参考吸收原型）
├── inputs/                        ← 更早一层的原始输入材料（如前端交互设计需求说明、发散性探讨）
├── design/                        ← 04-architecture §0 已声明"子系统内部详细逻辑见 docs/design/"
│   ├── frontend-experience-brief.md        ← 体验原则简报（候选方向，不授权编码）
│   ├── frontend-interaction.md             ← COMP-001 详细交互设计（P1 已实现基线 + P2 候选）
│   ├── frontend-workspace-redesign.md      ← 工作台级重设计（P1B 已实现）
│   ├── frontend-workspace-redesign-prototype.html  ← 配套可视化原型
│   ├── ingestion.md / export-delivery.md   ← 其他子系统详细设计（被 frontend-interaction 引用）
│   └── ...                                 ← 其余 COMP-* 详细设计（未逐一评估）
├── archive/  （建议新建）           ← kb-* 系列历史草稿归档位
└── env/
    └── local-env.md
ai/
├── global-rules.md                ← 文档演进方式定义（"完整骨架+阶段增量"，见 §8）
└── project-rules.md               ← 阶段边界、技术禁令等权威源
```

---

## 3. 做得好的地方

### 3.1 单向可追溯链路完整

`00 场景 → 01 需求(U-ID) → 02 SRS → 03 PRD(阶段路线图) → 04 架构(REQ 覆盖) → 06 数据 / 07 接口 → 08 开发计划(Sprint) → 09 验收`，每份文档「0. 文档元信息」中的「输入来源」栏都显式指向上游文档，形成一条可审计的需求→实现链路。这在中小项目里并不常见，多数项目的文档链路要么断裂、要么全靠口头传递。

### 3.2 阶段标签与实现状态双维度管理

`[P1]/[P2]/[愿景]`（属于哪个阶段）与 `骨架/P1-已设计/P1-已实现`（做到什么程度）是两个独立字段，不互相绑定。这避免了"一个功能到底该不该做"和"这个功能做完没有"两件事纠缠不清，也让"降级口径"（如 U-09/U-10 的 Word/PDF 解析、OCR 降级说明）可以被显式记录而不是被隐藏。

### 3.3 预留了"输入但非权威"的文档层

`docs/research/*.md` 承担了外部审计、调研、建议类文档的角色，与 00-09 的"权威规格"明确分层，类似成熟工程组织里 RFC/ADR 前置讨论稿与正式决策文档分离的做法。本次生成的 Obsidian 参考建议文档正是嵌入这一层，说明该分层设计具备良好的可扩展性。

### 3.4 降级口径与真实/骨架状态被如实记录

04-architecture 中多处出现"仍降级：真实 Word/PDF 解析、OCR"这类诚实标注，而不是把未完成的能力包装成"已完成"。这对后续验收（09-verification）和技术债务管理非常关键，是文档质量而非文档结构层面的加分项，一并记录在此。

### 3.5 详细设计层（`docs/design/`）延续了主线文档的元信息规范，并明确"不做事项"边界

`frontend-experience-brief.md`、`frontend-interaction.md`、`frontend-workspace-redesign.md` 三份文档都完整保留了「0. 文档元信息」表（设计对象、文档路径、输入来源、覆盖 REQ、所属 Phase、当前状态、下游影响），并且每份文档都显式声明了"不做事项"（如 `frontend-interaction.md` §1.2 明确"不把前端隐藏入口作为安全边界""不新增 P2 标签视图/时间轴/关联图……未经批准的能力"）。这种"职责 + 边界"双写的方式，比只写"要做什么"的详细设计文档更能防止范围蔓延（scope creep），是值得在其余 `docs/design/*` 详细设计文档中推广的实践。

---

## 4. 需要改进的地方

### 4.1 【高优先级】历史草稿与正式文档的血缘关系未被文档化

**现状**：`kb-architecture-v2.md`、`kb-prd-v5.md`、`kb-urs-v2.md`、`kb-scenario-v19.md` 四份早期草稿目前与 00-09 平铺在同一项目文件层级，且技术栈描述不同（草稿为 Vue3+SQLite，正式稿为 React+FastAPI+PostgreSQL+pgvector）。对话确认这四份是早期草稿，已分别转正为对应的正式文档（kb-scenario-v19 → `docs/vision/product-vision.md` → `00-scenario.md`；kb-urs-v2 → `01-user-requirements.md`；kb-prd-v5 → `03-prd.md`；kb-architecture-v2 → `04-architecture.md`），但这一血缘关系此前未在任何文档中显式声明。

**风险**：新协作者或未来的自己，无法仅凭文件列表判断 kb-\* 是废弃草稿、并行方案还是当前依据，存在误把过时技术栈方案当作现行架构参考的风险。

**建议**：
- 新建 `docs/archive/` 目录，将四份文件移入（内容保留，不删除，具备历史与培训价值）
- 每份归档文件顶部加转正声明，注明"现行对应文档"路径
- 新建 `docs/archive/README.md` 索引表，登记「草稿文件 / 版本号 / 转正为 / 归档日期 / 备注」
- 在 `docs/vision/product-vision.md` 的文档元信息中补一条"转正自 `docs/archive/kb-scenario-v19.md`（v19.0）"，补全追溯链路，避免在这一环断裂

### 4.2 【中优先级】`docs/research/` 缺少统一索引与生命周期状态

**现状**：04-architecture 的"输入来源"栏直接引用具体 research 文件名（如 `2026-07-15-overall-design-04-05-audit.md`），但不存在一份索引文件统一登记"当前有哪些 research 文档、状态是什么（草案/已评审/已采纳/已废弃）、被哪份正式文档吸收"。

**风险**：research 目录会随时间推移变成"只进不出"的文件堆，采纳过的建议文档无法被标记为"已处理"，容易被重复讨论或被遗忘。

**建议**：新建 `docs/research/00-index.md`，用表格登记全部 research 文档的标题、日期、状态、采纳去向。本次生成的 `2026-07-20-obsidian-design-reference-suggestions.md` 评审通过后，应在此索引中标记状态并注明被 01/04/03 的哪些条目吸收。

### 4.3 【中优先级】外部参考资料（非项目输出）与内部调研（项目自产）应分层存放

**现状**：`ref-obsidian-overview.md` 这类"调研第三方产品、非本项目产出"的资料，与 `2026-07-15-overall-design-04-05-audit.md` 这类"针对本项目自身架构的内部审计"，目前都建议放入同一个 `docs/research/` 目录。

**建议**：细分为 `docs/research/`（内部审计、自我复盘类）与 `docs/references/`（外部产品调研、竞品分析、技术选型参考类）两个目录，避免长期混杂后难以区分"这是我们自己的结论"还是"这是引用别人的资料"。

### 4.4 【低优先级】追溯链路依赖人工阅读，缺少结构化索引

**现状**：「输入来源」是自然语言文本引用，U-ID 与 REQ 的映射依赖人工在多份文档间比对。目前 U-ID 已到 U-43，规模尚可控，但持续增长后人工追溯"改一条 U-ID 影响哪些下游文档"的成本会上升。

**建议**：中长期可考虑维护一份轻量追溯矩阵（如 `docs/traceability.csv`：U-ID → REQ → 架构章节 → 数据表 → API → Sprint），或在 08/09 中做双向索引。优先级低于 4.1/4.2，不建议现阶段投入。

### 4.5 【低优先级】00-09 系列缺少版本号字段

**现状**：kb-\* 系列有明确版本号（v2/v5/v19），00-09 系列仅有「最后更新」日期，无版本号。

**风险**：日期只能表达"最近改过"，无法表达"改到第几轮、外部引用时是否兼容之前版本"。若未来 00-09 文档也会被外部（客户/投资人）引用，这个缺口会显现。

**建议**：下次修订窗口统一给 00-09 系列加版本号字段，与「最后更新」并列，不必单独排期处理。

### 4.6 【中优先级】三份 frontend-\* 文档的层次关系与新旧覆盖顺序未被单独索引，需读全文才能理清

**现状**：`frontend-experience-brief`（体验原则简报）→ `frontend-interaction`（COMP-001 详细交互设计，含 P1 已实现基线）→ `frontend-workspace-redesign`（工作台级重设计，P1B 已实现）三者之间存在明确的承接与迭代关系，但这一关系只能通过逐份阅读各自「输入来源」「下游影响」栏拼出来，例如：`frontend-workspace-redesign.md` 是对 `frontend-interaction.md` 中"P1 已实现基线"的**局部重做**（问题复盘 §1 指出 `.card` 堆叠、区块过大等问题），但 `frontend-interaction.md` 本身并未回写"本文 P1 视觉方案已被 frontend-workspace-redesign 取代，交互流程/页面 IA 部分仍有效"。

**风险**：`frontend-interaction.md` 篇幅大（487 行）且状态标注为"P1-已实现"，容易被误读为"当前 UI 视觉现状"，但实际视觉层已被 `frontend-workspace-redesign.md` 局部覆盖；两文档都在被动态维护，若后续只更新其中一份，另一份会逐渐与实现脱节而不自知。

**建议**：
- 在 `frontend-interaction.md` 顶部补一条交叉引用："本文 UI 视觉密度 / 组件拆分已被 `docs/design/frontend-workspace-redesign.md` 取代，本文交互流程（§3 UF 用户流）、页面职责边界仍为权威口径"，明确"哪部分仍生效、哪部分已被覆盖"，而不是让读者自行判断
- 三份文档共同的覆盖对象是 COMP-001，建议在 `docs/design/00-index.md`（见 4.7）中用一行清楚标注三者的层次：体验原则 → 交互与流程 → 视觉与组件实现，并标注各自当前状态

### 4.7 【中优先级】`docs/design/` 目录缺少索引，`04-architecture.md` 仅有一句话指向该目录

**现状**：`04-architecture.md` 开头写"各子系统内部详细逻辑见 `docs/design/`"，但没有说明该目录下有哪些文档、对应哪个 COMP-ID / REQ、当前状态如何。`docs/research/` 已经在本报告 4.2 中指出缺索引问题，`docs/design/` 同样缺失，且 `docs/design/` 是**权威详细设计**（不是候选调研），缺索引的影响比 research 更大——04-architecture 里提到的每个子系统，理论上都应有对应的 `docs/design/*.md`，但目前无法从任何一份文档确认"设计文档是否齐全、是否有遗漏"。

**建议**：新建 `docs/design/00-index.md`，登记「COMP-ID / 子系统 / 详细设计文件 / 覆盖 REQ / 当前状态 / 最后更新」，作为 04-architecture 与各详细设计之间的中间层索引，也便于识别哪些子系统（如 04 中列出的文档服务、检索问答服务、内容导入服务、空间权限服务、术语管理服务）还没有对应的详细设计文档。

### 4.8 【低优先级】两份"原型"文件（research 探索期 vs design 落地版）未标注彼此关系，容易被认错版本

**现状**：`frontend-interaction.md` 引用的是 `docs/research/2026-07-13-ui-prototype-exploration.md` 与 `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html`（探索期原型）；`frontend-workspace-redesign.md` 引用的是同目录下的 `frontend-workspace-redesign-prototype.html`（落地版原型，状态"用户确认 HTML 原型方向；React 工作台重构已完成"）。两个 HTML 原型文件名相似度较高，且分处 `docs/research/prototypes/` 与 `docs/design/` 两个目录，若无人特意说明，容易被误认为同一份文件的两个版本。

**建议**：在 `frontend-workspace-redesign.md` 中补一句"本文原型为最终落地版，`docs/research/prototypes/2026-07-14-*.html` 为更早的探索期原型，已被本文原型取代，仅供历史参考"，明确谁是当前权威版本。

---

## 5. 改进优先级与行动清单

| 优先级 | 行动项 | 对应问题 | 建议责任方 |
|---|---|---|---|
| 高 | 新建 `docs/archive/`，迁移 kb-\* 四份文件，加转正声明 | 4.1 | 文档维护者 |
| 高 | 新建 `docs/archive/README.md` 归档索引表 | 4.1 | 文档维护者 |
| 高 | 补全 `product-vision.md` 的"转正自"追溯信息 | 4.1 | 文档维护者 |
| 中 | 新建 `docs/research/00-index.md`，登记现有 research 文档状态 | 4.2 | 文档维护者 |
| 中 | 拆分 `docs/references/` 与 `docs/research/` | 4.3 | 文档维护者 |
| 低 | 评估是否需要结构化追溯矩阵 | 4.4 | 架构负责人 |
| 低 | 00-09 系列补版本号字段 | 4.5 | 文档维护者，下次修订窗口一并处理 |
| 中 | `frontend-interaction.md` 顶部补交叉引用，说明视觉部分已被 `frontend-workspace-redesign.md` 覆盖 | 4.6 | 前端设计负责人 |
| 中 | 新建 `docs/design/00-index.md`，登记全部 COMP-\* 详细设计文档状态 | 4.7 | 架构负责人 / 文档维护者 |
| 低 | `frontend-workspace-redesign.md` 补充与 research 探索期原型的取代关系说明 | 4.8 | 前端设计负责人 |

---

## 6. 总体评价

LUMEN 的文档体系在"内容规格化程度"上已经达到较高水平，本次评估发现的问题都不是内容问题，而是**体系随时间演进后必然出现的元管理缺口**——历史版本归档、外部输入索引、追溯结构化，这些通常是项目文档量翻倍之后才会暴露的问题，现在处理成本很低，建议尽快按 §5 清单落地，避免拖到文档体系进一步膨胀后再补课。

纳入 `docs/design/` 前端详细设计文档后，结论保持一致但风险点更具体：主线（00-09）的元管理问题在**详细设计层**（`docs/design/*`）以更小的规模重演——同一子系统（COMP-001）有三份文档随时间叠代（体验原则 → 交互设计 → 工作台重设计），彼此覆盖关系需要读全文才能拼出来，且 `docs/design/` 整体缺少一份索引。好消息是这几份文档本身质量很高（元信息表规范、"不做事项"边界清晰），问题同样是"缺一层索引把关系显式化"，与主线文档体系的改进方向完全一致，可以用同一套治理动作（新建索引 + 交叉引用声明）一并解决，不需要另设一套治理机制。

---

*本报告基于 2026-07-20 对话确认的信息整理，具体归档日期、索引表内容留待文档维护者核实后填入。*
