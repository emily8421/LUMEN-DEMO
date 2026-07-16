# REQ-012 Task A：标签视图后端（扁平标签最小版）

> Phase2A 第二个 vertical slice「标签视图」的后端部分。前端（NavRail 标签视图 + 文档详情标签面板）见 Task B，文档回写见 Task C。
> 参照实现：REQ-026 内链 / 反链 Task A（commit `fc2b869`），同构的「迁移 + entity + orm + 两份 repository + service + api + main + test」vertical slice。
> 本任务因修改范围 >3 文件且为 Phase2A 新功能块，按 `ai/implementation-lifecycle-rules.md` §4.3 落地为独立 task 文件。

## 目标

实现 REQ-012 标签视图**最小版后端**：扁平标签（无层级）CRUD + 文档-标签关联 + 标签下可见文档列表，全部带空间隔离与文档权限过滤。完成后 API-014/027/031/032 可用，TC-P2-TAG-001 后端部分通过。

## 输入文档

- `docs/02-srs.md` REQ-012（标签视图，U-13，[P2]）
- `docs/06-db-design.md` L209/210（`lumen_tags` / `lumen_tag_links` 字段与约束）、L234/235（索引）、L255-257（ER）、L281（权限边界）
- `docs/07-api-spec.md` L251-257（API-014/027/031/032 契约）、L97/98（错误码 4001/4003/4004/4090/4220）、L329/330（service↔repository 映射）
- `docs/09-verification.md` TC-P2-TAG-001（覆盖对象 / 步骤 / 预期 / 证据 = `tests/backend/test_tags.py`）
- 参照代码：`backend/migrations/007_doc_links.sql`、`backend/service/doc_links.py`、`backend/api/doc_links.py`、`backend/repository/{demo,pg}_repository.py` 的 doc_links 段、`tests/backend/test_doc_links.py`

## REQ-012 最小版范围（用户已确认）

- 扁平标签（无层级）；空间隔离 + `UNIQUE(space_id, normalized_name)`
- 独立「标签」视图（NavRail）= Task B：标签列表含 `document_count`；点标签看文档
- 单标签筛选（不做多标签组合）
- 文档详情标签面板打标签 / 移除（API-031，复用反链面板模式）= Task B
- API-014/027 标签 CRUD + API-031 文档-标签关联 + API-032 标签下文档
- **不做**：层级 / 嵌套、组合筛选、AI / 导入自动打标签（`link_source` 仅 `manual`，其余值预留）、跨空间标签

## 修改范围（9 文件）

| # | 文件 | 操作 | 关键内容 |
|---|---|---|---|
| 1 | `backend/migrations/008_tags.sql` | 新增 | `lumen_tags`（`UNIQUE(space_id,normalized_name)`、status CHECK、`(space_id,status)` 索引）+ `lumen_tag_links`（`PK(tag_id,document_id)`、link_source CHECK、document_id 单列索引） |
| 2 | `backend/model/entities.py` | 改 | 新增 `Tag`、`TagLink` frozen dataclass |
| 3 | `backend/model/orm.py` | 改 | 新增 `TagORM`（+`UniqueConstraint`）、`TagLinkORM`（复合主键） |
| 4 | `backend/repository/demo_repository.py` | 改 | `tags` / `tag_links` 存储 + `_next_tag_id` + 8 方法 |
| 5 | `backend/repository/pg_repository.py` | 改 | `_to_tag` / `_to_tag_link` + 8 方法（对齐 Demo 接口） |
| 6 | `backend/service/tag.py` | 新增 | CRUD + 权限 + `document_count` + 文档关联 |
| 7 | `backend/api/tags.py` | 新增 | API-014/027/031/032 路由（单 router、全路径） |
| 8 | `backend/main.py` | 改 | 注册 `tags_router` |
| 9 | `tests/backend/test_tags.py` | 新增 | 参照 `test_doc_links.py`：ServiceTest + ApiTest |

## 关键设计决策

- **`normalized_name` 归一化** = `name.strip().lower()`（中文 lower 无害；保证同空间重名命中 → 4090）
- **`document_count`** 只统计当前用户可见文档 → service 层职责：取该用户可见 doc_id 集合 ∩ 该 tag 的 document_ids 计数（贴 07 L251，权限逻辑统一在 service 层，不在 repository / SQL 下推）
- **权限口径**（贴 07 / 09 TC）：`list_tags`/`create`/`update`/`archive` 需空间成员；`list_document_tags` 需可读文档且只返同空间 active 标签；`add`/`remove` 需文档可写 + 标签同空间 active；`list_documents_by_tag` 按文档可见性过滤
- **幂等**：`add_document_tag` 重复打返既有 link（07 L255）
- **归档不硬删**：API-027 DELETE = `status='archived'`，不破坏历史 tag_links 关联（07 L253）
- **`link_source`** 最小版固定 `manual`，DB CHECK 预留 `quick_entry`/`import`/`ai_suggested`

## 验收标准（对齐 TC-P2-TAG-001）

- 标签只在当前空间可见；同空间 `normalized_name` 重名返回 4090
- `document_count` 只统计当前用户可见文档（跨空间 / 无权限文档不进入）
- 归档标签不破坏既有 tag_links 历史关联
- 打标签需文档可写 + 标签同空间 active；重复打幂等
- 移除关联不删标签本身
- `tests/backend/test_tags.py` 通过；`tests/backend/` 全量回归不破坏既有

## 验证方式

- 单测：`python -m pytest tests/backend/test_tags.py -v`（DemoRepository 路径）
- 回归：`python -m pytest tests/backend/ -q`
- 迁移 008：连 `lumen-pg` 容器，`init_db()` 幂等建表；若 Pg 可用，补 Pg 路径 smoke

## 禁止事项

- 不做层级 / 嵌套、多标签组合筛选、AI / 导入自动打标签、跨空间标签
- 不改前端（Task B）、不改 `docs/06/07/09` 状态（Task C 回写为「已实现」）
- 不引入新依赖
- 不擅自改 `GET /api/documents` 加 `tag_id` 过滤（API-032 用独立路由 `/api/tags/{id}/documents`）

## 文档措辞分歧（Task C 处理）

- TC-P2-TAG-001（`docs/09` L89）验证步骤写「按标签筛选 `GET /api/documents?tag_id=`」，但 `docs/07` L257 API-032 权威契约为 `GET /api/tags/{id}/documents`。Task A 按 API-032 实现（与 07 / handoff 一致）；Task C 回写时统一 TC 措辞为 API-032 路径。

## 完成记录

- **状态**：已完成·已验证（2026-07-16）
- **改动**：10 文件（迁移 008 / entities / orm / demo_repository / pg_repository / service/tag / api/tags / main / test_tags / 本任务文档）
- **验证**：
  - `tests/backend/test_tags.py` 15/15 通过（CRUD / 重名 4090 / document_count 权限过滤 / 空间隔离 / 幂等 / 归档保留 link / 可见性过滤 / API 全链路）
  - 全量回归 `tests/backend/` 99 passed, 30 skipped（skip = lumen-pg 容器当时 Exited 255，非代码问题，已重启）
  - 迁移 008 真实 PG 建表：两表 + 全部约束（unique_name / status_check / name_not_empty_check / tag_links_pk / link_source_check / 3 FK）+ 索引（space_status / tag_links_document）均就位
  - PgRepository tags 路径 smoke（自清理）：create / list / add / list_doc_tags / document_count / archive 全过
- **口径**：`normalized_name = name.strip().lower()`；document_count 只算当前用户可见文档；归档不硬删（保留 tag_links 历史）；打标幂等；`link_source` 固定 manual
- **遗留**：前端 Task B；文档回写 Task C（含 DOCC-012-API032 措辞统一）
