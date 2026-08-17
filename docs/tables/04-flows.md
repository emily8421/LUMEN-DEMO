# 04-flows · 关键流程（Flow）与追溯

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/04-architecture.md`（## 5. Flow|## 5. 起的章节）。表格内容以源文档为准。

| 维度 | 原则 | 权威源 |
|---|---|---|
| 错误码分层 | service 抛领域异常（带业务码），api 层统一转 HTTP（`code` 业务码、`status_code` HTTP 码、`msg` 固定用户文案），禁 `str(exc)` 直传泄露内部细节 | `05 §4.2.1`、`07 §3.4` |
| 错误码族 | 4001 认证失败 / 4003 权限拒绝 / 4030 管理权限不足 / 4090 冲突 / 5030 依赖不可用；错误码单一含义，不与 HTTP 码混用 | `07 §1` / `05 §4.2` |
| 权限拒绝语义 | 无权限访问返回 403 / 空结果，且不泄露标题、摘要与问答引用（私有文档对他人搜索 / RAG 零命中） | Flow-002、`02` EX-001 |
| 外部不可用 / 降级 | LLM / 导出依赖不可用时返回 5030 或明确 Mock 降级，不编造、不生成坏文件；库外问答明确「未找到」 | REQ-008、RG-003/004/006 |
| 鉴权强制 | 权限必须由后端 API / service / DB 查询过滤执行；前端隐藏 / 禁用 / 路由守卫不是权限边界 | `document-lifecycle-rules §5.2` |
| 接口域 | 职责 | 权威 |
|---|---|---|
| auth / users / admin / space_members | 账户认证、用户管理、成员治理 | `07` auth / admin / space 域 |
| documents / versions / folders | 文档 CRUD、版本、目录树 | `07` 文档域 |
| search / chat | 检索、RAG 问答 | `07` 检索域 |
| import / export / pdf | 导入、导出 | `07` 导入导出域 |
| terms | 术语管理 | `07` 术语域 |
| tags / links / quick-entries / timeline | 个人知识组织 | `07` 组织域 |
| vault | 本地挂载 | `07` vault 域 |
