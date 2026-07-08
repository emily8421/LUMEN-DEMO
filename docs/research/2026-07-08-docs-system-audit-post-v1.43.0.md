# 文档体系同步后审计报告（模板 v1.43.0）

> 定位：文档体系审计留痕（`ai/document-lifecycle-rules.md §2`），只读输出，不替代 00-09 正式修订。
> 审计日期：2026-07-08；审计模式：同步后审计（派生项目模板方法论刚从 v1.30.3 同步至 v1.43.0）。
> 关联：`sync-records/template-sync/2026-07-08-sync-template-v1.43.0.md`。

## 基本信息

- 项目：LUMEN Demo T2.1（Phase1，交付物形态 = Demo）
- 审计基线：`ai/doc-standards/00-09` + `design-doc.md` + `frontend-interaction.md` + `ui-prototype-strategy.md`（v1.34–v1.42 大幅强化，随 v1.43.0 同步入库）
- 审计规则：`ai/document-lifecycle-rules.md` §5/§6/§7、`ai/prompts/review/16-docs-system-audit.md`
- 审计方式：按文档组并行审计（00-03 / 04-05 / 06-07 / 08-09 / design），本报告为汇总去重版
- 分类约定：**SG** = 规范基线缺口（结构/矩阵缺失，不代表业务错误）｜**FP** = 项目事实问题（影响闭环的实质问题）｜**AC** = 可接受兼容差异

## 一、链路健康度总览

| 文档组 | 健康度 | 一句话结论 |
|---|---|---|
| 00-03 | 🟢 最好 | 语义追溯链完全闭合（U-01..U-42 ↔ REQ-001..REQ-036 全量双向，无悬空 ID）；仅形式编号缺失 |
| 04-05 | 🔴 最严重 | 目标架构（pgvector/Embedding/OCR/LLM）被呈现为「已确认/已钉死」，实际是内存 Demo——代码诚实、文档落后 |
| 06-07 | 🔴 严重 | 同 04-05：内存 Demo 仓储被写成已上线的 PostgreSQL+pgvector；缺 API-ID / endpoint contract matrix |
| 08-09 | 🟡 中 | 无造假，但「安全方向失真」——§2 矩阵全「待实现」，实际 Sprint-2~6 降级验收已执行 |
| design | 🟢 实质干净 | 权限边界正确下沉后端/SQL、无越权新增需求/接口；仅未回梳到新基线结构 |

**总体定性**：本项目降级在代码与评估报告中是**诚实**的（`demo_repository.py` docstring、`rag.py`「降级模式：未调用 LLM」前缀、`docs/09-verification.md` §5「降级口径」均如实标注）；问题集中在 **docs/00-09 没有把这份诚实回灌进状态列与架构图**——属「文档落后于实现」的可回梳缺口，**非业务事实错误**。所有 P0 修复均为补披露 / 重标状态，不动目标设计与 REQ。

## 二、跨文档核心问题（去重合并，按优先级）

### P0-A｜降级口径诚实性（跨 04 / 05 / 06 / 07，最高优先）

目标栈（PostgreSQL+pgvector / Embedding / OCR / LLM）被呈现为当前实现，但实际是内存 `demo_repository`（`backend/requirements.txt` 仅 3 项；`docker/` 空无 compose；`rag.py` 不调 LLM；`imports.py` 仅 `.md/.txt`）。证据见 `docs/research/2026-07-04-tech-env-evaluation-phase1.md`（§9.4 完整闭环 No-Go）。

| # | 类型 | 位置 | 缺口 | 修复 |
|---|---|---|---|---|
| P0-A1 | FP | `05-tech-spec.md` §1 技术栈表 + §0 元信息 | 表列全套带版本号依赖，元信息写「已确认（Phase1 技术基线已钉死）」，与 `requirements.txt` 仅 3 项矛盾 | 技术栈表加「当前状态」列（pgvector/SQLAlchemy/Alembic=候选未接入；Embedding=No-Go；OCR=降级/No-Go；LLM=Mock）；元信息改「目标基线已定，运行时为降级内存实现」 |
| P0-A2 | FP | `05-tech-spec.md` §1「本地 PostgreSQL+pgvector 由 compose 编排」 | 声称 compose 编排，但 `docker/` 仅 `.gitkeep`，全仓无 compose 文件；评估报告 §10.1 Docker daemon No-Go | 改「目标由 compose 编排（待补 docker-compose.yml）；当前未接入，后端用内存 `demo_repository`」 |
| P0-A3 | FP | `04-architecture.md` §1 架构图 + §2 模块表 | 架构图把 PostgreSQL+pgvector 画作唯一 DB 无降级标注；模块表状态全「P1-已设计」 | 架构图 DB/AI 节点加降级标注；模块表加「实现状态」列（已设计-已接入 / 已设计-降级实现） |
| P0-A4 | FP | `06-db-design.md` §0/§1/§2 + `07-api-spec.md` §3 时序图 | 全部 P1 表标「P1-已设计」并写 `embedding vector(512)` 等，当前实现是内存仓储；时序图画 `DB as PostgreSQL+pgvector` | 增「目标 vs 当前实现对照矩阵」；pgvector 表标 `目标设计`，当前实现标 `Mock/内存(DemoRepository)`；时序图标「目标架构」 |

### P0-B｜状态失真 + 完成事实回写（08 / 09）

| # | 类型 | 位置 | 缺口 | 修复 |
|---|---|---|---|---|
| P0-B1 | FP | `09-verification.md` §2 矩阵 | 全部 REQ 状态「待实现」，但 Sprint-2~6 降级验收已执行（Edge/Chrome smoke 通过降级口径、53 后端 tests 通过） | 依 09-standard §3 状态枚举更新：REQ-001~008/011/036 → `条件通过（降级口径）`；REQ-009 → `条件通过（仅 .txt/.md）`；REQ-010 → `阻塞（OCR 未实现）`/`后续阶段` |
| P0-B2 | FP | `08-dev-plan.md` 全文 / `09` §5 | Sprint-2~6 完成事实（提交 `83fb782`/`0fe169b`/`da9f6e5`/`5144f2a`/`bc03839`/`5b78f0a`、单元测试通过）只在 `.ai/session-handoff.md`，08 无「当前进度记录」，09 §5 仅记 Sprint-6 两行 smoke | 08 补「当前进度记录」表（日期/Sprint/进度/验证结果/关联提交 PR/是否回填 09）；09 §5 为 Sprint-2~5 各补验收记录行 |
| P0-B3 | FP | `09-verification.md` §6 | 未验证项不全：未列 PostgreSQL/pgvector 未接（内存 Demo）、真实 Embedding 未接、Docker Desktop Linux engine 阻塞 | §6 风险表追加 3 行（DB 真实化 / Embedding 真实化 / Docker 阻塞），影响 REQ-007/008/009/010 |
| P0-B4 | FP | `09-verification.md` 缺缺陷/回归节 | `c5c177e fix: index edited documents for search and rag` 无缺陷/回归记录 | 新增「缺陷与回归记录」表，补来源/修复 Task/回归范围（搜索+RAG 索引）/结果 |

### P1-C｜§2.7 UI 原型策略未传播 + 自身不全

| # | 类型 | 位置 | 缺口 | 修复 |
|---|---|---|---|---|
| P1-C1 | SG | `docs/design/frontend-interaction.md` | 缺「UI 原型策略与可视化证据」段，全文未引用 §2.7 | 增 §8，引用 `project-rules §2.7` + 09 smoke 证据 + 列覆盖/未覆盖项 |
| P1-C2 | SG | `ai/project-rules.md` §2.7 | 缺 ui-prototype-strategy §4 必填字段：未覆盖项（真实 PDF/图片 OCR）、与文档关系映射、确认状态；覆盖范围只列 4 流与实际 smoke（登录/空间切换/文档 CRUD/版本/桌面端）不符 | §2.7 补未覆盖项 / 确认状态 / 与文档关系映射；覆盖范围对齐 frontend-interaction §2.2 全部 P1 页面 |

### P1-D｜05 Readiness Gate + 05↔09 风险映射缺失

| # | 类型 | 位置 | 缺口 | 修复 |
|---|---|---|---|---|
| P1-D1 | FP | `05-tech-spec.md` 整体 ↔ `09-verification.md` §6 | 05↔09 风险验证映射完全缺失；05 无 Risk-ID 表，09 §6 风险项无 ID | 05 补「技术风险与验证计划」表（Risk-ID/触发/影响/验证方式/对应 TC/解锁条件），09 §6 用同 Risk-ID 承接证据 |
| P1-D2 | SG | `05-tech-spec.md` 整体 | 缺 Readiness Gate 表（doc-standards/05 §5）；本项目命中触发条件（backend/frontend/docker/DB/模型/外部 API） | 补 RG 表（RG-001 pgvector=No-Go/Docker；RG-002 Embedding=No-Go/torch；RG-003 OCR=No-Go/降级；RG-004 LLM=候选/Mock；RG-005 Web/ORM 基础栈=Conditional Go），引用评估报告 |
| P1-D3 | FP | `05-tech-spec.md` §0/§5 ↔ 评估报告 §9.4 | 05 未引用评估报告结论；报告判「完整闭环 No-Go」而 05 写「已确认」 | 05 元信息状态字段改「Conditional Go（基础栈）/ No-Go（完整闭环），见评估报告 §9.4」 |

### P2-E｜规范基线结构普遍缺失（可延后 / 分批）

稳定 ID 体系 + 矩阵化结构，对照新 doc-standards 普遍缺失；属形式补全，不改语义。

- **04**：缺 COMP-ID / MOD-ID / Flow-ID（§2/§5）、ADR 表（§3 现为散文）、系统上下文图（§1 缺信任边界）
- **05**：缺依赖配置矩阵、安全隐私合规节、前端交互设计边界节（§2.7 已有但 05 未承接）
- **06**：缺字段级契约矩阵（必填/默认值/约束/来源 REQ/敏感性）、数据安全与留存（content_md/chunks.text 发往外部 LLM 传输限制）、TC/Sprint 反向追溯
- **07**：缺 API-ID（所有接口仅路径）、endpoint contract matrix、错误码矩阵、请求/响应字段级契约、权限/限流/审计矩阵、异步任务状态机（lumen_imports.status）
- **08**：缺 Sprint 验证包 / 完成包、Sprint 总览、依赖里程碑、任务拆分规则
- **09**：缺 TC-ID 列、TC 用例详情章节、Phase 测试大纲、独立 Mock/降级口径章节
- **design（6 份）**：缺 §0 文档元信息、Flow-D / Page-ID 稳定 ID、实现偏差/设计回写区、验收追溯到 TC；部分缺上游追溯矩阵与契约引用表
- **02**：缺 NFR / 约束 / 异常章节（现仅存于 05）；§0 未显式声明交付物形态 Demo（00/01/03/09 均已声明，唯独 02 缺）
- **00**：缺 SC-ID / R-ID 编号（01 越过 00 直引 vision 场景N）；01 缺 AC-ID
- **03**：状态列未对齐 §7.1 横切状态词典

### 可接受兼容差异 / 豁免（无需改动）

- 03 不引入 `F-001` 功能 ID（§6.0.1 兼容补齐规则允许）
- 08 Sprint 五段式结构（合规 global-rules §3 Phase1 基线）；Sprint-2/6 未拆 task 文件（Phase1 不强制）
- `docs/design/intelligence-analysis.md` 愿景骨架简化（合规 global-rules §8）
- 04 §3 决策散文与 ADR 语义等价；04 §6 追溯矩阵语义到位（仅缺 COMP/MOD/Flow-ID 列）
- 06/07 mermaid ER/时序图符合 §2.6；REQ→表/接口矩阵齐全（仅未达新基线矩阵粒度）

## 三、待人工确认项（回梳前需决策）

| ID | 来源 | 待确认项 | AI 建议 | 建议依据 | 取舍影响 |
|---|---|---|---|---|---|
| C-1 | 04/05/06/07 | 降级口径呈现方式：单节统一说明 vs 各表加状态列 | 05 单列「当前实现降级状态」+ 04/06/07 各矩阵加状态列 | 集中说明易维护，矩阵状态列支撑追溯 | 影响 04/05/06/07/09 联动，定口径后统一刷一遍 |
| C-2 | 09 §2 / Phase1 出门标准 | REQ-009(PDF)/010(OCR) 验收口径 | 009=条件通过（仅 .txt/.md）；010=后续阶段（OCR 降级） | Demo 阶段降级口径已跑通；真实 PDF/OCR 受 PaddleOCR×Python 3.14 不兼容阻塞 | 影响 09 §2 状态与 Phase1 出门标准 |
| C-3 | 05 readiness / 09 §3 | pgvector/Embedding/OCR 真实化是否 Phase1 退出标准 | Phase1 接受降级基线（内存 Demo），真实化移至 Phase2/MVP | 评估报告判完整闭环 No-Go；Docker daemon 阻塞 | 决定 05 RG 结论与 09 §3 分阶段范围 |
| C-4 | 全文档追溯 | TC-ID 体系是否 Phase1 引入 | 引入最简 `TC-P1-NNN` | 解锁全链 REQ→TC→证据追溯与 design 验收追溯 | 影响回梳顺序（先 TC-ID 再 design 追溯） |
| C-5 | 05↔09 | Risk-ID 编号空间 | 05 新建 RG/Risk-ID，09 §6 对齐 | 建立双向映射 | 编号方案需先定 |
| C-6 | design §2.2 | `POST /api/spaces/switch` 是否在 07 定义 | 待核对 | frontend-interaction 引用该接口 | 缺则回写 07 或修正 design 引用（唯一可能触及业务事实） |
| C-7 | §2.7 | 覆盖范围口径（4 流 vs 实际 smoke 范围） | 扩写对齐 frontend-interaction 全部 P1 页面 | 09 smoke 实际覆盖登录/空间/CRUD/版本/桌面端 | 决定 §2.7 是否扩写 |

## 四、回梳计划（按优先级 / 批次）

**批次 1（P0，Phase1 收口前必做，业务事实校正）**
- P0-A1/A2/A3/A4：降级口径一致性（建议合并为「04-07 降级口径披露」一个 PR）
- P0-B1/B2/B3/B4：08/09 状态回写 + 完成事实回写（建议「08-09 状态与验收回写」一个 PR）

**批次 2（P1，结构性补强）**
- P1-C1/C2：§2.7 传播与补全 + frontend-interaction §8
- P1-D1/D2/D3：05 Readiness Gate + Risk-ID + 05↔09 映射

**批次 3（P2，可延后 / 升 Phase2 前批量）**
- P2-E：稳定 ID（COMP/MOD/Flow/ADR、API-ID、TC-ID、Flow-D/Page-ID）+ 各类矩阵 + design §0 元信息/实现偏差区 + 02 NFR 委托声明

**最小顺手项（可与批次 1 同 PR）**
- 02 §0 补「交付物形态 Demo」声明 + NFR 委托声明（1-2 行）

> 回梳前须先确认 C-1~C-7（尤其 C-1/C-2/C-3 三个口径决定批次 1 的执行方式）。回梳须按 `ai/prompts/docs/04-edit-single-doc.md` 最小变更，不机械重写、不删旧事实；旧项目用 `F-*` 等自定义编号时不强制重命名，优先补兼容映射表闭合追溯。

## 五、同步报告回写建议

建议把本报告摘要回写到 `sync-records/template-sync/2026-07-08-sync-template-v1.43.0.md`「文档体系审计摘要」节：
- 审计报告路径：本文件
- 主要缺口：降级口径诚实性（P0-A）、状态失真与完成事实回写（P0-B）、§2.7 传播（P1-C）、05 Readiness Gate（P1-D）
- 阻塞项：C-1/C-2/C-3 三个口径需先决策
- 可延后项：P2-E 结构补全
- 下一步命令：确认 C-1~C-7 后按批次 1 启动 `ai/prompts/docs/04-edit-single-doc.md` 回梳

## 六、审计范围与边界

- 本审计覆盖 `docs/00-09` + `docs/design/*`，对照 `ai/doc-standards/00-09 + design-doc + frontend-interaction + ui-prototype-strategy`。
- 未审计 `docs/inputs/`、`docs/vision/`、`docs/env/local-env.md` 内容（结构已确认存在且合规）。
- 本报告为只读审计留痕，不替代 00-09 正式修订；回梳须另行确认并按文档修订流程执行。
