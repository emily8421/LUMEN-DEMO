# Sprint-8 任务：pgvector 接入（内存 → PostgreSQL+pgvector，REQ-007/008 真实化）

> 多阶段大任务（内存仓储 → PG+pgvector，RAG 语义检索真实化）。本文件为总体规划 + T1–T7 子任务拆分，跨多个 PR / 会话推进。
> **前置已就绪**：RG-002（Embedding 已验证，bge-small-zh 512 维 float32）、RG-004（LLM Go）、Docker daemon live（TE-C-003 闭合，2026-07-09）、`pgvector/pgvector:pg16` 镜像已拉。
> **影响面评估**：Explore agent（2026-07-09）——后端无任何 DB 基础设施，全内存单例 `DemoRepository`（被 7 个 API 文件 import）；缺 3 张表迁移；search/rag 全表扫描。

## 目标

把后端从内存 `DemoRepository` 切换到 PostgreSQL + pgvector：数据持久化；RAG/搜索从关键词全表扫描升级为向量相似度（bge-small-zh 512 维）+ 全文检索双路召回。完成后 **RG-001（pgvector）→ Go**、REQ-007/008 真实化。

## 输入文档

- `docs/05-tech-spec.md` §5.1（RG-001/002）、§2（切块/Embedding 参数、pgvector hnsw `m=16/ef_construction=64/ef_search=40`）
- `docs/06-db-design.md`（`lumen_*` 表 + 字段契约）
- `docs/design/rag-retrieval.md`（向量+全文召回）、`docs/design/ingestion.md`（切块→Embedding）
- `docs/research/2026-07-09-tech-env-evaluation-phase1-reeval.md` §5.3（RG-002 验证 + `HF_HUB_DISABLE_XET=1` 约束）
- **`docs/research/2026-07-09-pgvector-impact-assessment.md`（T2–T7 执行依据）**：entity↔表对照 + 字段分歧、demo_repository 方法清单、service 依赖图、12 条硬编码风险点。**T3（最大工作量）必备**。
- 现状：`backend/service/demo_repository.py`（内存单例）、`backend/model/entities.py`、`backend/migrations/001-002`

## 架构决策（降低牵连面）

| 决策 | 选型 | 理由 |
|---|---|---|
| 驱动 | **psycopg（同步）** | 现有全同步签名；改 async 会牵连所有 service 函数 |
| ORM | **新建 `backend/model/orm.py`**（SQLAlchemy），entities 保留为 DTO | 隔离 ORM 与 frozen 领域模型 |
| 仓储 | **新建 `backend/service/pg_repository.py` 实现同接口**，最后切单例指针 | service 鸭子类型契约 + 单例名 `repository` 不变 → **API 层零改动** |
| Embedding | **`backend/service/embedding.py`** 封装 bge-small-zh | 复用 RG-002 验证；须设 `HF_HUB_DISABLE_XET=1` |

## 子任务拆分（T1–T7，每步独立可验证 + PR）

### T1 基建（本会话）
- **目标**：PG+pgvector 容器跑起来 + 后端能连。
- **范围**：`requirements.txt`（psycopg[binary]/sqlalchemy/pgvector/alembic）+ `.env.example`（DATABASE_URL）+ `docker/compose.yml`（pg16+pgvector）+ `backend/service/db.py`（连接池）+ `backend/main.py`（startup/shutdown 生命周期）。
- **验收**：`docker compose up` 起 PG；后端启动时连上库；`db.py` 跑 `SELECT version()` + pgvector 扩展可用。
- **依赖**：无（前置 Docker/镜像已就绪）。

### T2 migrations + entities 对齐
- **目标**：库里建齐 `lumen_*` 表（含 pgvector/tsvector 索引）。
- **范围**：`migrations/003` chunks（`vector(512)`+tsvector+hnsw+GIN）+ `004` imports/terms；entities 补 `created_at`、统一 `document_type↔type`、对齐 ImportJob 字段。
- **验收**：迁移执行成功；表结构与 06 一致；pgvector 扩展 + 向量索引在。
- **依赖**：T1。

### T3 ORM + PG 仓储（最大工作量）
- **目标**：内存读写 → 数据库读写，保持 DemoRepository 接口不变。
- **范围**：`model/orm.py`（SQLAlchemy 模型）+ `service/pg_repository.py`（同接口实现，事务化 `replace_document_chunks` + embedding 联动占位）。
- **验收**：pg_repository 通过现有 repository 接口的集成测试（真实 PG）。
- **依赖**：T2。

### T4 Embedding service
- **目标**：bge-small-zh 封装，生成 512 维向量。
- **范围**：`service/embedding.py`（`HF_HUB_DISABLE_XET=1` + 模型单例 + 批量 encode）。
- **验收**：对文本生成 512 维 float32 向量；batch 32。
- **依赖**：T2（chunks 表有 embedding 列）。

### T5 切单例 + seed
- **目标**：后端从内存切到 PG，灌演示数据。
- **范围**：单例指针切 pg_repository + seed SQL（复用现有种子：3 用户/2 空间/4 成员/2 文档/术语）。
- **验收**：后端用 PG 跑通现有 API；登录/CRUD/术语可用。
- **依赖**：T3、T4。
- **完成备注（本 PR）**：
  - **范围裁决**：embedding 写入联动（chunk 写入时调 bge 生成向量）**推迟到 T6**——随向量召回（读）一起做。理由：task-008 正式 T5 范围只有切单例+seed；在 T5 写 embedding 会连带让 `test_pg_repository`（3 chunk 测试）+ `test_api_routes`（文档测试）每次加载 ~7s bge 模型、强耦合 torch。T5 期间 chunks 只存 text、embedding 为 NULL（T6 回填）。
  - **切单例**：`demo_repository.py:354` `repository = DemoRepository()` → `PgRepository()`；DemoRepository 类保留（5 个 service 单测仍直接 `new` 它）。API 层 7 文件零改动（`from ... import repository` 捕获点不变）。
  - **seed**：`migrations/005_sprint8_seed_demo.sql`——显式 ID（匹配 demo token/login 契约与 `current_space_id=10`）+ `ON CONFLICT DO NOTHING`（幂等）+ `setval` 重置序列（运行时 BIGSERIAL 插入得 id=201，不撞 seed 固定 ID）。由 `init_db` 自动跑（生产/demo 启动即有数据）。
  - **test_api_routes 转 PG 集成测试**：切单例后它经 `login()→API→全局单例`会打 PG；加 `setUpClass`（判 schema 存在则先 truncate 清残留再 seed，保证跨运行确定性）+ PG 不可用 skip。其余 5 个 service 测试直接 `new DemoRepository()`，不受影响。
  - **test 隔离修复**：`test_pg_repository.tearDownClass` 加 truncate——清掉 BIGSERIAL 自增 ID 的测试残留（其自然键 alice/nova-internal 与 demo seed 固定 ID 在 UNIQUE 列冲突，会让 init_db seed 失败）。
  - **降级口径**：T5 切换后 PG 为必需运行时；init 失败仅记录不崩溃，不再降级到内存 demo（`main.py` lifespan 注释已更新）。
  - **验证**：74 tests OK（含 test_api_routes PG 集成）；uvicorn 起后端 urllib 冒烟：登录(alice)/空间/建文档(id=201)/术语/搜索/RAG(answer 含 280ms) 全通。

### T6 向量检索
- **目标**：search/rag 关键词全表扫描 → pgvector ANN + tsvector。
- **范围**：`service/search.py`、`service/rag.py`（向量召回 topK + 权限下推）；启用 `permission.visible_document_where_clause`。
- **验收**：检索按语义相似度召回；权限过滤正确；RAG 问答质量提升。
- **依赖**：T5、T4。
- **完成备注（本 PR，聚焦版）**：
  - **范围裁决（用户已确认）**：聚焦 RAG 向量召回；**search.py 不改**（关键词搜索经 `list_all_document_chunks` 仍工作，向量搜索留后续小 PR）；**不做 zhparser**（tsvector 'simple' 不分词 CJK，关键词 ILIKE/substring + 向量已覆盖中文；ts_vector 列+GIN 保留供未来 zhparser 全文路）。理由见会话讨论。
  - **embedding 写入**：`pg_repository.replace_document_chunks` 内懒加载 `embed_texts` 写 `lumen_chunks.embedding`；`_safe_embed` 守护（模型/网络不可用→embedding NULL + 日志，chunk 仍存，检索降级到关键词）。
  - **新方法 `recall_chunks(document_ids, query, limit, threshold)`**：`pg_repository` 用 pgvector `cosine_distance` ANN（`WHERE document_id IN 可见集 AND embedding IS NOT NULL AND 1-(emb<=>q)>=threshold ORDER BY emb<=>q LIMIT`，走 hnsw `vector_cosine_ops` 索引）；`demo_repository` 返回 **[]**（内存无向量，内存测试零变化）。
  - **rag.py 加法式叠加**：`_find_candidate_chunks` 关键词路**保留不变**，追加 `recall_chunks` 向量召回合并去重（向量 chunk 给 `_VECTOR_CANDIDATE_SCORE=1` 不被 `score<=0` 丢弃）；**阈值 `VECTOR_SIMILARITY_THRESHOLD=0.6`**（实测：真命中 0.875、不命中最高 0.512，0.6 干净分开）；"未找到"= 关键词空 + 向量空（threshold 门控）→ 库外不编造红线保住。
  - **权限**：可见文档集由 service 层 `filter_visible_documents` 算（permission.py 单一来源），传 doc_ids 给 recall_chunks 在 SQL 内 `IN` 过滤（§7.4 全表+Python 过滤已消除；`visible_document_where_clause` 留作未来 SQL 下推优化，未强接入）。
  - **验证**：74 tests OK（内存零变化；PG `完全不存在的问题`→NOT_FOUND 经 threshold 保住）；直验 embedding 存 512 维 + recall_chunks 相关命中/不命中/@0.3 阈值门控；uvicorn HTTP 冒烟：相关问答(answer 280ms) + 未找到(sources=[]) + **纯语义探针**（"响应速度和时延"与 chunk 零关键词重叠→向量召回到，证明价值）。
  - **遗留**：search 向量化 + zhparser 中文全文分词（后续小 PR）；`design/rag-retrieval.md` DEV-001/DEV-003 状态回写留 T7。

### T7 测试 + 文档回写
- **目标**：保证改造不破坏现有功能 + 文档据实回写。
- **范围**：tests（内存 fake 保留单测 + PG 集成测试）；`05 §5.1` RG-001→Go、`09` TC-P1-007/008、`06` 状态、design DEV-003 关闭、tech-env 报告。
- **验收**：全测试通过；文档状态一致（RG-001 Go）。
- **依赖**：T6。

## 整体验收标准

- 后端数据持久化在 PostgreSQL；重启不丢
- RAG/搜索用 pgvector 向量召回（bge-small-zh 512 维）+ tsvector 双路
- 现有 55 后端 tests 通过（内存 fake 保留）+ 新增 PG 集成测试通过
- RG-001（pgvector）→ Go；05/06/09/design 文档状态回写一致
- 不改 REQ / API 契约 / 产品红线（库外问答回复"未找到"不编造）

## 禁止事项

- 不改 00–03 需求、07 API 契约、产品红线
- 不引独立向量库（Milvus/Qdrant，project-rules §2）
- 不改 LLM provider（RG-004 已定）
- 不把 torch/sentence-transformers 写入 requirements.txt 锁定基线（待 T7 整体定基线，避免 drift 扩大）

## 降级 / Mock 边界

- DB 不可用时：T5 切换前，内存 `DemoRepository` 仍可用（降级基线保留，单测继续用它）
- Embedding 不可用时（网络/模型未下载）：T6 检索降级为 tsvector 全文召回（双路里的全文路保留）
- OCR/PDF 仍不在本 task 范围（RG-003，后续阶段）

## 完成记录

- [x] T1 基建（commit `68453b0` / PR #47）
- [x] T2 migrations + entities 对齐（commit `5e780fa` / PR #49）
- [x] T3 ORM + PG 仓储（commit `12c9ba3` / PR #50）
- [x] T4 Embedding service（commit `4ccefb7` / PR #51）
- [x] T5 切单例 + seed（commit `a90d2a0` / PR #52）
- [x] T6 向量检索 + embedding 写入联动（本 PR，聚焦版：RAG 向量召回）
- [ ] T7 测试 + 文档回写（commit/PR：___）

## 待确认项

| ID | 待确认 | AI 建议 | 阻塞 |
|---|---|---|---|
| PG-C-001 | requirements DB 依赖是否锁 3.12 基线版本（同 drift 口径） | T1 加依赖 + 注明 drift；T7 统一定基线 | 不阻塞 T1 |
| PG-C-002 | 同步 psycopg vs async | 同步（降低牵连面） | 不阻塞 |
| PG-C-003 | seed 数据来源 | ✅ 已确认：复用 demo_repository 种子，迁为 `migrations/005_sprint8_seed_demo.sql`（显式 ID + ON CONFLICT + setval） | 已闭合（T5） |
