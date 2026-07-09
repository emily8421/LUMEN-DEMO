# pgvector 接入影响面评估（内存 → PostgreSQL+pgvector）

> 定位：技术评估留痕（`ai/document-lifecycle-rules.md §2`），`tasks/task-008-pgvector-integration.md`（T1–T7）的**执行依据**。
> 来源：Explore agent 只读摸清 backend 数据层（2026-07-09）。
> 不替代 `docs/06-db-design.md`（目标表设计）/ `docs/07-api-spec.md`（接口）；为 task-008 T2–T7 提供现状基线 + 精确改造点。
> 评估时点：T1（基建）已完成、PG 容器已跑（见 task-008）；本文件描述 T2 起的改造对象现状。

## 1. 总览

当前后端**完全没有 DB 连接代码、没有 ORM、没有 asyncpg/psycopg/sqlalchemy/pgvector/alembic 依赖接入**（T1 已加依赖 + db.py + compose，但尚未接线业务）。全部状态集中在一个内存单例 `DemoRepository` 实例（`backend/service/demo_repository.py:354` 构造模块级单例 `repository`），构造时填入种子数据，被 7 个 API 路由文件以模块级单例形式直接 import。SQL 迁移 001/002 已写好但与运行时**完全未接线**。

## 2. 数据表清单（entity → 表）+ migrations 差异

`backend/model/entities.py` 定义 9 个 dataclass（全 `frozen=True`）+ 3 个 `StrEnum`。对照 `docs/06-db-design.md` 与已有迁移 001/002：

| Entity | 对应表 | migration | 关键差异 / 缺失 |
|---|---|---|---|
| `User`(id, external_id, name) | `lumen_users` | ✅ 001 | entity **缺 `created_at`**（迁移有 `TIMESTAMPTZ DEFAULT now()`） |
| `Space`(id, code, name) | `lumen_spaces` | ✅ 001 | entity **缺 `created_at`** |
| `SpaceMember`(user_id, space_id, role) | `lumen_space_members` | ✅ 001 | 一致；复合 PK(user_id,space_id)、role CHECK |
| `Document`(id, space_id, title, content_md, owner_id, permission, **document_type**="markdown", current_version=1) | `lumen_documents` | ✅ 001 | ⚠️ **命名分歧**：entity `document_type`，迁移/设计用 `type`；entity **缺 `created_at`/`updated_at`** |
| `DocumentVersion`(id, document_id, version_no, content_md, editor_id, created_at:str) | `lumen_document_versions` | ✅ 002 | 基本一致；`created_at` entity 是 `str`(ISO)，迁移 `TIMESTAMPTZ` |
| `DocumentChunk`(id, document_id, ordinal:int, text:str) | `lumen_chunks` | ❌ **无迁移** | **缺 `embedding vector(512)` + `ts_vector tsvector`**（pgvector 核心，Sprint-4 检索表） |
| `ImportJob`(id, space_id, source_filename, status, created_by, parsed_doc_id, chunk_count, error, created_at:str) | `lumen_imports` | ❌ **无迁移** | ⚠️ entity 有 `created_by`/`chunk_count`/`error`，但 06 设计**没有这三个**；设计有 `mime`，entity**没有**——需先对齐再写迁移 |
| `Term`(id, space_id, term, definition, aliases:list[str], owner_id, status, source_document_id) | `lumen_terms` | ❌ **无迁移** | **缺 `created_at`/`updated_at`**；`aliases` 设计 `jsonb` vs entity `list[str]`；设计要求 `UNIQUE(space_id, term)` |

**结论 — 缺 3 张表迁移**：`lumen_chunks`（含 pgvector embedding + tsvector）、`lumen_imports`、`lumen_terms`。需给 entity 补 `created_at`/`updated_at`，并对齐 `document_type↔type`、`ImportJob` 字段分歧（**T2 决策点**）。

## 3. demo_repository 方法清单（PG 仓储须实现的同接口）

`DemoRepository` 用 **list 存所有实体**（`self.users/spaces/memberships/documents/document_versions/import_jobs/document_chunks/terms`）+ 自增计数器生成主键；`_replace_*` 用列表重建实现"更新"。

**用户/空间/成员**：`find_user_by_external_id(external_id)->User|None`（登录）、`list_memberships()->list[SpaceMember]`、`list_spaces()->list[Space]`、`first_space_id_for_user(user_id)->int|None`。

**文档 CRUD**：`list_documents()`、`get_document(id)`、`require_document(id)`（不存在抛 KeyError）、`create_document(space_id,title,content_md,owner_id,permission)`（自动 append v1）、`update_document(id,title,content_md,permission,editor_id)`（append 新版本）、`delete_document(id)`（级联删版本+切块，靠 list 重建，`demo_repository.py:148-151`）。

**版本**：`list_document_versions(id)`（按 version_no 排序）、`get_document_version(id,version_no)`、`restore_document_version(id,version_no,editor_id)`（**不新建版本，只回滚 current_version 指针**，`:169-177`——PG 实现须保持此语义）。

**切块（检索核心）**：`replace_document_chunks(id,chunk_texts:list[str])`（先删后建，ordinal 自增）、`list_document_chunks(id)`、`list_all_document_chunks()`（**被 search.py/rag.py 全表扫描**）。

**导入**：`create_import_job(space_id,source_filename,created_by)`、`complete_import_job(id,parsed_doc_id,chunk_count)`、`fail_import_job(id,error)`、`require_import_job(id)`。

**术语**：`list_terms()`、`get_term(id)`、`create_term(space_id,term,definition,aliases,owner_id,status,source_document_id=None)`、`update_term(...)`、`delete_term(id)`、`require_term(id)`。

**私有辅助**（PG 化后废弃）：`_replace_document/_replace_import_job/_replace_term/_next_document_version_no/_append_version`。

## 4. service 层依赖图（哪个 service 用哪些 repository 方法）

> **关键有利点**：所有 service 函数**接收 `repository` 作第一个参数（鸭子类型）**——API 层传什么实例就用什么。保持接口 + 单例名 `repository` 不变 → API 层零改动。

| service | 调用的 repository 方法 |
|---|---|
| `document.py` | list_memberships、create/get/update/delete_document、list/get/restore_document_version、`replace_document_chunks`（经 `sync_document_chunks` `:123-126`，每次 create/update/restore 后同步重建切块） |
| `imports.py` | list_memberships、create/complete/fail_import_job（经 create_document+replace_document_chunks 间接） |
| `search.py` | list_documents、list_memberships、`list_all_document_chunks`（`:53-57` 全表扫描切块做关键词匹配） |
| `rag.py` | 经 find_matching_terms→list_terms；list_documents、list_memberships、`list_all_document_chunks`（`:113-118` 全表扫描） |
| `term.py` | list_memberships、list/get/create/update/delete_term、get_document（校验 source_document `:121-122`） |
| `space.py` / `auth.py` / `permission.py` / `chunking.py` / `llm_adapter.py` | **不直接调 repository**（纯函数 / 接收已查数据 / 读 env）。`permission.py` 含一个已写好但**仅测试用到**的 `visible_document_where_clause()`（`:48-52`，返回 SQL 片段，预留给查询层下推） |

## 5. 路由 → service → repository

每个 API 文件 import 模块级单例 `repository`（除 auth.py 外直接 import），统一用 `_read_token_payload`（各文件重复定义）解 demo token 拿 user_id+current_space_id。

| 路由 | 调用链 |
|---|---|
| `auth.py:8` | login → find_user_by_external_id + first_space_id_for_user + list_memberships → ensure_space_access → create_demo_token；`TOKEN_SIGNING_KEY` 从 `LUMEN_DEMO_TOKEN_KEY` env（默认硬编码） |
| `spaces.py:7` | list_spaces → list_spaces+list_memberships→list_user_spaces；switch → switch_space+create_demo_token |
| `documents.py:8` | list/create/get/update/delete/versions/restore → service.document.*；list_documents 端点**直接调** list_documents+list_memberships（`:47-49`） |
| `imports.py:8` | import_file_endpoint（唯一 `async`，因 file.read）→ import_extracted_text |
| `search.py:7` / `rag.py:7` | → search_documents / answer_question |
| `terms.py:8` | list/create/get/update/delete → service.term.* |

## 6. 需改文件清单（分层 + 改动量，对应 task-008 T1–T7）

**migrations**：003 chunks（`vector(512)`+tsvector+hnsw+GIN，中）+ 004 imports/terms（中）；001/002 一般不动。

**model**：`entities.py` 补 created_at/updated_at、统一 document_type↔type、对齐 ImportJob（中）；或新建 `model/orm.py` 放 SQLAlchemy 模型，entities 保留 DTO。

**service（核心改造区）**：`demo_repository.py` **整体重写为 PG 仓储**或新建 `pg_repository.py` 同接口（**大**）；`search.py`/`rag.py` 全表扫描→pgvector ANN+tsvector（中）；`document.py` sync_document_chunks 联动 embedding（小-中）；`term.py` list_terms/find_matching_terms→SQL 过滤（小-中）；`permission.py` 可下推 visible_document_where_clause（小）；新建 `embedding.py`/连接池（中）。

**api**：7 文件，若保留单例名 `repository` 则**几乎不改**（小）；`main.py` DB 生命周期（T1 已加 lifespan）。

**docker**：`compose.yml`（T1 已建）；`requirements.txt`（T1 已加依赖）；`.env.example`（T1 已加 DATABASE_URL）。

**tests**：9 文件无 conftest，直接 `DemoRepository()` new；PG 化后内存 fake 保留单测 + 新增 PG 集成测试（中）。

## 7. 关键风险 / 硬编码点（T3/T5/T6 注意）

1. **模块级单例 + 种子数据硬编码**（`demo_repository.py:354` + `__init__ :24-81`）：3 用户/2 空间/4 成员/2 文档/2 版本/1 术语。PG 化后改 seed SQL。保持单例名 `repository` 不变 → API 层零改动。
2. **同步访问**：所有 repository/service/路由都是 `def`（非 async），仅 `imports.py:26` 是 async。用同步 psycopg（task-008 决策）避免牵连。
3. **权限过滤在 Python 内存层**：`permission.py filter_visible_documents`（`:34-45`）总是先 `list_documents()` 全量加载再 Python 过滤；search/rag 同样全表。PG 化后用 `visible_document_where_clause()`（`:48-52`）下推，否则全表加载。
4. **`list_all_document_chunks()` 全表扫描**（`search.py:57`、`rag.py:118`）——pgvector 化核心替换点，必须改成带 embedding 的 ANN + 权限过滤。
5. **切块同步重建无 embedding**：`document.py:123` sync_document_chunks 只存 text，无 embedding。PG+pgvector 须在此联动 bge-small-zh（512 维，T4 embedding service）。
6. **`created_at` 类型不一致**：entity `str`(ISO, `_now_iso()`) vs DB `TIMESTAMPTZ`；多个 entity（User/Space/Document/DocumentChunk/Term）**根本没 created_at**。ORM 映射须处理。
7. **`document_type` vs `type` 命名分歧**：`entities.py:60` vs 迁移 001 `:33`。ORM 须显式 column 映射。
8. **ImportJob entity 与 06 设计字段不对齐**：entity 有 created_by/chunk_count/error，设计无；设计有 mime，entity 无。**T2 须先定稿 schema**。
9. **无 conftest/fixture**：测试直接 new DemoRepository（每个 test 方法独立），test_api_routes 经 login() 走全局单例。PG 化保留内存 fake 做单测。
10. **无 DB 配置基础设施**：T1 已补 db.py/compose/.env/requirements；T3 起接线。
11. **`restore_document_version` 不创建新版本**（`:169-177`）——PG 实现须保持语义（否则版本审计变）。
12. **requirements drift**（PG-C-001）：T1 加 DB 依赖锁 3.12 基线、.venv(3.14) 实际较新，T7 统一定基线。

## 8. 与 task-008 的映射

| task-008 步 | 本评估依据节 |
|---|---|
| T2 migrations + entities 对齐 | §2（表对照/字段分歧/缺表）、§7.6-8（命名/字段对齐决策点） |
| T3 ORM + PG 仓储 | §3（方法清单，须实现同接口）、§4（service 依赖）、§7.1/3/11（单例/权限/restore 语义） |
| T4 Embedding | §7.5（sync_document_chunks 联动点） |
| T5 切单例 + seed | §7.1（种子数据）、§5（API 零改动前提） |
| T6 向量检索 | §4（search/rag 全表扫描）、§7.3-4（权限下推/全表替换） |
| T7 测试 | §7.9（无 conftest，内存 fake 保留） |
