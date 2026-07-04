# Sprint-5 任务：术语管理与问答口径对齐最小闭环

## 目标

实现 Phase1 Demo 的空间级术语管理最小闭环：当前空间可创建、查看、更新、删除术语；RAG 问答命中术语时优先展示当前空间术语定义，并在来源中包含术语表引用；前端提供术语管理与基础提示展示。

## 输入文档

- `docs/08-dev-plan.md` Sprint-5：术语管理与问答口径对齐
- `docs/design/term-management.md`：术语 CRUD、空间优先、轻量匹配、RAG 术语上下文注入
- `docs/06-db-design.md`：`lumen_terms`
- `docs/07-api-spec.md`：`GET/POST /api/terms`、`GET/PUT/DELETE /api/terms/{id}`
- `docs/design/frontend-interaction.md`：术语管理页 / 提示的桌面端口径

## 修改范围

- `backend/model/entities.py`、`backend/service/demo_repository.py`：补充内存术语实体与仓储
- `backend/service/term.py`、`backend/api/terms.py`、`backend/main.py`：术语 CRUD 与当前空间权限校验
- `backend/service/rag.py`：降级 RAG 答案注入命中术语定义与术语来源
- `frontend/src/api.ts`、`frontend/src/App.tsx`、`frontend/src/styles.css`：术语管理 UI 与基础术语提示
- `tests/backend/*`：补充 service / API / RAG 术语优先级测试

## 验收标准

- 当前空间可创建、列表、更新、删除术语，字段包含 `term`、`definition`、`aliases`、`status`
- 非当前空间成员不能操作该空间术语；同名术语当前空间优先于全局术语
- RAG 问答命中术语时，答案包含当前空间术语定义，sources 包含术语表来源
- 前端可在当前空间维护术语，并在问答结果旁看到术语来源 / 解释
- 后端测试、前端构建通过

## 禁止事项

- 不做跨空间术语同步
- 不做术语冲突自动改写文档
- 不做 AI 自动建议术语、批量核对、复杂冲突检测
- 不接真实 LLM / Embedding / PostgreSQL
