# REQ 实现证据索引（REQ → 表 / API / migration / design / TC / Sprint）

> 定位：实现级证据**单点索引**，承接 `docs/03-prd.md` §3/§4 收敛后的实现证据，供维护态查询「某 REQ 用什么实现、验证在哪」。
> 它不是权威规格：表 / 字段权威在 `docs/06-db-design.md`，接口权威在 `docs/07-api-spec.md`，验证权威在 `docs/09-verification.md`，子系统详细设计在 `docs/design/*`。本索引只做交叉索引，不替代任何一份。
> 关联：`docs/03-prd.md` §4（阶段 / 形态 / 状态）+ `docs/04-architecture.md` §6（COMP / MOD / Flow）+ `docs/09-verification.md`（TC）。
> 建立：2026-08-17（03 §4 收敛为产品层职责后，实现证据集中于此）。新增 / 变更 REQ 实现时，先在 06/07/09/design 落权威，再回填本索引一行。

## 索引表

| REQ | 阶段 | 关键实现证据（表 / API / migration / design / TC / Sprint / PR） |
|---|---|---|
| REQ-001 / 002 / 003 | [P1] | MOD-001 空间与权限；`docs/design/permissions.md`；`lumen_users` / `lumen_spaces` / `lumen_space_members`（migration 001）；TC-P1-001/002/003；Sprint-1 |
| REQ-004 / 005 / 006 | [P1] | MOD-002 文档管理；`lumen_documents` / `lumen_document_versions`（migration 001/002）；TC-P1-004..006；Sprint-2 |
| REQ-007 | [P1] | MOD-004 检索问答；`docs/design/rag-retrieval.md`；`lumen_chunks` hybrid search（ts_vector + pgvector 语义召回，migration 003/006）；TC-P1-007；Sprint-4 / task-009 |
| REQ-008 | [P1] | MOD-004 RAG 问答（GLM LLM + 本机 Embedding）；TC-P1-008；Sprint-4 |
| REQ-009 / 010 | [P1] | MOD-003 内容导入；`docs/design/ingestion.md`；`lumen_imports`（migration 004）；Phase1 降级口径（真实 Word/PDF/OCR 留后续）；TC-P1-009/010；Sprint-3 |
| REQ-011 | [P1] | COMP-001/002 桌面端；TC-P1-011；Sprint-6 |
| REQ-036 | [P1] | MOD-005 术语管理；`docs/design/term-management.md`；`lumen_terms`（migration 004）；TC-P1-012；Sprint-5 |
| REQ-048 | [P1] | 术语领域树（REQ-036 增强）；`lumen_term_categories`（migration 017）；API-051..053；TC-P2-TERM-001；Sprint-29 |
| REQ-037 | [P1] | MOD-003 批量导入；API-029；复用 `lumen_imports`（Phase2B folder-tree `preserve_structure` 扩展见 REQ-039）；TC-P1-015；Sprint-16 |
| REQ-038 | [P1] | MOD-007 导出；API-030；复用 `lumen_documents` / `lumen_document_versions`；TC-P1-016；Sprint-17 |
| REQ-027 | [P1] | MOD-007 PDF 导出；API-019；`lumen_doc_exports`（migration 013）；TC-P1-017；Sprint-18 |
| REQ-012 | [P2] | MOD-006 标签；`lumen_tags` / `lumen_tag_links`（migration 008）；API-014/018；TC-P2-TAG-001；Phase2A Task A |
| REQ-025 | [P2] | MOD-006 快速录入；`lumen_quick_entries`（migration 009）；API-017/031/032；TC-P2-QUICK-001；Phase2A Task A/B |
| REQ-026 | [P2] | MOD-006 内链 / 反链；`lumen_doc_links`（migration 007）；API-027/028；TC-P2-LINK-001；Phase2A Task A/B |
| REQ-039 | [P2] | MOD-006 folder-tree；`docs/design/folder-tree.md`；`lumen_folders` + `lumen_documents.folder_id`（migration 011）；API-034..038 + API-029 扩展；TC-P2-FOLDER-001；Sprint-22 |
| REQ-013a / 024 | [P2] | MOD-006 主题时间线 / 密度热条；`docs/design/timeline.md`；migration 012 时间索引（候选 A 实时聚合不建表）；API-033；TC-P2-TL-001；Phase2B 第二 slice |
| REQ-014 | [P2] | MOD-007 AI 润色 / 写作引用；`docs/design/ai-polish.md`；`lumen_ai_drafts`（migration 010）；TC-P2-AI-001；Sprint-19 |
| REQ-015 / 016 / 017 | [P2] | 骨架（不进 Phase2B 首批；REQ-016 多人协作留候选） |
| REQ-018 | [P2] | MOD-008 本地知识源；`docs/design/ingestion.md` Flow-D-014 + `docs/design/frontend-interaction.md` §9.3；模式 A 随 Phase2B 交付、模式 B 浏览器路线（RG-009 Go）；`lumen_vault_mounts` 元数据（migration 015 待编码）；TC-P2-VAULT-001；Sprint-23C |
| REQ-019..023 / 028..035 | [愿景] | 骨架（技术验证后细化；对应表骨架见 `06 §1`） |
| REQ-040 / 041 / 042 | [P2] | MOD-011 账户与认证；`docs/design/accounts-auth.md`；`lumen_users` 扩列 + `lumen_sessions`（migration 014）；auth 域 API；TC-P2-AUTH-001；Sprint-26（PR#112 v3.0.0） |
| REQ-043 / 044 | [P2] | MOD-011 权限多人化（owner 过滤 + 跨用户隔离）；`docs/design/accounts-auth.md` §17；TC-P2-ACC-001；Sprint-27（PR#114） |
| REQ-045 / 046 / 047 | [P2] | MOD-011 角色分层 + 用户管理 + 空间加入；`docs/design/accounts-auth.md` §18；`lumen_users.role` + `lumen_space_members.created_at`（migration 016）；admin 域 / space 域 API；TC-P2-ACC-002；Sprint-28（PR#117 v3.1.0） |
| REQ-049 | [P2] | MOD-008 本地挂载可编辑（REQ-018 模式 B 增强）；纯前端 FSA 写路径 + 编辑态；`docs/design/ingestion.md` Flow-D-014；v3.5.0（2026-08-08 维护态） |
| REQ-050 | [P2] | MOD-011 admin 成员空间可见性；API-054 + `GET /api/spaces` admin 分支；TC-P2-ACC-003；Sprint-30（v3.7.0，PR#120） |
| REQ-051 | [P2] | MOD-011 密码小眼睛 + 忘记密码自助重置；API-055/056；migration 018（reset 3 字段）；无 SMTP → token 写日志降级；TC-P2-AUTH-002；Sprint-30（v3.7.0） |
