# task-027：folder-tree 后端核心编码（Sprint-22 · REQ-039）

## 任务元信息

- 所属 Sprint：Sprint-22（Phase2B 第三 slice 候选）
- 关联 REQ：REQ-039（文档目录树，新增）；扩展 REQ-037（导入保留结构，本轮**不做**）
- 关联 TC：TC-P2-FOLDER-001（候选）
- 关联 API：API-034..037（候选）
- 分支：`feat/folder-tree-backend`（待切）
- 状态：**后端核心编码完成（本地未提交），验证通过**

## 目标

实现文档目录树后端核心：`lumen_folders` 嵌套文件夹（邻接表）+ `lumen_documents.folder_id`
归属 + 文件夹 CRUD / 移动（防环 / 跨空间）/ 改名（重名 4090）/ 删非空 4090 / 排序，
全带空间隔离与文档可见性过滤。仅后端，不含前端与导入改造。

## 输入文档

- `docs/design/folder-tree.md`（FT-C-001..013 已确认；Flow-D-010..013）
- `docs/06-db-design.md`（lumen_folders + lumen_documents.folder_id 字段契约）
- `docs/07-api-spec.md`（API-034..037 契约草案）
- `docs/09-verification.md`（TC-P2-FOLDER-001）

## 修改范围（11 处文件）

| # | 文件 | 动作 |
|---|---|---|
| 1 | `backend/migrations/011_folder_tree.sql` | 新：lumen_folders + lumen_documents.folder_id |
| 2 | `backend/model/entities.py` | 改：Folder dataclass + Document.folder_id |
| 3 | `backend/model/orm.py` | 改：FolderORM + DocumentORM.folder_id |
| 4 | `backend/repository/pg_repository.py` | 改：folder 11 方法（WITH RECURSIVE 防环）+ _to_folder |
| 5 | `backend/repository/demo_repository.py` | 改：folder 11 方法（内存递归）+ self.folders |
| 6 | `backend/service/folder.py` | 新：异常类 + UNSET + FolderView + CRUD/移动/删非空/排序 |
| 7 | `backend/api/folders.py` | 新：API-034..037（token current_space_id，/api/folders） |
| 8 | `backend/main.py` | 改：import + include folders router |
| 9 | `tests/backend/test_folder.py` | 新：TC-P2-FOLDER-001（18 service + 1 API） |
| 10 | `tasks/task-027-folder-tree-backend.md` | 新：本任务单 |
| 11 | `docs/06`/`07`/`08`/`09` | 改：状态推进 + 路径修订 + Sprint/TC 详情（原位回写） |

## 验证包

- 单测：`.venv\Scripts\python.exe -m unittest tests.backend.test_folder` → **19/19 OK**（1.021s）
- 回归：`import backend.main` + `test_tags/test_document/test_quick_entry/test_doc_links` → **45/45 OK**（0.241s）
- 覆盖：CRUD / 根层+嵌套 / 重名 4090（含 parent=null service 兜底）/ 同名不同 parent / 空 name 4220 /
  非成员 4003 / parent 跨空间 4220 / 改名重名 4090 / 移动（含移到根）/ 防环 4220（后代+自身）/
  跨空间移动 4220 / 删空 / 删非空（子夹/文档）4090 / 排序 / 部分排序拒绝 / document_count 可见性 / 空间隔离 / API 端到端
- 未验证（留后续）：PG `WITH RECURSIVE` 递归 CTE 真实库行为（本轮用 DemoRepository；
  test_pg_repository 可选补）、前端浏览器 smoke（前端文件管理器留 slice 3）

## 验收标准（对齐 TC-P2-FOLDER-001 口径）

- 文件夹树 CRUD / 移动 / 排序后端可运行；folder 不独立设权限，文档可见性按 permission 过滤。
- 防环 / 跨空间 / 重名 / 删非空 folder 均被拒绝（4220 / 4220 / 4090 / 4090）。
- 现有文档 `folder_id=null`（空间根，FT-C-006 向后兼容）。

## 禁止事项（本轮越界）

- 不做导入保留结构（API-029 `preserve_structure`，Flow-D-012，留后续 slice）。
- 不做前端文件管理器（classic-tree / doc-tree-open 原型落地，留 slice 3）。
- 不做 folder 独立权限（FT-C-003）；不加文档 `order` 字段（FT-C-009，folder 内按 title）。
- 不做 folder 软删除 / 回收站（FT-C-013）。
- 不暴露文档归属写入 API（`set_document_folder` 为 repository 预留，文档归属走文档 CRUD 复用，留下个 slice）。

## 完成记录（2026-08-03）

- 后端核心编码完成（migration 011 + entity/ORM + pg/demo repository + service + API + main 注册 + tests + task 单）。
- 验证：folder 19/19 + 回归 45/45 全过，`import backend.main` 通过。
- 关键设计落定：
  - API 路径裁定为 `/api/folders`（token current_space_id，对齐既有 tags/documents 惯例与设计 §4）；
    07 原 `/api/spaces/{id}/folders` 待随回写修订。
  - PATCH 用 `model_fields_set` 区分「字段未传」与「字段显式 null」（move 到根 parent=null）。
  - 根层重名（parent_id=null）：PG UNIQUE 对 NULL 不去重，由 service `find_folder_by_name` 兜底。
  - 防环：pg `WITH RECURSIVE` 递归 CTE / demo 内存递归，含自身。

## 待确认项

- PG 真实库 `WITH RECURSIVE` 行为留 test_pg_repository 可选验证（不阻塞本轮）。
- 切分支 + 提交 + PR 时机（留用户决定）。
- 前端文件管理器（slice 3）+ 导入保留结构（slice 2）排在后端落地之后。
