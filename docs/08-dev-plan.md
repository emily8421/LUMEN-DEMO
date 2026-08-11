# 08 开发计划

> 按阶段拆 Sprint。本文件承载 Phase1 → Phase1.5A → Phase2A 的计划与完成记录；
> 升阶段时在**原位追加**新 Sprint（global-rules §8，不删旧 Sprint）。
> Sprint 格式见 `ai/global-rules.md` §3。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 当前 Phase | **Phase2D（账户与多人权限）已完成（2026-08-07 收口）：Sprint-26 账号体系基础（TC-P2-AUTH-001 / PR#112 v3.0.0）+ Sprint-27 权限多人化（TC-P2-ACC-001 / PR#114）+ Sprint-28 角色分层 + 用户管理 + 团队空间加入（TC-P2-ACC-002 / PR#117 v3.1.0）三 slice 全部验收通过、退出标准达成；Sprint-27 P2 两项 + Sprint-28 偏差经用户确认全接受、留后续；不升 Phase，下一阶段范围待用户定义**；Phase2C（本地知识源接入）已完成（2026-08-06）；Phase2B（团队 MVP）已完成（2026-08-05 收口；2026-07-30 切指针；RG-008 升 Go；Sprint-19/20/21/22 均完成验收） |
| 交付物形态 | Demo / 个人可用 Alpha / 个人知识组织 |
| 输入基线 | `docs/03-prd.md` §3、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/09-verification.md` |
| 当前状态 | **维护态**（2026-08-07 收口）。Phase2D（账户与多人权限）已完成，下一阶段范围待用户定义；无未完成执行任务。各 Sprint 状态见下方「Sprint 总览」，验收证据见 `docs/09-verification.md` §5。 |
| 最后更新 | 2026-08-07（Phase2D 收口：Sprint-26/27/28 三 slice 全部验收通过、退出标准达成；Sprint-27 P2 两项 + Sprint-28 偏差经用户确认全接受、留后续；不升 Phase，下一阶段范围待用户定义）；前次 2026-08-07（Phase2D Sprint-26/27/28 实现 + 契约回写） |

> **阶段完成线**（历史指针；各 Sprint 详情见「Sprint 总览」，不在此重复）：
> - **Phase1 Demo**：已完成，全量验收 Conditional Go。
> - **Phase1.5A**：REQ-037 批量 / 文件夹导入 + REQ-038 `.md` / ZIP 导出。
> - **Phase1.5B**：REQ-027 PDF 导出（Sprint-18 / API-019 / TC-P1-017 / v1.6.0；v1.7.0 下载闭环）。Word-PDF / zhparser 待后续 RG。
> - **Phase2A**：REQ-026 内链反链 + REQ-012 标签 + REQ-025 快速录入（TC-P2-LINK/TAG/QUICK-001）。
> - **Phase2B（团队 MVP）**：2026-08-05 收口。REQ-014 AI 润色（TC-P2-AI-001 / v1.1.0）+ REQ-013a/024 时间线（v1.5.0）+ REQ-039 文档目录树（TC-P2-FOLDER-001 / API-029 `preserve_structure` / API-038）；Sprint-21 Doc-First UX。
> - **Phase2C（本地知识源接入）**：2026-08-06 完成。REQ-018 模式 B（TC-P2-VAULT-001 / PR#108 / v2.0.0）；Sprint-24 子树导入 UI + Sprint-25 帮助手册随 Wave 1 收口。
> - **Phase2D（账户与多人权限）**：2026-08-07 收口。Sprint-26 账号体系基础（TC-P2-AUTH-001 / PR#112 / v3.0.0）+ Sprint-27 权限多人化（TC-P2-ACC-001 / PR#114）+ Sprint-28 角色分层 + 用户管理 + 团队空间加入（TC-P2-ACC-002 / PR#117 / v3.1.0）。Sprint-27 P2 两项 + Sprint-28 偏差经用户确认接受、留后续。

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
| Sprint-12（P1C·可用性 A） | 登录态持久化 + seed 自索引修复 | 011（可用性收口，不新增 REQ） | 09 §5 Sprint-8 记录、本次审计 §三 | frontend `App.tsx` + backend seed / 启动钩子 | 09 §5 描述性验收 + build / `test_seed_index` / `test_document` | 已完成（2026-07-16；Sprint-12①/②，见 §5 / `docs/09-verification.md` §5） | §5 |
| Sprint-13（P1C·权限） | 外部只读权限真实化（EXTERNAL 写操作拦截） | 003（权限收口） | design/permissions、06、07 | backend `service/permission` + api | TC-P1-003 扩展 + `test_permission` / `test_external_write` | 已完成（2026-07-16；见 §5 / `docs/09-verification.md` §5） | §5 |
| Sprint-14（P1C·导入·候选·需 RG） | 真实 Word/PDF 文本提取（REQ-009 真实化） | 009（导入真实化） | design/ingestion、05（RG 待评估）、本次审计 §二 | backend `service/imports` + 依赖 | TC-P1-009 扩展 | 候选·待确认（需选型 + RG；未编码） | — |
| Sprint-15（P1C·可选·分词·候选） | zhparser 中文分词接入 | 007（搜索质量收口） | 05、09 task-009 记录、docker | docker 镜像 + migration 006 | TC-P1-007 扩展 | 候选·可选·待确认（中成本；未编码） | — |
| Sprint-16（P1.5·批量导入） | 多文件 + 文件夹拖拽导入（drop zone + 批量进度 + 标题前缀 + 冲突跳过） | 037（新增）+ 009 扩展 | 02 REQ-037、07 API-029 | frontend ContextPane drop zone + backend api/imports 批量 + service | TC-P1-015 | 已完成（自动化 + Chrome headless drop-zone smoke 通过） | — |
| Sprint-17（P1.5A·导出备份） | 单文档 .md 下载 + 空间 ZIP 打包 | 038（新增） | 02 REQ-038、07 API-030 | frontend 下载入口 + backend api/export（zipfile）+ service | TC-P1-016 | 已完成（后端 tests + 端到端 HTTP smoke 通过） | — |
| Sprint-18（P1.5B·PDF 导出） | 单文档 PDF 导出（Markdown → PDF，中文）+ 下载闭环 | 027（从 Phase2 提前） | 02 REQ-027、07 API-019、05 RG-006、design/export-delivery | backend migration 013 + DocExport entity/ORM/repository + service + `POST /api/export-pdf` + `GET /api/export-pdf/{export_id}/download`；frontend 文档详情入口生成后直接下载 | TC-P1-017 | 已完成（v1.6.0 生成闭环；v1.7.0 下载闭环） | — |
| Sprint-19（Phase2B·AI 润色·首个 vertical slice） | AI 润色 polish + 写作引用 citation（API-028）+ `lumen_ai_drafts` migration 010 | 014 | 02 REQ-014、03 Phase2B、04 Flow-005、05 TCD-010 / RG-004 / RG-008、06 lumen_ai_drafts、07 API-028、design/ai-polish | backend service/ai_polish + api + migration 010；frontend 写作侧边栏 | TC-P2-AI-001（后端 tests + prompt 边界审查 + UI smoke + D-C-001 citation 延迟量化） | **已完成（RG-008 Go，2026-07-30；前端闭环 PR#89–95 / v1.1.0，TC-P2-AI-001 live UI smoke 2026-07-31 通过；D-C-001 2026-08-04 量化通过，当前不做异步 job）** | — |
| Sprint-20（Phase2B·**主题时间线**·第二 slice） | **主题时间线（关键词/标签驱动）** + 密度热条（API-033 `q`/`tag_ids` + actor + ratio） | 013a/024 | 02 REQ-013a/024、04 Flow-009、06 lumen_documents + tags + links、07 API-033、design/timeline | backend service/timeline + api（关键词命中复用 chunk.ts_vector）；frontend 主题时间线视图（搜索框 + 标签入口 + 密度热条 + 事件列表 + 逃生舱） | TC-P2-TL-001（后端 tests + Chrome/Edge smoke） | **已完成（task-030；后端自动化验证 + frontend build + 运行态 API smoke + Edge headless 浏览器 smoke 通过）** | tasks/task-030-timeline.md |
| Sprint-21（Phase2B·Doc-First UX） | slice 3a 侧栏可隐藏/默认收起/三路唤出/记忆 + slice 3c 默认落地欢迎页+主区少容器视觉收口+documents 空态引导 + slice 3d 导入入口弹窗化（§9.5 基线） | 011 + 037（P1B 默认行为升级 + 导入入口形态，不新增 REQ） | design/frontend-interaction §9.5（§9.5.8 导入弹窗）、research/prototypes/2026-07-31-obsidian-inspired-*、09 TC-P1-014/TC-P1-015 | frontend App.tsx + app/{usePaneLayout,pane-layout-store,TopBar,ContextPane} + features/{Welcome,DocumentEmptyState,Documents,Import}Feature + styles | TC-P1-014 回归 +（3d）TC-P1-015 回归 + Chrome/Edge smoke | 已完成（3a/3c 随 PR #97 合并；3d 本地编码完成并通过 build + 用户 smoke，TC-P1-015/014 回归通过；已随 v1.5.x 系列发布） | tasks/task-021..025 |
| Sprint-22（Phase2B·文档目录树·第三 slice） | `lumen_folders` 嵌套树 + 文档 `folder_id` 归属 + 文件夹 CRUD/移动/排序（API-034..038）+ 导入 API-029 `preserve_structure` 保留结构（Flow-D-010..013）+ 前端文件管理器 | 039（新增）+ 037 扩展 | 02 REQ-039、03 Phase2B 第三 slice、06 lumen_folders/folder_id/migration 011、07 API-034..038 + API-029、design/folder-tree、design/ingestion Flow-006 | backend migration 011 + service/folder + api/folders + document folder move + import `preserve_structure` 改造；frontend 文件管理器（树渲染 + CRUD + 移动 + 排序） | TC-P2-FOLDER-001 + TC-P1-015 扩展（后端 tests + Chrome/Edge smoke） | **后端核心已完成（task-027，PR #103 已合并）；导入 `preserve_structure` 已完成（task-028）；前端文件管理器基础能力 + API-038 单文档移动已完成（task-029，本地自动化验证 + 运行态 API smoke + 用户浏览器 smoke 通过）；浏览器自动化 smoke 已补（2026-08-04，`scripts/smoke-folder-tree-browser.mjs`）** | tasks/task-027-folder-tree-backend.md；tasks/task-028-import-preserve-structure.md；tasks/task-029-folder-tree-frontend.md |
| Sprint-23A（候选·导入规模修复） | 1000+ 文件夹导入分批上传 + 汇总结果 | 037/039 | 07 API-029、design/ingestion Flow-006、09 TC-P1-015 | frontend `api/imports.ts` + `app/useImport.ts` + `features/ImportFeature.tsx` | TC-P1-015 回归 + 1000+ 文件夹 smoke | 已完成（PR #104 已合并，v1.7.1 发布）：前端分批 50/批顺序上传 + 逐批失败隔离 + 汇总，失败项全显/成功项截断；纯前端、不改后端 API；1000 文件 smoke 通过（RISK-P1-008 关闭，见 `docs/09-verification.md`） | — |
| Sprint-23B（Vault 兼容 RG·已完成） | Obsidian Vault 兼容技术验证：RG-009 PoC + 双模式设计 + 左侧分区 | 018/037/039 | 02 REQ-018、04 ADR-011、05 TCD-011 / RG-009、06 `lumen_vault_mounts`、07 REQ-018、design/ingestion Flow-D-014、design/frontend-interaction | PoC / 文档 / 原型 | TC-P2-VAULT-001（已定义待执行） | **已完成（RG-009 Go 2026-08-05，REQ-018 升 Phase2C）**；`docs/research/2026-08-05-rg009-vault-local-mount-poc.{md,html}` | — |
| Sprint-23C（Phase2C·模式 B 编码·进行中） | REQ-018 模式 B 浏览器 File System Access 编码：句柄持久化 + 本地索引搜索 + 左侧分区 + 按需导入 | 018 | 03 Phase2C、04 Flow-010、05 TCD-011 / RG-009 / TC-P2-VAULT-001、06 `lumen_vault_mounts`（migration 014）、07 模式 B 零后端 API、design/ingestion Flow-D-014、design/frontend-interaction CMP-P2-TREE / PATH-P2-008 | 接 `frontend/src/`（ContextPane 本地挂载分区 + useLocalVaultMount hook）；不引第三方依赖 | TC-P2-VAULT-001 | **已完成**（2026-08-06，task-031..034，TC-P2-VAULT-001 通过） | tasks/task-031..034 |
| Sprint-24（Phase2C 增强·子树导入 UI·已完成） | REQ-018 模式 B 增强：本地挂载目录树「选子文件夹导入」UI（task-033 留后续），复用 API-029 + `preserveStructure` | 018 扩展（不新增 REQ） | 03 Phase2C、design/ingestion Flow-D-014、07 API-029、09 TC-P2-VAULT-002、tasks/task-033 | frontend `LocalMountPane` + `useLocalVaultMount`（选节点导入入口）；不引第三方依赖 | TC-P2-VAULT-002 | **已完成**（2026-08-06，TC-P2-VAULT-002 通过） | tasks/task-035-subtree-import-ui.md |
| Sprint-25（帮助手册 L0+L1·已完成） | REQ-011 可用性收口：L0 user-guide 任务导向重组 + L1 首次引导 / 新手清单 / 空状态 / 帮助速查 | 011 | design/help-onboarding、09 TC-P2-HELP-001、tasks/task-036 | frontend（onboarding-store / OnboardingGuide / 各视图空状态 / TopBar 帮助速查）+ docs/env/user-guide；不引第三方依赖 | TC-P2-HELP-001 | **已完成**（2026-08-06，TC-P2-HELP-001 通过，PR#110 v2.2.0） | tasks/task-036-help-onboarding.md |
| Sprint-26（Phase2D·账号体系基础·**已完成**） | REQ-040/041/042 账号体系基础：注册 + 凭证登录（bcrypt）+ 登出会话（不透明 token + `lumen_sessions`）+ 统一 `get_current_user` + 基础登录/注册页 + demo 模式物理隔离 | 040/041/042 | 03 Phase2D、design/accounts-auth、02 REQ-040..042、01 U-45..47、09 TC-P2-AUTH-001、tasks/task-038 | backend（auth_context / auth service+api / migration 014 / 13 router 收敛）+ frontend（登录/注册页 + 登出）；+ `bcrypt` 5.0.0（不采用 passlib） | TC-P2-AUTH-001 | **已完成**（2026-08-07，编码 + 后端回归通过 + 浏览器 smoke PASS）；权限多人化 / 角色 / 用户管理 UI 留 Sprint-27/28 | tasks/task-038-account-system-foundation.md |
| Sprint-27（Phase2D·权限多人化·**已完成**） | REQ-001/002/003 扩展（REQ-043/044）：owner_id 跨用户过滤全路径回归 + 私有文档按 owner 过滤 + external 仅 owner 可写 + 跨用户隔离回归 | 043/044 | 03 Phase2D、design/accounts-auth §17、02 REQ-043/044、01 U-48/49 + AC-P2-ACC-001..003、09 TC-P2-ACC-001、tasks/task-039 | backend（permission 谓词全路径审计 + 隔离回归 tests：`test_permission.py` 扩展 + 新增多用户隔离用例）；预期零新依赖 / 零 migration；前端无改动（或最小） | TC-P2-ACC-001 | **已完成（2026-08-07）**：全路径审计（P0 doc-links 源文档可见性修复 + 多用户隔离回归 229 OK（skipped=2）+ 双用户浏览器 smoke PASS）；P2 两项记录（`visible_document_where_clause` 未使用 / `upsert_link` 目标解析）待确认接受 | tasks/task-039-permission-multi-user.md |
| Sprint-28（Phase2D·角色分层 + 用户管理 + 团队空间加入·**已完成**） | REQ-045 全局角色分层（`lumen_users.role` admin/member）+ REQ-046 用户管理后台（admin 域：用户列表 / 过滤 / 改角色 / 禁用启用）+ REQ-047 团队空间加入机制（space 域成员 CRUD：按 email 添加 / 改空间角色 / 移除 + 空间设置 UI） | 045/046/047 | 03 Phase2D、design/accounts-auth §18、02 REQ-045..047、01 U-50..52 + AC-P2-ACC-004..006、09 TC-P2-ACC-002、tasks/task-040 | backend（migration 016 `lumen_users.role` + admin 域 user API + space 域 member API + 用户搜索）+ frontend（用户管理页 + 空间设置成员管理）；零新依赖 | TC-P2-ACC-002 | **已完成（2026-08-07）**：migration 016（`lumen_users.role` + `lumen_space_members.created_at`）+ admin 域用户管理（API-044/045）+ space 域成员 CRUD（API-046..049）+ 受限用户搜索（API-050）+ 登录响应 role；前端用户管理页 + 空间设置成员管理；TC-P2-ACC-002 通过（backend 275 OK + 浏览器双视角 smoke PASS）；偏差见 accounts-auth §18.9 | tasks/task-040-role-user-admin.md |
| Sprint-29（维护态 UI 改进批次·**已完成**） | 术语领域树（REQ-048，术语双栏升级为左树导航 + 主区单详情面板）+ 标签 CRUD 前端接线（API-027）+ 全局搜索命令面板（批2a）+ 顶栏图标迁移与折叠箭头（批1） | 048（新增）+ 036 扩展 + 012 扩展 | 02 REQ-048、06 lumen_term_categories/migration 017、07 API-051..053 + API-012/013 扩字段、design/term-management、research/2026-08-07-term-domain-tree-analysis | backend migration 017 + service/term_category + api/term_categories + terms 扩字段 + tests；frontend api/useTermCategories/TermCategoryTree/TermsFeature/ContextPane/useTags/TagsFeature + 命令面板 + 顶栏 | TC-P2-TERM-001 + 批2a 7 验收点 | **已完成（2026-08-07）**：步 A 后端（migration 017 + term_category 全套，298 tests OK + 真 PG 应用）+ 步 B 前端（build 291 modules + 运行时 smoke）+ 批2b 步2 标签 CRUD + 批1/批2a 已验收 + 用户浏览器验收通过；**已提交 `979094e` 直推 main + bump v3.2.0**（VERSION/CHANGELOG 三件套，REQ-048 + API-051..053 = MINOR）；09 §5.1 已回写；CI Project Check success | — |
| 维护态批3（AI 助手·已完成） | AI 助手抽屉 + 「基于知识库」开关 + 多轮对话 + LLM 多通道切换（REQ-008 扩展） | REQ-008 扩展（不另编号，用户确认） | 03 REQ-008、07 API-010 扩展（history/use_knowledge_base/llm_provider）+ 新增 GET /api/llm-configs、design/ai-assistant、09 TC-P2-ASSIST-001 | backend（`rag.answer_question` 增 history/use_knowledge_base/llm_provider + `llm_adapter` 多配置 LLM_PROVIDERS + deepseek + `_resolve_chat_fn` 闭包修复 + tests）；frontend（useAiAssistant/AiAssistant 抽屉 + LLM 通道下拉 + 命令面板「问 AI」改开抽屉 + run-sprint16-demo 加载 .env） | TC-P2-ASSIST-001 + `scripts/smoke-ai-assistant-browser.mjs` | **编码完成 + 验证通过 + 用户验收（2026-08-08）**：后端 310 OK（+13 tests）+ build 294 modules + smoke PASS（切 deepseek 通用对话真实出文）+ 用户浏览器验收通过；契约回写 07/09/design/ai-assistant；已提交 `59dd898`（v3.3.0，2026-08-08） | — |

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
| Sprint-12~15（P1.5 可用性收口·混合状态） | Phase1 closure（Sprint-8/10）已完成 | 范围蔓延到 Phase2 高级功能；跳过收口直接做 Phase2 编码 | 可与 Phase2 tech-env-eval 并行评估 | 低成本收口已完成（Sprint-12 登录持久化 / seed 自索引、Sprint-13 外部只读）；重依赖项仍为候选（Sprint-14 Word/PDF 需选型 + RG、Sprint-15 zhparser 可选） | M10 日常可用（Sprint-12/13 已完成；Sprint-14/15 候选） |
| Sprint-19（Phase2B·AI 润色·首个 slice） | Phase2A closure + **RG-008 Go（后端通过）** + Sprint-11 UI/WSG 门禁重跑 | ~~数据外发护栏未落实~~（后端已落实：权限过滤 / 5030 / hash）；~~前端 half 待续~~ 前端已闭环（PR#89–95 / v1.1.0，TC-P2-AI-001 live UI smoke 2026-07-31 通过）；D-C-001 citation 同步延迟量化已通过 | 否（首个 slice） | 后端 polish/citation + migration 010 + 前端写作侧边栏已完成；citation 同步模式保持，暂不引异步 job | M11 Phase2B AI 润色可用 |
| Sprint-20（Phase2B·**主题时间线**·第二 slice） | **Sprint-19 已落地** + folder-tree（Sprint-22）基础能力已完成 | 范围蔓延到关联图（REQ-013b）/ 因果推理（愿景） | 已完成（后端自动化验证 + frontend build + 运行态 API smoke + Edge headless 浏览器 smoke + 真实 PG 大数据性能 smoke 通过） | 数据来源候选 A 已落地（不建表，migration 012 仅加时间索引）；关键词命中复用 chunk.ts_vector；大集合降级阈值由单测覆盖；真实 PG smoke：620 docs + 240 links，density_events=2100，degraded=true，elapsed_ms=2677.61 | M12 Phase2B 主题时间线可用 |
| Sprint-21（Phase2B·Doc-First UX·slice 3a + 3c + 3d） | Phase2B closure（Sprint-19）+ DF-C-001 门禁（每 slice 重跑）+ §9.5 基线用户确认 | 改 REQ-011 已验收默认行为 → 需 TC-P1-014 回归；栏 state 蔓延到全局；导入入口形态变化 → 需 TC-P1-015 回归 | 否（UI 布局 slice） | slice 3a：顶栏图标唤出 + Ctrl+B/R + localStorage 记忆；先左目录后右栏 Inspector。slice 3c：home 欢迎引导页（默认落地）+ 主区少容器视觉收口 + 正文限宽 + documents 空态引导/返回。slice 3d：导入区从 ContextPane 常驻 section 迁到 DocumentsFeature toolbar 触发的居中 modal，复用 `useImport` / API-029，不动骨架/后端/API。**进展（2026-08-01）：3a/3c/3d 编码完成，build 绿，用户 smoke + TC-P1-014/015 回归通过**；3b 单列阅读/编辑另行启动前需先拆 inspector | M13 Doc-First 布局可用 |
| Sprint-22（Phase2B·文档目录树·第三 slice） | folder-tree 设计 FT-C-* 确认 + 06/07 契约回填 + REQ-039 U-ID/SC 追溯补齐 | 目标 folder 列表首版仅包含已加载 folder；folder 权限模型误读（folder 不独立设权限） | 可与 Sprint-20 时间轴部分并行（均基于 `lumen_documents`，互不冲突） | 后端契约（migration 011 + folder service/API）已完成；导入 `preserve_structure` 已完成；前端文件管理器基础树 / 菜单 / inline 文件夹编辑 / 单文档移动已完成，并通过运行态 API smoke + 用户浏览器 smoke + 浏览器自动化 smoke；folder 不独立设权限，文档可见性仍按 permission | M14 Phase2B 文档目录树可用 |
| Sprint-23A（候选·导入规模修复） | Sprint-22 + 用户复现 1000+ 文件夹导入失败 | 一次 multipart 请求撞 FastAPI/Starlette 默认 `max_files/max_fields=1000`；前端一次渲染过多结果 | 可先于 Vault RG 单独做 | 前端分批调用 API-029，每批 **50** 个文件（CPU embedding 同步耗时约束，避免单请求超时；原估 100-200 偏大），顺序上传 + 逐批失败隔离 + 汇总成功/失败/跳过；不改后端 API | M15 大文件夹导入可用（已编码 PR #104，待合并） |
| Sprint-23B（Vault 兼容 RG·已完成） | Sprint-23A 或现有导入可用；用户确认双模式方向 | ~~浏览器本地目录授权 / 持久化、隐私边界、仅本地索引、文件变更同步、桌面运行形态未验证~~ **已由 RG-009 PoC 解除（2026-08-05 Go）** | 可与 Word/PDF 解析 RG 并行 | PoC / 原型 / 技术评估已完成；REQ-018 升 Phase2C，编码进 Sprint-23C | M16 个人本地 Vault 连接器可行性已确认（Go），进入 Phase2C 编码 |

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
| Sprint-20（Phase2B） | TC-P2-TL-001 | 单元 + 集成 + UI smoke | `.venv\Scripts\python.exe -m unittest tests.backend.test_timeline`；`npm run build`（frontend）；运行态 API smoke；Edge headless CDP 浏览器 smoke | Chrome / Edge：**主题时间线（关键词命中 + 标签入口）**、密度热条（含量化 ratio）、actor、零命中空态、大集合降级 / 列表逃生舱 | 数据来源候选 A（不建表）；关键词命中复用 chunk.ts_vector；大集合聚合降级 |
| Sprint-21（Phase2B·Doc-First UX） | TC-P1-014（3a/3c/3d 回归）+ TC-P1-015（3d 入口形态回归） | 前端构建 + 浏览器 smoke + 回归验收 | `volta run --node 22.17.1 npm run build`（frontend） | Chrome / Edge：栏显隐、首页默认落地、documents 减框、空态引导/返回、导入 modal 打开 / 关闭 / 文件选择 / 导入成功刷新、900px 不破版、文档 / 搜索 / 问答 / 术语主流程 | 不新增 API / 后端能力；不引 router / 组件库；3d 只迁移导入入口容器，不改导入契约 |
| Sprint-22（Phase2B·文档目录树·候选） | TC-P2-FOLDER-001 + TC-P1-015 扩展（`preserve_structure` 保留结构） | 单元 + 集成 + UI smoke | `.venv\Scripts\python.exe -m unittest discover -s tests/backend`（test_folder / test_document / test_imports）；`volta run --node 22.17.1 npm run build`；`volta run --node 22.17.1 node scripts/smoke-folder-tree-browser.mjs` | Chrome / Edge：文件夹树渲染、新建/移动/排序/删除、单文档移动、导入文件夹后目录结构保留、防环/跨空间/重名/删非空拒绝、文档可见性不因 folder 泄露；2026-08-03 用户浏览器 smoke 已确认通过，2026-08-04 浏览器自动化 smoke 已补 | folder 不独立设权限；导入 `preserve_structure` 默认 true、=false 退回标题前缀；现有文档 `folder_id=null` 向后兼容；单文档移动只改归属、不新增版本 |
| Sprint-24（Phase2C 增强·子树导入 UI·已完成） | TC-P2-VAULT-002 | 前端构建 + 浏览器 smoke | `volta run --node 22.17.1 npm run build`（frontend） | Chrome / Edge：本地挂载目录树选中子文件夹 → 导入 → 上层 DB 出现且 `preserveStructure` 保留目录；单篇 / 整库入口回归 | 纯前端；复用 API-029 不改契约；不引新依赖 |
| Sprint-25（帮助手册 L0+L1·已完成） | TC-P2-HELP-001 | 前端构建 + 浏览器 smoke + 内容走查 | `volta run --node 22.17.1 npm run build`（frontend） | 新用户路径：登录 → 首次引导 3 步（建文档 → 搜索 → 问答）→ 各视图空状态有下一步按钮 → 首页提示「示例文档未建索引」；帮助内容源与 UI 单一来源核对 | 不新增 API / 后端能力；不引 help 库；localStorage 不可用时引导降级为普通提示 |
| Sprint-26（Phase2D·账号体系基础·**已完成**） | TC-P2-AUTH-001 | 后端 tests + 浏览器 smoke + RG-011/012/013 | `bcrypt` 5.0.0 PoC（RG-011 Go 2026-08-07）；`tests/backend/test_auth.py` 20/20；backend discover **222 OK（skipped=2）**；前端 `volta run --node 22.17.1 npm run build` 273 modules 绿（2026-08-07） | 注册 → 凭证登录 → 鉴权；错误凭证失败+锁定；登出撤销+TTL+续期轮换+多设备会话；demo 开关 PG 强制/内存允许；跨用户隔离不泄露 | 不做权限多人化/角色/用户管理 UI/REQ-016；不引 JWT；不破 demo 模式 |

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
| Sprint-18（P1.5B）实现 | 2026-08-04 | 027 | 单文档 PDF 导出：migration 013 `lumen_doc_exports` + `DocExport` entity/ORM + Demo/Pg repository；API-019 `POST /api/export-pdf`；ReportLab Markdown 子集渲染（标题 / 段落 / 列表 / 表格 / 引用 / 页眉页脚）；前端文档详情"导出 PDF"入口；artifact 首版写入 `tmp/pdf_exports` | `ee0ba89` | `py_compile`；`tests.backend.test_export` 20/20 OK；backend discover 196 OK（skipped=2，embedding torch DLL 警告按 text-only fallback 继续）；`volta run --node 22.17.1 npm run build` 通过；样例 `tmp/pdf_exports/Sprint18 产品 PDF 验证-v1-export-1.pdf` 经 `pdftoppm` 渲染、人工 PNG 检查、`pdfplumber` 抽文本与 PIL 非白像素检查通过（`non_white_pixels=122856`） | 首版同步生成任务结果；下载端点已由 v1.7.0 补齐；仍不做异步队列 / 过期清理 job / 水印 / Word-PDF 解析 / zhparser | §2 / §5（TC-P1-017 通过） |
| Sprint-18 PDF 下载闭环收尾 | 2026-08-04 | 027 | 在同步生成任务基础上补 `GET /api/export-pdf/{export_id}/download`；下载前复验 token 当前空间、源文档可见性、任务 done 状态与 artifact 目录边界；前端"导出 PDF"改为生成后直接下载，不再只提示本机路径 | 本批 | `.venv\Scripts\python.exe -m unittest tests.backend.test_export` 27/27 OK；`.venv\Scripts\python.exe -m unittest discover -s tests/backend -v` 203 OK（skipped=2，既有 embedding torch DLL 权限警告按 text-only fallback 继续）；`volta run --node 22.17.1 npm run build` 通过（259 modules）；运行态 demo API smoke 通过（OpenAPI 含下载路由，`export_id=1` 下载 9145 bytes，prefix `%PDF`） | 仍不做异步队列 / 过期清理 job / 水印 / Word-PDF 解析 / zhparser；系统 Python 缺 sqlalchemy，后端验证需用项目 `.venv` | §2 / §5（TC-P1-017 下载闭环补充） |
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
| Sprint-22 folder-tree 后端核心 | 2026-08-03 | 039 | `lumen_folders` + `lumen_documents.folder_id`、Folder entity/ORM、Pg/Demo repository、folder service/API（API-034..037）、main 注册、TC-P2-FOLDER-001 后端 tests；PR #103 已 squash merge 到 main | `2609a58`（PR #103） | `tests.backend.test_folder` 19/19 OK；`test_tags+test_document+test_quick_entry+test_doc_links` 45/45 OK；临时 PG folder CTE smoke 通过（递归防环、跨空间拒绝、可见计数、删非空拒绝） | 导入 `preserve_structure` 已由 task-028 完成；前端文件管理器当时待下一 slice（已由 task-029 补齐基础能力） | §2 / §5 |
| Sprint-22 API-029 导入保留结构 | 2026-08-03 | 037/039 | API-029 增加 `preserve_structure=true` 默认建/复用 `lumen_folders` 并回填文档 `folder_id`；`false` 保留旧标题前缀；前端默认显式传 true；修复 PgRepository `_to_document` 未映射 `folder_id` | 本地未提交 | `tests.backend.test_imports tests.backend.test_import_api` 11/11 OK；folder/import/document/tag/quick/doc_links 回归 75/75 OK；临时 PG import smoke 通过；frontend build 通过（252 modules） | 前端文件管理器当时待下一 slice（已由 task-029 补齐基础能力）；embedding 在沙箱 PG smoke 中降级为 text-only（已知 torch DLL 权限警告，不影响本验证） | §2 / §5 |
| Sprint-22 前端文件管理器与单文档移动补齐 | 2026-08-03 | 039/004 | 前端 `FolderTree` 基础树 + 受控右键菜单 + inline 新建/重命名 + 文档右键“移动到”；后端补 API-038 `PATCH /api/documents/{document_id}/folder`，只更新 `lumen_documents.folder_id`，不新增版本 / 不重建索引 | 已随 v1.4.0 发布；浏览器自动化 smoke 已由 v1.5.2 补齐 | `.venv\Scripts\python.exe -m unittest tests.backend.test_document tests.backend.test_folder tests.backend.test_imports tests.backend.test_import_api` 38/38 OK；`volta run --node 22.17.1 npm run build` 通过（255 modules）；运行态 OpenAPI 已出现 API-038，临时文档 API smoke 移动成功并清理；用户浏览器 smoke 确认通过；`scripts/smoke-folder-tree-browser.mjs` 通过（登录 → Documents → 目录树渲染 → UI 新建子文件夹 → UI 单文档移动 → API `folder_id` 后验） | 文档移动目标列表首版仅包含已加载 folder；无新增依赖 | §2 / §5 |
| Sprint-20 主题时间线（API-033） | 2026-08-03 | 013a/024 | Candidate A 时间线：`backend/service/timeline.py` 实时聚合 documents / tag_links / doc_links / chunks；API-033 `GET /api/spaces/{id}/timeline`；migration 012 时间索引；前端时间线视图（关键词 + 标签入口 + 密度热条 + 事件列表）；修复 demo runtime 新建文档空时间戳导致运行态 timeline 无事件的缺口 | `3e23d78`（demo smoke hardening）+ `28843cb`（Sprint-20，`origin/main` / `v1.5.0` tag）；真实 PG 性能 smoke 已由 v1.5.2 补齐 |
| Sprint-25（帮助手册 L0+L1） | 2026-08-06 | 011（可用性收口，不新增 REQ） | L0 `user-guide.md` 任务导向重组（唯一内容源）+ L1 首次引导 3 步 / 新手清单 / 空状态引导 / 顶栏帮助速查过滤；新增 `onboarding-store.ts` / `OnboardingGuide.tsx` / `onboarding.css` / `scripts/smoke-help-onboarding-browser.mjs`；task-036 | PR #110 squash merge（a025761） | `volta run --node 22.17.1 npm run build` 通过（273 modules）；`node scripts/smoke-help-onboarding-browser.mjs` 通过（登录 → 3 步引导 → 首页未建索引提示 → 搜索/问答空态按钮 → 时间线/标签空态入口 → 帮助过滤 10→3 命中「导入」→ 跳过持久化） | 人工浏览器 smoke 已确认通过（2026-08-06）；验收期修复 2 缺陷（帮助弹层无法关闭 / 空态按钮超高，见 docs/09 §5.1）；L2 帮助中心 / L3 / L4 留后续；Phase2B/2C 功能章节（AI 润色 / 时间线 / 文件夹树 / 本地挂载）待后续补 user-guide | §2 / §5 | `.venv\Scripts\python.exe -m unittest tests.backend.test_timeline` 7/7 OK；`tests.backend.test_timeline tests.backend.test_document tests.backend.test_tags tests.backend.test_doc_links` 38/38 OK；backend discover 190 OK（skipped=2，embedding torch DLL 警告按 text-only fallback 继续）；`npm run build`（frontend）通过（259 modules）；运行态 API smoke 通过（OpenAPI 含 API-033，创建文档/标签，关键词 timeline、tag timeline、空 q 422）；Edge headless CDP 浏览器 smoke 通过（登录、切到时间线、搜索 Phoenix、事件列表命中，density=1）；真实 PG 大数据性能 smoke 通过（620 docs + 240 links，density_events=2100，returned=200，degraded=True，window=week，elapsed_ms=2677.61）；push 后 `Project Check` success（run 30830484733）；`v1.5.0` annotated tag 已推送并解引用到 `28843cb2af431e5fa33f7c8eeeb0ad1dc27dccb3` | `linked` actor 按设计为 `null`；无新增依赖 / 无 timeline 事件表 | §2 / §5 |
| Sprint-26（Phase2D）实现 | 2026-08-07 | 040/041/042 | 账号体系基础：migration 014（`lumen_users` 扩列 + `lumen_sessions`）+ auth service/API（register/login/logout/refresh/sessions）+ 统一 `get_current_user` 收敛 13 router + 锁定/审计/密钥 env + 前端登录/注册面板与登出 | PR #112 squash merge（dba2f4a，v3.0.0） | `bcrypt` 5.0.0 PoC（RG-011 Go）；`tests/backend/test_auth.py` 20/20；backend discover 222 OK（skipped=2）；前端 build 273 modules 绿（2026-08-07） | 浏览器 smoke（`scripts/smoke-auth-browser.mjs`）PASS + demo 启动验证通过（2026-08-07）；登录/注册为内联 tab 而非独立路由（accounts-auth §15） | §2 / §5（TC-P2-AUTH-001） |
| Sprint-27（Phase2D）实现 | 2026-08-07 | 043/044 | 权限多人化：owner_id 跨用户过滤全路径回归 + 私有按 owner 过滤 + external 仅 owner 可写 + 跨用户隔离回归；P0 修复 `GET /api/doc-links` 源文档可见性校验（不可见→4004） | PR #114 squash merge（51629ce） | `test_permission.py` MultiUserIsolationTest（双用户 10 路径零泄露 + external 4003）+ `test_doc_links.py` 4004 用例；backend discover 229 OK（skipped=2）；双用户浏览器 smoke PASS（`scripts/smoke-sprint27-isolation-browser.mjs`） | P2 两项记录待确认接受（`visible_document_where_clause` 未使用 / `upsert_link` 目标解析）；零 migration / 零新依赖 | §2 / §5（TC-P2-ACC-001） |
| Sprint-28（Phase2D）实现 | 2026-08-07 | 045/046/047 | 角色分层 + 用户管理 + 团队空间加入：migration 016（`lumen_users.role` + CHECK + seed 对齐 + `lumen_space_members.created_at`）+ admin 域用户管理（API-044/045）+ space 域成员 CRUD（API-046..049）+ 受限用户搜索（API-050）+ 登录响应 role；前端用户管理页 + 空间设置成员管理（入口按角色显隐） | PR #117 squash merge（841668b，v3.1.0） | backend discover 275 OK（skipped=2）；前端 build 绿；浏览器 smoke PASS（`scripts/smoke-sprint28-role-admin-browser.mjs`：admin/member 双视角 + API 矩阵全绿） | 分页 / `last_login_at` 排序 / 响应 `updated_at` / refresh role 偏差（accounts-auth §18.9）；移除用户 / 重置密码 / 邀请码 / REQ-016 留候选 | §2 / §5（TC-P2-ACC-002） |
| 维护态批1（bug 修复） | 2026-08-08 | 使用反馈（① ② ⑦ ⑨） | ① 新手清单关闭（OnboardingGuide「×」+ 首页清单关闭/完成收起）；② 本地预览后新建清预览（App.handleCreateDocument）；⑦ 权限下拉 external_readonly 去重（前端移除遗留）；⑨ 登录响应补 name + TopBar 显示用户名 | `7c4ab2d` 直推 main（v3.3.3） | 前端 build 296 modules 绿；后端 311 tests OK | 登录响应补 name 为 additive 字段，不改契约；`external_readonly` 前端类型移除（后端本就三值） | §2 / §5.1（4 条缺陷登记） |
| 维护态批2（前端增强） | 2026-08-08 | 使用反馈（④ ⑤ ⑥） | ④ 长文档 TOC（`markdown-toc.ts` + `MarkdownBlock showToc`）；⑤ md 编辑工具栏（`markdown-editor-actions.ts` 13 动作 + `.editor-md-toolbar`）；⑥ 文件夹内新建（后端 `DocumentCreate.folder_id` 全链路 + 前端 Draft/新建带 folder_id + 文件夹右键「在此新建文档」） | v3.4.0 直推 main | 前端 build 296 modules 绿；后端 311 tests OK；`scripts/smoke-batch2-ui-browser.mjs` PASS（TOC + 工具栏 + folder_id 持久化） | 需求变更立项见 `docs/design/batch-maintenance-2026-08-08.md`（REQ-049..051 + ⑪ 部署，待人工确认） | §2 / §5（批2 验收记录） |
| REQ-049 本地挂载可编辑 + ⑪ 部署落地 | 2026-08-08 | 使用反馈（③ / ⑪） | **REQ-049**（纯前端）：`local-vault-fs` 补写路径（write/create/delete/rename）+ `useLocalVaultMount` 编辑态 + 主区 LocalDocPreview 编辑切换 + 左栏 LocalMountPane 右键增删改；**⑪ 部署**：backend/frontend Dockerfile + nginx.conf + docker-compose.prod.yml（三服务）+ deploy-guide.md + .env.example 多配置示例 | v3.5.0 直推 main | 前端 build 296 modules 绿；`docker compose config --quiet` 通过；真实 FSA 写文件待用户浏览器授权验收 | REQ-050（成员空间可见性）/ REQ-051（忘记密码+登录交互）仍立项待确认；REQ-049 / ⑪ 已实现 | §2 / §5（REQ-049+⑪ 验收记录） |
| 维护态批4（REQ-049 增强 + UI 优化） | 2026-08-08 | 使用反馈（多挂载 / 导入入口 / 并排 / 工具栏 / 撤销） | 多挂载目录（IDB 句柄数组 + `useLocalVaultMount` mounts 数组 + 聚合树平铺 + 待重授权列表 + 卸载全部）；右键菜单补「导入全部挂载」「导入此篇」；并排自动收右栏 + grid 三列显式定位（修复编辑列压窄）；md 工具栏去边框分组 + hover 文字变蓝 + 块级插入保留原文 + 编辑撤销栈（Ctrl+Z） | v3.6.0 直推 main | 前端 build 296 modules 绿；用户浏览器验收通过（多挂载平铺 / 导入入口 / 并排正常 / 工具栏 / 插入 / 撤销） | REQ-050 / REQ-051 仍立项待确认 | §2 / §5（批4 验收记录） |
| Sprint-30（维护态批5） | 2026-08-08 | REQ-050 / REQ-051（使用反馈⑧⑩） | **REQ-050** admin 用户空间可见性（API-054 admin 只读接口 `GET /api/admin/users/{user_id}/spaces` + `GET /api/spaces` admin 全空间分支 + 前端用户详情抽屉即时操作）；**REQ-051** 登录密码小眼睛（`PasswordInput`，复用登录/注册/重置）+ 忘记密码（API-055/056 reset request/confirm + migration 018 `lumen_users` reset 3 字段 + 重置吊销全部 session，demo 无 SMTP → token 写 `lumen.auth.reset` WARNING 日志）；登录标准优化：小眼睛 + 回车（form 天然）+ loading（isBusy）就绪，错误内联留候选 | 已完成（v3.7.0，PR #120 已合并 / 2026-08-09） | 后端 276 tests OK（+12：REQ-051 reset 9 + REQ-050 空间查询 3）+ 前端 build 301 modules 绿 + `scripts/smoke-batch5-auth-admin-browser.mjs` API smoke PASS（API-054/055/056 端到端）+ 真 PG migration 018 应用（reset 3 列 + 稀疏索引） | demo 无 SMTP → reset token 降级写日志；不实现邮箱验证 / OAuth / 邀请码 / 移除用户（Sprint-28 候选） | §2 / §5（TC-P2-ACC-003 / TC-P2-AUTH-002） |
| Sprint-31（维护态批6） | 2026-08-11 | P0 工程治理（NFR-005/006，非功能·不改 Phase） | **P0-1** test DB guard（`tests/backend/pg_test_support.py` 三重 fail-closed `UnsafeTestDatabaseError` + 独立 `lumen_test` 库 + 4 PG 测试面接入 + 根 `pytest.ini` integration marker）；**P0-2** CI 最小门（`backend-test`/`frontend-build`/`backend-lint` 三 job，A1 advisory→required + B1 eslint 暂缓 P1 + 根 `ruff.toml` + `backend/requirements-dev.txt`） | 已完成（v3.8.0，PR #124 squash 合并 main `c26bb63`，2026-08-11） | P0-1 guard 单测 10/10 + PG integration 47 passed；P0-2 CI 三 job（backend-test/frontend-build required 绿、backend-lint advisory 41）；CI 首跑修 2 潜伏 bug（multipart + llm_adapter 大小写） | 纯工程治理，不改功能 Phase / 交付物范围 / 对外 API；详见 `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 定稿 | §2 / §5（TC-P2-GOV-001/002） |
| Sprint-32（维护态批7） | 2026-08-11 | P1 错误契约收口（CQ-P1-005，NFR-007，非功能·不改 Phase） | **Slice A** 错误契约地基（`backend/model/error_codes.py` ErrorCode IntEnum + 集中 code→HTTP 映射 + ApiError 基类 + `main.py` ApiError handler + 通用 Exception 兜底 5xx envelope + TestClient 断言）；Slice B（api `str(exc)` 清零 + ~40 异常迁移继承 ApiError + 散落 `_status_for` 收口）/ Slice C（前端 `client.ts` ApiError + `session-store` 删文案判 auth）待续 | Slice A v3.8.1 PR #125（`176f3a9`）+ Slice B-1 PR #126（`84e4d84`）+ Slice B-2 PR #127（`23661f3`）+ Slice B-3 PR #128（`2aabab1`）+ Slice B-4a document PR #129（`2aa65a3`）+ Slice B-4b quick_entry+doc_links PR #130（`4a23e58`）+ Slice B-4c timeline+search+rag PR #131（`7f4b6f8`）+ Slice B-4d export+imports PR #132（`737c915`，v3.8.2）+ Slice B-5a space 域 PR #133（`2fd868e`） | Slice A 8 单测 + B-1 test_folder 19/19 + B-2 test_tags 15/15 + B-3 test_term+term_category 23/23 + B-4a test_document+tags 23/23 + B-4b test_quick_entry+doc_links 29/29 + B-4c test_timeline+search+rag 31/31 + B-4d test_export+imports 40/40 + B-5a 全量 294 passed 零回归（ruff 39→37） | 纯契约收口，不改对外 API 语义 / DB / 依赖；详见 `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3；Slice B-5b（auth）/ B-5c（admin）/ B-5d（space_members）`_status_for` 收口 / B-6（main.py else）/ Slice C 待续 | §2 / §5（TC-P2-GOV-003） |

> Sprint-8 后：pgvector / Embedding / LLM 已接入（RG-001/002/004 Go），基础 Web / ORM 栈为 Go（RG-005）。Phase1 全量验收结论为 Conditional Go（Demo closure）；仍移出 P1：真实 PDF/Word 解析、图片 OCR（REQ-010，RG-003 No-Go，后续阶段）。Sprint-9/10/12/13 为已完成 Demo 之上的前端体验与可用性收口；Phase1.5A 已完成批量入库与导出备份，Phase1.5B 已完成单文档 PDF 导出并补齐下载闭环。Phase2A 已完成 REQ-026 / REQ-012 / REQ-025 三个 vertical slice；Sprint-11 仅保留为 P2 UI / WSG 实现前门禁草案，Phase2B 启动前需重新确认范围、进入 / 退出标准与验证包。

---

<!-- 升阶段时在此原位追加 Phase2 Sprint，不删除上方内容 -->

## 待人工确认项

- Phase2A closure 已确认：REQ-026 内链/反链（fc2b869/6228f3f）+ REQ-012 标签（1e4cf48/d07688b）+ REQ-025 快速录入（f771e02/bad8fe5）均完成；个人知识组织「互联 / 组织 / 快录」闭环成形。
- 是否正式进入 Phase2B：团队 MVP 首批范围已确认（REQ-014 AI 润色 / 写作引用 **已落地**；**REQ-013a 主题时间线 + REQ-024 已完成并通过运行态 API smoke + Edge headless 浏览器 smoke**；关联图 REQ-013b 愿景）、进入 / 退出标准、数据外发风险接受方式、`04/05` 设计补强和 `08/09` 验证包需随后续验收继续更新。
- **P1.5B 收口**：单文档 PDF 导出（Sprint-18 / REQ-027）已完成 API-019 / TC-P1-017，v1.7.0 已补 PDF 下载端点 + 前端下载闭环；真实 Word/PDF 文本提取、zhparser 中文分词增强仍需 RG / 选型 / 中文样例验证；不阻塞 Phase2A closure。
- **Sprint-0′ / APP-SIZE-C-011**：框架补课已完成，后续 App 主应用文件减压也已由 APP-SIZE-C-011 收口（App.tsx 741→306，v0.2.1）；继续保持新功能优先下沉到域 hook / feature。
- **TC-P1-001~006/012 是否升级为「通过」**：09 已校准为「PG 仓储·Sprint-8 起真实化」（仍标条件通过）；是否进一步升级为「通过」待人工确认。
