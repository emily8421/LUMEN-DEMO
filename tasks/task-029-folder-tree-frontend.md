# task-029：folder-tree 前端文件管理器与单文档移动补齐（Sprint-22 · REQ-039）

## 任务元信息

- 所属 Sprint：Sprint-22（Phase2B · 文档目录树 · 第三 slice）
- 关联 REQ：REQ-039（文档目录树）、REQ-004（文档归属）
- 关联 TC：TC-P2-FOLDER-001
- 关联 API：API-034..038（新增 API-038 `PATCH /api/documents/{document_id}/folder`）
- 状态：**本地实现完成，自动化验证 + 运行态 API smoke + 用户浏览器 smoke 通过；浏览器自动化 smoke 后续补**

## 目标

补齐左侧文件管理器的前端基础能力，并修复“只能移动整个文件夹，不能移动单个文档”的缺口：

- 文件夹三点 / 右键菜单改为受控菜单，点外部 / Esc / 滚动关闭。
- 新建 / 重命名文件夹改为左侧树内 inline 编辑，不再使用浏览器 `prompt`。
- 文档行支持右键菜单，可将单个文档移动到根目录或已加载文件夹。

## 修改范围

| 文件 | 变更 |
|---|---|
| `backend/service/document.py` | 新增 `DocumentMove` / `DocumentValidationError` / `move_document_to_folder` |
| `backend/api/documents.py` | 新增 API-038 `PATCH /api/documents/{document_id}/folder` |
| `frontend/src/api/documents.ts` | 新增 `moveDocument` client |
| `frontend/src/app/useDocuments.ts` | 新增 `handleMoveDocument`，移动后刷新文档和已加载文件夹 |
| `frontend/src/app/useFolders.ts` | 新增文档移动目标列表 |
| `frontend/src/app/FolderTree.tsx` | 新增文档右键菜单；保留文件夹菜单 / inline 编辑 |
| `frontend/src/app/ContextPane.tsx` / `frontend/src/App.tsx` | 透传文档移动 handler |
| `frontend/src/styles/workspace.css` | 文档菜单打开态高亮 |
| `tests/backend/test_document.py` | 补服务/API 级文档移动测试 |

## 验证包

- `.venv\Scripts\python.exe -m unittest tests.backend.test_document tests.backend.test_folder tests.backend.test_imports tests.backend.test_import_api` → **38/38 OK**
- `volta run --node 22.17.1 npm run build`（frontend）→ **通过**
- 运行态 API smoke：OpenAPI 已含 API-038；临时文档移动到目标 folder 后 `folder_id` 读回一致，临时数据已清理。
- 用户浏览器 smoke（2026-08-03）：单篇文档右键移动已确认无问题。

## 验收标准

- 右键文档行可以选择“移动到”根目录或已加载文件夹。
- 移动单文档只更新 `lumen_documents.folder_id`，不改正文、不新增版本、不重建索引。
- 目标文件夹必须属于当前空间；无写权限文档不能移动。
- 文档移动后左侧树里的文档列表和 folder 计数刷新。

## 残留风险 / 未验证

- 本环境当前缺少可用 Playwright / Browser 自动化通道，本轮未做自动化点击 smoke；已有用户浏览器 smoke 通过。
- 目标列表仅包含已加载过的 folder；未展开过的深层 folder 需先展开加载后才可作为移动目标。
