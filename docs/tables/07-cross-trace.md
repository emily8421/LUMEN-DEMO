# 07-cross-trace · API ↔ DB / Service / Test 交叉追溯

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/07-api-spec.md`（## 5. 起的章节）。表格内容以源文档为准。

| API-ID | Service | 数据来源 / 表 | 权限规则 | 错误码 | 关联 TC | 状态 |
|---|---|---|---|---|---|---|
| API-001 | auth.authenticate（bcrypt verify + 不透明 token session；demo 兼容 create_demo_token） | lumen_users, lumen_sessions | 凭证校验 + 锁定 / 禁用；统一错误防枚举 | 4001/4010/4030/4220 | TC-P1-001；TC-P2-AUTH-001 | P1-已实现；Phase2D 契约变更（Sprint-26） |
| API-039 | auth.register | lumen_users, lumen_spaces, lumen_space_members | 公开；重复 email→4090；密码 8–64 | 4001/4090/4220 | TC-P2-AUTH-001 | Phase2D-已实现 |
| API-040 | auth.audit_logout / revoke_session | lumen_sessions | 已认证（owner 当前会话） | 4001 | TC-P2-AUTH-001 | Phase2D-已实现 |
| API-041 | auth.refresh_session | lumen_sessions | 有效 session（旧 token 作废） | 4001/4010 | TC-P2-AUTH-001 | Phase2D-已实现 |
| API-042 | auth.list_active_sessions | lumen_sessions | 已认证（仅本人） | 4001 | TC-P2-AUTH-001 | Phase2D-已实现 |
| API-043 | auth.revoke_session | lumen_sessions | 已认证（owner） | 4001/4004 | TC-P2-AUTH-001 | Phase2D-已实现 |
| API-002 | space.list_user_spaces | lumen_spaces, lumen_space_members | 仅本人所属空间 | 4001 | TC-P1-001/002 | P1-已实现 |
| API-003 | space.switch_space | lumen_space_members | 成员关系校验 | 4001/4003 | TC-P1-002 | P1-已实现 |
| API-004 | document.list_visible_documents | lumen_documents | space + permission 过滤 | 4001 | TC-P1-004 | P1-已实现 |
| API-005 | document.create_document | lumen_documents | space 归属 | 4001/4220 | TC-P1-004 | P1-已实现 |
| API-006 | document.get/update/delete_document | lumen_documents | space + permission（越权→空/404） | 4001/4004 | TC-P1-004/005 | P1-已实现 |
| API-007 | document.list_versions | lumen_document_versions | space + permission | 4001/4004 | TC-P1-006 | P1-已实现 |
| API-008 | document.restore_version | lumen_document_versions | space + permission | 4001/4004 | TC-P1-006 | P1-已实现 |
| API-009 | search.search_documents | lumen_chunks（substring + ts_vector + pgvector）/ lumen_documents | space + permission 过滤 | 4001/4220 | TC-P1-007 | 已实现（hybrid search；zhparser 可选） |
| API-010 | rag.answer_question | lumen_chunks（向量+关键词召回）/ lumen_documents / lumen_terms | space + permission 过滤 | 4001/4220 | TC-P1-008 | 已实现（向量召回 + GLM LLM；可配 Mock） |
| API-011 | imports.import_extracted_text | lumen_imports, lumen_documents | space 过滤 | 4001/4003/4220 | TC-P1-009/010 | 降级实现（仅 .md/.txt） |
| API-012 | term.list_visible_terms / create_term | lumen_terms | space 成员 | 4001/4003/4220 | TC-P1-012 | P1-已实现 |
| API-013 | term.get/update/delete_term | lumen_terms | space + owner | 4001/4003/4004 | TC-P1-012 | P1-已实现 |
| API-029 | imports.import_batch | lumen_imports, lumen_documents, lumen_chunks | 空间成员；逐文件导入当前空间 | 4001/4003/4090/4220 | TC-P1-015 | Phase1.5A-已实现 |
| API-030 | export.export_document_md / export.export_space_zip | lumen_documents, lumen_document_versions | 文档可读；ZIP 只含当前用户可见文档 | 4001/4003/4004/4220/5000 | TC-P1-016 | Phase1.5A-已实现 |
| API-019 | export.create_pdf_export / export.download_pdf_export | lumen_doc_exports, lumen_documents, lumen_document_versions | 文档可读 / 可导出；下载时复验权限与 artifact 目录边界 | 4001/4004/4090/4220/5000/5030 | TC-P1-017 | Phase1.5B-已实现（Sprint-18 + v1.7.0 下载闭环） |
| API-014 / API-027 | tag.list_tags / create_tag / update_tag / archive_tag | lumen_tags, lumen_tag_links | space 成员 + 文档权限统计 | 4001/4003/4004/4090/4220 | TC-P2-TAG-001 | Phase2A-已实现 |
| API-031 / API-032 | tag.list_document_tags / add_document_tag / remove_document_tag / list_documents_by_tag | lumen_tag_links, lumen_tags, lumen_documents | 文档可写 + 标签同空间；document_count / 筛选按文档可见性 | 4001/4003/4004/4090/4220 | TC-P2-TAG-001 | Phase2A-已实现 |
| API-017 | quick_entry.capture_quick_entry / discard_quick_entry | lumen_quick_entries, lumen_documents, lumen_tag_links | owner 私有 + 转文档后继承权限 | 4001/4003/4004/4220 | TC-P2-QUICK-001 | Phase2A-已实现 |
| API-018 | doc_links.list_links / upsert_link | lumen_doc_links, lumen_documents | source / target 双向权限过滤 | 4001/4003/4004/4220 | TC-P2-LINK-001 | Phase2A-已实现 |
| API-028 | writing.polish_document | lumen_ai_drafts, lumen_chunks, lumen_documents | 文档可写 + 来源 chunk 可见 | 4001/4003/4004/4220/5030 | TC-P2-AI-001 | Phase2B-已实现（RG-008 Go，Sprint-19） |
| API-034 | folder.list_folders | lumen_folders | 空间成员；folder 不独立设权限，文档可见性按 permission | 4001/4003 | TC-P2-FOLDER-001 | Phase2B-第三 slice·已实现 |
| API-035 | folder.create_folder | lumen_folders | 空间成员；同 parent 重名→4090 | 4001/4003/4090/4220 | TC-P2-FOLDER-001 | Phase2B-第三 slice·已实现 |
| API-036 | folder.move_folder / rename_folder / delete_folder | lumen_folders | 空间成员；防环 / 跨空间→4220；删非空→4090 | 4001/4003/4004/4090/4220 | TC-P2-FOLDER-001 | Phase2B-第三 slice·已实现 |
| API-037 | folder.reorder_folders | lumen_folders | 空间成员 | 4001/4003/4220 | TC-P2-FOLDER-001 | Phase2B-第三 slice·已实现 |
| API-038 | document.move_document_to_folder | lumen_documents.folder_id, lumen_folders | 文档可见且可写；目标 folder 同空间；`folder_id=null`=根目录 | 4001/4003/4004/4220 | TC-P2-FOLDER-001 | Phase2B-第三 slice·已实现 |
| 权限场景 | DB 过滤 / 约束 | API 校验 | 错误码 | 测试 / TC |
|---|---|---|---|---|
| 跨空间隔离 | `WHERE space_id = current_space_id` | space_id 取自 token | 空结果（不报错） | TC-P1-001 |
| 私有文档对他人不可见 | `permission='private' AND owner_id != user` → 排除 | 查询层过滤 | 空结果 / 404 | TC-P1-003 |
| 团队共享对成员可见 | `permission='team'` 且为 space 成员 | 成员校验 | — | TC-P1-003 |
| 外部只读 | `permission='external'` | 只读 | — | TC-P1-003 |
| Phase1.5A 批量导入 | 逐文件写入 current_space_id；默认生成当前空间文档 | 空间成员可导入 | 4003 / 4220 / skipped | TC-P1-015 |
| Phase1.5A `.md` / ZIP 导出 | 单文档按文档权限过滤；ZIP 查询只取当前用户可见文档 | 不可见文档不进入 ZIP | 4004 / 空 ZIP 提示 | TC-P1-016 |
| Phase1.5B PDF 导出 / 下载 | 导出与下载前复用文档可见性校验 | 导出产物继承源文档权限；下载任务 ID 不作为公开链接 | 4090 未就绪、5030 依赖不可用、4004 不泄露越权 artifact | TC-P1-017 |
| Phase2A 标签统计 | `tag_links -> documents` join 后继续套用文档权限 | 仅统计可见文档 | 不泄露隐藏文档数量 | TC-P2-TAG-001 |
| Phase2A 反向链接 | target 文档不可见时不返回标题 / 摘要 | 查询层返回 `no_access` 或过滤 | 4003 / 空结果 | TC-P2-LINK-001 |
| Phase2B AI 润色引用 | sources 仅来自当前用户可见 chunks | LLM 调用前过滤上下文 | 5030 可降级 Mock | TC-P2-AI-001 |
| Phase2B 文档目录树 | folder 查询过滤 `space_id`；folder 内文档仍按 `permission` 过滤 | folder 不独立设权限（FT-C-003） | 4003 / 不泄露越权文档 | TC-P2-FOLDER-001 |
| Phase2D 账号与会话 | session 按 token_hash 查 `lumen_sessions`（未过期未撤销）；跨用户不泄露 | `get_current_user` 统一鉴权；会话列表 / 撤销仅本人 | 4010 / 4030 / 4004 | TC-P2-AUTH-001 |
