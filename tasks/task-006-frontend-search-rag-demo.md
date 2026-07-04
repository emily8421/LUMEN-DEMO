# Sprint-4C 降级任务：前端搜索与问答 UI

## 目标

在 Sprint-4A / 4B 后端降级搜索与问答接口已完成后，为 Phase1 Demo 前端补齐最小可演示 UI：在登录后的工作台中输入关键词调用 `/api/search`，输入问题调用 `/api/query`，展示命中片段、降级答案与来源文档。

## 输入文档

- `docs/08-dev-plan.md` Sprint-4：检索与 RAG 问答
- `docs/design/frontend-interaction.md`：桌面端统一页面结构与状态反馈
- `docs/design/rag-retrieval.md`：搜索结果列表、问答答案与来源文档引用
- `docs/07-api-spec.md`：`GET /api/search?q=`、`POST /api/query`

## 修改范围

- `frontend/src/api.ts`：封装 `searchDocuments` 与 `queryKnowledgeBase`
- `frontend/src/App.tsx`：新增搜索 / 问答输入、结果列表、答案和来源展示
- `frontend/src/styles.css`：补充搜索 / 问答区域样式

## 验收标准

- 登录后可输入关键词并查看搜索结果标题与 snippet
- 登录后可输入问题并查看问答答案与 sources
- 搜索 / 问答请求携带当前 Bearer Token，随空间切换使用新 token
- 无结果 / 无来源时显示明确空状态
- 构建通过 `npm.cmd --prefix frontend run build`

## 禁止事项

- 不新增前端依赖或 UI 框架
- 不实现文件上传导入 UI
- 不接真实 LLM、Embedding、pgvector 或术语管理 UI
- 不改变既有文档 CRUD / 版本历史行为
