# Sprint-4B 降级任务：RAG 问答最小闭环

## 目标

在 Embedding / pgvector / LLM 尚未接入时，基于 Sprint-4A 的内存 chunks 与权限过滤，实现 Phase1 Demo 的 `/api/query` 最小闭环：对当前空间可见候选块做关键词召回，返回明确的降级摘要式答案与来源；无候选块时返回“未在当前空间知识库找到相关内容”，不编造。

## 输入文档

- `docs/08-dev-plan.md` Sprint-4：检索与 RAG 问答
- `docs/design/rag-retrieval.md`：权限过滤、候选块、受约束回答、无候选块边界
- `docs/06-db-design.md`：`lumen_chunks` 与文档权限字段
- `docs/07-api-spec.md`：`POST /api/query`

## 修改范围

- `backend/service/rag.py`：降级候选块召回、答案生成与来源列表
- `backend/api/rag.py`、`backend/main.py`：提供 `POST /api/query` 降级接口
- `tests/backend/*`：补充 service 与 API 测试

## 验收标准

- `POST /api/query` 接收 `question` 并返回 `{ answer, sources }`
- 命中当前空间可见 chunks 时，答案明确标注为降级模式，并只引用候选块原文摘要
- `sources[]` 包含 `doc_id`、`title`、`snippet`，且不泄露跨空间或私有不可见文档
- 无相关内容时返回 `answer="未在当前空间知识库找到相关内容"` 与空 sources
- 空问题或仅空白问题返回明确参数错误

## 禁止事项

- 不接真实 LLM / OpenAI 兼容接口
- 不安装或启用 Embedding、reranker、pgvector 依赖
- 不实现术语注入、Prompt 编排、引用编号解析或多文档矛盾推理
- 不扩展前端问答 UI
