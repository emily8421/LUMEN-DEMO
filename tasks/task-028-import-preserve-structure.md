# task-028：导入保留目录结构（Sprint-22 · REQ-037/039）

## 任务元信息

- 所属 Sprint：Sprint-22（Phase2B 文档目录树）
- 关联 REQ：REQ-037（批量 / 文件夹导入扩展）、REQ-039（文档目录树）
- 关联 TC：TC-P2-FOLDER-001 + TC-P1-015 扩展
- 关联 API：API-029 `POST /api/import/batch`
- 状态：**已完成（本地未提交），验证通过**

## 目标

把批量 / 文件夹导入从“标题前缀模拟目录”升级为真实目录结构：
`preserve_structure=true` 默认按 `relative_paths[]` 建 / 复用 `lumen_folders`，
并把导入文档的 `folder_id` 指向叶子文件夹；`preserve_structure=false` 保留旧的平铺标题前缀行为。

## 修改范围

| # | 文件 | 动作 |
|---|---|---|
| 1 | `backend/service/imports.py` | API-029 service 增加 `preserve_structure`、folder 幂等建/复用、同 folder 标题冲突、`items[].folder_id` |
| 2 | `backend/api/imports.py` | 表单字段 `preserve_structure=true` + response 返回 `folder_id` |
| 3 | `backend/repository/pg_repository.py` | `_to_document` 映射 `folder_id`，补齐 PgRepository 读回路径 |
| 4 | `frontend/src/api/imports.ts` / `frontend/src/app/useImport.ts` | 前端默认显式提交 `preserve_structure=true` |
| 5 | `tests/backend/test_imports.py` / `test_import_api.py` / `test_pg_repository.py` | 覆盖保留结构、平铺兼容、PgRepository `folder_id` round trip |
| 6 | `docs/07-api-spec.md` / `docs/design/ingestion.md` / `docs/08-dev-plan.md` / `docs/09-verification.md` | 状态与验证证据回写 |

## 验证包

- `.venv\Scripts\python.exe -m unittest tests.backend.test_imports tests.backend.test_import_api` → **11/11 OK**
- `.venv\Scripts\python.exe -m unittest tests.backend.test_folder tests.backend.test_imports tests.backend.test_import_api tests.backend.test_document tests.backend.test_tags tests.backend.test_quick_entry tests.backend.test_doc_links` → **75/75 OK**
- 临时 PG smoke（`lumen_import_preserve_verify_codex`，结束后删除）→ **OK**：迁移、默认保留结构建 folder、`items[].folder_id`、同名文件跨 folder 共存、`preserve_structure=false` 旧标题前缀。
- `volta run --node 22.17.1 npm run build`（frontend）→ **通过**（252 modules）。

## 验收标准

- 默认导入文件夹时，目录段写入 `lumen_folders`，文档标题只保留文件名去扩展名。
- 同名文件允许出现在不同 folder；同一 folder 下同标题按既有 `skip` 策略跳过。
- `preserve_structure=false` 仍保留 Phase1.5A 行为：标题包含路径前缀，`folder_id=null`。
- 导入成功响应包含 `folder_id`，便于后续前端文件管理器刷新树。

## 禁止事项

- 不做前端文件管理器 UI。
- 不做文档拖拽移动 / 文档排序。
- 不改 folder 权限模型，不做 folder 独立权限。

## 完成记录（2026-08-03）

- API-029 `preserve_structure` 后端/API/前端默认参数完成；真实 PG 临时库验证通过。
- 发现并修复 PgRepository `_to_document` 未映射 `folder_id` 的后端核心遗留缺陷。
- 剩余：前端文件管理器（tree 渲染 + CRUD + 移动 + 排序 + 浏览器 smoke）留下一 slice。
