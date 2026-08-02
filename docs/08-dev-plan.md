# 08 开发计划

> 按阶段拆 Sprint。本文件承载 Phase1 → Phase1.5A → Phase2A 的计划与完成记录；
> 升阶段时在**原位追加**新 Sprint（global-rules §8，不删旧 Sprint）。
> Sprint 格式见 `ai/global-rules.md` §3。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | **Phase2B（团队 MVP）进行中**（2026-07-30 切指针；RG-008 升 Go，Sprint-19 后端通过 2026-07-30；前端 half 待实现） |
| 交付物形态 | Demo / 个人可用 Alpha / 个人知识组织 |
| 输入基线 | `docs/03-prd.md` §3、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/09-verification.md` |
| 当前状态 | Phase1 Demo 已完成并已记录全量验收（Conditional Go）；Phase1.5A 已完成批量 / 文件夹导入（REQ-037）与 `.md` / ZIP 导出备份（REQ-038）；Phase2A 已完成 REQ-026 内链 / 反链、REQ-012 标签、REQ-025 快速录入三个 vertical slice 并通过 `09` 对应用例。Phase1.5B（PDF / Word-PDF / zhparser）仍待后续 RG；**Phase2B（团队 MVP）范围已确认（2026-07-30）：REQ-014 首批核心已完成 v1.1.0（TC-P2-AI-001 通过），REQ-013/024 时间轴为第二 slice 待启动；Sprint-21 Doc-First UX slice 3a/3c/3d 已完成本地 build + 用户 smoke + TC-P1-014/015 回归（2026-08-01 用户确认）**；**Sprint-22 文档目录树（folder-tree，REQ-039）为 Phase2B 第三 slice 候选，06/07/02/03/09/ingestion 设计骨架已回填，待 FT-C-* 确认 + 立项编码**。 |
| 最后更新 | 2026-08-02（folder-tree 设计回填：Sprint-22 候选 + REQ-039 文档目录树，06/07/02/03/09/ingestion 设计骨架已回填，待 FT-C-* 确认 + 立项编码；Sprint-21 完成记录见前版） |

## Sprint 总览

> 对照 `ai/doc-standards/08-dev-plan.md` §2。状态用 §7.1 横切状态词典。Sprint-1~6 为**降级实现**（原内存 `demo_repository`）；Sprint-7/8 真实化（LLM / pgvector / Embedding 接入）；OCR / 真实 PDF 解析仍降级（后续阶段）。

| Sprint | 目标 | 覆盖 REQ | 输入设计 / 契约 | 修改范围 | 验证包 | 状态 | 任务单 |
|---|---|---|---|---|---|---|---|
| Sprint-1 | 空间与权限底座 | 001/002/003 | 06、design/permissions | backend auth/space/permission | 见「Sprint 验证包」/ TC-P1-001~003 | 已完成（降级） | — |
| Sprint-2 | 文档管理 + 版本 | 004/005/006 | 06、07（documents） | backend document + frontend 编辑器 | / TC-P1-004~006 | 已完成（降级） | — |
| Sprint-3 | 内容导入 | 009/010 | design/ingestion、06、07 | backend import + scripts | / TC-P1-009/010 | 已完成（降级·仅 `.md`/`.txt`） | — |
| Sprint-4 | 检索与 RAG | 007/008 | design/rag-retrieval、06、07 | backend search/rag + frontend | / TC-P1-007/008 | 已完成（降级） | — |
| Sprint-5 | 术语管理 | 036 | design/term-management、06、07 | backend term/rag + frontend | / TC-P1-012 | 已完成（降级） | — |
| Sprint-6 | 桌面端集成与验收 | 011 | 09 + 前置 Sprint | frontend 桌面端集成 | / TC-P1-011 | 已完成（降级） | — |
| Sprint-7 | LLM 真实化 adapter | 008 | design/rag-retrieval、05（RG-004） | backend llm_adapter.py + rag.py + .env | / TC-P1-008 | 已完成（GLM-5.2 真实验证） | — |
| Sprint-8 | pgvector 接入（内存→PG+向量召回） | 007/008 | design/rag-retrieval、06、05（RG-001/002）、task-008 | docker + db.py + orm + pg_repository + embedding + rag + migrations 003-005 | / TC-P1-007/008 | 已完成（RG-001/002 Go；T1–T7，task-008） | `tasks/task-008-pgvector-integration.md` |
| Sprint-9（P1A） | 前端结构聚焦重构 | 011（既有 P1 页面体验修正） | design/frontend-interaction、research/frontend-p1-structure-exploration | frontend 组件拆分 + 视图切换 + CSS 响应式 | / TC-P1-013 | 已完成（构建 + Chrome / Edge 900px smoke 通过） | — |
| Sprint-10（P1B） | 前端工作台系统化重设计 | 011（既有 P1 页面体验修正） | design/frontend-workspace-redesign、frontend-workspace-redesign-prototype | frontend 工作台骨架 + 密度 token + 四视图 Workspace | / TC-P1-014 | 已完成（构建 + Chrome / Edge 900px smoke 通过） | — |
| Sprint-11（P2-UI-Gate / WSG 候选） | Phase2 前端 UI 实现前确认与计划冻结 | 012/013/014/025/026（P2 骨架候选，不新增 REQ） | 04 WSG 矩阵、05 §4.1、design/frontend-interaction §9.3、research/prototypes/2026-07-14-frontend-ui-reference-absorbed-prototype、09 TC-P2-WSG-001 + TC-P2-UI-001~005 | docs + 后续 frontend 实现范围冻结；Phase2A 已以三个 vertical slice 完成 | / TC-P2-WSG-001 + TC-P2-UI-001~005 | 静态评审条件通过；门禁口径（DF-C-001 已确认）：每个 UI slice 前重跑 UI / WSG 门禁 | — |
| Sprint-0′（框架补课·候选） | 前端目录骨架 + 拆 App.tsx / styles.css；后端 repository 独立 + 清单例 hack | 011（结构收口，不新增 REQ） | web-fullstack-profile、04 §1.3、05 §4.1、本次审计 §四 / §五 | frontend `src/{app,features,components,api,state,styles}` + backend `repository/` | TC-P1-WSG 重测 + 既有 smoke 全绿；前端 build 绿、后端 42 service tests 过 | 已完成（4b hook 化暂缓·软阈值） | ae51210·3d02bb2·2924df4·0a67cfc·2e34c28·a33c536 |
| Sprint-12（P1C·可用性 A·候选） | 登录态持久化 + seed 自索引修复 | 011（可用性收口，不新增 REQ） | 09 §5 Sprint-8 记录、本次审计 §三 | frontend `App.tsx` + backend seed / 启动钩子 | 待新增 TC-P1-015/016 | 候选·待确认（未编码） | — |
| Sprint-13（P1C·权限·候选） | 外部只读权限真实化（EXTERNAL 写操作拦截） | 003（权限收口） | design/permissions、06、07 | backend `service/permission` + api | TC-P1-003 扩展 | 候选·待确认（未编码） | — |
| Sprint-14（P1C·导入·候选·需 RG） | 真实 Word/PDF 文本提取（REQ-009 真实化） | 009（导入真实化） | design/ingestion、05（RG 待评估）、本次审计 §二 | backend `service/imports` + 依赖 | TC-P1-009 扩展 | 候选·待确认（需选型 + RG；未编码） | — |
| Sprint-15（P1C·可选·分词·候选） | zhparser 中文分词接入 | 007（搜索质量收口） | 05、09 task-009 记录、docker | docker 镜像 + migration 006 | TC-P1-007 扩展 | 候选·可选·待确认（中成本；未编码） | — |
| Sprint-16（P1.5·批量导入） | 多文件 + 文件夹拖拽导入（drop zone + 批量进度 + 标题前缀 + 冲突跳过） | 037（新增）+ 009 扩展 | 02 REQ-037、07 API-029 | frontend ContextPane drop zone + backend api/imports 批量 + service | TC-P1-015 | 已完成（自动化 + Chrome headless drop-zone smoke 通过） | — |
| Sprint-17（P1.5A·导出备份） | 单文档 .md 下载 + 空间 ZIP 打包 | 038（新增） | 02 REQ-038、07 API-030 | frontend 下载入口 + backend api/export（zipfile）+ service | TC-P1-016 | 已完成（后端 tests + 端到端 HTTP smoke 通过） | — |
| Sprint-18（P1.5·PDF 导出·候选·需 RG） | 单文档 PDF 导出（Markdown → PDF，中文） | 027（从 Phase2 提前） | 02 REQ-027、07 API-019、05 RG-006 | backend api/export-pdf + PDF 库 + service | 待新增 TC-P1-017 | 候选·待 RG-006 选型（未编码） | — |
| Sprint-19（Phase2B·AI 润色·首个 vertical slice） | AI 润色 polish + 写作引用 citation（API-028）+ `lumen_ai_drafts` migration 010 | 014 | 02 REQ-014、03 Phase2B、04 Flow-005、05 TCD-010 / RG-004 / RG-008、06 lumen_ai_drafts、07 API-028、design/ai-polish | backend service/ai_polish + api + migration 010；frontend 写作侧边栏 | TC-P2-AI-001（后端 tests + prompt 边界审查 + UI smoke） | **已完成（RG-008 Go，2026-07-30；前端闭环 PR#89–95 / v1.1.0，TC-P2-AI-001 live UI smoke 2026-07-31 通过）** | — |
| Sprint-20（Phase2B·时间轴·第二 slice） | 时间轴视图 + 密度热条（API-033） | 013/024 | 02 REQ-013/024、04 Flow-009、06 lumen_documents + tags + links、07 API-033、design/timeline | backend service/timeline + api；frontend 时间轴视图 | TC-P2-TL-001（后端 tests + Chrome/Edge smoke） | 待 Sprint-19 落地 + D-T-001 数据来源定稿后启动（未编码） | — |
| Sprint-21（Phase2B·Doc-First UX） | slice 3a 侧栏可隐藏/默认收起/三路唤出/记忆 + slice 3c 默认落地欢迎页+主区少容器视觉收口+documents 空态引导 + slice 3d 导入入口弹窗化（§9.5 基线） | 011 + 037（P1B 默认行为升级 + 导入入口形态，不新增 REQ） | design/frontend-interaction §9.5（§9.5.8 导入弹窗）、research/prototypes/2026-07-31-obsidian-inspired-*、09 TC-P1-014/TC-P1-015 | frontend App.tsx + app/{usePaneLayout,pane-layout-store,TopBar,ContextPane} + features/{Welcome,DocumentEmptyState,Documents,Import}Feature + styles | TC-P1-014 回归 +（3d）TC-P1-015 回归 + Chrome/Edge smoke | 已完成（3a/3c 已随 PR #97 合并；3d 本地编码完成并通过 build + 用户 smoke，TC-P1-015/014 回归通过；未 bump 版本 / 未提交） | tasks/task-021..025 |
| Sprint-22（Phase2B·文档目录树·第三 slice 候选） | `lumen_folders` 嵌套树 + 文档 `folder_id` 归属 + 文件夹 CRUD/移动/排序（API-034..037）+ 导入 API-029 `preserve_structure` 保留结构（Flow-D-010..013）+ 前端文件管理器 | 039（新增）+ 037 扩展 | 02 REQ-039、03 Phase2B 第三 slice、06 lumen_folders/folder_id/migration 011、07 API-034..037 + API-029、design/folder-tree、design/ingestion Flow-006 | backend migration 011 + service/folder + api/folders + import `preserve_structure` 改造；frontend 文件管理器（树渲染 + CRUD + 移动 + 排序） | TC-P2-FOLDER-001 + TC-P1-015 扩展（后端 tests + Chrome/Edge smoke） | 候选·待 FT-C-* 确认 + 立项编码（未编码） | — |

## 依赖关系与里程碑

| 项 | 前置依赖 | 阻塞风险 | 可并行 | 处理方式 | 里程碑 |
|---|---|---|---|---|---|
| Sprint-1 权限底座 | 无 | — | 否（后续依赖） | 最先执行 | M1 权限底座就绪 |
| Sprint-2 文档 | Sprint-1 | — | 可与 Sprint-3 部分并行 | 顺序 | M2 文档可用 |
| Sprint-3 导入 | Sprint-2（产物为文档） | OCR / PDF 未实现 → 降级 | — | 降级先行（`.md`/`.txt`） | M3 导入可用（降级） |
| Sprint-4 检索 RAG | Sprint-2 / 3（供数） | pgvector / Embedding 未接入 → 降级 | — | 降级先行（内存关键词） | M4 检索 RAG 可用（降级） |
| Sprint-5 术语 | Sprint-4（RAG 口径注入） | — | — | 顺序 | M5 术语对齐 |
| Sprint-6 桌面端 | Sprint-1~5 全部 | — | 否（横切验收） | 最后执行 | M6 Phase1 Demo 验收 |
| Sprint-9（P1A）前端结构聚焦 | Sprint-6 + #72 P0 UX + #74 探索 | 范围蔓延到 router / 组件库 / 移动端 | 可与 Phase2 tech-env-eval 并行 | 先纯 React state + CSS，不引新依赖 | M7 P1A 体验收口 |
| Sprint-10（P1B）前端工作台重设计 | Sprint-9 + `frontend-workspace-redesign` 原型确认 | 继续局部样式微调导致返工；范围蔓延到组件库 / router | 可与 Phase2 tech-env-eval 并行 | 先按原型落地 Nav Rail + Context Pane + Workspace，不引新依赖 | M8 P1B 工作台体验收口 |
| Sprint-11（P2-UI-Gate / WSG 候选）实现前门禁 | Sprint-10 + `frontend-interaction` §9.3 + 少容器清爽稿暂定确认 + WSG-001..006 草案 | UI 方向继续返工；跳过 WSG / UI-G 直接编码；范围蔓延到组件库 / router / 新 API / 图谱算法 | Phase2A 已完成；Phase2B 每个 UI slice 前重跑（DF-C-001 已确认） | Phase2A 已按三个 vertical slice 完成；门禁口径（DF-C-001 已确认）：每个 UI slice 前重跑 Page-ID / Flow-ID / TC / WSG 和 UI smoke 范围确认 | M9 P2 UI + WSG 实现前门禁 |
| Sprint-0′（框架补课·候选） | Phase1 closure（Sprint-8/10）已完成 | 继续往 `App.tsx` / 全局 CSS / 后端 service 堆 P1.5 功能，导致更难拆 | 否（P1.5 全部前置） | 纯结构搬运、逻辑不动、每步 smoke；前端建目录骨架 + 拆 App.tsx / styles.css，后端 repository 独立 + 清单例 hack；**先于所有 P1.5 编码** | M9.5 框架对齐（WSG 闭环） |
| Sprint-12~15（P1.5 可用性收口·候选） | Phase1 closure（Sprint-8/10）已完成 | 范围蔓延到 Phase2 高级功能；跳过收口直接做 Phase2 编码 | 可与 Phase2 tech-env-eval 并行评估 | 先做低成本收口（Sprint-12 登录持久化 / seed 自索引、Sprint-13 外部只读），再做重依赖项（Sprint-14 Word/PDF 需选型 + RG、Sprint-15 zhparser 可选）；**P1.5 优先于 Phase2 编码** | M10 日常可用（P1.5 收口） |
| Sprint-19（Phase2B·AI 润色·首个 slice） | Phase2A closure + **RG-008 Go（后端通过）** + Sprint-11 UI/WSG 门禁重跑 | ~~数据外发护栏未落实~~（后端已落实：权限过滤 / 5030 / hash）；~~前端 half 待续~~ 前端已闭环（PR#89–95 / v1.1.0，TC-P2-AI-001 live UI smoke 2026-07-31 通过） | 否（首个 slice） | 先后端 polish/citation + migration 010，再前端写作侧边栏；复用 RAG / 术语 / LLM adapter | M11 Phase2B AI 润色可用 |
| Sprint-20（Phase2B·时间轴·第二 slice） | Sprint-19 落地 + D-T-001 数据来源定稿 | 时间轴从零设计，范围蔓延到关联图 / 因果推理（愿景） | 可与 Sprint-19 收尾部分并行 | 数据来源选候选 A（不建表）先行；大集合降级本机实测定阈值 | M12 Phase2B 时间轴可用 |
| Sprint-21（Phase2B·Doc-First UX·slice 3a + 3c + 3d） | Phase2B closure（Sprint-19）+ DF-C-001 门禁（每 slice 重跑）+ §9.5 基线用户确认 | 改 REQ-011 已验收默认行为 → 需 TC-P1-014 回归；栏 state 蔓延到全局；导入入口形态变化 → 需 TC-P1-015 回归 | 否（UI 布局 slice） | slice 3a：顶栏图标唤出 + Ctrl+B/R + localStorage 记忆；先左目录后右栏 Inspector。slice 3c：home 欢迎引导页（默认落地）+ 主区少容器视觉收口 + 正文限宽 + documents 空态引导/返回。slice 3d：导入区从 ContextPane 常驻 section 迁到 DocumentsFeature toolbar 触发的居中 modal，复用 `useImport` / API-029，不动骨架/后端/API。**进展（2026-08-01）：3a/3c/3d 编码完成，build 绿，用户 smoke + TC-P1-014/015 回归通过**；3b 单列阅读/编辑另行启动前需先拆 inspector | M13 Doc-First 布局可用 |
| Sprint-22（Phase2B·文档目录树·第三 slice 候选） | folder-tree 设计 FT-C-* 确认 + 06/07 契约回填 + REQ-039 U-ID/SC 追溯补齐 | 引入 folder 表 → migration 范围扩大；改 API-029 已实现契约 → 需 TC-P1-015 回归；folder 权限模型误读（folder 不独立设权限） | 可与 Sprint-20 时间轴部分并行（均基于 `lumen_documents`，互不冲突） | 先后端契约（migration 011 + folder service/API），再导入 `preserve_structure` 改造，最后前端文件管理器；folder 不独立设权限，文档可见性仍按 permission；导入幂等建/复用 folder；推翻 ingestion ING-C-001 | M14 Phase2B 文档目录树可用（候选） |

## 任务拆分规则

- Phase1 不强制 `tasks/` 独立文件（`ai/global-rules.md` §3）；Sprint 五段式（目标 / 输入文档 / 修改范围 / 验收标准 / 禁止事项）承载任务边界。
- 拆分触发（`ai/implementation-lifecycle-rules.md` §4）：修改 > 3 文件 / 模块、验收无法一次完成、多不相干功能、多人 / 多 AI 并行、跨测试等级逐步验证。
- Sprint-2 / Sprint-6 未拆 task 文件（Phase1 合规，审计「可接受兼容差异」已认定）。
- 分支 / worktree：每个 Sprint / PR 独立分支；多会话并行操作同一仓库时用 `git worktree`（见 `ai/session-rules.md` §8）。

## Sprint 验证包

> 每个 Sprint 的验证包（对照 `ai/doc-standards/08-dev-plan.md` §3）：关联 TC / 测试等级 / 自动化命令 / Mock·降级口径。完成包（改动文件 / 验证结果 / 提交 / 残留风险）见文末「Sprint 完成包与进度记录」。

| Sprint | 关联 TC | 测试等级 | 自动化命令 | 人工步骤 | Mock / 降级口径 |
|---|---|---|---|---|---|
| Sprint-1 | TC-P1-001/002/003 | 单元 + 集成 | `.venv\Scripts\python.exe -m unittest discover -s tests/backend`（test_permission / test_space） | — | 内存权限过滤（无真实账号系统） |
| Sprint-2 | TC-P1-004/005/006 | 单元 + 集成 | 同上（test_document） | 前端编辑器 smoke | 内存文档 / 版本（无 DB） |
| Sprint-3 | TC-P1-009/010 | 集成 | 同上（test_imports） | — | 仅 `.md`/`.txt` 文本切块；无 PDF/OCR/向量 |
| Sprint-4 | TC-P1-007/008 | 单元 + 集成 | 同上（test_search / test_rag） | 前端搜索 / 问答 smoke | 内存关键词检索；RAG 不调 LLM |
| Sprint-5 | TC-P1-012 | 单元 + 集成 | 同上（test_term / test_rag） | 前端术语管理 smoke | 内存术语；问答口径注入（不调 LLM） |
| Sprint-6 | TC-P1-011 | 系统 / E2E | — | Edge Headless + Chrome 人工 smoke（09 §5） | 桌面端全 P1 功能（降级口径） |
| Sprint-7 | TC-P1-008 | 单元 + 集成 | 同上（test_rag） | 本机 GLM-5.2 真实问答 | LLM 默认 Mock 可切；GLM 真实验证 |
| Sprint-8 | TC-P1-007/008 | 单元 + 集成（PG） | 同上（test_pg_repository / test_api_routes / test_embedding） | uvicorn 起后端冒烟（登录/CRUD/术语/导入/搜索/RAG） | PG 必需运行时（lumen-pg 容器）；Embedding 模型 ~7s 首加载 |
| Sprint-9（P1A） | TC-P1-013 | 前端构建 + 浏览器 smoke | `npm.cmd run build`（frontend） | Chrome / Edge：登录、视图切换、文档、搜索、问答、术语、900px 宽度 | 不新增 API / 后端能力；不引 router / 组件库；移动端不验收 |
| Sprint-10（P1B） | TC-P1-014 | 前端构建 + 浏览器 smoke | `npm.cmd run build`（frontend） | Chrome / Edge：工作台三层布局、Context Pane 随视图变化、文档 / 搜索 / 问答 / 术语主流程、900px 宽度 | 不新增 API / 后端能力；不引 router / 组件库；移动端不验收 |
| Sprint-11（P2-UI-Gate / WSG 候选） | TC-P2-WSG-001、TC-P2-UI-001~005 | 文档门禁 + 原型走查 + 后续浏览器 smoke | `git diff --check`；后续实现前 `npm.cmd run build`（frontend） | 已形成实现前门禁草案；Phase2A 已由 REQ-026/012/025 的独立 build / smoke 覆盖 | 当前不编码；不新增 API / DB / 权限模型 / 图谱算法 / router / 组件库；Phase2B 启动前重新确认 UI / WSG 门禁 |
| Sprint-0′ | TC-P1-WSG-001..006 重测（结构对齐后）+ 既有 P1 smoke 全绿 | 前端构建 + 后端单测 + 浏览器 smoke | `npm.cmd run build`；`.venv\Scripts\python.exe -m unittest discover -s tests/backend`；Chrome / Edge 900px smoke | 拆分后登录 / 文档 / 搜索 / 问答 / 术语主流程不回退 | 纯结构搬运，不改 API / DB / 业务逻辑 |
| Sprint-12 | 09 §5 验收（REQ-011 可用性收口；TC-P1-015/016 已被 REQ-037/038 占用，登录持久化 / seed 自索引走 §5 描述性验收） | 前端构建 + 后端单测 | `npm.cmd run build`；`.venv\Scripts\python.exe -m unittest tests.backend.test_seed_index`（seed 回填） | Chrome 刷新不掉线；全新起库后 seed 文档开箱可搜 | 不新增 API / DB 能力 |
| Sprint-13 | TC-P1-003 扩展（EXTERNAL 写拦截） | 单元 + 集成 | 同上（test_permission） | EXTERNAL 账号改 / 删被拒；读 / 搜 / 问答不受影响 | 不改变可见性边界，只补写权限 |
| Sprint-14 | TC-P1-009 扩展（.docx / .pdf 文本提取） | 集成 | 同上（test_imports） | 导入 .docx / 文本型 .pdf 后可搜可问答 | 选型未定前为降级；OCR 仍后续（RG-003） |
| Sprint-15 | TC-P1-007 扩展（中文分词） | 集成（PG） | 同上（test_search） | 中文长词精确命中改善 | 无 zhparser 时仍回退 simple（不阻塞） |
| Sprint-19（Phase2B） | TC-P2-AI-001 | 单元 + 集成 + UI smoke | `.venv\Scripts\python.exe -m unittest discover -s tests/backend`（test_ai_polish）；`npm.cmd run build` | Chrome / Edge：写作侧边栏 polish / citation、来源点击、降级提示 | RG-008 Go（后端通过）；LLM 可 Mock；数据外发护栏（hash / 无 key / sources 权限过滤） |
| Sprint-20（Phase2B） | TC-P2-TL-001 | 单元 + 集成 + UI smoke | 同上（test_timeline）；`npm.cmd run build` | Chrome / Edge：时间轴渲染、密度热条、大集合降级 / 列表逃生舱 | 数据来源候选 A（不建表）；大集合聚合降级 |
| Sprint-21（Phase2B·Doc-First UX） | TC-P1-014（3a/3c/3d 回归）+ TC-P1-015（3d 入口形态回归） | 前端构建 + 浏览器 smoke + 回归验收 | `volta run --node 22.17.1 npm run build`（frontend） | Chrome / Edge：栏显隐、首页默认落地、documents 减框、空态引导/返回、导入 modal 打开 / 关闭 / 文件选择 / 导入成功刷新、900px 不破版、文档 / 搜索 / 问答 / 术语主流程 | 不新增 API / 后端能力；不引 router / 组件库；3d 只迁移导入入口容器，不改导入契约 |
| Sprint-22（Phase2B·文档目录树·候选） | TC-P2-FOLDER-001 + TC-P1-015 扩展（`preserve_structure` 保留结构） | 单元 + 集成 + UI smoke | `.venv\Scripts\python.exe -m unittest discover -s tests/backend`（test_folder / test_imports）；`volta run --node 22.17.1 npm run build` | Chrome / Edge：文件夹树渲染、新建/移动/排序/删除、导入文件夹后目录结构保留、防环/跨空间/重名/删非空拒绝、文档可见性不因 folder 泄露 | folder 不独立设权限；导入 `preserve_structure` 默认 true、=false 退回标题前缀；现有文档 `folder_id=null` 向后兼容 |

> 资源 / 环境验证：Sprint-8 起 Docker / pgvector / Embedding **已 Go**（RG-001/002 Go，见 05 §5.1；TE-C-003 闭合）；OCR / 真实 PDF 解析仍 No-Go（RG-003，后续阶段，不在 P1 必过范围）。

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

## Sprint-12（P1C·可用性收口 A · 候选）：登录态持久化 + seed 自索引修复

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

## Sprint-13（P1C·可用性收口 B · 候选）：外部只读权限真实化

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

## Sprint-18（P1.5·PDF 导出 · 候选·需 RG）：单文档 PDF

> **候选·待 RG-006**：REQ-027 单文档 PDF 导出，从 Phase2 提前到 P1.5。需先选型（weasyprint / reportlab 等）+ 中文排版最小验证（RG-006），未通过不得编码。

### 目标
单文档导出 PDF（Markdown → PDF，含中文、基础排版 / 页眉页脚）。属 REQ-027（从 Phase2 提前到 P1.5）。文档详情页"导出 PDF"。

### 输入文档
- `docs/02-srs.md` REQ-027、`docs/07-api-spec.md` API-019、`docs/05-tech-spec.md` RG-006

### 修改范围
- 后端：`api/export-pdf`（PDF 库渲染 Markdown → PDF）+ service；选型 + 中文验证。
- 前端：文档详情"导出 PDF"入口。
- 引 PDF 库（新依赖，须选型 + RG-006 通过）。

### 验收标准
- 选型 + 中文最小 PDF 导出验证通过（RG-006 Go / Conditional Go）。
- 文档详情可导出 PDF（中文正常、基础排版）。
- 后端 tests + 人工 PDF 样例。

### 禁止事项
- RG-006 选型 / 中文验证未通过前不得编码；不引未确认 PDF 库；不改 DB schema。

## Sprint 完成包与进度记录

> 对照 `ai/doc-standards/08-dev-plan.md` §4（完成包）+ §5（进度记录）。Sprint-1~6 为早期降级实现；Sprint-7/8 已完成真实 LLM、PostgreSQL+pgvector、Embedding 与 RAG 向量召回接入；task-009 已完成 search 向量化 + 可选 zhparser 回退。仍降级：真实 Word / PDF 解析、OCR。验收证据见 `docs/09-verification.md §5`。

| Sprint | 日期 | 目标（REQ） | 实际交付 | 关联提交 / PR | 验证结果 | 残留风险 / 下一步 | 已回填 09 |
|---|---|---|---|---|---|---|---|
| Sprint-1 | 2026-07-03~ | 001/002/003 | 降级内存实现（权限过滤可用；Sprint-8 后 PG 仓储已接入） | 含于 Sprint-2~4 提交基线；PG 真实化见 Sprint-8 | 53 后端 tests 通过；Sprint-8 后 74 tests 通过 | RG-001 已在 Sprint-8 解除 | §2 / §5 |
| Sprint-2 | 2026-07-03 | 004/005/006 | 降级内存实现 + 前端编辑器 | `83fb782` | 通过（降级口径） | — | §5 |
| Sprint-3 | 2026-07-03 | 009/010 | 降级文本导入（仅 `.md`/`.txt`，无 PDF/OCR） | `0fe169b` | 通过（降级口径） | PDF / OCR 未实现（RG-003）→ 后续阶段 | §5 |
| Sprint-4 | 2026-07-04 | 007/008 | 内存搜索 + 降级 RAG（不调 LLM）+ 前端 UI；Sprint-7/8 后 RAG 已真实化 | `da9f6e5`/`5144f2a`/`bc03839`/`c5c177e`(fix)；真实化见 Sprint-7/8 | 通过（降级口径）；Sprint-7/8 后真实 LLM + 向量召回通过 | RG-001/002/004 已解除；search 向量化 + 可选 zhparser 已由 task-009 补齐 | §5 / §5.1 |
| Sprint-5 | 2026-07-05 | 036 | 空间术语 CRUD + 问答口径注入 | `5b78f0a` | 通过（降级口径） | — | §5 |
| Sprint-6 | 2026-07-06 | 011 | 桌面端集成 + Edge Headless / Chrome smoke | `cb6fb8a`（PR #28） | 部分通过 → 通过（降级口径） | 真实 PDF / OCR 未验证 → Phase2 | §5 |
| Sprint-7 | 2026-07-09 | 008 | LLM adapter（`llm_adapter.py`）+ rag 接入 + `.env` 模板 | `754d5eb`/`78a8550`（PR #45） | 55 tests + GLM-5.2 真实问答验证 | GPT/ollama 待验证；向量检索仍缺（RG-002 已验证·待 pgvector） | §5 / §6 |
| Sprint-8 | 2026-07-09~10 | 007/008 | pgvector 接入 task-008 T1–T7：基建（docker/compose + db.py）/ migrations 003-005 / ORM + PgRepository / 切单例 + demo seed / embedding 写入 / RAG 向量召回 / 测试 + 文档回写 | T1 `68453b0`(#47) · T2 `5e780fa`(#49) · T3 `12c9ba3`(#50) · T4 `4ccefb7`(#51) · T5 `a90d2a0`(#52) · T6 `f14b9d9`(#53) · T7 本批 | 74 tests（含 PG 集成 + embedding）+ uvicorn 冒烟全通 | RG-001/002→Go；search 向量化 + 可选 zhparser 已由 task-009 补齐；真实 PDF/OCR 仍 No-Go（RG-003） | §5 / §6 |
| Phase1 全量验收 | 2026-07-10 | 001..011/036 | Phase1 Demo closure 评估与全量验收记录；覆盖 Sprint-1~8、TC-P1-001~012、RG-001~005 | `24fc3c7` · `4f036cc`(#56) · `24ccfc8`(#57) · `d8d0f8f` | Conditional Go（Demo closure）；详见 `docs/09-verification.md §5` | 需人工确认是否升 Phase2；真实 Word / PDF 解析、OCR 真实化留后续 | §5 / §6 |
| task-009 search 向量化 + 可选 zhparser | 2026-07-10 | 007 | `/api/search` hybrid：substring + `ts_vector` SQL 候选 + pgvector 语义召回；migration 006 可选 zhparser / simple 回退 | 本 PR | `init_db()` 两次通过；76 后端 tests 通过（含 `tests.backend.test_search` 与真实 PG 语义搜索集成测试） | 当前 pgvector 镜像无 zhparser，中文分词回退 `simple`；不影响向量语义召回 | §5 / §6 |
| Sprint-9（P1A）实现 | 2026-07-11 | 011 | 前端结构聚焦重构：本地 `activeView` 四视图切换、右栏拆回文档 / 搜索 / 问答 / 术语主视图、桌面响应式 CSS | `9ede5b6`（PR #76） | `git diff --check`；`npm.cmd run build`；Chrome / Edge 900px headless smoke 通过 | 不阻塞 Phase1 Demo closure；P1A 仅作为既有 Demo 的前端结构体验收口 | §2 / §5（TC-P1-013 通过） |
| Sprint-10（P1B）实现 | 2026-07-12 | 011 | 前端工作台系统化重设计：TopBar + Nav Rail + Context Pane + Workspace 三层布局；Context Pane 随文档 / 搜索 / 问答 / 术语变化；CSS token + pane / toolbar / list-row / inspector 分层；新增正式设计文档与 HTML 原型 | 本批 | `git diff --check`；`npm.cmd run build`；Chrome / Edge 900px headless smoke 通过，覆盖登录、四视图切换、文档新建 / 编辑 / 版本恢复 / 删除、Markdown 预览、搜索来源打开、问答、术语新建 / 删除确认；无全局横向滚动 | 不阻塞 Phase1 Demo closure；P1B 仅作为既有 Demo 的前端工作台体验收口；不引 router / 组件库 / 新 API | §2 / §5（TC-P1-014 通过） |
| Sprint-16（P1.5A）实现 | 2026-07-15 | 037/009 | 批量 / 文件夹 `.md` / `.txt` 导入：`POST /api/import/batch`、逐文件结果、同名跳过、路径标题前缀；前端 drop zone、多文件 / 文件夹选择、批量摘要与逐条结果 | `e958001` | `git diff --check`；`python -m unittest tests.backend.test_imports tests.backend.test_import_api`（9 tests）；非 PG/embedding 后端业务测试 47 tests；`npm.cmd run build`；Chrome headless drop-zone smoke 通过 | 不改 DB schema、不引新依赖、不做 Word/PDF/PDF 导出；全量 PG/embedding 测试受本机环境限制未完成 | §5（TC-P1-015 通过） |
| Sprint-17（P1.5A）实现 | 2026-07-16 | 038 | 单文档 `.md` 下载 + 空间 ZIP 导出备份：`GET /api/documents/{id}/export`（`text/markdown`）+ `GET /api/export/space`（标准库 `zipfile`，按权限过滤，不可见文档不进 ZIP）；前端文档详情"下载 `.md`" + TopBar"导出空间 ZIP" + `api.ts` blob 下载 | 本批 | `git diff --check`；`python -m unittest tests.backend.test_export`（13 tests）；回归 `test_imports` + `test_import_api`（9 tests）；`npm.cmd run build`；FastAPI TestClient 端到端 HTTP smoke（路由注册 / 异常 handler / 二进制 Response / 权限 4004 / 非法 format 4220 / 无 token 4001） | 不改 DB schema、不引依赖、不做 PDF；全量 PG/embedding 测试受本机环境限制未完成；浏览器按钮下载落盘的人工 smoke 可用 `scripts/run-sprint16-demo.ps1` 补 | §5（TC-P1-016 通过） |
| Sprint-12①（P1C）实现 | 2026-07-16 | 011 | 登录态持久化：`App.tsx` 将 `{token,userId,currentSpaceId}` 存 localStorage、启动恢复、切空间同步、token 失效（invalid token / 401）自动清除登出 | 本批 | `npm.cmd run build` 通过；刷新不掉线端到端 smoke 建议用 `scripts/run-sprint16-demo.ps1`（内存后端，不需 Docker）人工验证 | 不改 API / DB / 权限 / 依赖；seed 自索引（Sprint-12②）待做 | §5 |
| Sprint-12②（P1C）实现 | 2026-07-16 | 011 | seed 自索引：`document.py` 加 `ensure_documents_indexed`（回填无 chunks 文档的分块 + embedding，幂等），`main.py` lifespan `init_db` 后调用 | 本批 | `python -m unittest tests.backend.test_seed_index`（4 tests）；回归 `test_document`（5 tests）；embedding 向量集成验证待本机 PG（沙箱受限，`_safe_embed` 降级时 chunks 仍写入、关键词搜索可用） | 不改 DB schema / 不改 seed SQL / 不引依赖；demo 内存模式 lifespan noop 不触发（PG 生产生效） | §5 |
| Sprint-13（P1C）实现 | 2026-07-16 | 003 | 外部只读真实化（口径 B）：`permission.py` `can_write_document`（external 仅 owner 可写）+ `document.py` update/delete/restore 写校验（`DocumentAccessError`）+ `documents.py` 端点 403/4003 + `test_permission`/`test_external_write` | 本批 | `python -m unittest tests.backend.test_permission tests.backend.test_external_write`（3 个 can_write + 5 个 service 级拦截）；回归 44 tests 通过 | 不改 DB schema / 权限定义 / 可见性边界 / 依赖；team/private 写权限不变 | §5 |
| Phase2A·REQ-026 Task A（后端） | 2026-07-16 | 026 | 内链/反链后端：迁移 007 `lumen_doc_links` + entities/ORM + Demo/Pg repository（list/find_by_title/replace_wikilinks/upsert_manual）+ `service/doc_links`（list_links 权限折算 / upsert_link）+ `service/document` `sync_document_wikilinks`（保存时解析 `[[target]]`）+ `api/doc_links`（API-018 GET/POST）+ `main.py` 注册 | 本批 | `test_doc_links` 8 tests + 全回归 52 tests；TestClient 路由 smoke 5/5（outbound resolved/unresolved、manual POST、4220） | 不改既有 DB 表/权限模型/依赖；wikilink 拒手动 POST（仅正文解析）；前端 Task B 已完成（6228f3f，UI smoke 4/4 通过） | §5（TC-P2-LINK-001 后端） |
| Phase2A·REQ-026 Task B（前端） | 2026-07-16 | 026 | 内链/反链前端：`api.ts` DocLink client（`listDocLinks`/`createDocLink`）+ `MarkdownBlock` `[[wikilink]]` 四态渲染（resolved 可点跳转 / unresolved 虚线占位 / no_access 隐藏锚文本显占位 / pending 编辑未同步；自定义 `urlTransform` 放行 wikilink scheme）+ `DocumentsFeature` 反链面板（来源标题取自 `documents` 按 `source_document_id` 查）+ `App.tsx` 出链/反链加载 + `panels.css` 三态样式 | 本批（`6228f3f`） | `npm.cmd run build`（tsc -b + vite，209 modules）；react-dom/server SSR 五态渲染验证（resolved/unresolved/no_access/pending/plain，no_access 锚文本已隐藏）；浏览器 UI smoke 4/4 通过（resolved 跳转 / unresolved 占位 / 反链面板 / pending） | no_access 单用户单空间场景未浏览器验证（SSR 已验证隐藏锚文本）；`docs/07` API-018 偏差本次回写 | §5（TC-P2-LINK-001 通过） |
| Phase2A·REQ-012 Task A（后端） | 2026-07-17 | 012 | 标签后端：迁移 008 `lumen_tags` / `lumen_tag_links` + entities/ORM + Demo/Pg repository + `service/tag.py` + `api/tags.py`（API-014/027/031/032） | `1e4cf48` | `tests/backend/test_tags.py` 15/15 通过 | 扁平标签最小版；标签空间隔离，document_count 只统计当前用户可见文档；不做层级 / 组合筛选 / AI 自动打标签 | §5（TC-P2-TAG-001 后端） |
| Phase2A·REQ-012 Task B（前端） | 2026-07-17 | 012 | 标签前端：`api/tags.ts` + `useTags` + `TagsFeature` 独立标签视图 + 文档详情打标签 / 移除 + 标签下文档筛选入口 | `d07688b` | `npm run build` 通过；浏览器 smoke 通过 | 最小版仅单标签筛选；归档标签不破坏历史关联；批量打标签 / AI 建议留后续 | §5（TC-P2-TAG-001 通过） |
| Phase2A·REQ-025 Task A（后端） | 2026-07-18 | 025 | 快速录入后端：迁移 009 `lumen_quick_entries` + entities/ORM + Demo/Pg repository（create/get/list/update + _to_quick_entry）+ `service/quick_entry`（capture 三 mode：draft/create_document/append_document + discard）+ `api/quick_entry`（API-017 POST capture + DELETE discard）+ `main.py` 注册 | `f771e02` | `test_quick_entry` 17/17 + service 回归 53 + 迁移 009 PG 建表/PgRepository smoke + test_api_routes 15 passed | 最小版不暴露 list endpoint；draft 默认 owner 私有；`source` 字段 07 草案未列，本次 Task C 回写补 | §5（TC-P2-QUICK-001 后端） |
| Phase2A·REQ-025 Task B（前端） | 2026-07-19 | 025 | 快速录入前端：`api/quickEntry.ts`（capture/discard + 类型）+ `api.ts` barrel + `app/useQuickEntry.ts`（表单 state + handler）+ `features/QuickEntryFeature.tsx`（顶部胶囊 + 侧滑抽屉：标题/来源/摘要/tag_ids/mode + 结果区丢弃/打开）+ `App.tsx` 集成 + `panels.css` | `bad8fe5` | `npm run build` 通过；API smoke（draft/create/append + discard + 4220）通过；浏览器 smoke 通过 | discard 最小版（后端无 list，会话内保留最近一次草稿）；App.tsx +41 胶水，整体拆分留 APP-SIZE-C-011 | §5（TC-P2-QUICK-001 通过） |
| Sprint-21 slice 3a/3c 回归 | 2026-08-01 | 011 | Doc-First UX 首批：栏显隐 / 默认收起 / 快捷键唤出、首页默认落地、主区少容器视觉收口、documents 空态引导与返回能力；本地 demo 启动脚本补 Windows `Path`/`PATH` 兼容修复作为 smoke 支撑 | `216fcc3`、`e0b8db5`、`bf0c693`、PR #97 | `volta run --node 22.17.1 npm run build` 已通过；用户本地 Chrome/Edge smoke + TC-P1-014 回归通过（documents 减框、空态引导/返回、900px 无破版） | slice 3d 导入弹窗化已另行补完成包；`Path`/`PATH` 根因已另起模板回流提案 | §2 / §5 / §5.1 |
| Sprint-21 slice 3d 导入弹窗化 | 2026-08-01 | 037/011 | 导入入口从 ContextPane 常驻区迁到 DocumentsFeature toolbar「导入」按钮 + 居中 modal；复用 `useImport` / API-029，保留拖拽、多文件 / 文件夹选择、权限、逐条结果与同名跳过；导入成功后自动关闭 modal 并刷新文档列表 | 本地未提交 | `volta run --node 22.17.1 npm run build` 通过（248 modules）；`git diff --check` 通过（仅 CRLF warning）；用户确认 smoke 通过，覆盖 TC-P1-015 导入入口形态回归与 TC-P1-014 栏显隐 / 900px 布局回归 | 未 bump VERSION / CHANGELOG；未提交 / 未推送；3b 单列阅读/编辑另行启动前需先拆 inspector（DocumentsFeature 313 行） | §2 / §5 |
| Sprint-21 slice 3b 单列阅读/编辑切换 | 2026-08-01 | 011/025/038 | §9.5.4 单列阅读/编辑/并排三态切换；快速录入迁 TopBar + 用户头像；右栏重构 `DocumentInspectorFeature`（版本/链接/标签/AI tabs）。含 smoke 反馈修复：① download 中文标题 `.md` 导出 500（`export.py` ASCII fallback + `filename*` + 前端解析 + `test_export` 14 OK）② quick-entry A（默认 create_document + 移除 draft 入口，后端 draft 契约保留）③ 标签 inspector 内联「新建并打标签」+ 首页标签卡片 + placeholder | 本地未提交 | `volta run --node 22.17.1 npm run build` 通过（252 modules）；用户本地 Chrome smoke 全过（G1–G26） | 未 bump VERSION / CHANGELOG；未提交 / 未推送；真目录（方案2）作候选另行立项 | §2 / §5 / §5.1 |

> Sprint-8 后：pgvector / Embedding / LLM 已接入（RG-001/002/004 Go），基础 Web / ORM 栈为 Go（RG-005）。Phase1 全量验收结论为 Conditional Go（Demo closure）；仍移出 P1：真实 PDF 解析、图片 OCR（REQ-010，RG-003 No-Go，后续阶段）。Sprint-9/10/12/13 为已完成 Demo 之上的前端体验与可用性收口；Phase1.5A 已完成批量入库与导出备份。Phase2A 已完成 REQ-026 / REQ-012 / REQ-025 三个 vertical slice；Sprint-11 仅保留为 P2 UI / WSG 实现前门禁草案，Phase2B 启动前需重新确认范围、进入 / 退出标准与验证包。

---

<!-- 升阶段时在此原位追加 Phase2 Sprint，不删除上方内容 -->

## 待人工确认项

- Phase2A closure 已确认：REQ-026 内链/反链（fc2b869/6228f3f）+ REQ-012 标签（1e4cf48/d07688b）+ REQ-025 快速录入（f771e02/bad8fe5）均完成；个人知识组织「互联 / 组织 / 快录」闭环成形。
- 是否正式进入 Phase2B：需确认团队 MVP 首批范围（建议先评估 REQ-014 AI 润色 / 写作引用与 REQ-013/024 时间轴候选）、进入 / 退出标准、数据外发风险接受方式、`04/05` 设计补强和 `08/09` 验证包。
- **P1.5B 候选**：单文档 PDF 导出（Sprint-18 / REQ-027）、真实 Word/PDF 文本提取、zhparser 中文分词增强仍需 RG / 选型 / 中文样例验证；不阻塞 Phase2A closure。
- **Sprint-0′ / APP-SIZE-C-011**：框架补课已完成，后续 App 主应用文件减压也已由 APP-SIZE-C-011 收口（App.tsx 741→306，v0.2.1）；继续保持新功能优先下沉到域 hook / feature。
- **TC-P1-001~006/012 是否升级为「通过」**：09 已校准为「PG 仓储·Sprint-8 起真实化」（仍标条件通过）；是否进一步升级为「通过」待人工确认。
