# DIAG-SEQ-FLOW001 · Flow-001 登录与空间切换（概要流程）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/04-architecture.md`（本图所在块）。阶段：概要设计；类型：顺序图（流程）；追溯：API-001..003 / TC-P1-001/002；渲染：GitHub 原生。

```mermaid
sequenceDiagram
  participant Browser as React 前端
  participant API as FastAPI API
  participant Auth as 鉴权 service
  participant DB as PostgreSQL

  Browser->>API: 提交登录凭证
  API->>Auth: 校验凭证
  Auth->>DB: 读取用户可访问 spaces
  DB-->>Auth: user_id + 默认 current_space_id
  Auth-->>API: 签发 Bearer token(user_id,current_space_id,exp)
  API-->>Browser: token + 当前空间
  Browser->>API: 请求切换空间
  API->>Auth: 校验用户是否为空间成员
  Auth->>DB: 查询 space_members
  DB-->>Auth: 成员关系有效
  Auth-->>API: 签发新 token(current_space_id=目标空间)
  API-->>Browser: 新 token
```
