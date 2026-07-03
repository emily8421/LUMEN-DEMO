# 05 技术方案

> 技术栈版本与关键决策。"为什么"见 04，本文讲"具体版本与约束"。
> Phase 技术约束与 `ai/project-rules.md` §1 / §2 一致。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 输入来源 | `docs/03-prd.md`、`docs/04-architecture.md`、`docs/env/local-env.md`、`ai/project-rules.md` |
| 覆盖架构组件 | FastAPI 后端、React 前端、PostgreSQL + pgvector、Embedding / LLM 适配、导入解析 |
| 当前状态 | 已确认（Phase1 技术基线已钉死；实现期变更需先修订本文） |
| 最后更新 | 2026-07-03 |

## 1. 技术栈与版本

> Phase1 固定以下运行基线；本机已采集到 Python 3.14.3 / Node.js 22.17.1 / Docker 29.5.2，可用于辅助工具，但项目后端运行时以 Python 3.12 为准。

| 层 | 选型 | Phase1 基线 |
|---|---|---|
| 后端 | Python + FastAPI | Python 3.12.x；FastAPI 0.115.x；Uvicorn 0.34.x；Pydantic 2.10.x |
| 数据库 | PostgreSQL + pgvector | PostgreSQL 16.x；pgvector 0.7.x；SQLAlchemy 2.0.x；Alembic 1.14.x；psycopg 3.2.x |
| 向量索引 | pgvector hnsw | Embedding 维度 512；HNSW `m=16`、`ef_construction=64`、查询 `ef_search=40`；Demo 数据 < 1k chunks 可先用精确扫描 |
| AI | LLM：OpenAI 兼容接口；Embedding：本机 `BAAI/bge-small-zh-v1.5` | Embedding 512 维；`sentence-transformers` 3.0.x；LLM Demo 默认走公司内网 OpenAI 兼容中转，未配置时显式 Mock |
| 前端 | React | React 18.2.x；Vite 5.4.x；TypeScript 5.5.x；Node.js 22.17.1；npm 11.11.0 |
| 文档解析 | python-docx / pdfplumber | python-docx 1.1.x；pdfplumber 0.11.x |
| OCR | PaddleOCR（可降级） | PaddleOCR 2.8.x；Phase1 允许关闭 OCR 并降级为已提取文本 |
| 部署 | Docker Compose（本地起库与依赖） | Docker 29.5.2；Docker Compose v5.1.4；本地 PostgreSQL + pgvector 由 compose 编排 |

```mermaid
flowchart TB
  frontend[React 前端] --> api[FastAPI API 层]
  api --> service[service 层<br/>权限 / 文档 / 导入 / 检索 / 术语]
  service --> model[model 层]
  model --> postgres[(PostgreSQL + pgvector)]
  service --> parser[python-docx / pdfplumber / PaddleOCR]
  service --> embedding[bge-small-zh<br/>本机 Embedding 512 维]
  service --> llm[OpenAI 兼容 LLM<br/>公司内网中转 / Mock]
```

## 2. 关键技术决策

- **向量检索用 pgvector**，Phase1 不引 Milvus / Qdrant（见 project-rules §2）。
- **AI 调用分层封装**：LLM 统一走 OpenAI 兼容封装层；Embedding 通过本机 adapter 调 `bge-small-zh`，后续可替换为公司内网 OpenAI-compatible `/v1/embeddings` 服务。
- **导入流水线**：异构文件 → 纯文本 → 切块 → Embedding → 入 `lumen_chunks`（详见 docs/design/ingestion）。
- **RAG**：向量检索 + 全文检索双路召回，答案带来源（详见 docs/design/rag-retrieval）；P1 不做重排调优。
- **术语口径注入**：RAG 构造 Prompt 前按当前空间查 `lumen_terms`，空间术语优先于全局术语；文档阅读 / 编辑侧用术语表做轻量匹配提示（详见 docs/design/term-management）。
- **鉴权**：Phase1 使用 Demo Bearer Token；`POST /api/auth/login` 返回 HMAC-SHA256 签名 token，前端通过 `Authorization: Bearer <token>` 传递。Token 载荷包含 `user_id`、`current_space_id`、`exp`，有效期 8 小时；`POST /api/spaces/switch` 校验成员关系后返回带新 `current_space_id` 的 token。权限在空间 + 文档两级校验，查询 / 检索 / 问答三层统一过滤（详见 docs/design/permissions）。
- **错误码**：HTTP 状态码 + `{ code, msg, data }` 双层表达；`code=0` 表示成功，业务错误使用 4 位数字码（详见 `docs/07-api-spec.md` §1）。
- **切块与 Embedding 参数**：导入侧与检索侧共用同一套（避免 train/serve 偏差）；按标题 / 段落优先切分，目标块长 512 tokens、重叠 64 tokens，单块最小 80 字符；Embedding 模型为 `BAAI/bge-small-zh-v1.5`，维度 512，对应 pgvector `vector(512)`，写入前做向量归一化；批量 Embedding 默认 batch size 32。

## 3. Phase 技术约束

- **P1 允许**：见 project-rules §1。
- **P1 禁止**：独立向量库、闭源 SDK 绑定、移动端、实时协作。
- **高风险项不进 P1**：跨文档因果推理、问题热力矩阵——需本文先验证可行（对应 REQ-020/021）。

## 4. 编码约定

- 后端使用 Python `snake_case`；目录按 `api / service / model` 分层，对外接口只进 api 层。
- 前端使用 JS/TS `camelCase`，React 组件使用 `PascalCase`。
- AI 调用统一走 OpenAI 兼容 adapter；不得在业务层直接绑定单一闭源 SDK。
- 新增依赖必须写入依赖文件，并说明用途；Sprint 内不得引入本节基线之外的依赖。

## 5. 运行环境与资源评估

> 受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束。给出本机 Demo 可行性、瓶颈、降级 / Mock 与服务器预案。

- 本机 Demo 可行性：PostgreSQL+pgvector、FastAPI、React 均可本机 Docker 运行；Embedding 采用本机 `bge-small-zh`（512 维），不依赖公司 Embedding 资源。
- 数据范围：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档。真实文档必须显式标注来源 / 敏感级别，并优先避免发送到外部模型。
- 依赖 / 镜像：允许本机安装项目所需 Python / npm 依赖并拉取 Docker 镜像；新增依赖必须进入依赖文件并说明用途，不得替换既定技术栈。
- 资源软上限：Demo 峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；依据见 `docs/env/local-env.md` 自动采集值与人工确认项。
- 资源瓶颈：大文档批量导入的内存占用、向量索引构建开销；超限先优化批处理、增量索引与 chunk 策略。
- 降级 / Mock 策略：LLM 可降级为明确 Mock 回答或远程 API；OCR 可降级为已提取文本；真实文档场景下需优先避免把敏感片段发送到外部模型。
- 服务器资源预案：本机 Embedding 不够用时，申请公司内网 Embedding / reranker 服务，后端通过 adapter 调用 OpenAI-compatible `/v1/embeddings`，并按新维度重建向量与索引（见 `docs/env/local-env.md`「服务器资源预案」段）。

## 6. 待人工确认项

- 无开发前阻塞项；若实现期需要升级本节基线之外的版本或依赖，必须先修订本文并说明原因。
