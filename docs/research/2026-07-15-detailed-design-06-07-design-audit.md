# 详细设计阶段审计报告：06 / 07 / docs/design

| 项 | 内容 |
|---|---|
| 审计日期 | 2026-07-15 |
| 审计范围 | `docs/06-db-design.md`、`docs/07-api-spec.md`、`docs/design/*.md`（不含 HTML 原型） |
| 审计基线 | `00-03` “个人可用优先”路线图、`04/05` Phase1.5A/B 与 Phase2A/B 口径、`08/09` Sprint-16/17/18 与 TC-P1-015..017 |
| 审计标准 | `ai/doc-standards/06-db-design.md`、`ai/doc-standards/07-api-spec.md`、`ai/doc-standards/design-doc.md`、`ai/doc-standards/frontend-interaction.md` |
| 总结论 | 详细设计阶段当前**未闭合**最新需求与总体设计口径；Sprint-16/17 编码前建议先做一轮“薄修订”。 |

## 1. 执行摘要

`00-05` 已把路线图重排为：Phase1.5A 先做批量 / 文件夹导入与 `.md` / ZIP 导出备份，Phase1.5B 再做 PDF / 真实 Word/PDF 文本提取，Phase2A 是个人知识组织，Phase2B 才进入团队 MVP。

详细设计阶段尚未完全吸收这条主线：`06/07` 中 API-029 / API-030 只出现在接口清单，缺字段级契约、权限矩阵、API↔DB↔TC 追溯；`docs/design/ingestion.md` 仍停留在 P1 单文件导入与 Word/PDF/OCR 目标态；导出能力没有独立详细设计；前端交互设计仍以旧 “Phase2 MVP” 口径组织候选 UI。

因此，Phase1.5A Sprint-16/17 的状态应判为：**需求与总体设计已就绪，详细设计尚需最小补齐后再编码**。

## 2. 审计范围与文档分层

| 层级 | 文件 | 审计定位 | 结论 |
|---|---|---|---|
| DB 详细设计 | `docs/06-db-design.md` | 表 / 字段 / 索引 / 敏感数据 / REQ→表→TC→Sprint | 需同步 Phase1.5A/B、Phase2A/B 与 REQ-037/038 |
| API 详细设计 | `docs/07-api-spec.md` | API-ID、字段级契约、错误码、权限、API↔Service↔DB↔TC | 需补 API-029 / API-030 契约与追溯 |
| 子系统设计 | `docs/design/ingestion.md` | 内容导入 MOD-003 | 需补批量 / 文件夹导入 Flow-006 与 P1.5A 边界 |
| 子系统设计 | 导出交付设计（缺失） | MOD-007 中 `.md` / ZIP / PDF 导出 | 建议新增 `docs/design/export-delivery.md` 或等价章节 |
| 前端详细设计 | `docs/design/frontend-interaction.md`、`frontend-experience-brief.md` | 页面 / Flow / 状态 / 权限 / smoke 草案 | 需加入 P1.5A 导入 / 导出 UI 路径，并拆 Phase2A/B |
| P1 已实现设计 | `permissions.md`、`rag-retrieval.md`、`term-management.md`、`frontend-workspace-redesign.md` | 已实现基线 | 大体可用；少量实现状态文案需刷新 |
| 愿景设计 | `intelligence-analysis.md` | 远期骨架 | 可保留，不阻塞 P1.5A |

## 3. 关键问题

### 3.1 06 数据库设计

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| D06-001 | 阶段口径仍是旧 P1.5 / Phase2 MVP | `docs/06-db-design.md` §0、§2、§6、§7 仍写 P1.5 PDF、Phase2 MVP、核心 4 项 | 与 `04/05` 的 Phase1.5A/B、Phase2A/B 不一致 | 更新元信息、章节标题和追溯矩阵阶段口径 |
| D06-002 | REQ-037 / REQ-038 未进入 DB 追溯矩阵 | `REQ-037` / `REQ-038` 在 `06` 中无命中 | Sprint-16/17 无 DB 层“是否需要迁移 / 复用哪些表”的结论 | 补两行：REQ-037 复用 `lumen_imports/documents/chunks`；REQ-038 复用 `lumen_documents/document_versions`，不新增表 |
| D06-003 | `lumen_imports` 未说明批量 / 文件夹导入策略 | 字段仍只围绕 `source_filename`、单个 `parsed_doc_id` | 实现 API-029 时不清楚是一批一条 job，还是每文件一条 job | 明确 P1.5A 采用“逐文件记录 / 逐条结果”，相对路径只作为标题前缀或 `source_filename`，不建真实目录表 |
| D06-004 | `.md` / ZIP 导出备份没有数据边界 | `lumen_doc_exports` 仅覆盖 PDF，REQ-038 无表说明 | ZIP 是否落盘、是否需要任务表、权限如何过滤不明确 | 写明 REQ-038 默认流式响应 / 临时产物，不进入 `lumen_doc_exports`；只包含当前用户可见文档 |
| D06-005 | `lumen_doc_links` 在表清单中重复 | 表清单同时有 “内部链接与反向链接索引” 与 “文档间内部链接 / 反向链接” | 容易造成 P2A 表契约漂移 | 保留一行，删除或合并重复骨架 |
| D06-006 | 真实 Word/PDF 文本提取缺 RG-007 承接 | `06` 只引用 RG-003 / RG-006 | 与 `05` 新增 RG-007 不一致 | 在 REQ-009 相关说明中标注真实 Word/PDF 属 Phase1.5B，待 RG-007 |

### 3.2 07 API 设计

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| D07-001 | 元信息仍未覆盖 P1.5A/B | `docs/07-api-spec.md` §0 仍写 Phase1 + P2 / 愿景骨架 | API 文档与 03/04/05 路线图不一致 | 更新覆盖范围：P1.5A API-029/030，P1.5B API-019 |
| D07-002 | API-029 / API-030 只有清单，无字段级契约 | 两者只在 §2 接口清单出现 | Sprint-16/17 无法直接按 API 契约编码 / 测试 | 在 §3.1.1 与 §3.9 补请求、响应、权限、错误、状态、示例 |
| D07-003 | API-029 / API-030 未进入 API↔DB / Service / Test 表 | §5 只有 API-019 与 P2 API | TC-P1-015 / 016 无 API 追溯 | 补 `imports.import_batch`、`export.export_document_md`、`export.export_space_zip` 追溯行 |
| D07-004 | TC-P1-015 / 016 未被 07 引用 | `TC-P1-015` / `TC-P1-016` 在 `07` 中无命中 | 09 验证与 API 契约断链 | 在 contract matrix、权限矩阵、追溯表中补 TC |
| D07-005 | API-009 / search 实现状态滞后 | §0 / §2 / §3 仍有“向量搜索留后续” | 与 task-009 hybrid search 已完成事实冲突 | 改为 hybrid search 已实现，zhparser 为可选增强 |
| D07-006 | P2 仍混作旧 MVP | §3.9、§4、§6 仍写 Phase2 MVP / 核心 4 项 | 与 Phase2A / Phase2B 拆分冲突 | 把 API-014/018/017 归 Phase2A，API-028 归 Phase2B；REQ-013/024 另列 Phase2B 候选 |

### 3.3 `docs/design/ingestion.md`

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| DD-ING-001 | 只覆盖 REQ-009/010，缺 REQ-037 | 元信息只列 API-011 / REQ-009/010 | Sprint-16 批量导入无详细设计承接 | 增补 REQ-037、API-029、Flow-006、TC-P1-015 |
| DD-ING-002 | P1 目标仍写 Word/PDF/图片三路 | §2 / §4 仍写 `.docx/.pdf/图片` 为 P1 已设计 | 与 P1.5A “只做 `.md/.txt` 批量，不让真实解析阻塞”冲突 | 拆分：P1 已降级 `.md/.txt`；P1.5A 批量 `.md/.txt`；P1.5B 真实 Word/PDF 待 RG-007；OCR 后续 |
| DD-ING-003 | 元信息实现状态自相矛盾 | §0 写“无 Embedding/向量”，§6 DEV-003 写已实现向量落地 | 新会话恢复时容易误判实现状态 | 刷新元信息：Embedding / pgvector 已落地，真实解析 / OCR 仍降级 |
| DD-ING-004 | 批量失败隔离和同名跳过未设计 | 当前只有单文件失败处理 | API-029 的逐条结果、部分成功、同名跳过缺口 | 补批量状态模型与响应结果结构，说明不回滚成功项 |
| DD-ING-005 | 文件夹相对路径策略缺失 | 04/05/08 已要求标题前缀保留目录感 | 前后端对 `webkitdirectory` / relative path 的数据口径不一致 | 约定相对路径仅作为标题前缀或 import metadata，不新建 folder 表 |

### 3.4 导出交付详细设计缺失

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| DD-EXP-001 | MOD-007 缺 P1.5A/B 详细设计文件 | `docs/design/` 无 export / delivery 设计；04 已写“待 P1.5 建导出实现说明” | Sprint-17 / 18 缺页面、API、权限、失败态、产物策略承接 | 新增 `docs/design/export-delivery.md` |
| DD-EXP-002 | REQ-038 `.md` / ZIP 导出未定义权限和产物策略 | 05 已要求 ZIP 只含可见文档、默认 `zipfile`，但 detailed design 未承接 | ZIP 可能泄露不可见文档，或误引 PDF / 重依赖 | 设计 Flow-007：单文档 `.md`、空间 ZIP、权限过滤、文件名规则、失败态、是否临时落盘 |
| DD-EXP-003 | REQ-027 PDF 与 REQ-038 混淆风险 | 06/07 当前只强调 PDF 表 / API-019 | 可能让 PDF 阻塞 Alpha | 在导出设计中明确 P1.5A 不做 PDF；PDF 只走 Flow-008 + RG-006 |

### 3.5 前端详细设计

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| DD-FE-001 | `frontend-interaction` 仍以旧 Phase2 MVP 组织 | §0、§8、§9 仍写 Phase2 UI Gate / MVP | 与 P1.5A 下一步编码不匹配 | 增补 P1.5A 小节：批量导入 drop zone、批量进度、导出按钮、空间 ZIP 入口 |
| DD-FE-002 | 缺 TC-P1-015 / 016 前端路径 | `frontend-interaction` 无 TC-P1-015 / 016 | Sprint-16/17 Chrome smoke 无页面路径依据 | 补 UF / Path：多文件 / 文件夹导入、逐条结果、单文档 `.md` 下载、空间 ZIP 导出 |
| DD-FE-003 | Phase2A / Phase2B 未拆分 | `frontend-experience-brief` 与 `frontend-interaction` 仍写 Phase2 MVP | 标签 / 内链 / AI 润色 / 时间轴优先级混在一起 | Phase2A 只保留标签、内链 / 反链、快速录入；AI 润色 / 时间轴进入 Phase2B |
| DD-FE-004 | AI 助手 / 推荐问题需重新归位 | P2 UI 方向池把首页 AI 助手作为高频候选 | 可能把 Phase2B AI 润色与 P1 RAG 问答混用 | 保留 P1 RAG 问答入口；Phase2B 的写作 AI / 润色另行确认数据外发边界 |

### 3.6 P1 已实现设计状态小漂移

| ID | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| DD-P1-001 | `permissions.md` 元信息仍写存储层降级 / 内存 | 当前 06/05 已表明 PG 权限过滤接入 | P1 基线状态不准确 | 刷新为 PG 已接入，`DemoRepository` 仅单测 fake |
| DD-P1-002 | `rag-retrieval.md` 与 `term-management.md` 大体健康 | 已记录 Sprint-7/8 真实化 | 不阻塞 | 仅在后续统一文档清理时同步日期和 Phase1.5 影响 |
| DD-P1-003 | `frontend-workspace-redesign.md` 为 P1B 已实现 | 与当前主线不冲突 | 不阻塞 | 无需优先修改 |

## 4. 编号追溯缺口矩阵

| 编号 | 当前详细设计承接 | 审计结论 | 修订建议 |
|---|---|---|---|
| SC-007 | 06/07/design 基本未显式引用 | 缺口 | 在 ingestion / export design 元信息中引用 |
| U-43 | 06/07/design 基本未显式引用 | 缺口 | 导出备份详细设计承接 U-43 |
| REQ-037 | 仅 `07` 接口清单 API-029 | 严重不足 | 补 06 追溯、07 契约、ingestion Flow、前端路径、TC-P1-015 |
| REQ-038 | 仅 `07` 接口清单 API-030 | 严重不足 | 补 06 无新增表结论、07 契约、export design、前端路径、TC-P1-016 |
| REQ-027 | 06/07 有 PDF 契约 | 部分合规 | 改为 Phase1.5B，补导出设计与 RG-006 边界，不阻塞 Alpha |
| REQ-009 | ingestion / 06 / 07 有 P1 降级 | 部分滞后 | 标注真实 Word/PDF 属 Phase1.5B + RG-007，刷新 Embedding 状态 |
| REQ-012 / 026 / 025 | 06/07 有旧 P2 草案 | 需拆分 | 归 Phase2A，P1.5A/B 后再细化 |
| REQ-014 / 013 / 024 | 06/07 / FE 有旧 P2 草案 | 需拆分 | 归 Phase2B 或后续候选，补数据外发 / 时间轴门禁 |
| TC-P1-015 / 016 | 06/07/design 无引用 | 严重缺口 | 在 DB / API / ingestion / export / frontend 路径中补齐 |

## 5. Go / No-Go 结论

| 阶段 / 任务 | 结论 | 理由 | 下一步 |
|---|---|---|---|
| Phase1.5A Sprint-16 批量 / 文件夹导入 | Conditional No-Go（详细设计待补） | 需求、总体设计、08/09 已清楚；但 ingestion / 07 / 06 / 前端路径未闭合 | 先最小修 `ingestion.md`、`07` API-029、`06` REQ-037、前端路径 |
| Phase1.5A Sprint-17 `.md` / ZIP 导出备份 | Conditional No-Go（详细设计待补） | 04/05 已明确；但缺 export design、API-030 契约、06 无新增表结论、TC-P1-016 追溯 | 先新增或补导出详细设计，再修 07/06 |
| Phase1.5B PDF / Sprint-18 | No-Go | RG-006 未完成，导出详细设计未拆 Alpha / Beta | 先完成 RG-006 与 export design PDF 小节 |
| Phase1.5B 真实 Word/PDF 文本提取 | No-Go | RG-007 / tech-env-eval 未完成，ingestion 口径未拆 | 先做选型与最小样例 |
| Phase2A 个人知识组织 | No-Go | 06/07/frontend 仍为旧 Phase2 MVP 草案，未按 Phase2A 重拆 | P1.5A/B 后再补 navigation 详细设计 |
| Phase2B 团队 MVP | No-Go | 不是个人最快可用路径，AI / 时间轴 / 数据外发门禁未闭合 | Phase2A 后再评估 |

## 6. 推荐修订顺序

1. **先修 `07-api-spec.md`**：补 API-029 / API-030 的 contract matrix、请求 / 响应、错误码、权限、API↔Service↔DB↔TC 追溯；同步 API-009 hybrid search 状态。
2. **再修 `06-db-design.md`**：补 REQ-037 / REQ-038 追溯，声明 Sprint-16/17 默认不新增表，修正旧 Phase2 MVP 文案与 `lumen_doc_links` 重复行。
3. **更新 `docs/design/ingestion.md`**：拆 P1 / P1.5A / P1.5B，补 API-029、Flow-006、TC-P1-015、批量失败隔离与标题前缀策略。
4. **新增 `docs/design/export-delivery.md`**（或等价章节）：覆盖 API-030 / API-019、Flow-007 / Flow-008、`zipfile`、权限过滤、临时产物 / 流式响应、TC-P1-016 / 017。
5. **更新 `frontend-interaction.md`**：补 P1.5A UI 路径与 smoke 草案；同时把 Phase2 UI 候选拆成 Phase2A / Phase2B。
6. **低优先级清理**：刷新 `permissions.md`、`frontend-experience-brief.md` 等元信息中的旧阶段或实现状态文案。

## 7. 结论

详细设计阶段不需要推倒重写，但必须围绕 `REQ-037 / REQ-038 / REQ-027 / API-029 / API-030 / TC-P1-015 / TC-P1-016 / TC-P1-017` 做一次薄修订。修订目标不是扩大范围，而是让 Phase1.5A 的“批量入库 + 导出备份”在 DB、API、子系统、前端路径和验证之间形成闭环，并继续阻止 PDF、真实解析、AI 润色和团队 MVP 过早进入编码。
