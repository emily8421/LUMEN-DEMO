# 05 技术方案

> 技术栈版本与关键决策。"为什么"见 04，本文讲"具体版本与约束"。
> Phase 技术约束与 `ai/project-rules.md` §1 / §2 一致。

## 1. 技术栈与版本

> 标注「待确认」的版本号待开发前钉死；不影响 P1 架构形态。

| 层 | 选型 | 版本（待确认） |
|---|---|---|
| 后端 | Python + FastAPI | Python 3.12 / FastAPI 0.11x 待确认 |
| 数据库 | PostgreSQL + pgvector | PG 16 / pgvector 0.7 待确认 |
| 向量索引 | pgvector ivfflat 或 hnsw | 参数与 Embedding 维度联动，待确认 |
| AI | OpenAI 兼容（LLM + Embedding） | 具体型号 / Embedding 维度待确认 |
| 前端 | React | 18 + 状态管理 / 路由待确认 |
| 文档解析 | python-docx / pdfplumber | 版本待确认 |
| OCR | PaddleOCR（建议，中文友好） | 待确认 |
| 部署 | Docker Compose（本地起库与依赖） | 待确认 |

## 2. 关键技术决策

- **向量检索用 pgvector**，Phase1 不引 Milvus / Qdrant（见 project-rules §2）。
- **AI 调用统一走 OpenAI 兼容封装层**，不绑厂商 SDK；换模型只改配置。
- **导入流水线**：异构文件 → 纯文本 → 切块 → Embedding → 入 `lumen_chunks`（详见 design-ingestion）。
- **RAG**：向量检索 + 全文检索双路召回，答案带来源（详见 design-rag-retrieval）；P1 不做重排调优。
- **鉴权**：会话 / Token（具体方式待本文细化）；权限在空间 + 文档两级校验，查询 / 检索 / 问答三层统一过滤（详见 design-permissions）。
- **切块与 Embedding 参数**：导入侧与检索侧共用同一套（避免 train/serve 偏差）；具体 token 长度 / 重叠待钉。

## 3. Phase 技术约束

- **P1 允许**：见 project-rules §1。
- **P1 禁止**：独立向量库、闭源 SDK 绑定、移动端、实时协作。
- **高风险项不进 P1**：跨文档因果推理、问题热力矩阵——需本文先验证可行（对应 REQ-020/021）。

## 4. 编码约定

见 `ai/project-rules.md` §5（待 04-08 审核后回填，不虚构）。
