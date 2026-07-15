# 验证计划（Verification Plan）

> 测试策略与 REQ → 用例追溯。按阶段增量：本期覆盖 `[P1]` 全部 REQ；升阶段在原位追加（global-rules §8）。
> 与 `08-dev-plan`（"何时做"）正交：本文回答"怎么算对"。
>
> 定位：本项目「验证」支柱，对应 global-rules §5 编号档 `09-verification`（由语义命名 `verification-plan.md` 升格而来）。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | Phase1 / Phase1.5A 候选 |
| 交付物形态 | Demo / 个人可用 Alpha |
| 覆盖 REQ | Phase1：REQ-001..REQ-011、REQ-036；Phase1.5A：REQ-037/038；Phase1.5B：REQ-027；Phase2A/B 与愿景验证项待升阶段细化 |
| 当前状态 | Phase1 全量验收已记录，结论为 Conditional Go（Demo closure）；Sprint-7/8 已完成真实 LLM、PostgreSQL+pgvector、Embedding 与 RAG 向量召回验证；task-009 已完成 search hybrid 验证；P1A / P1B 前端体验收口均已实现。2026-07-15 00-03 路线图重排后，TC-P1-015/016 为个人可用 Alpha 草案，TC-P1-017 为个人增强 Beta 草案；P2 UI / WSG 门禁草案未执行、不代表可编码 |
| 最后更新 | 2026-07-15（00-03 路线图重排：P1.5A 个人可用 Alpha 优先；TC-P1-015/016/017 阶段语义对齐） |

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
| TC-P1-014 | REQ-011 P1B 工作台重设计 | TopBar + Nav Rail + Context Pane + Workspace 三层布局；Context Pane 随视图变化；900px 桌面宽度不横向破版；信息密度达标；P0/P1A 能力不回退 | [P1] | 通过（构建 + Chrome / Edge 900px smoke） |
| TC-P1-015 | REQ-037 批量导入 | 拖入文件夹 / 多文件后全部 `.md`/`.txt` 入库可搜可问答；标题保留路径前缀；同名跳过 | [P1] | P1.5A 草案·待编码（Sprint-16） |
| TC-P1-016 | REQ-038 导出备份 | 文档详情下载 `.md`；空间导出 ZIP 含可见文档、权限过滤 | [P1] | P1.5A 草案·待编码（Sprint-17） |
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
| TC-P1-014 | REQ-011 | P1B 工作台重设计实现 + Chrome / Edge 桌面 | ① 登录后检查 TopBar + Nav Rail + Context Pane + Workspace 三层布局；② 切换文档 / 搜索 / 问答 / 术语并确认 Context Pane 随视图变化；③ 在 900px 宽度完成文档、搜索、问答、术语主流程；④ 检查搜索首屏 ≥5 条结果、术语首屏 ≥8 条、编辑区 ≥12 行；⑤ 回归 Markdown 渲染、来源点击、删除 / 恢复二次确认 | 工作台布局与 `frontend-workspace-redesign` 原型一致；任务聚焦，不显示无关大卡片；900px 无全局横向滚动；P0/P1A 能力不回退 | `npm.cmd run build` 通过；Chrome / Edge headless smoke（900px）通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认 | 通过 |
| TC-P1-015 | REQ-037 | 多个 `.md` / `.txt` 文件或文件夹 | 拖入文件夹 / 多文件后批量导入 | 全部入库可搜可问答；标题保留路径前缀；同名跳过 | 待 Sprint-16 后端 tests + Chrome smoke | 草案·待编码 |
| TC-P1-016 | REQ-038 | 当前空间存在多篇可见 / 不可见文档 | 文档详情下载 `.md`；空间导出 ZIP | 单文档 `.md` 内容正确；ZIP 只含可见文档 | 待 Sprint-17 后端 tests + Chrome smoke | 草案·待编码 |
| TC-P1-017 | REQ-027 | RG-006 已 Go / Conditional Go；当前用户可读文档 | 对可读文档指定版本发起 PDF 导出；验证中文、失败态、权限态和产物访问 | 导出任务与版本绑定；中文正常；产物继承源文档权限；导出库不可用返回 5030；未验证前不得进入实现 | 待 tech-env 依赖验证 + 后端 tests + 人工 PDF 样例 | 草案·待 RG-006 |

> TC-P1-010 暂为「后续阶段」，待 OCR 落地后补步骤与证据；TC-P1-013 已随 PR #76 合并后完成前端构建与 Chrome / Edge 900px smoke；TC-P1-014 已随 Sprint-10（P1B）完成前端构建与 Chrome / Edge 900px smoke；TC-P1-015~017 为 P1.5 候选草案，待 Sprint-16~18 编码后补证据；其余 TC 自动化均含于后端测试与既有 smoke 证据（见 §5）。

### Phase2（功能范围 `[P2]` · 交付物形态 **MVP**，升阶段时追加）

> 当前仅回填 P2 UI 实现前门禁草案；Phase2 范围、进入 / 退出标准和实现任务仍需人工确认。

| TC ID | 覆盖对象 | 前置条件 | 验证步骤 | 预期结果 | 证据要求 | 状态 |
|---|---|---|---|---|---|---|
| TC-P2-WSG-001 | WSG-001..006；P2-UI-G-001..006；首个 P2 Web vertical slice | `04` WSG 矩阵、`05 §4.1`、`08` Sprint-11 草案、`frontend-interaction §9.3` 均已回填；用户确认执行门禁评审 | 逐项检查 App Shell、目录边界、vertical slice、文件膨胀阈值、验证入口、UI 链路是否有文档锚点；确认首个 P2 vertical slice 是否已选定 | WSG-001..006 均有明确证据位置；首个 slice 静态评审建议为 `REQ-012 + REQ-026`；不得跳过 WSG 直接改 `frontend/` | `04/05/08/09/frontend-interaction` 锚点 + 2026-07-14 静态评审记录 | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-001 | PG-P2-001/002/003、P2-UI-G-001/006；REQ-012/025/026 页面入口候选 | 少容器清爽稿暂定按当前稿继续；首个 slice 聚焦 REQ-012/026 | 静态检查 `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html` 首页、经典目录、文档工作区的信息层级、首屏入口和视觉密度 | 首屏 2-3 个主信息区；少圆角、少边框、少胶囊、少阴影；层级主要靠留白、细分隔线、文字标签和左侧选中线表达；无卡片墙回退 | 原型路径 + 后续截图 / smoke 记录 | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-002 | PG-P2-008、CMP-P2-BREADCRUMB、CMP-P2-LAYER-SEARCH；REQ-012/026 候选 | 使用当前空间 mock 数据；首个 slice 聚焦标签与内链 / 反链 | 静态检查面包屑、当前层级搜索、经典目录 / 列表过滤路径 | 路径定位清楚；搜索只过滤当前空间 / 当前层级可见内容；无结果不泄露跨空间或无权限内容 | 原型路径 + 后续 UI smoke | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-003 | PG-P2-003、CMP-P2-DOC-MODE；REQ-014/026 候选 | 打开示例文档；首个 slice 只用 REQ-026 相关文档工作区能力 | 静态检查预览、编辑、编辑+预览并排、版本 / 来源入口和可调宽说明 | 阅读与预览合并；编辑不破坏阅读；并排预览可用；主要区域可调宽；来源 / 版本可追溯 | 原型路径 + 后续 Chrome / Edge smoke | 静态评审条件通过·待实现 smoke |
| TC-P2-UI-004 | PG-P2-004/005、CMP-P2-QA-SOURCE；REQ-014 候选 | 当前空间已有搜索与问答 mock；完整 AI 润色暂避 | 静态检查搜索 / 问答入口、推荐问题、来源文档 / 术语入口 | 搜索结果高密度但可读；答案限定当前空间并带来源列表行；来源可回看；库外问题与 AI 降级不编造 | 原型路径 + 后续 UI smoke | 静态评审条件通过·非首个 slice |
| TC-P2-UI-005 | PG-P2-007、P2-UI-G-003/004；REQ-013 候选 | 使用小 / 中 / 大集合 mock；关系图不进首个 slice | 静态检查局部关系图候选与大集合降级、无权限、空结果、AI 降级、>80 文档先筛选文案 | 局部关系图仍为候选 / 静态说明，不进入默认实现；大集合先筛选或聚合；不新增真实图谱算法、冲突检测或权限模型 | 原型说明 + 后续设计评审记录 | 静态评审条件通过·后续候选 |
| TC-P2-TAG-001 | REQ-012；`lumen_tags` / `lumen_tag_links`；API-014 / API-027 | Batch B 契约已回填；Phase2 范围和首个 slice 待确认 | 创建 / 更新 / 归档标签；给可见文档打标签；按标签筛选文档；跨空间 / 无权限文档不进入统计 | 标签只在当前空间可见；重名返回 4090；文档数量只统计当前用户可见内容；归档不破坏历史关联 | 后续后端 tests + 前端 smoke；DB / API 契约锚点 | 契约草案·未执行 |
| TC-P2-LINK-001 | REQ-026；`lumen_doc_links`；API-018 | Batch B 契约已回填；首个 vertical slice 建议优先选择 | 在文档内容中登记 `[[wikilink]]`；查询出链 / 反链；target 缺失、无权限、跨空间分别验证 | resolved / unresolved / no_access 状态正确；无权限目标不泄露标题 / 摘要；反链仅返回当前用户可见文档 | 后续后端 tests + UI smoke；DB / API 契约锚点 | 契约草案·未执行 |
| TC-P2-QUICK-001 | REQ-025；`lumen_quick_entries`；API-017 | Batch B 契约已回填 | 快速录入 draft；转为新文档；追加到已有文档；关联 tag_ids；丢弃 draft | draft 默认 owner 私有；转换后继承文档权限；非法 tag_ids / document_id 返回 4220；不绕过权限 | 后续后端 tests + UI smoke | 契约草案·未执行 |
| TC-P2-AI-001 | REQ-014；`lumen_ai_drafts`；API-028；RG-004 | LLM adapter 可用或 Mock 降级；真实文档外发边界需确认 | 对可写文档选中文本执行 polish / citation；验证 sources 仅来自可见 chunks；LLM 不可用时降级 | 输出保存为 draft；引用可追溯到 chunk / document；库外或无权限来源不进入 prompt；5030 / Mock 降级不编造 | 后续后端 tests + 人工审查 prompt 边界 + UI smoke | 契约草案·未执行 |
- REQ-027 PDF 导出已提前到 Phase1.5B，验证口径见 TC-P1-017；REQ-013 / 015 / 016 / 017 / 024 其余 P2 后续用例（时间轴 / 推送 / 协作 / 移动端 / 时间轴热条）——不进 Phase2A 个人知识组织，待 Phase2B / 后续阶段细化。

### 远期愿景（不承诺）
- REQ-018..023、REQ-028..035 用例——待 05 技术验证可行后补

## 3. 分阶段验证范围

- **Phase1（Demo）**：覆盖 REQ-001..011、REQ-036（上表）——可演示 + 守产品红线；REQ-009/010 按 `.md` / `.txt` 已提取文本降级验收，真实 Word / PDF 解析与 OCR 不作为 Phase1 Demo 必过。P1A 的 TC-P1-013 是既有 REQ-011 的前端结构体验收口，不新增业务范围
- **Phase1.5A（个人可用 Alpha）**：覆盖 REQ-037 / REQ-038，对应 TC-P1-015 / 016；目标是批量入库 + 导出备份，优先于 PDF 和 Phase2 编码。
- **Phase1.5B（个人增强 Beta）**：覆盖 REQ-027，对应 TC-P1-017；受 RG-006 约束，未验证前不得实现。
- **Phase2A / Phase2B**：P2 UI 实现前门禁 TC-P2-UI-001~005 已原位追加为草案；REQ-026 / 012 / 025 属 Phase2A 个人知识组织优先候选，REQ-014 / 013 / 024 属 Phase2B 团队 MVP 候选，其余 P2 用例待阶段确认后继续细化。
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

### 5.1 缺陷与回归记录

| 缺陷 | 来源 | 修复 | 回归范围 | 结果 |
|---|---|---|---|---|
| 新建 / 编辑文档无法被搜索或问答命中 | Sprint-4 实现期发现 | `c5c177e fix: index edited documents for search and rag` | 搜索 + RAG 索引（新建 / 编辑文档入库后被检索召回） | 回归通过；53 后端 tests 含相关用例 |

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
| RISK-P2-003 | WSG-001..006 / P2-UI-G-001..006 | P2 UI 少容器清爽稿尚未实现 / smoke | Sprint-11、TC-P2-WSG-001、TC-P2-UI-001~005 | 当前仅 HTML 原型与验证草案，需人工确认 Phase2 范围并开实现任务后，再执行 Chrome / Edge smoke；未执行前不得标记通过 | 待用户确认 + 后续 smoke 证据 |
| RISK-P2-004 | OI-005 / TC-P2-TAG-001..AI-001 | P2 核心 4 项 DB / API / TC 契约未实现 | REQ-012 / 014 / 025 / 026 | Batch B 已补契约草案；尚未创建迁移、接口、前端或自动化测试；未执行前不得标记 Phase2 Go | 待首个 vertical slice 确认 + 实现任务 + 对应 TC 通过 |
| RISK-P2-005 | RG-004 / 数据外发 | AI 润色 / 写作引用可能发送真实文档片段到外部 LLM | REQ-014 | 复用 LLM adapter；真实文档外发需风险接受，sources 必须权限过滤；可用 Mock 降级 | 待 prompt / source 过滤测试与人工审查 |
| RISK-P1-006 | RG-006 | PDF 导出库未验证 | REQ-027 | tech-env 草案标记 `reportlab` / `weasyprint` 未安装；API / DB 仅为契约草案，不得编码导出能力 | 待 PDF 库选型、安装、中文样例和资源验证 |

## 7. 待人工确认项

- Phase1 全量验收已记录；下一步建议确认并执行 Phase1.5A（TC-P1-015/016），使个人可批量入库并导出备份。
- Phase1.5B 的 TC-P1-017 受 RG-006 控制；PDF 不得阻塞 Phase1.5A。
- Phase2A / Phase2B 仍需人工确认；首个 Phase2A vertical slice 建议优先 `REQ-026 内链 / 反链`，其次 `REQ-012 标签`，再考虑 `REQ-025 快速录入`；未确认前不得一次性实现全部 P2 UI。
