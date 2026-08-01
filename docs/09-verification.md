# 验证计划（Verification Plan）

> 测试策略与 REQ → 用例追溯。按阶段增量：本期覆盖 `[P1]` 全部 REQ；升阶段在原位追加（global-rules §8）。
> 与 `08-dev-plan`（"何时做"）正交：本文回答"怎么算对"。
>
> 定位：本项目「验证」支柱，对应 global-rules §5 编号档 `09-verification`（由语义命名 `verification-plan.md` 升格而来）。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | **Phase2B（团队 MVP）进行中**（2026-07-30 切指针；RG-008 → **Go**，Sprint-19 后端 vertical slice 通过 2026-07-30；前端 half 待实现） |
| 交付物形态 | Demo / 个人可用 Alpha / 个人知识组织 |
| 覆盖 REQ | Phase1：REQ-001..REQ-011、REQ-036；Phase1.5A：REQ-037/038；Phase1.5B：REQ-027；Phase2A：REQ-026/012/025；**Phase2B：REQ-014 首批核心（后端已实现，RG-008 升 Go，2026-07-30）+ REQ-013/024 第二 slice（待 Sprint-20）**；愿景验证项待升阶段 |
| 当前状态 | Phase1 全量验收已记录，结论为 Conditional Go（Demo closure）；Phase1.5A 已完成 TC-P1-015/016；Phase2A 已完成 TC-P2-LINK-001 / TC-P2-TAG-001 / TC-P2-QUICK-001，个人知识组织三个 vertical slice 验收通过。Phase1.5B 仍待 RG；**Phase2B 范围已确认（2026-07-30）+ 设计就绪 + 数据外发风险已接受；REQ-014 已完成 v1.1.0（TC-P2-AI-001 通过）；Sprint-21 Doc-First UX slice 3a/3c 已完成本地 smoke + TC-P1-014 回归（2026-08-01 用户确认），slice 3d 导入弹窗化待编码后补 TC-P1-015 回归**；愿景项待升阶段。 |
| 最后更新 | 2026-08-01（Sprint-21 slice 3a/3c 本地 smoke + TC-P1-014 回归通过回写；保留 2026-07-20 Phase2A closure 验收记录） |

## 1. 测试策略

- **单元测试**：service 层——权限过滤、切块、检索排序、导入解析
- **集成测试**：导入 → 检索 → 问答 端到端闭环（双空间、三级权限场景）
- **验收测试**：逐条 REQ 的可验证口径（见 §2 矩阵）
- **数据夹具**：`nova-internal` / `brightlite-team` 两空间 + 私有 / 团队共享 / 外部只读 各若干文档

## 2. REQ → 用例追溯矩阵

### Phase1（功能范围 `[P1]` · 交付物形态 **Demo**）

| TC-ID | REQ | 验收用例 | 阶段 | 状态 |
|---|---|---|---|---|
| TC-P1-001 | REQ-001 隔离 | brightlite 账号查询 nova-internal 文档 = 0 命中 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-002 | REQ-002 切换 | 切换后搜索 / 问答只反映目标空间 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-003 | REQ-003 权限 | 作者私有文档，同空间他人搜不到、问答不引用 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-004 | REQ-004 CRUD | 创建 / 读 / 改 / 删均成功，删后不可检索 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-005 | REQ-005 行内编辑 | 编辑保存后内容持久、再打开一致 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-006 | REQ-006 版本 | 3 次修改 → 3 版本 → 能恢复指定版本 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-007 | REQ-007 搜索 | 已知关键词 / 语义相近问题返回正确文档 | [P1] | 条件通过（hybrid：关键词 + `ts_vector` SQL 候选 + pgvector 语义召回；zhparser 可选回退 `simple`） |
| TC-P1-008 | REQ-008 RAG | 库内问答正确 + 标来源；库外回复"未找到" | [P1] | 通过（真实 LLM·glm-5.2 + 向量召回·bge-small-zh pgvector ANN threshold 0.6；RG-001/002 Go） |
| TC-P1-009 | REQ-009 导入 | 导入 `.md` / `.txt` 已提取文本后可搜、可问答引用 | [P1] | 条件通过（真实 Word / PDF 解析未验证，留后续） |
| TC-P1-010 | REQ-010 OCR | 中文白板照片 OCR 后可搜 | [P1] | 后续阶段（OCR 未实现，降级移出 P1 必过） |
| TC-P1-011 | REQ-011 桌面端 | Chrome / Edge 完成上述全部 | [P1] | 条件通过（降级口径·Edge Headless + Chrome 人工 smoke） |
| TC-P1-012 | REQ-036 术语管理 | 新建空间术语后，文档识别该词，问答优先使用空间定义且不被同名全局术语覆盖 | [P1] | 条件通过（PG 仓储·Sprint-8 起真实化） |
| TC-P1-013 | REQ-011 P1A 结构聚焦 | 文档 / 搜索 / 问答 / 术语一级视图切换；900px 桌面宽度不横向破版；P0 能力不回退 | [P1] | 通过（构建 + Chrome / Edge 900px smoke） |
| TC-P1-014 | REQ-011 P1B 工作台重设计 | TopBar + Nav Rail + Context Pane + Workspace 三层布局；Context Pane 随视图变化；900px 桌面宽度不横向破版；信息密度达标；P0/P1A 能力不回退 | [P1] | 通过（构建 + Chrome / Edge 900px smoke）；**Sprint-21 slice 3a + 3c 回归通过**（栏默认收起 + 首页默认落地 + documents 空态/返回，2026-08-01 用户本地 smoke 确认） |
| TC-P1-015 | REQ-037 批量导入 | 拖入文件夹 / 多文件后全部 `.md`/`.txt` 入库可搜可问答；标题保留路径前缀；同名跳过 | [P1] | 通过（Sprint-16 自动化 + Chrome headless drop-zone smoke） |
| TC-P1-016 | REQ-038 导出备份 | 文档详情下载 `.md`；空间导出 ZIP 含可见文档、权限过滤 | [P1] | 通过（Sprint-17 后端 tests + 端到端 HTTP smoke） |
| TC-P1-017 | REQ-027 单文档 PDF | 选型 + 中文 PDF 导出验证（RG-006）；文档详情导出 PDF 中文正常 | [P1] | P1.5B 草案·待 RG-006（Sprint-18） |

> 状态说明：Sprint-2~6 按**降级口径**验收（原内存 `demo_repository`）；Sprint-7/8 真实化后 RAG 已走真实 LLM（GLM-5.2）+ 向量召回（pgvector），存储切到 PostgreSQL（见 §5 Sprint-7/8 记录）。仍降级的：真实 PDF/Word 解析、OCR（RG-003，后续阶段）。search 已在 task-009 升级为 hybrid（关键词 / ts_vector / pgvector 语义召回），zhparser 为可选回退。「条件通过」= 当前实现满足 Demo 级别验收；详见 §6 与 `docs/05-tech-spec.md §5.1`。 TC-P1-013 / TC-P1-014 为 REQ-011 体验收口增量，不改变 Phase1 Demo closure 结论。**2026-07-15 标注校准**：TC-P1-001~006/012 原标「降级口径·内存」，因运行时仓储自 Sprint-8 起为 `repository = PgRepository()`（内存降级已解除），已校准为「PG 仓储·Sprint-8 起真实化」；是否进一步将这些 TC 升级为「通过」待人工确认（见 `08` 待确认项）。

#### Phase1 TC 用例详情

> P2-E 回梳新增（C-4：引入稳定 TC-ID）。`TC-P1-NNN` 与 REQ 一一映射；自动化位置指向 `tests/backend/`，证据见 §5。

| TC-ID | REQ | 前置 | 步骤 | 期望 | 自动化 / 证据 | 状态 |
|---|---|---|---|---|---|---|
| TC-P1-001 | REQ-001 | nova / brightlite 双空间 + 成员 | brightlite 账号搜索 nova 文档 | 0 命中 | `tests/backend/test_permission.py`、`test_search.py` | 条件通过 |
| TC-P1-002 | REQ-002 | 用户属多空间 | 切换空间后搜索 / 问答 | 仅目标空间结果 | `tests/backend/test_space.py`、`test_api_routes.py` | 条件通过 |
| TC-P1-003 | REQ-003 | 作者私有文档 + 同空间他成员 | 他成员搜索 / 问答该私有文档 | 不命中、不引用 | `tests/backend/test_permission.py` | 条件通过 |
| TC-P1-004 | REQ-004 | 已登录 + 当前空间 | 创建 / 读 / 改 / 删文档 | 四项成功，删后不可检索 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-005 | REQ-005 | 已有文档 | 行内编辑保存后重开 | 内容持久、一致 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-006 | REQ-006 | 已有文档 | 改 3 次 → 查版本 → 恢复 | 3 版本可见、能恢复指定版本 | `tests/backend/test_document.py` | 条件通过 |
| TC-P1-007 | REQ-007 | 已索引文档 | 关键词搜索 / 语义搜索 | 返回正确文档 + 摘要；无直接关键词重叠时可通过向量召回 | `tests/backend/test_search.py`（+ `test_api_routes.py::test_search_api_returns_vector_semantic_hits` PG 集成） | 条件通过（hybrid search） |
| TC-P1-008 | REQ-008 | 已索引文档 | 库内问答 / 库外问答 | 库内正确 + 来源；库外「未找到」 | `tests/backend/test_rag.py`（+ `test_api_routes.py` PG 集成）+ GLM-5.2 真实问答 | 通过（真实 LLM + 向量召回） |
| TC-P1-009 | REQ-009 | `.md`/`.txt` 文件 | 导入后搜索 / 问答 | 可命中 | `tests/backend/test_imports.py` | 条件通过（仅 .md/.txt） |
| TC-P1-010 | REQ-010 | 中文白板照片 | OCR 后搜索 | 可搜 | — | 后续阶段（OCR 未实现） |
| TC-P1-011 | REQ-011 | 桌面端浏览器 | 走查全部 P1 功能 | 全部可用 | Edge Headless + Chrome 人工 smoke（§5） | 条件通过 |
| TC-P1-012 | REQ-036 | brightlite 空间 | 新建术语 → 文档识别 → 问答 | 识别 + 空间术语优先于全局 | `tests/backend/test_term.py`、`test_rag.py` | 条件通过 |
| TC-P1-013 | REQ-011 | P1A 前端实现 + Chrome / Edge 桌面 | ① 登录并切换文档 / 搜索 / 问答 / 术语视图；② 在 900px 宽度完成文档、搜索、问答、术语主流程；③ 回归 Markdown 渲染、来源点击、删除 / 恢复二次确认 | 视图切换保持当前空间上下文；各视图主区不被无关面板挤压；900px 无全局横向滚动；P0 能力不回退 | `npm.cmd run build` 通过；Chrome / Edge headless smoke（900px）通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认 | 通过 |
| TC-P1-014 | REQ-011 | P1B 工作台重设计实现 + Chrome / Edge 桌面；Sprint-21 slice 3a/3c 回归覆盖栏显隐、首页默认落地、documents 减框、空态引导与返回 | ① 登录后检查 TopBar + Nav Rail + Context Pane + Workspace 三层布局；② 切换文档 / 搜索 / 问答 / 术语并确认 Context Pane 随视图变化；③ 在 900px 宽度完成文档、搜索、问答、术语主流程；④ 检查搜索首屏 ≥5 条结果、术语首屏 ≥8 条、编辑区 ≥12 行；⑤ 回归 Markdown 渲染、来源点击、删除 / 恢复二次确认；⑥ Sprint-21 追加确认首页非空、左目录展开后主区不消失、空态「展开左目录 / 新建文档」可用、文档页 / 新建态「返回」回到空态 | 工作台布局与 `frontend-workspace-redesign` 原型一致；任务聚焦，不显示无关大卡片；900px 无全局横向滚动；P0/P1A 能力不回退；Sprint-21 追加的默认落地与空态能力不造成主体空白或三栏消失 | `npm.cmd run build` 通过；Chrome / Edge headless smoke（900px）通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认；Sprint-21：用户本地 Chrome/Edge smoke + TC-P1-014 回归通过（2026-08-01） | 通过（含 Sprint-21 回归） |
| TC-P1-015 | REQ-037 | 多个 `.md` / `.txt` 文件或文件夹 | 拖入文件夹 / 多文件后批量导入 | 全部入库可搜可问答；标题保留路径前缀；同名跳过 | `tests/backend/test_imports.py`（批量成功、失败隔离、同名跳过、可搜可问答）；`tests/backend/test_import_api.py`（API-029 响应契约）；`npm.cmd run build`；Chrome headless drop-zone smoke（登录 → drop 两个带 `webkitRelativePath` 文件 → 导入成功 2 → 搜索 / 问答命中） | 通过 |
| TC-P1-016 | REQ-038 | 当前空间存在多篇可见 / 不可见文档 | 文档详情下载 `.md`；空间导出 ZIP | 单文档 `.md` 内容正确；ZIP 只含可见文档 | `tests/backend/test_export.py`（13 tests：单文档可见 / 不可见 / 指定版本、ZIP 只含可见 / 空空间 / 路径前缀 / 防穿越 / 非成员）+ FastAPI TestClient 端到端 HTTP smoke（路由注册 / 异常 handler / 二进制 Response / 不可见 4004 / 非法 format 4220 / 无 token 4001） | 通过 |
| TC-P1-017 | REQ-027 | RG-006 已 Go / Conditional Go；当前用户可读文档 | 对可读文档指定版本发起 PDF 导出；验证中文、失败态、权限态和产物访问 | 导出任务与版本绑定；中文正常；产物继承源文档权限；导出库不可用返回 5030；未验证前不得进入实现 | 待 tech-env 依赖验证 + 后端 tests + 人工 PDF 样例 | 草案·待 RG-006 |

> TC-P1-010 暂为「后续阶段」，待 OCR 落地后补步骤与证据；TC-P1-013 已随 PR #76 合并后完成前端构建与 Chrome / Edge 900px smoke；TC-P1-014 已随 Sprint-10（P1B）完成前端构建与 Chrome / Edge 900px smoke，并随 Sprint-21 slice 3a/3c 完成本地回归（2026-08-01 用户确认）；TC-P1-015 已随 Sprint-16 完成自动化验证与 Chrome headless drop-zone smoke，待 Sprint-21 slice 3d 导入弹窗化编码后补入口形态回归；TC-P1-016 已随 Sprint-17 完成后端 tests + 端到端 HTTP smoke；TC-P1-017 待 Sprint-18（RG-006）编码后补证据；其余 TC 自动化均含于后端测试与既有 smoke 证据（见 §5）。

### Phase2（功能范围 `[P2]` · Phase2A **个人知识组织** / Phase2B **团队 MVP**）

> Phase2A 已完成 REQ-026 / REQ-012 / REQ-025 三个 vertical slice；**Phase2B 范围已确认（2026-07-30）：REQ-014 首批核心（后端 vertical slice 已通过，RG-008 升 Go，2026-07-30）+ REQ-013/024 第二 slice；前端 half + Sprint-11 门禁重跑 + 切指针推进待续**。

| TC ID | 覆盖对象 | 前置条件 | 验证步骤 | 预期结果 | 证据要求 | 状态 |
|---|---|---|---|---|---|---|
| TC-P2-WSG-001 | WSG-001..006；P2-UI-G-001..006；P2 Web vertical slice | `04` WSG 矩阵、`05 §4.1`、`08` Sprint-11 草案、`frontend-interaction §9.3` 均已回填；用户确认执行门禁评审 | 逐项检查 App Shell、目录边界、vertical slice、文件膨胀阈值、验证入口、UI 链路是否有文档锚点；Phase2B 启动前确认是否沿用 / 调整 | WSG-001..006 均有明确证据位置；Phase2A 已由 REQ-026 / 012 / 025 三个 slice 完成 build / smoke；不得跳过 WSG 直接改 `frontend/` | `04/05/08/09/frontend-interaction` 锚点 + 2026-07-14 静态评审记录 + Phase2A closure | 静态评审条件通过；Phase2B 启动前重跑 |
| TC-P2-UI-001 | PG-P2-001/002/003、P2-UI-G-001/006；REQ-012/025/026 页面入口候选 | 少容器清爽稿暂定按当前稿继续；首个 slice 聚焦 REQ-012/026 | 静态检查 `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html` 首页、经典目录、文档工作区的信息层级、首屏入口和视觉密度 | 首屏 2-3 个主信息区；少圆角、少边框、少胶囊、少阴影；层级主要靠留白、细分隔线、文字标签和左侧选中线表达；无卡片墙回退 | 原型路径 + 后续截图 / smoke 记录 | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-002 | PG-P2-008、CMP-P2-BREADCRUMB、CMP-P2-LAYER-SEARCH；REQ-012/026 候选 | 使用当前空间 mock 数据；首个 slice 聚焦标签与内链 / 反链 | 静态检查面包屑、当前层级搜索、经典目录 / 列表过滤路径 | 路径定位清楚；搜索只过滤当前空间 / 当前层级可见内容；无结果不泄露跨空间或无权限内容 | 原型路径 + 后续 UI smoke | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-003 | PG-P2-003、CMP-P2-DOC-MODE；REQ-014/026 候选 | 打开示例文档；首个 slice 只用 REQ-026 相关文档工作区能力 | 静态检查预览、编辑、编辑+预览并排、版本 / 来源入口和可调宽说明 | 阅读与预览合并；编辑不破坏阅读；并排预览可用；主要区域可调宽；来源 / 版本可追溯 | 原型路径 + 后续 Chrome / Edge smoke | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-004 | PG-P2-004/005、CMP-P2-QA-SOURCE；REQ-014 候选 | 当前空间已有搜索与问答 mock；完整 AI 润色暂避 | 静态检查搜索 / 问答入口、推荐问题、来源文档 / 术语入口 | 搜索结果高密度但可读；答案限定当前空间并带来源列表行；来源可回看；库外问题与 AI 降级不编造 | 原型路径 + 后续 UI smoke | 静态评审条件通过·非首个 slice |
| TC-P2-UI-005 | PG-P2-007、P2-UI-G-003/004；REQ-013 候选 | 使用小 / 中 / 大集合 mock；关系图不进首个 slice | 静态检查局部关系图候选与大集合降级、无权限、空结果、AI 降级、>80 文档先筛选文案 | 局部关系图仍为候选 / 静态说明，不进入默认实现；大集合先筛选或聚合；不新增真实图谱算法、冲突检测或权限模型 | 原型说明 + 后续设计评审记录 | 静态评审条件通过·后续候选 |
| TC-P2-TAG-001 | REQ-012；`lumen_tags` / `lumen_tag_links`；API-014 / API-027 / API-031 / API-032 | Phase2A 最小版已细化（扁平标签 + 独立标签视图 + 单标签筛选 + 文档详情打标签）；首个 slice REQ-026 已完成 | 创建 / 更新 / 归档标签（API-014/027）；给可见文档打标签 / 移除（API-031）；按标签筛选文档（API-032 `GET /api/tags/{id}/documents`）；跨空间 / 无权限文档不进入 document_count 与筛选结果 | 标签只在当前空间可见；同空间 normalized_name 重名返回 4090；document_count 只统计当前用户可见文档；归档标签不破坏既有 tag_links 历史关联；打标签需文档可写 + 标签同空间 | `tests/backend/test_tags.py` 15 通过 + 浏览器 smoke 通过（Task A `1e4cf48` + Task B `d07688b`） | 通过（Task A `1e4cf48` + Task B `d07688b`） |
| TC-P2-LINK-001 | REQ-026；`lumen_doc_links`；API-018 | Batch B 契约已回填；首个 vertical slice | 在文档内容中登记 `[[wikilink]]`；查询出链 / 反链；target 缺失、无权限、跨空间分别验证 | resolved / unresolved / no_access 状态正确；无权限目标不泄露标题 / 摘要；反链仅返回当前用户可见文档 | `tests/backend/test_doc_links.py`（8 tests）+ TestClient 路由 smoke 5/5；前端 UI smoke 2026-07-16 通过（resolved 跳转 / unresolved 占位 / 反链面板 / pending，alice space10） | 通过（Task A fc2b869 + Task B 6228f3f；UI smoke 4/4） |
| TC-P2-QUICK-001 | REQ-025；`lumen_quick_entries`；API-017 | Phase2A 已实现 | 快速录入 draft；转为新文档；追加到已有文档；关联 tag_ids；丢弃 draft | draft 默认 owner 私有；转换后继承文档权限；非法 tag_ids / document_id 返回 4220；不绕过权限 | `tests/backend/test_quick_entry.py` 17/17 + service 回归 53 + API smoke（draft/create/append + discard + 4220）+ 浏览器 smoke（Task B `bad8fe5`） | 通过（Task A `f771e02` + Task B `bad8fe5`） |
| TC-P2-AI-001 | REQ-014；`lumen_ai_drafts`；API-028；RG-004；**RG-008** | LLM adapter 可用或 Mock 降级；**数据外发风险已接受（RG-008 Go）** | 对可写文档选中文本执行 polish / citation；验证 sources 仅来自可见 chunks；草稿只存 hash + 摘要；LLM 不可用时降级 | 输出保存为 draft；引用可追溯到 chunk / document；库外或无权限来源不进入 prompt / 不返回；草稿不含 API key 与完整敏感原文；5030 / Mock 降级不编造 | 后端 tests（test_ai_polish）+ prompt 边界人工审查 + Chrome/Edge UI smoke（Sprint-19） | 通过（后端 service 9/9 + 全量 125 OK；RG-008 升 Go；**前端 UI smoke 2026-07-31 live 实跑通过**：真 GLM polish/citation + 应用→版本 + 越权 4004 + 交互点击流 alice 实测；面板可见性缺陷已修，见 §5.1） |
- REQ-027 PDF 导出已提前到 Phase1.5B，验证口径见 TC-P1-017。
- **REQ-013 / 024 时间轴 / 密度热条（Phase2B 首批·第二 slice）**：TC-P2-TL-001（待 Sprint-20 实现）——时间轴渲染仅含当前用户可见文档事件；密度热条色阶正确；大集合聚合 / 采样降级 + 列表逃生舱；越权事件不泄露；详见 `docs/design/timeline.md`。
- REQ-015 / 016 / 017 其余 P2 后续用例（推送 / 协作 / 移动端）——不进 Phase2B 首批，待后续 Phase 细化。

### 远期愿景（不承诺）
- REQ-018..023、REQ-028..035 用例——待 05 技术验证可行后补

## 3. 分阶段验证范围

- **Phase1（Demo）**：覆盖 REQ-001..011、REQ-036（上表）——可演示 + 守产品红线；REQ-009/010 按 `.md` / `.txt` 已提取文本降级验收，真实 Word / PDF 解析与 OCR 不作为 Phase1 Demo 必过。P1A 的 TC-P1-013 是既有 REQ-011 的前端结构体验收口，不新增业务范围
- **Phase1.5A（个人可用 Alpha）**：覆盖 REQ-037 / REQ-038，对应 TC-P1-015 / 016；目标是批量入库 + 导出备份，优先于 PDF 和 Phase2 编码。
- **Phase1.5B（个人增强 Beta）**：覆盖 REQ-027，对应 TC-P1-017；受 RG-006 约束，未验证前不得实现。
- **Phase2A / Phase2B**：REQ-026 / 012 / 025 已作为 Phase2A 个人知识组织完成并通过 TC-P2-LINK/TAG/QUICK-001；P2 UI 实现前门禁 TC-P2-UI-001~005 仍作为 Phase2B 启动前门禁草案保留；REQ-014 / 013 / 024 属 Phase2B 团队 MVP 候选，其余 P2 用例待阶段确认后继续细化。
- **愿景（产品）**：待技术验证后再补用例

## 4. 本机资源验证

> 验证 Demo 在本机资源范围内可运行（受 `docs/env/local-env.md` 与 `ai/project-rules.md` §2.5 约束）。

- 本机起库与依赖：Docker Compose 起 PostgreSQL+pgvector，确认本机内存 / 磁盘足够。
- Demo 运行资源占用：峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；Embedding 必须使用本机 `bge-small-zh`（512 维），不依赖外部 Embedding API。
- 数据边界验证：默认夹具使用已标注的虚构 Demo 数据；如导入真实团队文档，需检查来源 / 敏感级别标注，并验证敏感片段不默认发送到外部模型。
- 依赖 / 镜像验证：仅安装项目所需依赖与镜像；新增依赖必须进入依赖文件并说明用途。
- 资源超限的验证口径：超过软上限或本机 Embedding 在导入规模、响应时间、检索质量上无法满足要求时，先优化批处理、增量索引与 chunk 策略；仍不足则触发公司内网 Embedding / reranker 服务预案。

## 5. 验收记录

| 日期 | 范围 | 结果 | 记录 |
|---|---|---|---|
| 2026-07-03 | Sprint-2 前端文档编辑器 | 通过（降级口径） | 提交 `83fb782`；前端文档编辑器 Demo UI |
| 2026-07-03 | Sprint-3 降级文本导入 | 通过（降级口径） | 提交 `0fe169b`；仅 `.md`/`.txt` 已提取文本，不接真实 PDF/OCR |
| 2026-07-04 | Sprint-4A/B/C 搜索 + RAG API + 前端 UI | 通过（降级口径） | 提交 `da9f6e5`/`5144f2a`/`bc03839`；内存搜索 + 降级 RAG（不调 LLM）+ 前端搜索 / 问答 UI |
| 2026-07-04 | 缺陷修复：编辑文档索引 | 通过 | 提交 `c5c177e`；修复新建 / 编辑文档无法被搜索 / 问答命中（见 §5.1） |
| 2026-07-05 | Sprint-5 术语管理 | 通过（降级口径） | 提交 `5b78f0a`；空间术语 CRUD + 问答口径对齐 |
| 2026-07-03~07 | 后端单元 / 集成测试 | 通过（53 tests） | `.venv\Scripts\python.exe -m unittest discover -s tests/backend -v` 全通过；`compileall backend tests/backend` 通过 |
| 2026-07-06 | Sprint-6 桌面端集成 smoke（Edge Headless + FastAPI + Vite） | 部分通过（降级口径） | 已通过登录、空间切换、文档新建 / 编辑 / 版本恢复、`.md` 降级导入、搜索、RAG 问答、术语创建与术语来源、跨空间搜索隔离；Chrome 人工点击、真实 PDF 解析、图片 OCR 未验证。 |
| 2026-07-06 | Sprint-6 Chrome 人工 smoke | 通过（降级口径） | 用户反馈已通过 Chrome 桌面端 14 步 smoke：登录、空间切换、文档 CRUD / 版本恢复、`.md` 降级导入、标题 / 正文搜索、RAG 问答、术语创建与术语来源、跨空间搜索隔离；真实 PDF 解析、图片 OCR 未验证。 |
| 2026-07-09 | Sprint-7 LLM adapter（RG-004） | 通过（GLM-5.2 真实验证） | `llm_adapter.py` 多 provider + rag 接入；55 tests + 本机 GLM `glm-5.2` 真实问答验证通过（answer 带来源标注） |
| 2026-07-10 | Sprint-8 pgvector 接入（task-008 T1–T7） | 通过（RG-001/002 Go） | T1–T5 后端切 PostgreSQL（`docker/compose.yml` lumen-pg + ORM/PgRepository + 单例切换 + demo seed）；T6 RAG 向量召回（bge-small-zh 写 `lumen_chunks.embedding` + pgvector ANN，加法式叠加关键词，threshold 0.6）；74 后端 tests（含 PG 集成 + embedding）+ uvicorn 冒烟（相关问答 / 未找到红线 / 纯语义探针）；T7 文档回写 |
| 2026-07-10 | Phase1 Sprint / 全量验收 | Conditional Go（Demo closure） | TC-P1-001~012 均有验收口径与证据链：Sprint-1~6 按 Demo 降级口径通过；Sprint-7/8 真实 LLM、PostgreSQL+pgvector、Embedding 与 RAG 向量召回通过（RG-001/002/004/005 Go）；REQ-009 以 `.md` / `.txt` 已提取文本降级通过；REQ-010 OCR 明确移出 Phase1 必过（RG-003 No-Go，后续阶段）。遗留项：真实 Word / PDF 解析、OCR 真实化；不阻塞 Phase1 Demo closure，但阻塞无条件生产级 MVP 结论。 |
| 2026-07-10 | task-009 search 向量化 + 可选 zhparser | 通过 | `/api/search` 升级为 substring + `ts_vector` SQL 候选 + pgvector 语义召回；`init_db()` 两次验证通过；当前 `pgvector/pgvector:pg16` 无 zhparser 时回退 `simple`；76 后端 tests 通过（含 `tests.backend.test_search` 与 `test_search_api_returns_vector_semantic_hits`）。 |
| 2026-07-11 | RG-004 LLM 中转迁移复测 | 通过 | 旧中转 `47.107.134.2:7777` 的 key 被停用 → `.env` 迁至 `192.168.15.190:7777/v1`（`glm-5.2`）；`llm_adapter.chat()` + RAG 真实问答复测通过（答案带来源），RG-004 维持 Go。 |
| 2026-07-11 | Sprint-9（P1A）前端结构聚焦实现 | 通过 | PR #76 合并提交 `9ede5b6`；已实现本地 `activeView` 四视图切换、右栏拆分与桌面响应式 CSS；`npm.cmd run build` 通过；Chrome / Edge headless smoke（900px）通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认；无全局横向滚动。 |
| 2026-07-12 | Sprint-10（P1B）前端工作台系统化重设计 | 通过 | 已实现 TopBar + Nav Rail + Context Pane + Workspace 三层工作台；Context Pane 随文档 / 搜索 / 问答 / 术语视图变化；CSS token + pane / toolbar / list-row / inspector 分层；新增 `frontend-workspace-redesign` 设计文档与 HTML 原型；`npm.cmd run build` 通过；Chrome / Edge headless smoke（900px）通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认；无全局横向滚动。 |

| 2026-07-14 | Sprint-11（P2-UI-Gate 候选）实现前 UI 门禁草案 | 草案·未执行 | 已根据少容器清爽稿回填 TC-P2-UI-001~005；当前仅作为进入编码前的验证草案，不代表 Phase2 已启动或可直接编码。 |
| 2026-07-14 | UI / WSG 门禁静态评审 + 首个 vertical slice 确认 | Conditional Go（实现前） | WSG-001..006 与 P2-UI-G-001..006 均有文档锚点；静态检查少容器清爽稿原型关键入口、面包屑 / 层级搜索、文档预览 / 编辑并排、搜索 / 问答来源和关系图降级说明；首个 Phase2 vertical slice 静态评审建议为 `REQ-012 + REQ-026`（标签视图 + 内链 / 反向链接最小闭环）。仍未启动 Phase2、不改代码；进入实现前需补具体任务、迁移 / API / UI 实现计划和 smoke 证据。 |
| 2026-07-15 | Sprint-16（P1.5A）批量 / 文件夹导入 | 通过 | 已实现 API-029 `POST /api/import/batch` 与前端 drop zone / 多文件 / 文件夹选择；同名默认 skipped，失败隔离，标题保留相对路径前缀。验证：`git diff --check` 通过；`python -m unittest tests.backend.test_imports tests.backend.test_import_api` 9 tests 通过；非 PG/embedding 后端业务测试 47 tests 通过；`npm.cmd run build` 通过；Chrome headless drop-zone smoke 通过（登录 → drop 两个带 `webkitRelativePath` 文件 `smoke-folder/readme.md` / `smoke-folder/notes.txt` → 导入成功 2 → 文档列表保留路径标题 → 搜索命中 `smoke-folder/readme` → 问答来源命中 `smoke-folder/notes`）。未完成：全量 `python -m unittest discover -s tests/backend` 因本地 PG 测试超时未完成，embedding 模块在沙箱内触发 `torch_python.dll` 权限错误。 |
| 2026-07-16 | Sprint-17（P1.5A）单文档 `.md` + 空间 ZIP 导出 | 通过 | 已实现 API-030 `GET /api/documents/{id}/export`（`text/markdown`）+ `GET /api/export/space`（标准库 `zipfile`，按权限过滤，不可见文档不进 ZIP、不泄露数量）；前端文档详情"下载 `.md`"按钮 + TopBar"导出空间 ZIP"入口 + `api.ts` blob 下载。验证：`git diff --check` 通过；`python -m unittest tests.backend.test_export` 13 tests 通过（service + API 级）；回归 `test_imports` + `test_import_api` 9 tests 通过；`npm.cmd run build` 通过；FastAPI TestClient 端到端 HTTP smoke 通过（路由注册 + 全局异常 handler + 二进制 Response：单文档 markdown、空间 ZIP 含可见文档、不可见 4004、非法 format 4220、无 token 4001）。未完成：全量 PG/embedding 测试受本机环境限制未完成；浏览器按钮点击下载落盘的人工 smoke 可用 `scripts/run-sprint16-demo.ps1` 起服务后补充。 |
| 2026-07-16 | Sprint-12① 登录态持久化（REQ-011 可用性收口） | 通过（build；刷新 smoke 待人工） | `App.tsx` 将 `{token,userId,currentSpaceId}` 存 localStorage，启动恢复、切空间同步、token 失效（invalid token / 401）自动清除登出；`npm.cmd run build` 通过。刷新不掉线端到端 smoke 建议用 `scripts/run-sprint16-demo.ps1`（内存后端，不需 Docker）人工验证（登录→F5→仍在线→切空间→F5→仍在新空间）。seed 自索引（Sprint-12②）待做。 |
| 2026-07-16 | Sprint-12② seed 自索引（REQ-011 可用性收口） | 通过（单测；embedding 集成待本机 PG） | 根因：`migrations/005_sprint8_seed_demo.sql` 直接 INSERT 文档不经服务层，seed demo 文档开箱无 chunks / embedding。修复：`backend/service/document.py` `ensure_documents_indexed` 启动时幂等回填无 chunks 文档（`sync_document_chunks` → `replace_document_chunks`），`backend/main.py` lifespan `init_db` 后调用。验证：`python -m unittest tests.backend.test_seed_index` 4 tests 通过（回填 / 幂等 / 跳过已索引 / seed 初始无 chunks）；回归 `test_document` 5 tests 通过。embedding 向量集成验证（语义召回）待本机起 Docker+PG（沙箱 `torch_python.dll` 受限）；`_safe_embed` guarded 降级时 chunks 仍写入、关键词 / 标题搜索可用。 |
| 2026-07-16 | Sprint-13 外部只读真实化（REQ-003 权限收口，口径 B） | 通过（单测） | `permission.py` 加 `can_write_document`（external 文档仅 owner 可写，team/private 维持可见即可写）；`document.py` `update_document`/`delete_document`/`restore_version` 加 `_ensure_can_write` 校验（抛 `DocumentAccessError`）；`documents.py` 改/删/恢复端点捕获 → 403/4003。验证：`test_permission` 3 个 `can_write` 用例 + `test_external_write` 5 个 service 级用例（非 owner 改/删/恢复被拒、owner 可改、team 维持现状）通过；回归 44 tests 通过。设计回写：`permissions.md §3/§7` 补写口径（原仅定义读）。 |
| 2026-07-16 | Phase2A·REQ-026 内链/反链后端（Task A） | 通过（后端单测 + TestClient smoke；前端待 Task B） | 迁移 007 建 `lumen_doc_links`（resolved/unresolved/no_access + 防自链 CHECK + 索引）；`service/document.py` `sync_document_wikilinks` 文档保存时解析 `[[target]]` 按标题匹配（resolved/unresolved，自链跳过）；`service/doc_links.py` `list_links` 出链 target 不可见→`no_access` 不泄露标题、反链来源不可见过滤、`upsert_link` 仅 manual（wikilink 拒手动 POST）；API-018 `GET/POST /api/doc-links`。验证：`test_doc_links` 8 tests（解析 / 同步 / no_access / 反链过滤 / manual / wikilink 拒收 / API）+ 全回归 52 tests；TestClient 路由 smoke 5/5。前端 `[[wikilink]]` 渲染 + 反链面板见下行 Task B 验收。 |
| 2026-07-16 | Phase2A·REQ-026 内链/反链前端（Task B） | 通过（build + SSR + 浏览器 UI smoke 4/4） | `api.ts` 加 DocLink client（`listDocLinks`/`createDocLink`）；`MarkdownBlock` 扩展可选 `docLinks`/`onOpenDocument`，正则 `[[target]]`（同后端）注入伪链接 `lumen-wikilink:`，`components.a` 拦截按 status 渲染四态（resolved 可点跳转 / unresolved 虚线占位 / no_access 隐藏锚文本显「无权访问的链接」/ pending 编辑未同步）；自定义 `urlTransform` 放行 wikilink scheme（react-markdown v10 `defaultUrlTransform` 的 `safeProtocol` 会清空自定义 scheme，须放行）；`DocumentsFeature` 加反链面板（来源标题取自 `documents` 按 `source_document_id` 查）；`App.tsx` `loadDocLinks` + 出链/反链 state + effect；`panels.css` 三态 + 反链样式。验证：`npm.cmd run build`（tsc -b + vite，209 modules）；react-dom/server SSR 五态渲染验证；浏览器 UI smoke（`scripts/run-sprint16-demo.ps1` 内存后端，alice space10）4/4 通过：resolved `[[Nova Sprint Notes]]` 可点跳转、unresolved `[[不存在的文档]]` 虚线占位、反链面板显示引用方、编辑未保存 pending 占位。no_access 单用户单空间场景未构造（SSR 已验证隐藏锚文本）。 |
| 2026-07-20 | Phase2A 个人知识组织整体验收 closure | 通过 | 验收范围：REQ-026 内链 / 反链（TC-P2-LINK-001）、REQ-012 标签（TC-P2-TAG-001）、REQ-025 快速录入（TC-P2-QUICK-001）。证据：后端单测 / service 回归 / API smoke / 前端 build / 浏览器 smoke 均已分别记录在上方 Sprint / Task 验收与 §2 矩阵；`docs/08-dev-plan.md` 已补 Phase2A 完成包。结论：Phase2A「互联 / 组织 / 快录」闭环通过；未进入 Phase2B，REQ-014 AI 润色 / 写作引用与团队 MVP 范围仍待确认。 |
| 2026-07-30 | Phase2B·REQ-014 AI 润色 / 写作引用后端（Sprint-19 / task-019 后端 half） | 通过（后端单测 + 回归；**RG-008 升 Go**；前端 UI smoke 待前端 half） | migration 010 `lumen_ai_drafts`（hash + 摘要留存，不存原文 / key）；entity `AiDraft` + `AiDraftORM`；`repository` pg/demo `create_ai_draft`；`service/ai_polish.py` polish / citation（citation 复用 `rag._find_candidate_chunks` 权限收敛，越权 chunk 不进 prompt / 不返回）；API-028 `POST /api/documents/{id}/polish`（4001/4003/4004/4220/**5030**）；LLM 不可用→`LlmUnavailableError`→5030 不落库不编造；citation 无可见来源→「未找到可引用来源」不调 LLM。验证：`tests.backend.test_ai_polish` service **9/9 绿**（DemoRepository + chat_fn 注入：polish 生成 / 越权不进 prompt / hash+摘要留存 / LLM 失败与未配置均不落库 / citation 无来源不调 LLM / 4003/4004/4220）+ 全量后端 `discover` **125 OK(skipped=3)**（该轮 PG up，API 层 6 例 + `PgRepository.create_ai_draft`/`AiDraftORM` PG 落库路径跑过）；`compileall` exit 0。**RG-008→Go、RISK-P2-005 关闭（后端）；TC-P2-AI-001 后端通过**。待办：前端 half（侧边栏 + selection + 浏览器 UI smoke）、commit / PR。 |
| 2026-07-31 | Phase2B·REQ-014 AI 润色前端 UI smoke（task-019 前端 half；live 实跑） | 通过（真 GLM + 真 PG + 交互点击流） | 栈：lumen-pg + 后端 18000（注入 .env GLM）+ 前端 5173（identity + `/api` 代理 ✓）。**后端 live 实跑**（python urllib，UTF-8）：alice 建文档→polish 200（真 GLM 出草稿）→citation 200（sources 仅可见 chunk：Frontend Indexed Note / Semantic Timing Note / Term Source）→应用 PUT 200（版本 v1→v2）→越权 kira→alice 私有 404/4004；RG-008 存储护栏 live 验证（`lumen_ai_drafts`：`input_excerpt_hash`=64 位 sha256、`prompt_summary` 仅摘要无原文/key、`cited_chunk_ids`=可见 chunk）。**交互 UI 点击流**（alice 浏览器实测）：选区→触发 polish→草稿预览出现、citation sources 可见、应用替换选区 + 版本 +1（后端日志 polish×5 / citation×2 / PUT×8 / 版本恢复 全 200）。**TC-P2-AI-001 UI smoke 通过 → REQ-014 vertical slice 闭环。** 面板可见性 UX 缺陷发现并修复，见 §5.1。 |
| 2026-08-01 | Sprint-21 Doc-First UX slice 3a/3c smoke + TC-P1-014 回归 | 通过（用户本地 Chrome/Edge smoke） | 范围：slice 3a 栏显隐 / 默认收起 / Ctrl+B/R + 3a hotfix（左栏收起不再导致主区消失）；slice 3c 首页默认落地、主区少容器视觉收口、documents 空态引导与返回。验证：`volta run --node 22.17.1 npm run build` 已通过；本轮修复本地 demo 启动脚本后确认前端 `http://127.0.0.1:5173` 与后端 `http://127.0.0.1:18000/docs` HTTP 200；用户确认 Chrome/Edge 本地 smoke + TC-P1-014 回归通过，覆盖 documents 减框、空态「展开左目录 / 新建文档」、文档页 / 新建态「返回」、900px 不破版、文档 / 搜索 / 问答 / 术语主流程。残留：slice 3d 导入弹窗化未编码，需后续补 TC-P1-015 + TC-P1-014 回归；demo 脚本 `Path`/`PATH` 根因已起模板回流提案。 |

### 5.1 缺陷与回归记录

| 缺陷 | 来源 | 修复 | 回归范围 | 结果 |
|---|---|---|---|---|
| 新建 / 编辑文档无法被搜索或问答命中 | Sprint-4 实现期发现 | `c5c177e fix: index edited documents for search and rag` | 搜索 + RAG 索引（新建 / 编辑文档入库后被检索召回） | 回归通过；53 后端 tests 含相关用例 |
| AI 润色侧边栏生成草稿后「生成 / 应用」按钮被折叠遮挡；≤1199px 小屏 `.inspector-pane` `max-height:190px` 容不下整个面板 | task-019 前端 UI smoke（2026-07-31）发现 | `fix/ai-polish-panel-visibility`：`AiPolishFeature` 草稿生成后 `useEffect`+`scrollIntoView` 把「应用 / 丢弃」滚进视野；`responsive.css` `.inspector-pane` max-height 190→360px | 前端 `npm run build` 绿（Node 22）+ 用户 live 复测通过 | 已修复（本次 PR） |
| 本地 demo 脚本在 Windows PowerShell 下无法后台启动：`Start-Process` 因 `Path` / `PATH` 重复报错；普通 `-Detached` 子进程可能被 AI 执行器回收 | Sprint-21 smoke 启动 demo 时发现（2026-08-01） | `scripts/run-sprint16-demo.ps1` 增加 `Normalize-ProcessPathEnvironment`，服务启动 `Start-Process` 增加 `-WindowStyle Hidden`；实际后台启动通过 WMI / 人工终端方式保持进程 | 本地 demo 启动与 smoke 支撑；不影响业务功能 / API / DB | 前端 / 后端 HTTP 200，用户完成本地 smoke；去项目化模板问题已转 `_proposals/TEMPLATE-UPGRADE-powershell-start-process-path-normalization.md` |

## 6. 风险与未验证项

| Risk-ID | RG / Gate | 风险 / 未验证项 | 影响范围 | 当前处理 | 关闭依据 |
|---|---|---|---|---|---|
| RISK-P1-001 | RG-001 | ~~PostgreSQL+pgvector 未接入~~ | ~~REQ-007/008 真实化~~ | ✅ **已解决**（Sprint-8 / task-008 T1–T6：lumen-pg + PgRepository + RAG 向量召回；RG-001→Go，见 `05 §5.1`） | Sprint-8 验收记录、TC-P1-007/008 |
| RISK-P1-002 | RG-002 | ~~真实 Embedding（bge-small-zh）未接入后端~~ | ~~REQ-007/008 向量检索~~ | ✅ **已解决**（T6 写 `lumen_chunks.embedding` 512 维；RG-002→已启用；约束 `HF_HUB_DISABLE_XET=1`） | embedding tests、TC-P1-007/008 |
| RISK-P1-003 | TE-C-003 / RG-001 | ~~Docker Desktop Linux engine 阻塞~~ | ~~起库 / 真实 PostgreSQL~~ | ✅ **已解决**（daemon live，TE-C-003 闭合；`docker/compose.yml` 起 lumen-pg healthy） | Sprint-8 T1 验证 |
| RISK-P1-004 | RG-001 / RG-002 | ~~search 仍关键词检索（未向量化）~~ | ~~REQ-007 语义搜索~~ | ✅ **已解决**（task-009：substring + `ts_vector` SQL 候选 + pgvector 语义召回；zhparser 可选，当前镜像无扩展时回退 `simple`） | task-009 tests |
| RISK-P2-001 | RG-006 候选 | 真实 PDF / Word 解析 | REQ-009 相关交付 | 仅 `.md`/`.txt` 已提取文本；python-docx/pdfplumber 未接入；后续真实化前需 tech-env-eval | 待后续 tech-env-eval 与 TC |
| RISK-P2-002 | RG-003 | OCR 质量与资源占用 | REQ-010、内容导入 | OCR 未实现，REQ-010 移至后续阶段（RG-003 No-Go）；当前降级为已提取文本 | 待 OCR 引擎定版与资源验证 |
| RISK-P1-005 | RG-004 | LLM 外部调用可用性 | REQ-008、REQ-036 | GLM `glm-5.2` 真实问答已验证（Sprint-7 首验 + 2026-07-11 新中转 `192.168.15.190:7777/v1` 复测，RG-004→Go；旧 `47.107.134.2` key 已停用）；GPT/ollama 待验证 | GLM 复测记录；GPT/ollama 非 P1 必过 |
| RISK-VISION-001 | 后续 AI Gate | P2 / 愿景高风险 AI 能力 | REQ-020 / 021 / 030 / 032 / 033 等 | 不进入 Phase1 必过项，技术验证通过后再补用例 | 待愿景技术验证 |
| RISK-P2-003 | WSG-001..006 / P2-UI-G-001..006 | P2 UI 少容器清爽稿通用 gate 未形成独立全量 smoke | Sprint-11、TC-P2-WSG-001、TC-P2-UI-001~005、Phase2B | Phase2A 三个 vertical slice 已分别完成浏览器 smoke / build；Sprint-11 仍作为后续 Phase2B UI gate 草案保留，不阻塞 Phase2A closure | Phase2B 启动前重新确认 UI gate 与 smoke 范围 |
| RISK-P2-004 | OI-005 / TC-P2-TAG-001..QUICK-001 | ~~Phase2A 核心 DB / API / TC 契约未实现~~ | ~~REQ-012 / 025 / 026~~ | ✅ **已解决**（REQ-026 / REQ-012 / REQ-025 已完成后端 + 前端 vertical slice；TC-P2-LINK-001 / TAG-001 / QUICK-001 通过） | 2026-07-20 Phase2A closure；§2 矩阵与 §5 验收记录 |
| RISK-P2-005 | RG-004 / 数据外发 / **RG-008** | AI 润色 / 写作引用可能发送真实文档片段到外部 LLM | REQ-014 | **数据外发风险已人工接受（2026-07-30，真实外发 + 权限护栏，见 RG-008 / `ai/project-rules.md §2.5`）**：sources 权限过滤、草稿只存 hash + 摘要、不做自动过滤、5030 降级 | ✅ 已解决 / 关闭（后端 vertical slice，2026-07-30）：权限过滤（越权 chunk 不进 prompt / 不返回）、5030 不落库不编造、hash 留存均经 `tests.backend.test_ai_polish` 验证；RG-008→Go。前端 UI smoke 待前端 half |
| RISK-P1-006 | RG-006 | PDF 导出库未验证 | REQ-027 | tech-env 草案标记 `reportlab` / `weasyprint` 未安装；API / DB 仅为契约草案，不得编码导出能力 | 待 PDF 库选型、安装、中文样例和资源验证 |
| RISK-P1-007 | TC-P1-015 | ~~Sprint-16 Chrome 拖拽 / 文件夹 smoke 未补~~ | ~~REQ-037 前端人工验收~~ | ✅ **已解决**（Chrome headless drop-zone smoke 已覆盖批量 drop、路径标题、搜索与问答来源） | Sprint-16 smoke 记录（2026-07-15） |

## 7. 待人工确认项

- Phase2A 已完成整体验收 closure；不得再把 REQ-026 / REQ-012 / REQ-025 标为待确认或未实现。
- **Phase2B 范围、进入 / 退出标准、数据外发风险接受方式（RG-008）与验证包均已确认 / 就绪（2026-07-30）**；REQ-014 AI 润色后端已实现并通过（Sprint-19 / task-019，2026-07-30），**RG-008 已升 Go**。**待办**：前端 half（侧边栏 + selection + 浏览器 UI smoke）、Sprint-11 UI/WSG 门禁重跑、切阶段指针推进——需再次人工确认。
- Phase1.5B 的 TC-P1-017 受 RG-006 控制；PDF / Word-PDF / zhparser 不阻塞 Phase2A closure。
