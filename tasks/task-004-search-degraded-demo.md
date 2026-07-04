# Sprint-4A 降级任务：内存全文搜索最小闭环

## 目标

在 PostgreSQL / pgvector / Embedding / RAG 尚未接入时，先基于 Sprint-3 已生成的内存 `document_chunks` 实现 Phase1 Demo 的全文搜索入口最小闭环：当前空间内按关键词检索可见文档 chunk，返回文档标题与命中片段，为后续 RAG 问答提供可复用候选块筛选基础。

## 输入文档

- `docs/08-dev-plan.md` Sprint-4：检索与 RAG 问答
- `docs/design/rag-retrieval.md`：权限过滤 → 全文召回 → 返回标题 / 片段 / 定位
- `docs/06-db-design.md`：`lumen_chunks` 与文档权限字段
- `docs/07-api-spec.md`：`GET /api/search?q=关键词`

## 修改范围

- `backend/service/search.py`：内存 chunks 关键词匹配、权限过滤、片段生成与分页
- `backend/api/search.py`、`backend/main.py`：提供 `GET /api/search` 降级接口
- `backend/service/demo_repository.py`：暴露全部内存 chunks 供检索服务读取
- `tests/backend/*`：补充 service 与 API 测试

## 验收标准

- `GET /api/search?q=关键词` 返回 `{ items, total, page }`，命中项包含 `doc_id`、`title`、`snippet`
- 搜索只返回当前 token `current_space_id` 下可见文档的 chunks
- 私有文档只有作者本人能搜索到，同空间其他成员搜索不到
- 空关键词或仅空白关键词返回明确参数错误

## 禁止事项

- 不接真实 PostgreSQL / `ts_vector` / pgvector
- 不安装或启用 Embedding、reranker 或 LLM 依赖
- 不实现 `/api/query` RAG 问答、来源生成或术语注入
- 不扩展前端搜索 UI
