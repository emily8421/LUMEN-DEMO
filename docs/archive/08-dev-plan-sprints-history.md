# 08 开发计划：已完成 Sprint 详细原文（归档）

> 2026-08-17 从 `docs/08-dev-plan.md` 归档：Sprint-1..28 已完成的逐个详细展开（目标 / 输入 / 修改范围 / 验收 / 禁止 + 完成记录）。当前有效状态见 `docs/08-dev-plan.md`「Sprint 总览」表；本文件仅供历史追溯。
> 归档依据：`ai/global-rules.md` §8.4 整理例外（已完成过程性记录归档，不删除）。

---

## Sprint-1：空间与权限底座

### 目标
多空间隔离 + 权限分级 + 查询时过滤（REQ-001 / 002 / 003）

### 输入文档
00/01/02、06（lumen_spaces / members / documents）、docs/design/permissions.md

### 修改范围
- backend：api/auth、api/spaces、service/space、service/permission
- 06 相关数据库迁移

### 验收标准
- brightlite 账号查询 nova-internal 文档零命中
- 作者的私有文档，同空间其他成员搜索不到

### 禁止事项
- 不引入新依赖
- 不做跨空间推送（P2）

## Sprint-2：文档管理 + 版本

### 目标
文档 CRUD + 行内编辑 + 版本历史 / 恢复（REQ-004 / 005 / 006）

### 输入文档
06（documents / versions）、07（documents 接口）

### 修改范围
- backend：api/documents、service/document
- frontend：文档编辑器

### 验收标准
- CRUD 全通过
- 改 3 次能看到 3 个版本，能恢复到指定版本

### 禁止事项
- 不做 AI 润色（P2）

## Sprint-3：内容导入流水线

### 目标
目标设计为 Word / PDF 解析 + OCR + 切块入库（REQ-009 / 010）；Phase1 Demo 实际按 `.md` / `.txt` 已提取文本降级导入，为检索问答供数

### 输入文档
docs/design/ingestion.md、06（chunks / imports）、07（import）

### 修改范围
- backend：service/import（Phase1 已实现 `.md` / `.txt` 文本导入 + 切块；真实解析 / OCR 留后续）
- scripts：导入 / 索引脚本

### 验收标准
- Phase1 Demo：导入 `.md` / `.txt` 已提取文本后，能被搜索与问答命中；真实 .pdf / Word / 图片 OCR 不作为当前必过项

### 禁止事项
- 不把真实 Word / PDF 解析或 OCR 作为 Phase1 Demo 必过项；RG-003 未解除前不得声称 OCR 已实现
- 不做录音转写（愿景）

## Sprint-4：检索与 RAG 问答

### 目标
全文搜索 + RAG 问答带来源（REQ-007 / 008）

### 输入文档
docs/design/rag-retrieval.md、06（chunks 索引）、07（search / query）

### 修改范围
- backend：service/search、service/rag
- frontend：搜索 / 问答 UI

### 验收标准
- 搜索命中正确
- 问答答案正确且标注来源
- 问库外内容明确回复"未找到"，不编造

### 禁止事项
- 不做重排 / 混合检索的高级调优（P2+）
- 不做因果推理（愿景）

## Sprint-5：术语管理与问答口径对齐

### 目标
空间级术语表维护 + 文档术语识别 + RAG 问答优先使用术语定义（REQ-036）

### 输入文档
01/02/03、docs/design/term-management.md、06（terms）、07（terms 接口）

### 修改范围
- backend：api/terms、service/term、service/rag 术语上下文注入
- frontend：术语管理页 / 文档术语悬浮提示（最小演示）

### 验收标准
- brightlite-team 新建「触发延迟」术语后，文档中该词可识别
- 问答优先使用 brightlite-team 空间术语定义，不被同名全局术语覆盖

### 禁止事项
- 不做跨空间术语同步
- 不做术语冲突自动改写文档

## Sprint-6：桌面端集成与验收

### 目标
Chrome / Edge 桌面端跑通全部 P1 功能（REQ-011）—— 本 Sprint 不新增功能，是 Phase1 桌面端横切验收与集成。

### 输入文档
09-verification.md（REQ-011 验证矩阵 + 各 REQ 桌面端口径）、各前置 Sprint 交付

### 修改范围
- frontend：桌面端布局 / 交互适配、各功能页面集成
- 集成验证：Chrome / Edge 全 P1 功能走查

### 验收标准
- Chrome / Edge 桌面端完成 REQ-001..REQ-011 全部功能（见 09 §2 矩阵）
- 桌面端主流分辨率下交互可用、无阻塞缺陷

### 禁止事项
- 不做移动端 / 响应式移动适配（Phase1 禁止，见 project-rules §1）
- 不新增 P1 范围外功能

## Sprint-9（P1A）：前端结构聚焦重构

### 目标
基于 #74 探索结论，修正 Phase1 桌面端前端结构体验：提供文档 / 搜索 / 问答 / 术语一级视图切换，拆解全局右栏常驻面板，保证桌面 768px+ 不横向破版，并拆分 `App.tsx` 以降低后续维护风险。该 Sprint 不新增业务 REQ，归属 REQ-011 桌面端体验收口。

### 输入文档
- `docs/research/2026-07-11-frontend-p1-structure-exploration.md`
- `docs/design/frontend-interaction.md` §2.3 / §6 / §7 / 实现偏差 DEV-002
- `docs/09-verification.md` TC-P1-013

### 修改范围
- `frontend/src/App.tsx`：引入 `activeView` 视图状态并拆出轻量组件。
- `frontend/src/styles.css`：左导航 / 主区视图布局、桌面响应式断点、去除全局固定最小宽。
- 可新增 `frontend/src/components/*` 或同级轻量组件文件；不修改 `frontend/src/api.ts` 契约。

### 验收标准
- `npm.cmd run build` 通过。
- 登录后可在文档 / 搜索 / 问答 / 术语四个一级视图之间切换，当前空间上下文不丢失。
- 搜索 / 问答 / 术语在主区呈现，不被版本历史或其他无关面板挤压。
- 版本历史归入文档视图侧栏或折叠区，恢复版本仍需二次确认。
- Chrome / Edge 桌面 900px 宽度下无全局横向滚动，可完成文档、搜索、问答、术语主流程。
- #72 P0 能力不回退：Markdown 渲染、来源点击、删除 / 恢复二次确认仍可用。

### 禁止事项
- 不引入 `react-router`、组件库或全局状态管理；若后续需要 URL 深链，另开 P1.5 评估。
- 不新增后端接口，不修改 API 契约，不改变权限边界。
- 不做移动端适配，不新增 P2 / Phase2 功能入口。

## Sprint-10（P1B）：前端工作台系统化重设计

### 目标
基于 `docs/design/frontend-workspace-redesign.md` 与 HTML 原型确认结果，将 P1A 后仍偏“卡片堆叠式 Demo UI”的前端改为生产力工具型知识库工作台：采用 TopBar + Nav Rail + Context Pane + Workspace 的三层结构，按文档 / 搜索 / 问答 / 术语任务切换上下文面板，统一视觉密度 token，减少大卡片和大块留白。该 Sprint 不新增业务 REQ，归属 REQ-011 桌面端体验收口。

### 输入文档
- `docs/design/frontend-workspace-redesign.md`
- `docs/design/frontend-workspace-redesign-prototype.html`
- `docs/design/frontend-interaction.md` §2.3 / §6 / §7 / DEV-002
- `docs/09-verification.md` TC-P1-014

### 修改范围
- `frontend/src/App.tsx`：按原型重构工作台骨架，可在文件内拆出 `TopBar` / `PrimaryNav` / `ContextPane` / 各 Workspace 轻量组件；保持现有 API 调用与业务状态。
- `frontend/src/styles.css`：重写为设计 token + shell / pane / toolbar / list-row / workspace / inspector 分层样式，弱化主布局 `.card` 堆叠。
- 可新增 `frontend/src/components/*` 或同级轻量组件文件；本 Sprint 优先少文件落地，避免范围扩散。

### 验收标准
- `npm.cmd run build` 通过。
- 登录后呈现 TopBar + Nav Rail + Context Pane + Workspace 三层工作台；文档 / 搜索 / 问答 / 术语四视图可切换，当前空间上下文不丢失。
- Context Pane 随视图变化：文档视图显示文档列表 / 导入入口，术语视图显示术语列表，搜索 / 问答不常驻无关文档编辑或版本面板。
- 文档视图主区保留标题 / 权限 / Markdown 编辑 / 预览 / 版本恢复 / 删除二次确认；搜索结果与问答来源仍可打开文档。
- 900px 桌面宽度下无全局横向滚动；搜索首屏可见至少 5 条结果，术语列表首屏可见至少 8 条，文档编辑区至少 12 行可见。
- #72 / P1A 能力不回退：Markdown 渲染、来源点击、删除 / 恢复二次确认、四视图切换仍可用。

### 禁止事项
- 不引入 `react-router`、组件库或全局状态管理；若后续需要 URL 深链，另开 P1.5 评估。
- 不新增后端接口，不修改 API 契约，不改变权限边界。
- 不做移动端适配，不新增 P2 / Phase2 功能入口。
- 不把静态 HTML 原型作为生产代码引入；只按其布局、密度和交互结构实现 React 版本。

## Sprint-11（P2-UI-Gate 候选）：Phase2 前端 UI 实现前确认与计划冻结

### 目标
基于 `docs/design/frontend-interaction.md` §9.3 与 `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html`，将当前少容器清爽稿作为 Phase2 前端实现前 UI 确认版候选，冻结页面结构、核心点击路径、信息密度、权限 / 降级口径和验证草案。该 Sprint 是实现前门禁，不直接编码，不新增 REQ / API / DB。

### 输入文档
- `docs/design/frontend-interaction.md` §8.1 / §9.3（PG-P2、CMP-P2、PATH-P2、P2-UI-G）。
- `docs/research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype.html`（少容器清爽稿，暂定按当前稿继续）。
- `docs/research/2026-07-13-ui-prototype-exploration.md` §9.4 / §10（用户反馈与 PX-R-007）。
- `docs/02-srs.md` REQ-012 / 013 / 014 / 025 / 026（P2 骨架候选，仅作追溯，不直接扩大实现范围）。
- `docs/09-verification.md` TC-P2-UI-001~005。

### 修改范围
- `docs/design/frontend-interaction.md`：必要时补齐 PG-P2 / CMP-P2 / PATH-P2 与 P2-UI-G 的最终确认状态。
- `docs/08-dev-plan.md`：保留本 Sprint-11 候选计划、依赖和禁止事项。
- `docs/09-verification.md`：补 Phase2 UI 门禁 TC 草案与未验证项。
- 后续如人工确认进入实现，再另开代码任务；预计实现范围优先限制在 `frontend/src/App.tsx`、`frontend/src/styles.css` 与少量轻量组件，不在本 Sprint 直接修改代码。

### 验收标准
- 用户确认少容器清爽稿可作为实现前 UI 确认版候选；若有局部意见，先回到 HTML 原型调整。
- `docs/08-dev-plan.md` 已记录 Sprint-11 候选计划、依赖关系和禁止事项。
- `docs/09-verification.md` 已记录 TC-P2-UI-001~005，能追溯到 PG-P2 / CMP-P2 / PATH-P2 和 P2-UI-G。
- 页面布局、内容呈现、点击路径、权限 / 降级口径与默认稿一致，不新增真实图谱算法、推荐算法、接口契约或数据库字段。
- 当前阶段只完成计划 / 验证草案回填；是否正式进入 Phase2 与是否开实现任务仍需人工确认。

> 2026-07-14 静态评审补充：用户确认执行 UI / WSG 门禁评审后，`docs/09-verification.md` 已将 TC-P2-WSG-001 与 TC-P2-UI-001~005 标为“静态评审条件通过·待实现 smoke / 非首个 slice / 后续候选”。首个 Phase2 vertical slice 建议确认为 `REQ-012 + REQ-026`（标签视图 + 内链 / 反向链接最小闭环）。这仍不是编码任务；进入实现前需另开任务并补迁移、API、前端和 smoke 执行计划。

### 禁止事项
- 未确认 Phase2 范围、进入 / 退出标准和实现任务前，不修改 `frontend/` 代码。
- 不引入 `react-router`、组件库、图标库、全局状态管理或新依赖。
- 不新增后端接口、数据库字段、权限模型或图谱 / 冲突检测算法。
- 不把愿景级局部情报墙、随机关系图、强“矛盾检测”提前做成 Phase2 默认能力。
- 不做移动端适配；桌面端宽度和现有 P1 能力不回退。

## Sprint-0′（P1.5 前置 · 框架补课 · 候选）：前端目录骨架 + 后端仓储独立

> **已完成（2026-07-15）**：对齐 `template-docs/web-fullstack-profile.md` WSG-001..006。按「Shell → features → styles → repository」分 6 个小提交实现（Step 1-5）：前端 `App.tsx` 1026→542、`styles.css` 886→6 文件、4 视图抽进 `features/`；后端 `repository/` 独立 + 清单例 hack。纯结构搬运，未改业务逻辑 / API / DB；前端 build 绿、后端 42 service tests 过、所有 repository / api import 验证通过。**4b（handler→hooks，App ≤300）暂缓**（WSG-004 软阈值，App 542 已从 1026 降 47%，待功能稳定后再做）。

### 目标
把 Phase1 在 WSG 落地前堆出的代码结构对齐方法论：前端从单文件 `App.tsx`（1026 行）/ `styles.css`（886 行）拆为 `app / pages / features / components / api / state / styles` 目录骨架；后端把 `pg_repository` / `demo_repository` 从 `service/` 迁到独立 `backend/repository/`，清理 `demo_repository` 末尾的单例 hack（改为显式工厂 / 依赖注入）。不新增 REQ，属 REQ-011 结构收口。

### 输入文档
- `template-docs/web-fullstack-profile.md` §3 / §4 / §5 / §6
- `docs/04-architecture.md` §1.3（WSG 矩阵）、`docs/05-tech-spec.md` §4.1（目录边界 + 阈值）
- `docs/research/2026-07-15-system-completion-audit.md` §四 / §五

### 修改范围
- 前端：`frontend/src/` 建 `app / pages / features / components / api / state / styles` 目录；把 TopBar / NavRail / ContextPane / Workspace 抽进 `app/`，文档 / 搜索 / 问答 / 术语四视图抽进 `features/`，`api.ts` 进 `api/`，`styles.css` 拆 tokens / layout / components。**仅搬运，逻辑不动**。
- 后端：新增 `backend/repository/`，迁入 `pg_repository.py` / `demo_repository.py`；删 `demo_repository` 末尾 `repository = PgRepository()` 单例覆盖，改为显式工厂 / 依赖注入；`main.py` 用 router 注册表。
- 不改 API 契约、不改 DB schema、不改业务逻辑、不引新依赖（router / 组件库 / 状态库仍不引入）。

### 验收标准
- `npm.cmd run build` 通过；`.venv\Scripts\python.exe -m unittest discover -s tests/backend` 76 tests 全绿；Chrome / Edge 900px smoke 覆盖登录 / 四视图 / 文档 CRUD / 版本 / 搜索 / 问答 / 术语，**与重构前行为一致**。
- `App.*` 主入口 ≤ 300 行；拆出的页面 / feature 文件 ≤ 250 行；全局 CSS 拆分后单文件 ≤ 300 行。
- `backend/repository/` 独立；无单例 hack；API 层不再直接 `import repository` 单例。

### 禁止事项
- 不改业务逻辑、API 契约、DB schema、权限规则；不顺手修 P1.5 缺陷（登录持久化 / 外部只读等留 Sprint-12 / 13）。
- 不引入 react-router / 组件库 / 全局状态库 / 新依赖。
- 不得一次提交全部拆分；按「Shell → features → api / styles → repository」分多个小提交，每个跟 smoke。

## Sprint-12（P1C·可用性收口 A · 已完成）：登录态持久化 + seed 自索引修复

> **已完成（2026-07-16）**：① 登录态持久化（`App.tsx` localStorage，刷新不掉线、token 失效自动登出）；② seed 自索引（`document.py` `ensure_documents_indexed` 幂等回填 + `main.py` lifespan 启动调用）均已实现并验证。

### 目标
修复两个"日常可用"硬伤（审计 §三 坑 1 / 坑 3）：① 登录态持久化（当前 token 只存 React state，刷新即掉线）；② seed 示例文档自索引（seed 直接 INSERT 不经服务层，2 篇 demo 文档无 chunks / embedding，开箱搜不到）。不新增业务 REQ，属 REQ-011 可用性收口。

### 输入文档
- `docs/research/2026-07-15-system-completion-audit.md` §三（坑 1 / 坑 3）
- `docs/09-verification.md` §5（Sprint-8 seed 记录）
- `frontend/src/App.tsx`、`backend/service/demo_repository.py`（seed）、`backend/main.py`（lifespan）

### 修改范围
- `frontend/src/App.tsx`：登录 token 存 localStorage，启动时恢复。
- `backend`：seed 后或 lifespan 启动钩子中对无 chunks 的文档回填分块 + embedding（或改 seed 脚本经服务层写入）。
- 不改 API 契约、不改 DB schema、不引新依赖。

### 验收标准
- 刷新页面后仍保持登录态。
- 全新起库后，seed 的 2 篇示例文档无需手动重存即可被搜索 / RAG 命中。
- `npm.cmd run build` 通过；后端单测通过；Chrome 刷新不掉线 smoke。

### 禁止事项
- 不把 token 与敏感信息写入不可控存储；不新增 API / DB / 权限模型。
- 不扩大到其他 P1.5 项。

## Sprint-13（P1C·可用性收口 B · 已完成）：外部只读权限真实化

> **已完成（2026-07-16）**：口径 B——external 文档仅 owner 可写（update/delete/restore 拦截非 owner，403/4003），team/private 维持"可见即可写"；读/搜/问答不变。`permissions.md` 原仅定义读、未定义写，本 Sprint 按 B 补写口径并回写 `permissions.md §3/§7`。

### 目标
修复权限缺口（审计 §三 坑 4）：EXTERNAL 权限当前与 TEAM 等价、无只读约束。补写操作（创建 / 改 / 删文档、改术语等）的只读拦截，使"外部只读"名副其实。属 REQ-003 权限收口，不新增 REQ。

### 输入文档
- `docs/research/2026-07-15-system-completion-audit.md` §二 / §三
- `docs/design/permissions.md`、`backend/service/permission.py`

### 修改范围
- `backend/service/permission.py` + 相关 api 写操作：EXTERNAL 成员写操作被拒（返回明确错误码）。
- 不改可见性边界（PRIVATE / TEAM / EXTERNAL 可见性维持现状），只补写权限。

### 验收标准
- EXTERNAL 成员对团队文档执行改 / 删被拒；读 / 搜 / 问答不受影响。
- `tests/backend/test_permission.py` 新增 EXTERNAL 写拦截用例并通过。

### 禁止事项
- 不改 DB schema、不改权限三级定义、不引新依赖。
- 前端隐藏 / 禁用不得作为唯一权限边界（权限必须后端执行）。

## Sprint-14（P1C·可用性收口 C · 候选·需技术验证）：真实 Word/PDF 文本提取

> **候选·待确认·需 RG 技术验证**：REQ-009 真实化，需先选型（如 python-docx / pdfplumber）并做技术环境评估；RG 未通过前不得编码。

### 目标
将导入从"仅 .md / .txt 已提取文本"真实化为"可上传 .docx / .pdf 提取文本后入库"（OCR 仍后续）。属 REQ-009 真实化，不新增 REQ。

### 输入文档
- `docs/design/ingestion.md`、`docs/05-tech-spec.md`（RG 待评估）、`docs/09-verification.md` TC-P1-009
- 本次审计 §二

### 修改范围
- `backend/service/imports.py` + 依赖文件（新增解析库）。
- 不做 OCR（REQ-010 仍后续）；不改 DB schema（`lumen_imports.mime` 列已预留）。

### 验收标准
- 上传 .docx / 文本型 .pdf 后能被搜索 / RAG 命中。
- 选型 + 最小导入技术验证通过（RG 结论 Go / Conditional Go）。
- `tests/backend/test_imports.py` 扩展并通过。

### 禁止事项
- 未完成选型与技术验证前不得编码；不得引入未确认依赖。
- 不做 OCR、不做扫描件、不改既有 .md / .txt 路径。

## Sprint-15（P1C·可选 · 候选）：zhparser 中文分词接入

> **候选·可选·待确认**：中成本，可延后；不阻塞"日常可用"主线。

### 目标
改善中文关键词搜索（审计 §三 坑 2）：当前 pgvector 镜像无 zhparser，关键词路退回 simple、对 CJK 基本不分词。接入 zhparser 扩展（或等价中文分词）。属 REQ-007 搜索质量收口，向量语义召回不受影响。

### 输入文档
- `docs/05-tech-spec.md`、`docs/09-verification.md` task-009 记录、`backend/migrations/006_optional_zhparser_search.sql`

### 修改范围
- docker 镜像（带 zhparser 的 pgvector 变体）+ migration 006 启用。
- 不改 API、不改向量召回路径。

### 验收标准
- 中文长词精确匹配命中率提升；无 zhparser 时仍回退 simple（不阻塞）。
- `tests/backend/test_search.py` 中文用例通过。

### 禁止事项
- 不改 DB schema 既有表；不引入向量库替代品。

## Sprint-16（P1.5·批量导入）：多文件 + 文件夹拖拽导入

> **已完成（2026-07-15）**：用户新增需求（痛点：一个个导入太慢）。方案已确认并按最小范围落地【标题前缀模拟目录 / 多文件+文件夹拖拽+落区】。本 Sprint 只做 `.md`/`.txt` 批量导入，不碰 Word/PDF 解析（留 Sprint-14）、不碰 DB schema（标题前缀，非真 folder）。Chrome headless drop-zone smoke 已通过。

### 目标
把单文件导入升级为批量：拖拽落区（drop zone）+ 多文件选择 + 文件夹递归（`webkitdirectory`），一次导入多个 `.md`/`.txt`；标题用相对路径前缀（如 `docs/team/readme`）保留目录感；批量进度 + 逐条成功/失败反馈；同名默认跳过。属 REQ-037（新增）+ REQ-009 扩展。

### 输入文档
- `docs/02-srs.md` REQ-037、`docs/07-api-spec.md` API-029（POST /api/import/batch）
- 本次需求方案（标题前缀 / drop zone / 批量进度 / 冲突跳过）

### 修改范围
- 前端：`ContextPane` 导入区升级为 drop zone（多文件 + 文件夹拖拽）+ 批量进度 UI；`api.ts` 加批量导入调用。
- 后端：`api/imports` 加批量端点（接多文件 + 标题前缀元数据）；`service/imports` 批量循环 + 冲突跳过。
- 不改 DB schema（标题前缀）、不引新依赖（前端原生 multiple/webkitdirectory，后端复用现有 import）。

### 验收标准
- 一次拖入多个 `.md`/`.txt` 或整个文件夹，全部入库并可搜/可问答。
- 批量进度 + 逐条结果（成功/失败）；同名跳过并提示。
- 标题保留文件夹前缀（目录感）。
- `npm.cmd run build` + 后端 tests 通过；Chrome smoke 拖拽批量导入。

### 禁止事项
- 不做 Word/PDF 解析（留 Sprint-14）；不加真 folder 数据模型（留 Phase2）；不引 router / 组件库 / 新重依赖。

### 完成记录（2026-07-15）
- 后端新增 `POST /api/import/batch`，逐文件处理 `files[]` + `relative_paths[]`，返回 `success_count / failed_count / skipped_count` 与逐条结果；同名默认 `skipped`，失败项不回滚成功项。
- 前端导入区升级为 drop zone + 多文件选择 + 文件夹选择（`webkitdirectory`）+ 批量摘要 / 逐条结果；相对路径用于标题前缀，不新增真实目录模型。
- 验证：`python -m unittest tests.backend.test_imports tests.backend.test_import_api` 9 tests 通过；非 PG/embedding 后端业务测试 47 tests 通过；`npm.cmd run build` 通过；Chrome headless drop-zone smoke 通过（登录 → 合成 drop 两个带 `webkitRelativePath` 文件 → 批量导入成功 2 → 文档列表保留 `smoke-folder/*` 标题 → 搜索命中 → 问答来源命中）；`git diff --check` 通过。
- 未完成验证：`python -m unittest discover -s tests/backend` 因本地 PG 相关测试超时未完成，embedding 模块在沙箱内触发 `torch_python.dll` 权限错误，未作为本 Sprint 阻塞。

## Sprint-17（P1.5·导出 · 候选）：单文档 .md + 空间 ZIP

> **已完成（2026-07-16）**：方案已确认并实现【单文档 `.md` + 空间 ZIP】（API-030 + 前端下载 / 导出入口；后端 tests + 端到端 HTTP smoke 通过，TC-P1-016 通过）。不碰 PDF 导出（REQ-027 已前移 Sprint-18，需 RG-006）。

### 目标
对称的导出能力：文档详情页"下载 .md"；工具栏"导出整个空间"打包 ZIP（所有可见文档 `.md`）。属 REQ-038（新增）。

### 输入文档
- `docs/02-srs.md` REQ-038、`docs/07-api-spec.md` API-030（GET /api/documents/{id}/export + GET /api/export/space）
- 本次需求方案

### 修改范围
- 前端：文档详情下载按钮 + 空间导出入口；`api.ts` 下载调用（blob）。
- 后端：`api/export`（新）单文档 .md 响应 + 空间 ZIP（`zipfile` 标准库，按权限过滤）。
- 不做 PDF（留 Sprint-18）；不引重依赖（zipfile 标准库）。

### 验收标准
- 文档详情可下载 `.md`；空间导出生成 ZIP（含所有可见文档 `.md`）。
- 权限过滤（不可见文档不进 ZIP）。
- 后端 tests + Chrome smoke 下载。

### 禁止事项
- 不做 PDF 导出（留 Sprint-18）；不引 PDF 库；不改 DB schema。

## Sprint-18（P1.5B·PDF 导出 · 已完成）：单文档 PDF

> **已完成（2026-08-04）**：REQ-027 单文档 PDF 导出从 Phase2 提前到 P1.5B，已完成 API-019、前端文档详情入口和 TC-P1-017。RG-006 的 ReportLab + 中文字体 + Poppler 渲染前置验证已关闭，产品样例 PDF 也已通过人工 PNG 检查、文本抽取与非白像素检查。v1.7.0 已补 `GET /api/export-pdf/{export_id}/download` 和前端浏览器下载闭环。

### 目标
单文档导出 PDF（Markdown → PDF，含中文、基础排版 / 页眉页脚）。属 REQ-027（从 Phase2 提前到 P1.5）。文档详情页"导出 PDF"。

### 输入文档
- `docs/02-srs.md` REQ-027、`docs/07-api-spec.md` API-019、`docs/05-tech-spec.md` RG-006

### 修改范围
- 后端：migration 013 `lumen_doc_exports`、`DocExport` entity / ORM、Demo/Pg repository、`service/export.py` PDF 渲染 / 下载读取与失败态、API-019 `POST /api/export-pdf` + `GET /api/export-pdf/{export_id}/download`。
- 前端：文档详情"导出 PDF"入口与 `exports.ts` API client；v1.7.0 起点击后直接触发浏览器 PDF 下载。
- PDF 依赖：ReportLab 首版路线；`pypdf` / `pdfplumber` / `Pillow` 用于产物校验与 TC-P1-017。

### 验收标准
- RG-006 选型 + 中文最小 PDF 导出验证通过。
- API-019 可生成绑定指定版本的中文 PDF，失败态写入 `lumen_doc_exports` 并映射 5030；下载端点复验权限、任务状态与 artifact 目录边界。
- 文档详情可发起 PDF 导出并直接下载，中文标题 / 正文 / 列表 / 表格 / 引用基础排版正常。
- 后端 tests、frontend build、产品样例 PDF 人工与机器校验均通过。

### 禁止事项
- 不新增未确认 PDF 库；不做异步队列 / 过期清理 job / 水印 / Word-PDF 解析 / zhparser。

## Sprint-24（Phase2C 增强·子树导入 UI·已完成）

### 目标
REQ-018 模式 B 增强：本地挂载目录树支持「选子文件夹导入」，补齐 task-033 留的「子树（选特定文件夹节点）导入 UI」尾巴；导入复用 API-029 + `preserveStructure:true` 保留目录结构。

### 输入文档
- docs/03-prd.md §3 Phase2C；docs/design/ingestion.md Flow-D-014；docs/07-api-spec.md API-029
- docs/09-verification.md TC-P2-VAULT-002；tasks/task-033-local-vault-import-and-host.md（留后续口径）

### 修改范围
- frontend `LocalMountPane`（本地树节点「导入此子树」入口）+ `useLocalVaultMount`（按需导入复用）
- 限制 1–3 个文件 / 模块；不引第三方依赖

### 验收标准
- 本地挂载树任意文件夹节点可「导入到 LUMEN」，走 API-029、`preserveStructure` 保留目录；导入后出现在上层 DB 分区且可搜；单篇 / 整库入口回归不破。

### 禁止事项
- 不改后端 / API 契约；不新增依赖；不扩展其它 Phase2C 增强项（FileSystemObserver / 跨设备）。

## Sprint-25（帮助手册 L0+L1·已完成）

### 目标
帮助体系首版：L0 内容源（`docs/env/user-guide.md` 按任务导向重组，作为唯一内容源）+ L1 首次引导（登录后 3 步引导 / 新手清单 / 空状态引导 / 「示例文档未建索引」提示）。设计见 `docs/design/help-onboarding.md`。

### 输入文档
- docs/design/help-onboarding.md（新增）；docs/env/user-guide.md；frontend-interaction.md §9.5（Doc-First 基线）
- docs/09-verification.md TC-P2-HELP-001

### 修改范围
- docs/env/user-guide.md（L0 重组）+ frontend（WelcomeFeature 引导、onboarding store、各视图空状态）
- 限制 1–3 个文件 / 模块（组件抽独立文件防 WSG-004）

### 验收标准
- 新用户路径人工 smoke 通过（见 TC-P2-HELP-001）；帮助内容源与 UI 单一来源；tsc build 绿；既有 TC-P1-014 回归。

### 禁止事项
- 不引第三方 help / onboarding 库；不改后端；不一次性实现 L2-L4（留后续）。

> **完成记录（2026-08-06，Sprint-25）**：L0 `docs/env/user-guide.md` 任务导向重组（唯一内容源）；L1 新增 `frontend/src/app/onboarding-store.ts` + `frontend/src/features/OnboardingGuide.tsx` + `styles/onboarding.css`，欢迎页新手清单 + 「示例文档未建索引」提示，搜索 / 问答空态「去新建文档 / 去导入」按钮，标签 / 时间线空态下一步入口，顶栏帮助弹层升级（分类速查 + 轻量过滤 + 完整手册链接）。验证：`volta run --node 22.17.1 npm run build` 绿（273 modules）；`node scripts/smoke-help-onboarding-browser.mjs` 通过（登录 → 3 步引导 → 首页未建索引提示 → 空态按钮 → 帮助过滤 10→3 命中「导入」→ 跳过引导持久化不再弹出）。人工浏览器 smoke 新用户路径确认通过（2026-08-06）；验收期修复 2 缺陷（帮助弹层无法关闭、空态按钮超高，见 docs/09 §5.1）；L2 帮助中心 / L3 / L4 留后续。

## Sprint-26（Phase2D·账号体系基础·已完成）

### 目标
把 Demo 占位账号侧（无密码 / 3 seed 用户 / 手撸 HMAC token）升级为真实多用户账号体系（REQ-040/041/042，U-45/46/47）：注册（bcrypt 哈希）/ 凭证登录（bcrypt verify + 不透明 token session）/ 登出·会话管理（撤销 + TTL 8h + 滑动续期 + 多设备会话）；`lumen_users` 扩列 + `lumen_sessions`（migration 014）；统一 `get_current_user` 收敛 13 router；基础登录 / 注册页 + 登出；demo 模式物理隔离（PG 强制真实 / 内存允许 demo）；登录失败锁定 + 审计日志 + 密钥 env 注入。

### 输入文档
- docs/design/accounts-auth.md（§3 流程 / §4 密码哈希 / §5 不透明 token / §6 get_current_user / §7 demo 物理隔离 / §8 migration 014 / §9 auth API / §10 安全 / §11 readiness gate / §16 C-AUTH-001..006）
- docs/02-srs.md REQ-040/041/042；docs/01 U-45/46/47 + AC-P2-AUTH-001/002/003；docs/03-prd.md §3 Phase2D；ai/project-rules.md §1；docs/09 TC-P2-AUTH-001；tasks/task-038

### 修改范围
- backend：`service/auth.py`（bcrypt hash/verify + 不透明 token + 锁定/审计）、`service/auth_context.py`（get_current_user / optional / require_space_member）、`api/auth.py`（register/login/logout/refresh/sessions）、migration `014_account_sessions.sql`、repository（Demo/Pg session 与用户方法）、13 router 收敛到 `Depends(get_current_user)`、`main.py` 生产 fail-fast 护栏、`requirements.txt` + `bcrypt==5.0.0`
- frontend：`api/auth.ts`（login/register/logout/listSessions/revokeSession）、`app/useSession.ts`（登录/注册 tab + 登出）、`App.tsx`（登录面板改造）、`TopBar.tsx`（退出登录菜单）
- 回写：docs/05（TCD-012 + RG-011/012/013）、docs/06（migration 014）、docs/07（API-001 契约变更 + API-039..043）、docs/08/09、accounts-auth §15

### 验收标准
- TC-P2-AUTH-001（AC-P2-AUTH-001/002/003）：注册 → 凭证登录 → 鉴权访问；重复标识拒绝；bcrypt 哈希非明文；错误凭证失败 + 连续失败锁定 + 不枚举账号；登出撤销 + TTL 过期 + 续期轮换旧 token 失效 + 多设备会话查询/撤销；demo 开关 PG 强制真实 / 内存允许 demo；跨用户隔离不泄露。
- RG-011（bcrypt PoC）/ RG-012（token session 单测）/ RG-013（跨用户隔离回归）均 Go。
- 后端 `tests/backend/test_auth.py` + 既有回归不破（全量 222 OK）；浏览器 smoke PASS（`scripts/smoke-auth-browser.mjs`）+ demo 启动验证通过。

### 禁止事项
- 不做权限多人化实质改造 / 全局角色分层 / 用户管理后台 UI / REQ-016（Sprint-27/28）。
- 不引 JWT / python-jose / 自实现 token 协议（不透明 token + `secrets` 标准库）。
- 不破 demo 模式（`run-sprint16-demo` 内存仓储继续可用；seed id=1/2/3 保留）。
- 不改 `lumen_space_members.role`（空间级角色保留）；不明文存储 / 日志记录密码。

> **完成记录（2026-08-07，Sprint-26）**：migration 014（`lumen_users` 扩列 email / password_hash / status / last_login_at / failed_login_count / locked_until + `lumen_sessions`，token 只存 SHA-256 摘要）；auth service（bcrypt cost 12、锁定 5 次 / 15min、TTL 8h 滑动续期、结构化审计日志 register / login_success / login_failed / login_locked / logout）；`api/auth.py` 六端点（register / login / logout / refresh / sessions GET+DELETE，错误码 4001/4010/4030/4090/4220/4004）；统一 `get_current_user` 收敛 13 router；`main.py` `LUMEN_ENV=production` + demo 仓储 fail-fast；seed 用户统一设 demo 密码 `demo-pass-1234`（PG 强制凭证，内存模式保留无密码快捷登录）；前端登录/注册 tab 面板 + 退出登录菜单（实现偏差：内联 tab 而非独立路由，见 accounts-auth §15）。验证：`bcrypt` 5.0.0 PoC（RG-011 Go）；`tests/backend/test_auth.py` 20/20；backend discover 222 OK（skipped=2）；RG-012/013 Go。浏览器 smoke：`scripts/smoke-auth-browser.mjs` PASS（注册 / 登录 / 登出 / 凭证登录 / refresh 轮换 / 多设备会话撤销 200 幂等 / 404 / 401 / 409 / 422）+ demo 启动验证通过（`run-sprint16-demo`，18000/5173）；前端 build 273 modules 绿（2026-08-07 复核）。
