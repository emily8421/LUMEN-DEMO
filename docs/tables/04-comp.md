# 04-comp · 容器 / 组件视图（COMP）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/04-architecture.md`（### 1.2 起的章节）。表格内容以源文档为准。

| COMP-ID | 组件 / 进程 | 职责 | 部署位置 | 通信方式 | 阶段 | 状态 | 关联 REQ |
|---|---|---|---|---|---|---|---|
| COMP-001 | React 前端 SPA | 桌面浏览器 UI（文档 / 搜索 / 问答 / 术语） | 浏览器 | REST / JSON | [P1] | P1-已实现（代码原型 + smoke） | REQ-011、004~008、036 |
| COMP-002 | FastAPI 后端（api / service / repository / model 四层） | REST API、权限校验、业务逻辑、持久化 | 本机单进程（开发 / Demo）；容器（生产） | HTTP | [P1] | 已实现（PG 仓储 `PgRepository`，Sprint-8；repository 独立成层见 project-rules §5.1） | 全 P1 |
| COMP-003 | 数据存储 | PostgreSQL + pgvector | Docker Compose（lumen-pg:pg16；生产 lumen-pg-prod） | SQL + pgvector | [P1] | 已接入（Sprint-8；RG-001 Go） | REQ-003~010、036 |
| COMP-004 | AI 服务 | LLM 中转（GLM）+ 本机 Embedding（bge-small-zh） | 本机 + 内网 | OpenAI 兼容 API | [P1] | 已接入（Sprint-7/8；RG-002/004 Go） | REQ-008、036 |
| COMP-005 | Nginx 反向代理（生产） | 前端静态资源 + `/api` 同源反代到 backend（无跨域） | 生产前端容器内 | HTTP 反代 | [P2] | 已落盘（v3.5.0 ⑪ 方案 A；生产专用，本地形态不启用） | 全部浏览器访问 |
