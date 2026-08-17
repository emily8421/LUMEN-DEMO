# 06-req-table-trace · REQ → 表 / TC / Sprint 追溯

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/06-db-design.md`（## 6. 起的章节）。表格内容以源文档为准。

| REQ | 相关表 | TC-ID | Sprint | 说明 |
|---|---|---|---|---|
| REQ-001 / 002 | `lumen_users`、`lumen_spaces`、`lumen_space_members` | TC-P1-001 / 002 | Sprint-1 | 账号、空间与成员关系支撑隔离和切换 |
| REQ-040 / 041 / 042 | `lumen_users`（扩列）、`lumen_sessions` | TC-P2-AUTH-001 | Sprint-26（Phase2D，task-038，migration 014） | 注册 / 凭证登录 bcrypt / 登出会话·不透明 token + 多设备 / 锁定与审计 |
| REQ-045 / 046 / 047 | `lumen_users`（role）、`lumen_space_members` | TC-P2-ACC-002 | Sprint-28（Phase2D，task-040，migration 016） | 全局角色 admin/member + admin 域用户管理（列表 / 改角色 / 禁用启用）+ space 域成员 CRUD（按 email 添加 / 改空间角色 / 移除） |
| REQ-003 | `lumen_documents`、`lumen_space_members` | TC-P1-003 | Sprint-1 | 文档权限、作者与空间成员共同决定可见性 |
| REQ-004 / 005 | `lumen_documents` | TC-P1-004 / 005 | Sprint-2 | 文档 CRUD 与行内编辑持久化 |
| REQ-006 | `lumen_document_versions` | TC-P1-006 | Sprint-2 | 保存历史版本并支持恢复 |
| REQ-007 / 008 | `lumen_documents`、`lumen_chunks` | TC-P1-007 / 008 | Sprint-4 | 全文 / 向量检索与 RAG 来源引用 |
| REQ-009 / 010 | `lumen_imports`、`lumen_documents`、`lumen_chunks` | TC-P1-009 / 010 | Sprint-3 | 导入任务、解析产物与切块索引 |
| REQ-011 | 全部 P1 表 | TC-P1-011 | Sprint-6 | 桌面端通过 API 覆盖全部 P1 功能 |
| REQ-036 | `lumen_terms`、`lumen_documents`、`lumen_chunks` | TC-P1-012 | Sprint-5 | 空间术语维护、识别与问答口径对齐 |
| REQ-037 | `lumen_imports`、`lumen_documents`、`lumen_chunks` | TC-P1-015 | Sprint-16（Phase1.5A） | 批量 / 文件夹 `.md` / `.txt` 导入；逐文件结果、同名跳过；默认不新增表（Phase2B·folder-tree 第三 slice 候选扩展 `preserve_structure` 建 `lumen_folders`，见 REQ-039 / API-029） |
| REQ-038 | `lumen_documents`、`lumen_document_versions` | TC-P1-016 | Sprint-17（Phase1.5A） | 单文档 `.md` 与空间 ZIP 导出备份；默认流式 / 临时产物，不写导出表 |
| REQ-027 | `lumen_doc_exports`、`lumen_documents`、`lumen_document_versions` | TC-P1-017 | Sprint-18（Phase1.5B·已实现） | 单文档 PDF 导出任务、版本绑定和权限继承已落地 |
| REQ-012 | `lumen_tags`、`lumen_tag_links`、`lumen_documents` | TC-P2-TAG-001 | Phase2A-已实现（Task A `1e4cf48`） | 标签视图、标签筛选与标签-文档关联已落地 |
| REQ-025 | `lumen_quick_entries`、`lumen_documents`、`lumen_tag_links` | TC-P2-QUICK-001 | Phase2A-已实现（Task A `f771e02` + Task B `bad8fe5`） | 快速录入 draft/转文档/追加/tag_ids/丢弃；API-017 |
| REQ-026 | `lumen_doc_links`、`lumen_documents` | TC-P2-LINK-001 | Phase2A-已实现（Task A `fc2b869` + Task B `6228f3f`） | `[[wikilink]]` 出链 / 反链索引与权限过滤已落地 |
| REQ-014 | `lumen_ai_drafts`、`lumen_documents`、`lumen_chunks` | TC-P2-AI-001 | Phase2B 首批核心（Sprint-19，RG-008 升 Go） | AI 润色草稿、写作引用和来源 chunk 追溯；**已实现（migration 010 已落地，后端已实现，TC-P2-AI-001 通过）** |
| REQ-013a / 024 | `lumen_documents`(created_at/updated_at/owner_id) + `lumen_tag_links`(created_at/created_by) + `lumen_doc_links`(created_at) + `lumen_chunks.ts_vector`（关键词命中）实时聚合（**候选 A 已定，不建表**，见 `docs/design/timeline.md` TL-C-001） | TC-P2-TL-001 | Phase2B 首批·第二 slice（task-030 本地实现完成） | **主题时间线** / 密度热条，关键词/标签驱动 + actor + 密度 ratio；migration 012 已落地 `lumen_documents(space_id, created_at/updated_at)` 时间索引；运行态 API smoke / Edge headless 浏览器 smoke / 真实 PG 大数据性能 smoke 已通过 |
| REQ-039 | `lumen_folders`、`lumen_documents`（folder_id） | TC-P2-FOLDER-001 | Phase2B 第三 slice（Sprint-22） | 文档目录树：嵌套文件夹 CRUD / 移动 / 排序 + 单文档移动 + 导入保留结构（扩展 REQ-037 / API-029）；migration 011 已落地，后端/API + 导入归属 + 前端文件管理器基础能力已实现，浏览器自动化 smoke 已补 |
| REQ-048 | `lumen_term_categories`、`lumen_terms`（扩 category_id / category / source，migration 017） | TC-P2-TERM-001 | 维护态增强（Sprint-29，v3.6.0） | 术语领域树 CRUD / 移动 / 排序 / 删非空拒绝 + 术语挂领域；API-051..053；领域树不独立设权限（复用 folder 口径） |
| REQ-050 | 无新表（复用 `lumen_users` / `lumen_space_members` 查询；admin 域只读） | TC-P2-ACC-003 | 维护态批5·Sprint-30（v3.7.0，PR#120） | 成员空间可见性配置：API-054 + `GET /api/spaces` admin 分支；仅全局 admin（4030） |
| REQ-051 | `lumen_users`（reset_token_hash / reset_expires_at / reset_used_at，migration 018） | TC-P2-AUTH-002 | 维护态批5·Sprint-30（v3.7.0） | 忘记密码自助重置：API-055/056；无 SMTP → token 写日志人工下发降级；重置成功吊销全部活跃 session |
| REQ-015 / 016 / 017 | 后续 Phase 骨架 | — | — | 推送 / 协作 / 移动端不进 Phase2B 首批 |
| REQ-018 | `lumen_vault_mounts` | TC-P2-VAULT-001 / 004 | Phase2C（Sprint-23C，v2.0.0 已收口） | Vault 兼容双模式：模式 A 导入数据库随 Phase2B；模式 B 仅本地挂载（RG-009 Go，TC-P2-VAULT-001）；字段已定义（id / user_id / device_id / mount_name / source_type / auth_status / last_synced_at / created_at / updated_at；索引 user_id / device_id）；仅元数据，不存句柄/路径/正文；跨设备元数据 TC-P2-VAULT-004（migration 015）待编码——014 已被 Sprint-26 账户体系占用 |
| REQ-019..023 / 028..035 | 愿景表骨架 | — | — | 技术验证通过后细化字段与索引 |
