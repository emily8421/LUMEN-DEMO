# task-009：search 向量化 + 可选 zhparser（REQ-007 搜索质量提升）

> 小 PR：承接 task-008 T6 遗留项。范围限定在普通搜索 `/api/search` 的召回质量提升，不切 Phase2，不引入高级视图或新产品能力。

## 目标

- 让普通搜索在关键词 / 标题匹配之外，复用 `pg_repository.recall_chunks` 的 pgvector 语义召回。
- 启用 PostgreSQL `ts_vector` SQL 候选路径，作为关键词全文检索候选。
- 评估并可选接入 `zhparser`：扩展存在时启用中文分词配置；当前 `pgvector/pgvector:pg16` 镜像无 zhparser 时回退到 `simple`，不破坏本地 Demo 起库。

## 输入文档

- `docs/03-prd.md`：REQ-007 全文搜索为 Phase1 Demo 范围。
- `docs/05-tech-spec.md`：pgvector / Embedding / RG-001/002/005 状态。
- `docs/06-db-design.md`：`lumen_chunks.embedding`、`lumen_chunks.ts_vector`。
- `docs/design/rag-retrieval.md`：DEV-001 / DEV-003 与 Flow-D-003。
- `docs/09-verification.md`：TC-P1-007。
- `tasks/task-008-pgvector-integration.md`：T6 完成备注中的遗留项。

## 修改范围

- `backend/service/search.py`：普通搜索改为 substring + SQL 全文候选 + pgvector 语义候选的加法式合并。
- `backend/service/pg_repository.py` / `backend/service/demo_repository.py`：补 `search_chunks` 仓储接口；PG 走 `ts_vector`，内存 fake 返回空。
- `backend/migrations/006_optional_zhparser_search.sql`：可选 zhparser 配置与 `ts_vector` 回填。
- `tests/backend/test_search.py` / `tests/backend/test_api_routes.py`：补向量搜索单测与真实 PG 集成测试。
- `docs/05-tech-spec.md`、`docs/06-db-design.md`、`docs/design/rag-retrieval.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`：回写状态。

## 验收标准

- 关键词搜索仍返回原结果，权限 / 空间过滤不回退。
- 普通搜索能在无直接关键词重叠时通过 pgvector 召回语义相关 chunk。
- `zhparser` 不存在时 `init_db()` 幂等通过；存在时可启用 `lumen_zh` 配置。
- 新增 / 相关测试通过，且不修改 `/api/search` API 契约。

## 禁止事项

- 不修改 Phase 指针，不启动 Phase2。
- 不新增独立向量库或替换 pgvector。
- 不把 `zhparser` 作为当前 Docker 镜像的硬依赖。
- 不实现标签 / 时间轴 / 关联图等 Phase2 高级视图。

## 完成记录

- [x] search hybrid recall：substring + `search_chunks` + `recall_chunks` 合并去重。
- [x] optional zhparser migration：当前镜像无 zhparser 时回退 `simple`，`init_db()` 两次验证通过。
- [x] tests：76 后端 tests 通过（提升权限加载 torch / embedding；含真实语义搜索集成测试）。
