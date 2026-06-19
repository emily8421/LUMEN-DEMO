# 08 开发计划

## Sprint1：待办 CRUD + SQLite 持久化

### 目标
实现 MiniTodo 全部功能（REQ-1~5），本地可跑通创建/查询/标记完成/删除，数据落 SQLite。

### 输入文档
- docs/03-prd.md（功能范围）
- docs/06-db-design.md（todos 表结构）
- docs/07-api-spec.md（四个接口契约）

### 修改范围
- `backend/api/todos.py`（四个路由）
- `backend/model/todo_repo.py`（SQLite 增删改查）
- `backend/db.py`（建表初始化）

### 验收标准
- POST/GET/PATCH/DELETE 四接口按 07-api-spec 返回正确
- 重启服务后数据仍在（REQ-5）
- 无鉴权、无多用户代码（守住 Phase 边界）

### 禁止事项
- 不引入 ORM、不引入鉴权、不引入 PostgreSQL
- 不做前端（Phase1 只 API）
- 不超出 03-prd 的功能范围
