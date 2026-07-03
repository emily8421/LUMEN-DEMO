# 05 技术方案

> 技术栈版本与关键决策。"为什么"见 04，本文讲"具体版本与约束"。
> Phase 技术约束与 `ai/project-rules.md` §1 / §2 一致。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 输入来源 | `docs/03-prd.md`、`docs/04-architecture.md`、`docs/env/local-env.md`、`ai/project-rules.md` |
| 覆盖架构组件 | FastAPI 后端、React 前端、PostgreSQL + pgvector、Embedding / LLM 适配、导入解析 |
| 当前状态 | 已确认（版本号与部分实现细节仍按文内“待确认”处理） |
| 最后更新 | 2026-07-03 |

## 1. 技术栈与版本

> 标注「待确认」的版本号待开发前钉死；不影响 P1 架构形态。

| 层 | 选型 | 版本（待确认） |
|---|---|---|
| 后端 | Python + FastAPI | Python 3.12 / FastAPI 0.11x 待确认 |
| 数据库 | PostgreSQL + pgvector | PG 16 / pgvector 0.7 待确认 |
| 向量索引 | pgvector ivfflat 或 hnsw | Embedding 维度 512；索引参数待确认 |
| AI | LLM：OpenAI 兼容接口；Embedding：本机 `bge-small-zh` | Embedding 512 维；LLM 具体型号待确认 |
| 前端 | React | 18 + 状态管理 / 路由待确认 |
| 文档解析 | python-docx / pdfplumber | 版本待确认 |
| OCR | PaddleOCR（建议，中文友好） | 待确认 |
| 部署 | Docker Compose（本地起库与依赖） | 待确认 |

## 2. 关键技术决策

- **向量检索用 pgvector**，Phase1 不引 Milvus / Qdrant（见 project-rules §2）。
- **AI 调用分层封装**：LLM 统一走 OpenAI 兼容封装层；Embedding 通过本机 adapter 调 `bge-small-zh`，后续可替换为公司内网 OpenAI-compatible `/v1/embeddings` 服务。
- **导入流水线**：异构文件 → 纯文本 → 切块 → Embedding → 入 `lumen_chunks`（详见 docs/design/ingestion）。
- **RAG**：向量检索 + 全文检索双路召回，答案带来源（详见 docs/design/rag-retrieval）；P1 不做重排调优。
- **术语口径注入**：RAG 构造 Prompt 前按当前空间查 `lumen_terms`，空间术语优先于全局术语；文档阅读 / 编辑侧用术语表做轻量匹配提示（详见 docs/design/term-management）。
- **鉴权**：会话 / Token（具体方式待本文细化）；权限在空间 + 文档两级校验，查询 / 检索 / 问答三层统一过滤（详见 docs/design/permissions）。
- **切块与 Embedding 参数**：导入侧与检索侧共用同一套（避免 train/serve 偏差）；Embedding 模型为 `bge-small-zh`，维度 512，对应 pgvector `vector(512)`；具体 token 长度 / 重叠待钉。

## 3. Phase 技术约束

- **P1 允许**：见 project-rules §1。
- **P1 禁止**：独立向量库、闭源 SDK 绑定、移动端、实时协作。
- **高风险项不进 P1**：跨文档因果推理、问题热力矩阵——需本文先验证可行（对应 REQ-020/021）。

## 4. 编码约定

见 `ai/project-rules.md` §5（待 04-08 审核后回填，不虚构）。

## 5. 运行环境与资源评估

> 受 `ai/project-rules.md` §2.5 与 `docs/env/local-env.md` 约束。给出本机 Demo 可行性、瓶颈、降级 / Mock 与服务器预案。

- 本机 Demo 可行性：PostgreSQL+pgvector、FastAPI、React 均可本机 Docker 运行；Embedding 采用本机 `bge-small-zh`（512 维），不依赖公司 Embedding 资源。
- 数据范围：默认使用已标注的虚构 Demo 数据；允许按需导入部分真实团队文档。真实文档必须显式标注来源 / 敏感级别，并优先避免发送到外部模型。
- 依赖 / 镜像：允许本机安装项目所需 Python / npm 依赖并拉取 Docker 镜像；新增依赖必须进入依赖文件并说明用途，不得替换既定技术栈。
- 资源软上限：Demo 峰值内存 < 8GB、显存 < 4GB、磁盘 < 20GB；依据见 `docs/env/local-env.md` 自动采集值与人工确认项。
- 资源瓶颈：大文档批量导入的内存占用、向量索引构建开销；超限先优化批处理、增量索引与 chunk 策略。
- 降级 / Mock 策略：LLM 可降级为明确 Mock 回答或远程 API；OCR 可降级为已提取文本；真实文档场景下需优先避免把敏感片段发送到外部模型。
- 服务器资源预案：本机 Embedding 不够用时，申请公司内网 Embedding / reranker 服务，后端通过 adapter 调用 OpenAI-compatible `/v1/embeddings`，并按新维度重建向量与索引（见 `docs/env/local-env.md`「服务器资源预案」段）。
