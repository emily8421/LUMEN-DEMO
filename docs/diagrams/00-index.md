# 图索引（docs/diagrams/）

> **生成式镜像索引**（`scripts/extract-diagrams.mjs` 产物，不手改）。审核主入口：按 OO 方法五阶段分组；每图一文件（图块 + 源锚点 + 追溯）。
> 文档内图是唯一权威源，本目录是抽取镜像——改图请改源文档后重跑脚本；CI（docs-mirror job）校验同步。
> 共 46 张。方案：`docs/research/2026-08-17-oo-coverage-evaluation-and-diagram-mirror-plan.md`。

### 需求分析（2）

| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |
|---|---|---|---|---|---|
| [DIAG-UC-01](DIAG-UC-01.md) | 用例全景图（域入口视图） | 用例图 | `docs/00-scenario.md` | 全量 REQ（01 §6 / 00 §3.3） | plantuml（需本机预览） |
| [DIAG-DOM-01](DIAG-DOM-01.md) | 领域模型（分析类图 / 概念 ERD） | 类图（概念） | `docs/06-db-design.md` | 06 §6 REQ→表 | GitHub 原生 |

### 概要设计（11）

| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |
|---|---|---|---|---|---|
| [DIAG-ARCH-01](DIAG-ARCH-01.md) | 整体架构图 | 架构图 | `docs/04-architecture.md` | REQ / MOD | GitHub 原生 |
| [DIAG-ARCH-01a](DIAG-ARCH-01a.md) | 系统上下文图（信任边界） | 上下文图 | `docs/04-architecture.md` | 04 §1.1 外部系统状态 | GitHub 原生 |
| [DIAG-ARCH-01b](DIAG-ARCH-01b.md) | 分层架构视图 | 分层图 | `docs/04-architecture.md` | project-rules §5.1 四层 | GitHub 原生 |
| [DIAG-CLS-PRELIM-01](DIAG-CLS-PRELIM-01.md) | 概设类图（后端四层关键类） | 类图（概设） | `docs/04-architecture.md` | → 详细类图 DIAG-CLS-* | GitHub 原生 |
| [DIAG-ARCH-02](DIAG-ARCH-02.md) | 生产部署拓扑图（⑪ 方案 A） | 部署图 | `docs/04-architecture.md` | 04 §4 运行形态 | GitHub 原生 |
| [DIAG-SEQ-FLOW001](DIAG-SEQ-FLOW001.md) | Flow-001 登录与空间切换（概要流程） | 顺序图（流程） | `docs/04-architecture.md` | API-001..003 / TC-P1-001/002 | GitHub 原生 |
| [DIAG-FLOW-002](DIAG-FLOW-002.md) | Flow-002 统一过滤（概要流程） | 流程图 | `docs/04-architecture.md` | API-004..010 / TC-P1-003..008 | GitHub 原生 |
| [DIAG-ARCH-SEQ-01](DIAG-ARCH-SEQ-01.md) | SEQ-01 文档访问 / 搜索 / RAG 统一过滤 | 顺序图 | `docs/04-architecture.md` | Flow-002 | GitHub 原生 |
| [DIAG-ARCH-SEQ-02](DIAG-ARCH-SEQ-02.md) | SEQ-02 Phase2D 认证升级 | 顺序图 | `docs/04-architecture.md` | REQ-040..042 | GitHub 原生 |
| [DIAG-ARCH-SEQ-03](DIAG-ARCH-SEQ-03.md) | SEQ-03 AI 润色 / 写作引用 | 顺序图 | `docs/04-architecture.md` | Flow-005 / RG-008 | GitHub 原生 |
| [DIAG-ARCH-SEQ-04](DIAG-ARCH-SEQ-04.md) | SEQ-04 批量 / 文件夹导入 | 顺序图 | `docs/04-architecture.md` | Flow-006 / EX-006 | GitHub 原生 |

### 详细设计（31）

| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |
|---|---|---|---|---|---|
| [DIAG-CLS-AUTH-01](DIAG-CLS-AUTH-01.md) | 详细类图 · 账户与认证 | 类图（详细） | `docs/design/accounts-auth.md` | REQ-040..047/050/051 | GitHub 原生 |
| [DIAG-CLS-INGEST-01](DIAG-CLS-INGEST-01.md) | 详细类图 · 内容导入 | 类图（详细） | `docs/design/ingestion.md` | REQ-009/010/037 | GitHub 原生 |
| [DIAG-CLS-RAG-01](DIAG-CLS-RAG-01.md) | 详细类图 · 检索问答 | 类图（详细） | `docs/design/rag-retrieval.md` | REQ-007/008 | GitHub 原生 |
| [DIAG-CLS-PERM-01](DIAG-CLS-PERM-01.md) | 详细类图 · 空间与权限 | 类图（详细） | `docs/design/permissions.md` | REQ-001/002/003 | GitHub 原生 |
| [DIAG-CLS-TERM-01](DIAG-CLS-TERM-01.md) | 详细类图 · 术语管理 | 类图（详细） | `docs/design/term-management.md` | REQ-036/048 | GitHub 原生 |
| [DIAG-CLS-FOLDER-01](DIAG-CLS-FOLDER-01.md) | 详细类图 · 文档目录树 | 类图（详细） | `docs/design/folder-tree.md` | REQ-039/037 | GitHub 原生 |
| [DIAG-CLS-EXPORT-01](DIAG-CLS-EXPORT-01.md) | 详细类图 · 导出交付 | 类图（详细） | `docs/design/export-delivery.md` | REQ-038/027 | GitHub 原生 |
| [DIAG-CLS-POLISH-01](DIAG-CLS-POLISH-01.md) | 详细类图 · AI 润色 / 写作引用 | 类图（详细） | `docs/design/ai-polish.md` | REQ-014 | GitHub 原生 |
| [DIAG-CLS-AI-01](DIAG-CLS-AI-01.md) | 详细类图 · AI 助手 | 类图（详细） | `docs/design/ai-assistant.md` | REQ-008 | GitHub 原生 |
| [DIAG-DB-ER-01](DIAG-DB-ER-01.md) | 物理 ERD（表间关系） | ER 图 | `docs/06-db-design.md` | 06 §1/§6 | GitHub 原生 |
| [DIAG-STATE-IMPORT-01](DIAG-STATE-IMPORT-01.md) | 导入任务状态机（单文件任务态） | 状态图 | `docs/design/ingestion.md` | REQ-009/037 · EX-003/006 | GitHub 原生 |
| [DIAG-STATE-IMPORT-01b](DIAG-STATE-IMPORT-01b.md) | 批量导入逐文件结果态（响应级） | 状态图 | `docs/design/ingestion.md` | Flow-006 items[] | GitHub 原生 |
| [DIAG-FLOW-INGEST-SINGLE](DIAG-FLOW-INGEST-SINGLE.md) | Flow-D-001 单文件导入流程 | 流程图 | `docs/design/ingestion.md` | REQ-009 | GitHub 原生 |
| [DIAG-FLOW-INGEST-BATCH](DIAG-FLOW-INGEST-BATCH.md) | Flow-006 批量导入流程 | 流程图 | `docs/design/ingestion.md` | REQ-037 | GitHub 原生 |
| [DIAG-FLOW-VAULT-DUAL](DIAG-FLOW-VAULT-DUAL.md) | Flow-D-014 Vault 双模式流程 | 流程图 | `docs/design/ingestion.md` | REQ-018（已设计未实现） | GitHub 原生 |
| [DIAG-FLOW-EXPORT-MDZIP](DIAG-FLOW-EXPORT-MDZIP.md) | Flow-007 .md / ZIP 导出流程 | 流程图 | `docs/design/export-delivery.md` | REQ-038 | GitHub 原生 |
| [DIAG-STATE-EXPORT-01](DIAG-STATE-EXPORT-01.md) | PDF 导出任务状态机 | 状态图 | `docs/design/export-delivery.md` | REQ-027 · EX-008 | GitHub 原生 |
| [DIAG-STATE-DRAFT-01](DIAG-STATE-DRAFT-01.md) | AI 草稿生命周期状态机 | 状态图 | `docs/design/ai-polish.md` | REQ-014 | GitHub 原生 |
| [DIAG-FLOW-AUTH](DIAG-FLOW-AUTH.md) | 认证流程（注册 / 登录 / 登出） | 流程图 | `docs/design/accounts-auth.md` | REQ-040..042 | GitHub 原生 |
| [DIAG-STATE-SESSION-01](DIAG-STATE-SESSION-01.md) | 会话生命周期状态机 | 状态图 | `docs/design/accounts-auth.md` | REQ-041/042 | GitHub 原生 |
| [DIAG-FLOW-PERM-FILTER](DIAG-FLOW-PERM-FILTER.md) | 权限过滤决策流 | 流程图 | `docs/design/permissions.md` | Flow-D-002 | GitHub 原生 |
| [DIAG-FLOW-RAG](DIAG-FLOW-RAG.md) | RAG 检索问答流程 | 流程图 | `docs/design/rag-retrieval.md` | Flow-D-004 | GitHub 原生 |
| [DIAG-FLOW-TERM](DIAG-FLOW-TERM.md) | 术语维护与口径对齐流程 | 流程图 | `docs/design/term-management.md` | Flow-D-005..007 | GitHub 原生 |
| [DIAG-FLOW-FOLDER-IMPORT](DIAG-FLOW-FOLDER-IMPORT.md) | 导入保留目录结构流程 | 流程图 | `docs/design/folder-tree.md` | Flow-D-012 | GitHub 原生 |
| [DIAG-TL-FLOW-01](DIAG-TL-FLOW-01.md) | 主题时间线装配流程 | 流程图 | `docs/design/timeline.md` | REQ-013a/024 | GitHub 原生 |
| [DIAG-FLOW-ASSIST](DIAG-FLOW-ASSIST.md) | AI 助手多轮对话交互流 | 流程图 | `docs/design/ai-assistant.md` | Flow-D-ASSIST-01 | GitHub 原生 |
| [DIAG-FLOW-FE-IA](DIAG-FLOW-FE-IA.md) | P1 页面信息架构 | 流程图（前端） | `docs/design/frontend-interaction.md` | REQ-011 页面清单 | GitHub 原生 |
| [DIAG-FE-COMP-01](DIAG-FE-COMP-01.md) | 前端组件树（App 装配 → Shell → Feature） | 组件树（前端） | `docs/design/frontend-interaction.md` | REQ-011 / COMP-001 · CQ-P1-008 | GitHub 原生 |
| [DIAG-FE-STATE-01](DIAG-FE-STATE-01.md) | 工作台视图与栏布局状态机 | 状态图（前端） | `docs/design/frontend-interaction.md` | REQ-011 · Doc-First §9.5 | GitHub 原生 |
| [DIAG-SEQ-FE-UF001](DIAG-SEQ-FE-UF001.md) | UF-001 登录与空间切换（前端时序） | 顺序图（前端） | `docs/design/frontend-interaction.md` | UF-001 | GitHub 原生 |
| [DIAG-API-SEQ-01](DIAG-API-SEQ-01.md) | P1 交互时序图（API 视角） | 顺序图 | `docs/07-api-spec.md` | 07 §3.8 API-ID | GitHub 原生 |

### 详细设计（愿景）（1）

| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |
|---|---|---|---|---|---|
| [DIAG-FLOW-INTEL](DIAG-FLOW-INTEL.md) | 情报分析功能骨架（愿景） | 流程图 | `docs/design/intelligence-analysis.md` | REQ-029..034 骨架 | GitHub 原生 |

### 实现（1）

| 图 ID | 名称 | 类型 | 源 | 追溯 | 渲染 |
|---|---|---|---|---|---|
| [DIAG-TECH-STACK-01](DIAG-TECH-STACK-01.md) | 技术栈分层图 | 分层图 | `docs/05-tech-spec.md` | 05 §1 COMP | GitHub 原生 |

## 按文档反查

| 源文档 | 图 |
|---|---|
| `docs/00-scenario.md` | [DIAG-UC-01](DIAG-UC-01.md) |
| `docs/06-db-design.md` | [DIAG-DOM-01](DIAG-DOM-01.md) · [DIAG-DB-ER-01](DIAG-DB-ER-01.md) |
| `docs/04-architecture.md` | [DIAG-ARCH-01](DIAG-ARCH-01.md) · [DIAG-ARCH-01a](DIAG-ARCH-01a.md) · [DIAG-ARCH-01b](DIAG-ARCH-01b.md) · [DIAG-CLS-PRELIM-01](DIAG-CLS-PRELIM-01.md) · [DIAG-ARCH-02](DIAG-ARCH-02.md) · [DIAG-SEQ-FLOW001](DIAG-SEQ-FLOW001.md) · [DIAG-FLOW-002](DIAG-FLOW-002.md) · [DIAG-ARCH-SEQ-01](DIAG-ARCH-SEQ-01.md) · [DIAG-ARCH-SEQ-02](DIAG-ARCH-SEQ-02.md) · [DIAG-ARCH-SEQ-03](DIAG-ARCH-SEQ-03.md) · [DIAG-ARCH-SEQ-04](DIAG-ARCH-SEQ-04.md) |
| `docs/design/accounts-auth.md` | [DIAG-CLS-AUTH-01](DIAG-CLS-AUTH-01.md) · [DIAG-FLOW-AUTH](DIAG-FLOW-AUTH.md) · [DIAG-STATE-SESSION-01](DIAG-STATE-SESSION-01.md) |
| `docs/design/ingestion.md` | [DIAG-CLS-INGEST-01](DIAG-CLS-INGEST-01.md) · [DIAG-STATE-IMPORT-01](DIAG-STATE-IMPORT-01.md) · [DIAG-STATE-IMPORT-01b](DIAG-STATE-IMPORT-01b.md) · [DIAG-FLOW-INGEST-SINGLE](DIAG-FLOW-INGEST-SINGLE.md) · [DIAG-FLOW-INGEST-BATCH](DIAG-FLOW-INGEST-BATCH.md) · [DIAG-FLOW-VAULT-DUAL](DIAG-FLOW-VAULT-DUAL.md) |
| `docs/design/rag-retrieval.md` | [DIAG-CLS-RAG-01](DIAG-CLS-RAG-01.md) · [DIAG-FLOW-RAG](DIAG-FLOW-RAG.md) |
| `docs/design/permissions.md` | [DIAG-CLS-PERM-01](DIAG-CLS-PERM-01.md) · [DIAG-FLOW-PERM-FILTER](DIAG-FLOW-PERM-FILTER.md) |
| `docs/design/term-management.md` | [DIAG-CLS-TERM-01](DIAG-CLS-TERM-01.md) · [DIAG-FLOW-TERM](DIAG-FLOW-TERM.md) |
| `docs/design/folder-tree.md` | [DIAG-CLS-FOLDER-01](DIAG-CLS-FOLDER-01.md) · [DIAG-FLOW-FOLDER-IMPORT](DIAG-FLOW-FOLDER-IMPORT.md) |
| `docs/design/export-delivery.md` | [DIAG-CLS-EXPORT-01](DIAG-CLS-EXPORT-01.md) · [DIAG-FLOW-EXPORT-MDZIP](DIAG-FLOW-EXPORT-MDZIP.md) · [DIAG-STATE-EXPORT-01](DIAG-STATE-EXPORT-01.md) |
| `docs/design/ai-polish.md` | [DIAG-CLS-POLISH-01](DIAG-CLS-POLISH-01.md) · [DIAG-STATE-DRAFT-01](DIAG-STATE-DRAFT-01.md) |
| `docs/design/ai-assistant.md` | [DIAG-CLS-AI-01](DIAG-CLS-AI-01.md) · [DIAG-FLOW-ASSIST](DIAG-FLOW-ASSIST.md) |
| `docs/design/timeline.md` | [DIAG-TL-FLOW-01](DIAG-TL-FLOW-01.md) |
| `docs/design/frontend-interaction.md` | [DIAG-FLOW-FE-IA](DIAG-FLOW-FE-IA.md) · [DIAG-FE-COMP-01](DIAG-FE-COMP-01.md) · [DIAG-FE-STATE-01](DIAG-FE-STATE-01.md) · [DIAG-SEQ-FE-UF001](DIAG-SEQ-FE-UF001.md) |
| `docs/design/intelligence-analysis.md` | [DIAG-FLOW-INTEL](DIAG-FLOW-INTEL.md) |
| `docs/05-tech-spec.md` | [DIAG-TECH-STACK-01](DIAG-TECH-STACK-01.md) |
| `docs/07-api-spec.md` | [DIAG-API-SEQ-01](DIAG-API-SEQ-01.md) |
