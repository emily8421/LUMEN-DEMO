# 总体设计阶段文档审计报告（04 / 05）

| 项 | 内容 |
|---|---|
| 审计日期 | 2026-07-15 |
| 审计范围 | `docs/04-architecture.md`、`docs/05-tech-spec.md` |
| 审计基线 | `docs/00-scenario.md`、`docs/01-user-requirements.md`、`docs/02-srs.md`、`docs/03-prd.md` 的最新编号体系 |
| 审计目标 | 基于需求阶段编号，检查总体设计阶段是否承接 `SC / U / REQ / F / Phase / TC` 追溯链，并判断是否可进入个人可用 Alpha 编码 |
| 总结论 | 04/05 主体架构仍可复用，但尚未完全吸收 Phase1.5A / Phase1.5B / Phase2A / Phase2B 新路线图；Sprint-16/17 为 Conditional Go，PDF 与 Phase2A/B 为 No-Go / 待设计 |

## 1. 需求编号基线

本次审计以 00-03 最新路线图为准：

| 编号 | 当前含义 | 阶段 | 设计影响 |
|---|---|---|---|
| SC-007 | 个人资料批量入库与导出备份场景 | Phase1.5A/B | 04/05 需承接批量导入、`.md` / ZIP 导出、PDF 导出 |
| U-43 | 文档 / 空间导出与本地备份 | Phase1.5A | 04/05 需有导出备份模块、权限过滤与无新增依赖策略 |
| REQ-037 | 批量 / 文件夹 `.md` / `.txt` 导入 | Phase1.5A | 04 需 Flow；05 需批量处理与失败隔离技术决策 |
| REQ-038 | 单文档 `.md` + 空间 ZIP 导出备份 | Phase1.5A | 04 需 Flow；05 需 `zipfile` / 权限过滤 / 导出边界技术决策 |
| REQ-027 | 单文档 PDF 导出 | Phase1.5B | 04 需 PDF Flow；05 需 RG-006 与依赖矩阵 |
| REQ-026 / 012 / 025 | 内链 / 反链、标签、快速录入 | Phase2A | 04/05 需从旧 Phase2 MVP 中拆出个人知识组织阶段 |
| REQ-014 / 013 / 024 | AI 润色、时间轴候选 | Phase2B | 04/05 需从个人知识组织后置到团队 MVP |
| TC-P1-015 / 016 / 017 | P1.5A/B 验证入口 | Phase1.5A/B | 04/05 追溯矩阵与 RG / 风险映射需补齐 |

## 2. 04 架构文档审计

### 2.1 合规项

- Phase1 基础架构仍成立：React + FastAPI + PostgreSQL/pgvector + LLM / Embedding adapter。
- 空间 / 文档权限过滤、搜索和 RAG 的统一过滤原则清楚，仍可复用为 P1.5 导出权限边界。
- 已有 PDF 导出 ADR-006 和 Flow-005 骨架，可作为 Phase1.5B 的基础。
- 已有 WSG / 文件膨胀阈值意识，适合约束后续 P1.5 / Phase2 实现。

### 2.2 主要问题

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| A04-001 | 阶段口径滞后 | 元信息仍写 P1.5 / Phase2 MVP，而不是 Phase1.5A/B、Phase2A/B | 后续编码可能误判下一阶段 | 更新元信息与架构目标 |
| A04-002 | 架构图未体现 P1.5A | 整体图只有导入 service，没有批量导入、导出备份、ZIP / PDF 导出节点 | Sprint-16/17 缺架构锚点 | 图中补 batch import / export service |
| A04-003 | 组件视图缺导出职责 | COMP-001..004 未标 API-029/030、导出备份、ZIP 权限过滤 | REQ-038 无组件承接 | 补 COMP / 职责说明 |
| A04-004 | MOD-003 不覆盖 REQ-037 关键语义 | 仍偏 Word/PDF/OCR 解析，未写部分成功、同名跳过、路径前缀 | 批量导入编码边界不清 | 拆或扩展 MOD-003A 批量导入 |
| A04-005 | MOD-007 阶段冲突 | PDF 仍混在 P2 写作增强中 | REQ-027 已是 Phase1.5B | 拆 MOD-007A 导出备份、MOD-007B PDF、Phase2B 写作增强 |
| A04-006 | 缺 REQ-037 / 038 Flow | 5.4 只有标签/内链、AI 润色、PDF、快速录入 | Sprint-16/17 缺成功 / 异常 / 权限路径 | 增加 Flow-006 / Flow-007 |
| A04-007 | 追溯矩阵过粗 | REQ-027/037/038 合并一行 | API / TC / Flow 无法一一追溯 | 拆成三行，对齐 API-029/030/019 与 TC-P1-015/016/017 |
| A04-008 | Phase2 仍按旧核心项混排 | REQ-012/014/025/026 仍一行 | 未体现 Phase2A / Phase2B | 拆出个人知识组织与团队 MVP |
| A04-009 | 运行拓扑事实滞后 | 仍写 search 向量化降级 / 后续 | 与 Sprint-8 / task-009 事实冲突 | 改为 hybrid search 已启用，zhparser 可选 |

### 2.3 04 建议修订方向

1. 元信息更新为：Phase1、Phase1.5A、Phase1.5B、Phase2A、Phase2B、愿景。
2. 新增或拆分模块：
   - `MOD-003A` 批量 / 文件夹导入（REQ-037）。
   - `MOD-007A` `.md` / ZIP 导出备份（REQ-038）。
   - `MOD-007B` PDF 导出（REQ-027）。
3. 新增 Flow：
   - `Flow-006` 批量 / 文件夹导入。
   - `Flow-007` `.md` / ZIP 导出备份。
   - `Flow-008` PDF 导出任务。
4. 追溯矩阵拆分为 REQ 级：
   - REQ-037 → API-029 → TC-P1-015。
   - REQ-038 → API-030 → TC-P1-016。
   - REQ-027 → API-019 → TC-P1-017 / RG-006。

## 3. 05 技术方案审计

### 3.1 合规项

- Phase1 技术基线稳定：PostgreSQL + pgvector、FastAPI、React、Embedding、LLM adapter 均已有 Go / 已启用记录。
- PDF 导出已有 RG-006 待评估项，能阻止未验证依赖直接进入编码。
- WSG / 文件阈值约束已具备，可用于 P1.5A 的前端 / 后端小步实现。

### 3.2 主要问题

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| A05-001 | 阶段口径滞后 | 仍写 P1.5 可用性收口、Phase2 MVP | 未体现 Alpha / Beta / Phase2A / Phase2B | 更新 Phase 技术约束 |
| A05-002 | 缺批量导入技术决策 | TCD 中无 REQ-037 | 部分成功、同名跳过、路径前缀无技术口径 | 新增 TCD-007 |
| A05-003 | 缺导出备份技术决策 | TCD 中无 REQ-038 | `.md` / ZIP 导出可能误引重依赖或漏权限 | 新增 TCD-008，优先标准库 `zipfile` |
| A05-004 | 依赖矩阵未列 PDF 导出库 | 只有 RG-006，无 weasyprint/reportlab 依赖行 | Sprint-18 前置不清 | 补 Phase1.5B 候选依赖 |
| A05-005 | python-docx / pdfplumber 阶段不准 | 当前写 Phase1 候选 | 应为 Phase1.5B 候选，不阻塞 Alpha | 改启用阶段与状态 |
| A05-006 | WSG 仍偏 Phase2 | 表头为 Phase2 实现前要求 | Sprint-16/17 也要遵守 | 改为 P1.5A 起生效 |
| A05-007 | 批量导入资源边界不足 | 仅泛泛提大文档批量导入 | 实现时容易一次性读入或阻塞索引 | 补 batch size / 单文件大小 / 失败隔离 / 增量索引原则 |
| A05-008 | 安全表缺导出产物边界 | 未写 ZIP/PDF 权限继承、公开链接、落盘清理 | 导出可能泄露无权限文档 | 补导出安全边界 |
| A05-009 | 待确认项不准确 | 仍写无开发前阻塞项 | PDF / 真实解析 / Phase2A 均有门禁 | 更新待确认项 |

### 3.3 05 建议修订方向

1. 新增技术决策：
   - `TCD-007` 批量/文件夹导入：逐文件处理、部分成功、同名跳过、路径前缀。
   - `TCD-008` `.md` / ZIP 导出备份：标准库 `zipfile`，统一权限过滤，不引重依赖。
   - `TCD-009` PDF 导出：受 RG-006 控制，验证后再编码。
2. 依赖矩阵：
   - `zipfile` 标准库：Phase1.5A，已可用。
   - `weasyprint / reportlab`：Phase1.5B 候选，待 RG-006。
   - `python-docx / pdfplumber`：Phase1.5B 候选，待选型验证。
3. 技术约束按阶段拆分：
   - Phase1.5A：REQ-037/038，低依赖，优先实现。
   - Phase1.5B：REQ-027、真实 Word/PDF 文本提取、zhparser，需 RG / 选型。
   - Phase2A：REQ-026/012/025。
   - Phase2B：REQ-014/013/024 候选。
4. 安全 / 隐私表补导出产物：
   - ZIP 只包含当前用户可见文档。
   - PDF / ZIP 不生成公开长期链接。
   - 如落盘，需过期清理或本地路径策略。

## 4. 编号追溯缺口矩阵

| 需求编号 | 当前 04/05 承接情况 | 审计结论 | 修订建议 |
|---|---|---|---|
| SC-007 | 未被 04/05 明确引用 | 缺口 | 04/05 元信息或设计目标引用 SC-007 |
| U-43 | 未被 04/05 明确引用 | 缺口 | 04 补导出备份模块；05 补 ZIP 技术决策 |
| REQ-037 | 04 合并承接，05 泛泛允许 | 不足 | 补 Flow-006、TCD-007 |
| REQ-038 | 04/05 基本缺失 | 严重缺口 | 补 Flow-007、TCD-008、导出安全边界 |
| REQ-027 | 有 ADR / RG，但阶段口径粗 | 部分合规 | 改为 Phase1.5B，补 Flow-008 与依赖矩阵 |
| REQ-026 / 012 / 025 | 仍混入旧 Phase2 MVP | 不足 | 拆为 Phase2A 个人知识组织 |
| REQ-014 / 013 / 024 | 与 Phase2A 混排 | 不足 | 拆为 Phase2B 团队 MVP / 候选 |
| TC-P1-015 / 016 / 017 | 04/05 未闭环引用 | 缺口 | 追溯矩阵、RG / 安全边界补 TC 映射 |

## 5. Go / No-Go 结论

| 阶段 / 任务 | 结论 | 理由 | 下一步 |
|---|---|---|---|
| Phase1.5A Sprint-16/17 | Conditional Go | 需求和计划清楚；04/05 需先补最小设计链路 | 最小修 04/05 后编码 Sprint-16 |
| Phase1.5B PDF / Sprint-18 | No-Go | RG-006 未完成，PDF 库与中文字体未验证 | 先做 PDF tech-env-eval |
| Phase1.5B 真实 Word/PDF 文本提取 | No-Go / 待评估 | 依赖和阶段口径未清 | 单独选型 / RG |
| Phase2A 个人知识组织 | No-Go | 04/05/06/07/09 未按 Phase2A 重拆 | P1.5A/B 后补契约 |
| Phase2B 团队 MVP | No-Go | 不是个人最快可用路径，且设计门禁不足 | Phase2A 后再评估 |

## 6. 推荐执行顺序

1. 先最小修订 `docs/04-architecture.md`：模块、Flow、REQ 追溯矩阵。
2. 再最小修订 `docs/05-tech-spec.md`：TCD、依赖矩阵、Phase 技术约束、安全边界、RG。
3. 必要时同步 `06/07/08/09` 中 API-029 / API-030 / TC-P1-015 / TC-P1-016 的细节。
4. 进入 Sprint-16 批量 / 文件夹导入编码。

## 7. 结论

`04/05` 不需要推倒重写，但必须围绕最新需求编号做一次“薄修订”。最小修订范围应聚焦 `SC-007 / U-43 / REQ-037 / REQ-038 / REQ-027 / Phase1.5A / Phase1.5B / Phase2A / Phase2B`，目标是让 Sprint-16/17 的设计依据闭合，并继续阻止 PDF、真实解析与团队 MVP 过早进入编码。
