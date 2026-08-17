# 00-sc-downstream · 场景 → U/REQ/TC 下游映射

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/00-scenario.md`（## 3.3 起的章节）。表格内容以源文档为准。

| SC-ID | 影响 U-ID | 影响 REQ | 设计入口 | 验证入口 | 任务入口 | 备注 |
|---|---|---|---|---|---|---|
| SC-001 | U-01 / U-02 | REQ-001 / REQ-002 | MOD-001 空间与权限（`docs/design/permissions.md`） | TC-P1-001 / 002 | Sprint-1 | 空间隔离与空间切换底座 |
| SC-002 | U-03 / U-12 | REQ-003 | MOD-001 空间与权限（`docs/design/permissions.md`） | TC-P1-003 | Sprint-1 | 权限分级与私有文档边界 |
| SC-003 | U-04 / U-05 / U-06 | REQ-004 / REQ-005 / REQ-006 | MOD-002 文档管理 | TC-P1-004..006 | Sprint-2 | 文档 CRUD、行内编辑与版本历史 |
| SC-004 | U-07 / U-08 / U-42 | REQ-007 / REQ-008 / REQ-036 | MOD-004 检索问答（`docs/design/rag-retrieval.md`）、MOD-005 术语管理（`docs/design/term-management.md`） | TC-P1-007 / 008 / 012 | Sprint-4 / Sprint-5（task-009） | hybrid search、RAG 问答和空间术语对齐 |
| SC-005 | U-09 / U-10 | REQ-009 / REQ-010 | MOD-003 内容导入（`docs/design/ingestion.md`） | TC-P1-009 / 010 | Sprint-3 | Phase1 已提取文本导入与 OCR 降级边界 |
| SC-006 | U-11 | REQ-011 | COMP-001 前端 / COMP-002 后端 | TC-P1-011 | Sprint-6 | 桌面浏览器验收入口 |
| SC-007 | U-09 / U-33 / U-43 | REQ-037 / REQ-038 / REQ-027 | MOD-003 内容导入、MOD-007 写作 / 导出；`docs/07-api-spec.md` API-019/029/030 | TC-P1-015 / 016 / 017 | Sprint-16 / Sprint-17 / Sprint-18 | P1.5 个人可用：批量入库 + 导出备份已完成；PDF 导出已随 Sprint-18 实现并通过 TC-P1-017 |
| SC-008 | U-13 / U-31 / U-32 | REQ-012 / REQ-025 / REQ-026 | MOD-006 个人知识组织；`docs/07-api-spec.md` API-014/017/018/027/031/032 | TC-P2-TAG-001 / TC-P2-QUICK-001 / TC-P2-LINK-001 | Phase2A Task A/B 完成包 | Phase2A 已完成：标签、快速录入、内链 / 反链 |
| SC-009 | U-44 | REQ-039 / REQ-037 | MOD-006 个人知识组织（folder-tree）；`docs/07-api-spec.md` API-034..037 + API-029 改造 | TC-P2-FOLDER-001 / TC-P1-015 扩展 | Sprint-22（候选） | 文档目录树组织 + 导入保留结构 |
