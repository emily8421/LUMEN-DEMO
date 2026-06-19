# 04 系统架构

## 1. 整体架构图

```text
客户端（curl / 浏览器）
      │  HTTP / JSON
      ▼
FastAPI 单进程服务 ──► SQLite 文件（todos.db）
```

单进程、无外部依赖、无网络分区，覆盖 03-PRD 的全部 CRUD 功能。

## 2. 模块划分
- `api/` 路由层：接收 HTTP 请求、校验入参、返回 JSON（对应 REQ-1~4 的四个动作）
- `model/` 数据访问层：封装对 SQLite 的增删改查
- `db` 持久层：SQLite 文件 `todos.db`

## 3. 技术选型理由
- FastAPI：自带 OpenAPI 文档、写四个接口很快；不选 Flask 是因为 FastAPI 的类型校验/自动文档对单人开发更省心。
- SQLite：零运维、单文件，单人场景完全够用；不选 PostgreSQL 是因为 Phase1 无需并发、无需独立数据库服务。
