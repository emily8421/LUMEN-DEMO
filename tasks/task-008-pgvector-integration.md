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

### T6 向量检索
- **目标**：search/rag 关键词全表扫描 → pgvector ANN + tsvector。
- **范围**：`service/search.py`、`service/rag.py`（向量召回 topK + 权限下推）；启用 `permission.visible_document_where_clause`。
- **验收**：检索按语义相似度召回；权限过滤正确；RAG 问答质量提升。
- **依赖**：T5、T4。

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
- [x] T2 migrations + entities 对齐（本 PR）
- [ ] T3 ORM + PG 仓储（commit/PR：___）
- [ ] T4 Embedding service（commit/PR：___）
- [ ] T5 切单例 + seed（commit/PR：___）
- [ ] T6 向量检索（commit/PR：___）
- [ ] T7 测试 + 文档回写（commit/PR：___）

## 待确认项

| ID | 待确认 | AI 建议 | 阻塞 |
|---|---|---|---|
| PG-C-001 | requirements DB 依赖是否锁 3.12 基线版本（同 drift 口径） | T1 加依赖 + 注明 drift；T7 统一定基线 | 不阻塞 T1 |
| PG-C-002 | 同步 psycopg vs async | 同步（降低牵连面） | 不阻塞 |
| PG-C-003 | seed 数据来源 | 复用现有 demo_repository 种子，迁为 seed SQL | 不阻塞 T1 |
