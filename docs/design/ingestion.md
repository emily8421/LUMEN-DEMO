# 详细设计：内容导入子系统（ingestion）

> 对应 REQ-009（内容导入）、REQ-010（OCR 后续）与 REQ-037（批量 / 文件夹 `.md` / `.txt` 导入）。总体定位见 04；数据见 06（lumen_imports / lumen_chunks）。
> 按「完整骨架 + 阶段增量」：`[P1]` / Phase1.5A 写细，Phase1.5B / 后续骨架。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 设计对象 | 内容导入子系统（MOD-003） |
| 文档路径 | docs/design/ingestion.md |
| 输入来源 | 02/03、04 §2 / §5.4（MOD-003 / Flow-006）、05（TCD-007、RG-002/003/007）、06（lumen_imports / lumen_chunks）、07（API-011 / API-029） |
| 覆盖 REQ | REQ-009、REQ-010、REQ-037（Phase2B folder-tree 扩展 `preserve_structure`，见 REQ-039）；REQ-018 Vault 兼容愿景 |
| 所属 Phase | [P1] + Phase1.5A 已完成；Phase1.5B / 后续 / 愿景保留骨架 |
| 交付物形态 | Demo / 个人可用 Alpha |
| 当前状态 | P1 已降级实现（`.md`/`.txt` + Embedding/pgvector 已落地；真实 Word/PDF/OCR 未实现）；Phase1.5A 批量 / 文件夹导入已完成并通过 TC-P1-015；Phase2B folder-tree 扩展 `preserve_structure=true` 已完成后端/API（task-028，真实 PG smoke 通过），前端文件管理器基础能力已由 task-029 补齐 |
| 流程 ID | Flow-D-001（单文件导入主流水线）/ Flow-006（批量 / 文件夹导入，见 §2.2）/ Flow-D-012（导入保留目录结构，Phase2B 候选，见 `docs/design/folder-tree.md`）/ Flow-D-014（Vault 兼容双模式，见 §2.3） |
| 最后更新 | 2026-08-17（新增 §2.4 导入任务状态机 DIAG-STATE-IMPORT-01，OO 覆盖度补全 Batch A2）；前次 2026-08-04（REQ-018 Vault 兼容方向确认：导入数据库 / 仅本地挂载双模式；仅本地挂载内容默认个人 / 当前设备可见，不写入团队知识库） |
| 下游影响 | 08 Sprint-3、Sprint-16；09 TC-P1-009/010/015；07 API-011 / API-029 |

### 0.5 详细类图（DIAG-CLS-INGEST-01）

> 图纸驱动编码：内容导入子系统的类级视图（实体 + `RepositoryProtocol` 契约 + 服务层函数）。类图挂 REQ-009/010/037/018/049；方法签名以 `backend/service/imports.py`、`chunking.py`、`embedding.py` 与 `backend/repository/protocol.py` 为准。

```mermaid
classDiagram
  direction LR
  class ImportJob {
    +id
    +space_id
    +source_filename
    +status
    +parsed_doc_id
    +chunk_count
    +error
  }
  class Document {
    +id
    +space_id
    +title
    +content_md
    +owner_id
    +permission
    +folder_id
  }
  class DocumentChunk {
    +id
    +document_id
    +ordinal
    +text
    +embedding
  }
  class RepositoryProtocol {
    <<interface>>
    +create_import_job(space_id, source_filename, created_by) ImportJob
    +complete_import_job(import_id, parsed_doc_id, chunk_count) ImportJob
    +fail_import_job(import_id, error) ImportJob
    +require_import_job(import_id) ImportJob
    +create_document(space_id, title, content_md, owner_id, permission, folder_id) Document
    +replace_document_chunks(document_id, chunk_texts) list
    +require_document(document_id) Document
    +find_document_id_by_title(space_id, title) int
  }
  class ImportService {
    +import_extracted_text(repository, user_id, current_space_id, request) ImportResult
    +import_batch(repository, user_id, current_space_id, request) BatchImportResult
  }
  class ChunkingService {
    +split_text_into_chunks(text, max_chars, overlap_chars) list
    +clean_text(source_text) str
  }
  class EmbeddingService {
    +embed_texts(texts, batch_size) list
  }

  ImportService --> RepositoryProtocol : 依赖
  ImportService --> ChunkingService : 切块
  ImportService --> EmbeddingService : 向量化
  ChunkingService --> EmbeddingService : 结果向量化
  ImportService ..> ImportJob : 创建 / 更新
  ImportService ..> Document : 生成
  ImportService ..> DocumentChunk : 落块
  RepositoryProtocol ..> ImportJob : 契约
  RepositoryProtocol ..> Document : 契约
```

## 1. 职责

`.md` / `.txt` 文本文件 → 清洗 → 切块 → Embedding → 入库，供检索问答；Phase1.5A 扩展为多文件 / 文件夹批量导入。真实 Word/PDF 文本提取属于 Phase1.5B 候选（RG-007），OCR 属后续（RG-003）。

## 2. 流程

### 2.1 Flow-D-001：单文件导入（[P1]）

1. 接收单个 `.md` / `.txt` 文件，记 `lumen_imports(status=processing)`
2. **文本读取**：读取已提取文本；`.docx` / `.pdf` / 图片不在 P1 / P1.5A 实现范围内
3. **清洗**：去乱码 / 分页符，保留段落结构
4. **切块**：同 docs/design/rag-retrieval 的切块策略（~512 token、重叠 64）
5. **Embedding**：批量调用本机 `bge-small-zh` adapter（512 维）
6. **入库**：写 `lumen_chunks`（text / embedding / ts_vector）+ 关联 `document`
7. 更新 `lumen_imports(status=done, parsed_doc_id)`

```mermaid
flowchart LR
  upload[上传 .md / .txt] --> imports[lumen_imports: processing]
  imports --> extract[读取已提取文本]
  extract --> clean[清洗]
  clean --> chunk[切块]
  chunk --> embedding[bge-small-zh Embedding]
  embedding --> chunks[lumen_chunks + ts_vector + vector]
  chunks --> done[lumen_imports: done / failed]
```

### 2.2 Flow-006：批量 / 文件夹导入（Phase1.5A）

1. 前端通过多文件选择或 `webkitdirectory` 提交 `files[]` 与可选 `relative_paths[]` 到 API-029。
2. 后端逐文件校验扩展名，仅接受 `.md` / `.txt`；不支持格式返回该项 `failed` 或 `skipped`，不影响其他文件。
3. 标题生成 / 目录归属：Phase1.5A 使用相对路径去扩展名后的安全化标题（如 `docs/team/readme`）。**Phase2B folder-tree 扩展（FT-C-008，已实现 task-028）**：`preserve_structure=true`（默认）按 `relative_path` 路径段建/复用 `lumen_folders`（幂等）并回填 `folder_id`，文档标题只取文件名去扩展名；`=false` 只模拟目录感（标题前缀）、不创建真实 folder 表（向后兼容）。
4. 冲突处理：同名默认 `skipped` 并返回原因；P1.5A 不静默覆盖已有文档。
5. 每个成功文件复用 Flow-D-001 的读取、清洗、切块、Embedding、入库流程。
6. 响应汇总 `success_count / failed_count / skipped_count` 与逐条 `items[]`；成功项保留，失败项不回滚。

```mermaid
flowchart TB
  batch[files[] + relative_paths[]] --> validate[逐文件校验 .md / .txt]
  validate -->|合法| ps{preserve_structure?}
  validate -->|不合法| failed[items[].status=failed]
  ps -->|true 默认| folder[建/复用 lumen_folders 幂等 + folder_id]
  ps -->|false 向后兼容| title[相对路径标题前缀]
  title --> conflict{同名?}
  folder --> conflict
  conflict -->|是| skipped[items[].status=skipped]
  conflict -->|否| single[复用 Flow-D-001]
  single --> done[done + parsed_doc_id + folder_id?]
  failed --> summary[批量结果汇总]
  skipped --> summary
  done --> summary
```

### 2.3 Flow-D-014：Vault 兼容双模式（[P2]，REQ-018，Phase2C·已设计）

> 状态：Phase2C·已设计（RG-009 PoC Go 2026-08-05）；模式 B 浏览器 File System Access MVP 路线采纳；不代表当前已实现。

### 2.4 导入任务状态机（DIAG-STATE-IMPORT-01）

> 详细设计层对象状态图（对照 OO 方法论转换⑧：交互图 → 活动 / 状态图）。`lumen_imports.status` 单文件任务态；批量导入（Flow-006）的逐文件结果（`items[].status`：`done / failed / skipped`）是响应级汇总，不落 `lumen_imports`，见 §2.2。挂 REQ-009 / REQ-037；异常路径：解析失败 / 编码不合法 → `failed` 并记原因，不生成脏文档（EX-003）；同名冲突默认 `skipped` 不静默覆盖（EX-006）。

```mermaid
stateDiagram-v2
  [*] --> processing : 接收 .md / .txt（记 lumen_imports）
  processing --> done : 清洗→切块→Embedding→入库成功（parsed_doc_id）
  processing --> failed : 解析失败 / 编码不合法 / 异常（记原因）
  done --> [*]
  failed --> [*]
```

> 批量级逐文件结果（不落库，随响应返回）：

```mermaid
stateDiagram-v2
  [*] --> itemCheck : 逐文件校验
  itemCheck --> itemDone : 合法且无同名冲突（复用 Flow-D-001）
  itemCheck --> itemFailed : 扩展名不支持 / 解析失败
  itemCheck --> itemSkipped : 同名冲突（默认跳过）
  itemDone --> [*]
  itemFailed --> [*]
  itemSkipped --> [*]
```
>
> 已知天花板：浏览器 File System Access 句柄只活在浏览器进程、后端读不到，仅本地挂载内容无法进服务端 RAG / 全文搜索；要进 RAG 必须 (a) 本地 agent / 桌面端增量索引 或 (b) 导入数据库（见 §3 Vault 兼容策略）。

1. 用户在 LUMEN 选择本地 Obsidian vault / Markdown 文件夹。
2. 系统先做本地预检：文件数量、支持格式、总大小、目录层级、浏览器 / 桌面授权状态。
3. 用户选择模式：
   - **导入数据库**：复用 Flow-006 / API-029，按批次把 `.md` / `.txt` 写入 `lumen_documents`、`lumen_chunks`，并在 `preserve_structure=true` 时写入 `lumen_folders`。导入后获得完整 LUMEN 权限、搜索、RAG、标签、链接、版本与团队共享能力。
   - **仅本地挂载**：文件正文仍留在本地文件夹；默认只对当前用户 / 当前设备可见；不写入团队空间、不进入服务端 RAG / LLM、不参与团队权限链。LUMEN 前端可在本地连接器中展示目录树、打开文件、做本地索引或按需导入单篇 / 子树。
4. 左侧文件管理器视觉分区：上层“LUMEN 知识库”（数据库内容），下层“本地挂载”（个人本地来源）。两个区块用标题、图标 / 状态徽标、分隔线和不同空态文案区分；仅本地挂载条目不得伪装成团队文档。
5. 挂载内容可升级为正式知识：用户可对单篇、文件夹或整 vault 执行“导入到 LUMEN”，此时转入数据库路径并接受权限选择。

```mermaid
flowchart TB
  pick[选择本地 vault / 文件夹] --> preflight[本地预检: 数量 / 格式 / 授权]
  preflight --> mode{用户选择}
  mode -->|导入数据库| importdb[分批调用 API-029 + preserve_structure]
  importdb --> dbdocs[lumen_documents + lumen_chunks + lumen_folders]
  dbdocs --> full[完整权限 / 搜索 / RAG / 团队能力]
  mode -->|仅本地挂载| local[本地连接器读取目录]
  local --> personal[个人 / 当前设备可见]
  personal --> promote[按需导入单篇 / 子树]
  promote --> importdb
```

## 3. 关键决策

- **OCR 引擎**：PaddleOCR 仍为后续候选，当前 RG-003 No-Go；不得阻塞 Phase1.5A
- **切块 / Embedding 参数与检索侧共用**：避免 train/serve 偏差（块大小、Embedding 维度必须一致）；Phase1 使用本机 `bge-small-zh`，写入 `vector(512)`
- **批量失败隔离**：单文件解析失败记 `status=failed` + 原因，不阻塞其他文件；同名冲突默认 `skipped`
- **目录策略**：Phase1.5A 不建真实目录表，`relative_path` 仅用于标题前缀 / API 返回 / 导入记录说明；**Phase2B folder-tree 扩展（推翻 ING-C-001，已实现 task-028）**：`preserve_structure=true` 建/复用 `lumen_folders` 保留真实目录结构，`=false` 退回标题前缀（向后兼容）
- **Vault 兼容策略**：LUMEN 数据库仍是正式知识库权威；本地 Vault 仅挂载是个人连接器，不默认共享、不默认服务端索引；用户显式选择导入后才进入 DB 权限与 RAG 链。

## 4. 阶段增量

- `[P1]` 已实现 / 降级：`.md` / `.txt` 已提取文本导入、切块、Embedding / pgvector 入库；真实 Word/PDF/OCR 不作为 P1 必过
- `Phase1.5A` 已完成：多文件 + 文件夹 `.md` / `.txt` 批量导入（REQ-037 / API-029 / TC-P1-015 通过）
- `Phase2B 第三 slice`（folder-tree，后端/API + 前端基础能力已实现）：导入保留真实目录结构（`preserve_structure` 建/复用 `lumen_folders`），扩展 REQ-037 / API-029；推翻 ING-C-001；详见 `docs/design/folder-tree.md` Flow-D-012。前端文件管理器基础能力已由 task-029 补齐。
- `Phase1.5B` 待 RG-007：真实 Word / PDF 文本提取（python-docx / pdfplumber 候选），不得阻塞 Phase1.5A
- `后续` 待 RG-003：图片 / 白板 OCR
- `[愿景]` 待验证：录音转写入库（REQ-019，转写引擎与摘要质量待验证）
- `[愿景]` 待验证：飞书自动同步（REQ-028）——外部源（飞书）文档更新后自动拉取摘要，原文留外部源，LUMEN 只更新索引条目摘要字段
- `[P2]` Phase2C·已确认（RG-009 Go 2026-08-05）：Obsidian Vault 兼容（REQ-018）模式 B 仅本地挂载浏览器 MVP 路线采纳（File System Access + IndexedDB）；模式 A 导入数据库已随 Phase2B 实现；仅本地挂载保持个人 / 当前设备边界。

## 5. 与其他子系统交互

- **为** docs/design/rag-retrieval 供 `lumen_chunks`
- **被** 07 `/api/import`、`/api/import/batch` 调用
- **写** 06 lumen_imports / lumen_chunks
- **影响** docs/design/frontend-interaction：Sprint-16 已补 drop zone、多文件 / 文件夹选择、批量进度与逐条结果 UI

## 6. 实现偏差 / 设计回写

> 对照 `ai/doc-standards/design-doc.md` §4.10。仅记录已实现的降级事实，不推测目标。

| 偏差 ID | 代码 / 配置事实 | 原设计 | 偏差类型 | 处理结论 | 回写目标 | 验证 / 证据 |
|---|---|---|---|---|---|---|
| DEV-001 | `backend/service/imports.py` 仅支持 `.md`/`.txt` 已提取文本 | .docx / .pdf / 图片三路解析 | Mock/降级 | Phase1 接受降级基线；真实 Word/PDF 文本提取移 Phase1.5B（RG-007）；OCR 后续（RG-003） | 06 lumen_imports、05 RG-003/RG-007 | TC-P1-009 |
| DEV-002 | 未接入 PaddleOCR；无 OCR | 图片 → PaddleOCR 中文 OCR | 后续阶段 | REQ-010 移出 P1 / P1.5A 必过 | 05 RG-003、09 §6 | TC-P1-010 |
| DEV-003 | ~~未接入 `bge-small-zh`；`lumen_chunks` 无向量落地~~ → **已实现（Sprint-8 T6）**：`pg_repository.replace_document_chunks` 写 `lumen_chunks.embedding`（bge-small-zh 512 维 float32） | 切块 → bge-small-zh 512 维 → embedding/ts_vector | 已实现 | 向量已落地 PG；ts_vector（zhparser 中文分词）留后续。DEV-001（真实 PDF/Word）/ DEV-002（OCR）仍降级 | 06 lumen_chunks、05 RG-001/002 | TC-P1-009 |
| DEV-004 | API-029 / 批量导入已实现 | Flow-006 批量 / 文件夹导入 | 已完成 | Sprint-16 已按不新增真实目录表、不引新依赖完成 | 07 API-029、06 REQ-037 | TC-P1-015 通过 |
| DEV-005 | **已实现（2026-08-03，task-028）**：folder-tree 接入后 API-029 `preserve_structure=true` 建/复用 `lumen_folders` 并回填 `lumen_documents.folder_id` | Flow-006 / API-029 原设计"不建真实目录表" | 已实现 | **推翻 ING-C-001**：Phase1.5A 结论维持（P1.5A 不建表），Phase2B 第三 slice（folder-tree）起允许建 `lumen_folders`；`preserve_structure=false` 保留标题前缀向后兼容 | 06 lumen_folders/folder_id、07 API-029/API-034..037、design/folder-tree Flow-D-012 | TC-P2-FOLDER-001（后端/API 通过；前端文件管理器待 slice 3） |

## 7. 验收追溯

| 设计点 | 关联 REQ | 关联 Sprint | 关联 TC | 验证方式 | 状态 |
|---|---|---|---|---|---|
| 文本导入可检索 | REQ-009 | Sprint-3 | TC-P1-009 | `tests/backend/test_imports.py` | 条件通过（仅 `.md`/`.txt`） |
| 图片 OCR 导入 | REQ-010 | Sprint-3 | TC-P1-010 | — | 后续阶段（OCR 未实现） |
| Flow-D-001 导入主流水线 | REQ-009/010 | Sprint-3 | TC-P1-009/010 | 见上 | 降级实现 |
| Flow-006 批量 / 文件夹导入 | REQ-037 | Sprint-16 | TC-P1-015 | 后端 tests + Chrome headless drop-zone smoke 已通过 | Phase1.5A-已实现 |
| Flow-D-012 导入保留目录结构（folder-tree） | REQ-037/039 | Sprint-22 | TC-P2-FOLDER-001 + TC-P1-015 扩展 | `tests.backend.test_imports` / `test_import_api` + 临时 PG smoke：`preserve_structure` 建/复用 `lumen_folders` | Phase2B 第三 slice·后端/API 已实现；前端文件管理器待实现 |
| Flow-D-014 Vault 兼容双模式 | REQ-018 | Phase2C | TC-P2-VAULT-001 | 浏览器 File System Access 授权 + IndexedDB 本地索引 + 1000+ 文件本地树 / 按需导入 smoke（RG-009 PoC Go 2026-08-05） | Phase2C·已完成（Sprint-23C TC-P2-VAULT-001 通过 / PR#108 v2.0.0） |

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| ING-C-001 | Sprint-16 是否允许新增真实目录表 | ~~不允许；只用标题前缀模拟目录感~~ **已被 folder-tree 设计推翻（Phase2B 第三 slice，2026-08-02）** | P1.5A 结论不变（04/05/06/07 约束 P1.5A 不新增表）；Phase2B folder-tree 已回填 06/07/02/03/08/09 | 新建 folder 表（Phase2B 已采纳，REQ-039） | P1.5A 不受影响；Phase2B `preserve_structure` 扩展见 DEV-005 / `docs/design/folder-tree.md` |
| ING-C-002 | 同名冲突默认策略 | 默认 skipped 并逐条提示 | 用户目标是快速入库，避免静默覆盖 | 覆盖 / 自动重命名 | 覆盖有数据风险；自动重命名会影响搜索标题一致性 |
| ING-C-003 | 真实 Word/PDF 解析是否提前 | 不提前；放 Phase1.5B + RG-007 | 05 已声明不阻塞 P1.5A | 与 Sprint-16 同做 | 会引依赖与隐私验证风险 |
