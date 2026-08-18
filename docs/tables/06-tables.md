# 06-tables · 表清单（完整 · 含状态列）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/06-db-design.md`（## 1. 起的章节）。表格内容以源文档为准。

| 表 | 用途 | 阶段 | 设计状态 | 当前实现状态 | 追溯 |
|---|---|---|---|---|---|
| lumen_users | 账号 | [P1] | P1-已实现；Phase2D 扩列（migration 014 / 016 / 018） | 已落地 PostgreSQL（migration 001 + 014 扩列：email / password_hash / status / last_login_at / failed_login_count / locked_until + 016 role + 018 reset_token_hash / reset_expires_at / reset_used_at；PgRepository 接入） | REQ-001 基础；REQ-040/041/042；REQ-045；REQ-051 |
| lumen_sessions | 登录会话（不透明 token） | [P2] | Phase2D-已实现 | 已落地 PostgreSQL（migration 014；token 只存 SHA-256 摘要；TTL / 撤销 / 续期轮换 / 多设备会话） | REQ-041/042 |
| lumen_spaces | 空间 | [P1] | P1-已实现 | 已落地 PostgreSQL（migration 001；PgRepository 接入） | REQ-001 |
| lumen_space_members | 成员-空间-角色 | [P1] | P1-已实现；Phase2D 补列（migration 016 `created_at`） | 已落地 PostgreSQL（migration 001 + 016 `created_at` 补列；PgRepository 接入） | REQ-001/002；REQ-047（API-046 joined_at） |
| lumen_documents | 文档 | [P1] | P1-已实现 | 已落地 PostgreSQL（migration 001；PgRepository 接入） | REQ-003/004 |
| lumen_document_versions | 版本历史 | [P1] | P1-已实现 | 已落地 PostgreSQL（migration 002；PgRepository 接入） | REQ-006 |
| lumen_chunks | 切块 + Embedding 向量 + 全文向量 | [P1] | P1-已实现 | 已落地 PostgreSQL（migration 003；T6 起写入 embedding 并用于 RAG 向量召回） | REQ-007/008 |
| lumen_imports | 导入任务 | [P1] | P1-已实现；Phase1.5A 复用 | 已落地 PostgreSQL（migration 004；当前导入仅 `.md`/`.txt` 已提取文本；批量导入默认逐文件复用此表） | REQ-009/010/037 |
| lumen_terms | 空间级术语表（REQ-048 扩 category_id / category / source，migration 017） | [P1] | P1-已实现 | 已落地 PostgreSQL（migration 004；migration 017 扩字段；PgRepository 接入） | REQ-036 / REQ-048 |
| lumen_term_categories | 术语领域树（嵌套领域，仿 lumen_folders） | [P1] | 维护态增强·已实现 | migration 017 已落地 + 后端 service/API/tests 已实现（REQ-048） | REQ-048 |
| lumen_tags | 标签 | [P2] | Phase2A-已实现 | 迁移 008 已落地（Task A `1e4cf48`）；扁平标签（无层级） | REQ-012 |
| lumen_tag_links | 标签-文档关联 | [P2] | Phase2A-已实现 | 迁移 008 已落地（Task A `1e4cf48`）；最小版仅写入 link_source='manual'，其余值预留 | REQ-012 |
| lumen_doc_links | 内部链接与反向链接索引 | [P2] | Phase2A-已实现 | 已落地（migration 007；fc2b869 Task A） | REQ-026 |
| lumen_quick_entries | 快速录入索引条目 | [P2] | Phase2A-已实现 | 迁移 009 已落地（Task A `f771e02`）；draft 默认 owner 私有 | REQ-025 |
| lumen_ai_drafts | AI 润色 / 写作引用草稿 | [P2] | Phase2B·已实现 | 已落地 PostgreSQL（migration 010；后端 service / API / tests 已实现，TC-P2-AI-001 通过） | REQ-014 |
| lumen_folders | 文档目录树（嵌套文件夹） | [P2] | Phase2B·第三 slice·已实现（后端/API + 导入归属 + 单文档移动） | migration 011 已落地 + 后端 service/API/tests 已实现（task-027，19 folder + 45 回归 tests OK）；API-029 `preserve_structure` 已实现建/复用 folder + 回填 `folder_id`（task-028）；API-038 单文档移动 + 前端文件管理器基础能力已实现（task-029，后端 38 tests + frontend build OK；v1.5.2 浏览器自动化 smoke 已补） | REQ-039 |
| lumen_doc_exports | 单文档导出 PDF 任务 | [P1] | Phase1.5B-已实现 | migration 013 已落地；DocExport entity/ORM + Demo/Pg repository 已接入 | REQ-027 |
| lumen_push_copies | 跨空间推送只读副本 | [P2] | 骨架 | — | REQ-015 |
| lumen_vault_mounts | Vault 挂载配置 / 本地连接器元数据 | [P2] | Phase2C·已设计 → Wave3-已实现（migration 015，2026-08-18） | 仅记录用户 / 设备 / 来源类型 / 授权状态等元数据（MVP 浏览器路线：句柄/路径/正文留客户端 IndexedDB，服务端不存）；不作为服务端 DB 权威内容 | REQ-018 |
| lumen_audio_records | 录音转写记录 | [愿景] | 骨架 | — | REQ-019 |
| lumen_brief_links | 对外只读简报链接 | [愿景] | 骨架 | — | REQ-022 |
| lumen_external_sync | 外部源同步配置（飞书等） | [愿景] | 骨架 | — | REQ-028 |
| lumen_doc_participants | 文档参与人物（实体抽取） | [愿景] | 骨架 | — | REQ-031 |
| lumen_hypotheses | 假设检验记录 | [愿景] | 骨架 | — | REQ-033 |
| lumen_evidence | 证据条目（支持 / 反对） | [愿景] | 骨架 | — | REQ-033 |
| lumen_signal_subscriptions | 信号追踪主题订阅 | [愿景] | 骨架 | — | REQ-034 |
| lumen_analysis_kits | 分析包（A Kit）配置 | [愿景] | 骨架 | — | REQ-035 |
