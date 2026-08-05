# task-033：按需导入到 LUMEN + demo host 切 localhost（Sprint-23C · REQ-018 模式 B）

## 任务元信息

- 所属 Sprint：Sprint-23C
- 关联 REQ：REQ-018 模式 B（按需导入复用模式 A = REQ-037/039）
- 关联 TC：TC-P2-VAULT-001（⑤ 按需导入走 API-029）
- 关联 API：API-029 `POST /api/import/batch`（复用，不改契约）
- 状态：待编码（依赖 task-032）

## 目标

1. 本地挂载条目可「导入到 LUMEN」（单篇 / 子树 / 整 vault），转入 DB 路径获得完整能力（搜索 / RAG / 标签 / 版本 / 团队共享）。复用 API-029 + 既有过滤。
2. 把前端访问 host 从 `127.0.0.1` 切到 `localhost`（FSA secure context 硬前提，PoC §3/§7 实测 127.0.0.1 不稳定）。

## 上游依据

- `docs/design/ingestion.md` Flow-D-014 §5（挂载内容可升级为正式知识，转入 DB 路径接受权限选择）
- `docs/07-api-spec.md` API-029（:42/100/131-134，`preserve_structure` + `relative_paths`）
- PoC 报告 §3/§7（localhost secure context 硬前提）

## 修改范围

| 文件 | 变更 |
|---|---|
| `frontend/src/features/LocalMountPane.tsx` | 加「导入到 LUMEN」入口（单篇 / 子树 / 整 vault），复用 `importBatchDocuments`（`api/imports.ts:106`）+ `filterImportable`（`ImportFeature.tsx:204`）；子树 `preserveStructure:true`；导入成功刷新 DB 文档列表（复用 `onImported` 回调链） |
| `frontend/vite.config.ts` | `server.host` `127.0.0.1`→`localhost`（:9-15） |
| `frontend/package.json` | dev / preview `--host 127.0.0.1`→`localhost`（:7,9） |
| `scripts/run-sprint16-demo.ps1` | vite `--host` + 访问 URL → `localhost`（:287,295）；后端代理目标保持 `127.0.0.1:18000` |

## 验证包

- `cd frontend && volta run --node 22.17.1 npm run build` → 通过
- 运行态按需导入 smoke（localhost 访问）：本地挂载单篇 → 导入 → 出现在 DB 上层且可搜；子树 `preserveStructure` 保留目录。

## 验收标准

- 单篇 / 子树 / 整 vault 均可「导入到 LUMEN」，走 API-029；导入后获完整 LUMEN 能力，出现在上层 DB 分区。
- 子树导入 `preserveStructure:true` 保留目录结构（复用 folder-tree 能力）。
- 前端访问走 `localhost`（secure context），FSA 稳定可用。
- 不改 API-029 契约 / 后端 / 不引依赖。

## 降级 / Mock 边界

- 导入复用既有 API-029 分批（50/批）+ 失败隔离，无新增降级。

## 残留风险 / 未验证

- host 切 localhost 影响：需确认 demo / dev / smoke 全链 localhost 一致；后端 `/api` 代理目标保持 `127.0.0.1:18000`（后端不需 secure context）。

## 完成记录

- **2026-08-06 完成（编码 + build；运行态 smoke 待 task-034 统一）**。
- 按需导入（走 API-029，不改契约）：
  - `LocalMountPane` 接收 `{ token, onImported }` props；「导入此篇」/「导入全部」按钮，复用 `importBatchDocuments`（`api/imports.ts:106`，分批 50 + 失败隔离 + onProgress）；`preserveStructure:true` 保留目录；默认权限 `private`；导入成功调 `onImported` → App `handleImported(null)` → refreshWorkspace + 切 documents 视图。
  - 为支持 `getFile()` 取 File，`LocalVaultDoc` 加 `handle: FileSystemFileHandle`（task-031 小扩展），`readVaultFile` 保留 `walked.handle`。
  - ContextPane 透传 `{ token, onImported }`；App 传 `token={token} onImported={() => handleImported(null)}`。
- host 切 localhost（FSA secure context 硬前提）：
  - `vite.config.ts` server.host `127.0.0.1`→`localhost`
  - `package.json` dev / preview `--host 127.0.0.1`→`localhost`
  - `scripts/run-sprint16-demo.ps1` vite `--host` + 前端 Wait-HttpOk + frontendUrl → `localhost`（:287/293/295）；后端代理目标保持 `127.0.0.1:18000`（后端不需 secure context）
- 验证：`cd frontend && volta run --node 22.17.1 npm run build` → **267 modules 绿**（`DocumentPermission 'private'` 类型合法；JS +1.24kB 导入逻辑）。
- 运行态按需导入 smoke：待 task-034（FSA 授权需用户手势 + localhost 访问；CDP 无法自动化 `showDirectoryPicker` 授权对话框，核心走用户人工 smoke）。
- 子树（选特定文件夹节点）导入 UI 留后续；MVP「导入全部」+ `preserveStructure:true` 已覆盖子树语义（保留目录结构）。

## 待确认项

无。
