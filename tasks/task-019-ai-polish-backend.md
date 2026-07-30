# Task 019：AI 润色后端（Sprint-19 / REQ-014 / Phase2B 首批核心）

> 本 task 是 Sprint-19 的后端 half（数据层 + service + API + 测试）。前端 half（侧边栏 + selection）见后续 task-019-ai-polish-frontend。Sprint-19 是 Phase2B 首个 vertical slice，跑通即 RG-008 升 Go。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-19（Phase2B 首个 vertical slice） |
| REQ | REQ-014（AI 润色 + 写作引用） |
| 接口 | API-028 `POST /api/documents/{id}/polish`（mode=polish/citation） |
| 表 | `lumen_ai_drafts`（migration 010） |
| Readiness Gate | RG-008（Conditional Go → **本 task 实跑升 Go**） |
| 设计 | `docs/design/ai-polish.md` |
| 前置 | Phase2B 已切指针（v1.0.0，PR #88）；build Node 22（project-rules §2.9） |

## 目标

实现 AI 润色 polish / citation 后端：选区 → LLM → 草稿落库 → 返回；citation 复用 RAG 检索带 sources；数据外发护栏（sources 权限过滤、hash+摘要留存、不自动过滤、5030/Mock 降级不编造）。

## 输入文档

`docs/design/ai-polish.md`、`docs/06-db-design.md:222`、`docs/07-api-spec.md:264`、`docs/09-verification.md` TC-P2-AI-001、`docs/research/2026-07-30-phase2b-kickoff-decision.md`（数据外发风险接受）。

## 修改范围 + 复用点（探索结论 file:line）

| # | 文件 | 做什么 | 复用/仿照 |
|---|---|---|---|
| 1 | `migrations/010_ai_drafts.sql`（新，**已写**） | 建 `lumen_ai_drafts` 表；护栏只存 hash+summary | 仿 `009`；字段见 `06:222` |
| 2 | `model/orm.py` | 加 `AiDraftORM`（`cited_chunk_ids` JSONB） | 仿 `QuickEntryORM` @169 |
| 3 | `model/entities.py` | 加 `AiDraft` + `PolishView` + `PolishRequest` | 仿 `QuickEntry` @169 |
| 4 | `repository/pg_repository.py` + `demo_repository.py` | ai_draft 读写方法（双实现） | 仿 quick_entry 读写 |
| 5 | `service/ai_polish.py`（新） | polish/citation 业务逻辑 | 复用 `llm_adapter.chat` / `rag._find_candidate_chunks`+`recall_chunks` / `permission.filter_visible_documents` / `term.find_matching_terms` / `document._ensure_can_write` |
| 6 | `api/documents.py` | 加 `POST /{id}/polish` endpoint | 仿 `quick_entry.py:45-71` |
| 7 | 错误处理 | 引入 **5030**（`LlmUnavailableError`→503/5030） | **代码里现在没有，首个** |
| 8 | `tests/backend/test_ai_polish.py`（新） | service + API 测试 | 仿 `test_rag.py`（注入 chat_fn mock）+ `test_api_routes.py` |

关键复用细节：
- LLM：`llm_adapter.chat(system, user)`（`llm_adapter.py:67-89`）；未配置抛 RuntimeError → polish 转 5030 或 Mock 占位（**不编造、不落 generated**，区别于 RAG 静默降级）。
- citation 检索：复用 `rag._find_candidate_chunks` + `repository.recall_chunks(visible_doc_ids, ...)`（`rag.py:110-183`），sources 仅可见 chunk。
- sources 要 `chunk_id`（API-028 契约），现有 `RagSource` 只有 `doc_id` → 用内部 `_CandidateChunk`（`rag.py:44-50`，含 `chunk.id`）。
- 文档可写：复用 `document._ensure_can_write`（`document.py:136-138`，抛 `DocumentAccessError`→4003）。
- 5030：当前代码 0 命中，polish 首个引入（`LlmUnavailableError` + 全局 handler `main.py:60-65`）。

## 验证包（= RG-008 升 Go 条件）

- **service**：polish 生成草稿；citation sources 仅可见 chunk（越权不进 prompt/不返回）；草稿只存 hash+summary、无 API key；5030/Mock 降级 status≠generated、不编造。
- **API**：鉴权 4001；文档可写 4003；未找到 4004；字段非法 4220；LLM 不可用 5030。
- **命令**：`.venv\Scripts\python.exe -m unittest tests.backend.test_ai_polish`（service 用 `DemoRepository` + 注入 chat_fn mock；API 需 PG，不可用则 SkipTest）。
- 跑通后回填：`05` RG-008 → Go、`09` RISK-P2-005 → 已解决。

## 禁止事项

- 不动 RAG 问答（REQ-008，独立子系统）。
- citation 首版**同步**（D-C-001），不建异步 job 状态机。
- 不做敏感字段自动过滤（RG-008：用户自判是否触发润色）。
- 不实现 REQ-013/024 时间轴（Sprint-20）、REQ-015/016/017。

## 待确认

- D-C-001：citation 异步？→ 首版同步，实测延迟高再补异步（`07 §3.6` 状态机）。
- D-C-002：前端「应用」= 替换选区（前端 task 处理）。

## 完成记录

- [x] migration 010（`010_ai_drafts.sql`）
- [ ] ORM（`AiDraftORM`）+ entity（`AiDraft`/`PolishView`/`PolishRequest`）
- [ ] repository（pg + demo）ai_draft 读写
- [ ] service/ai_polish.py
- [ ] API endpoint + 5030
- [ ] tests/test_ai_polish.py
- [ ] RG-008 升 Go 回填 05/09
