# 07-api-list · 接口清单（API-ID）

> **生成式镜像**（`scripts/extract-diagrams.mjs` 产物，不手改）。
> 唯一权威源：`docs/07-api-spec.md`（## 2. 起的章节）。表格内容以源文档为准。

| API-ID | 方法 | 路径 | 用途 | 阶段 | 设计状态 | 当前实现状态 | 追溯 REQ |
|---|---|---|---|---|---|---|---|
| API-001 | POST | /api/auth/login | 凭证登录 | [P1] | P1-已实现；**Phase2D 契约变更**（Sprint-26：`login_id`/`password` + bcrypt verify；返回不透明 token session） | 已实现（PG 用户 / `lumen_sessions`；demo 兼容） | REQ-001 基础；REQ-041 |
| API-039 | POST | /api/auth/register | 注册（建用户 + 默认个人空间） | [P2] | Phase2D-已实现 | 已实现（Sprint-26，REQ-040；bcrypt 哈希 + C-AUTH-001 个人空间） | REQ-040 |
| API-040 | POST | /api/auth/logout | 登出（撤销当前会话） | [P2] | Phase2D-已实现 | 已实现（Sprint-26，REQ-042） | REQ-042 |
| API-041 | POST | /api/auth/refresh | 续期轮换（旧 token 作废） | [P2] | Phase2D-已实现 | 已实现（Sprint-26，REQ-042） | REQ-042 |
| API-042 | GET | /api/auth/sessions | 列当前用户活跃会话 | [P2] | Phase2D-已实现 | 已实现（Sprint-26，REQ-042；多设备） | REQ-042 |
| API-043 | DELETE | /api/auth/sessions/{id} | 撤销指定会话 | [P2] | Phase2D-已实现 | 已实现（Sprint-26，REQ-042；owner；重复撤销幂等 200，不存在/非本人 404） | REQ-042 |
| API-044 | GET | /api/admin/users | 用户列表（`q` / `role` / `status` 过滤；返回 id/name/email/role/status/last_login_at） | [P2] | Phase2D·Sprint-28 已实现 | 已实现（全局 admin；member 4030；不返回 password_hash；扁平列表未分页） | REQ-045/046 |
| API-045 | PATCH | /api/admin/users/{id} | 改全局角色 / 禁用启用（`role` / `status`） | [P2] | Phase2D·Sprint-28 已实现 | 已实现（全局 admin；禁用后登录 4030 且既有会话失效） | REQ-045/046 |
| API-046 | GET | /api/spaces/{id}/members | 空间成员列表 | [P2] | Phase2D·Sprint-28 已实现 | 已实现（空间成员；非成员 4003） | REQ-047 |
| API-047 | POST | /api/spaces/{id}/members | 按 email 添加成员（含空间角色，默认 member） | [P2] | Phase2D·Sprint-28 已实现 | 已实现（空间 admin / 全局 admin；用户不存在 4004 / 已是成员 4090） | REQ-047 |
| API-048 | PATCH | /api/spaces/{id}/members/{user_id} | 改空间角色 | [P2] | Phase2D·Sprint-28 已实现 | 已实现（空间 admin / 全局 admin；最后一个 admin 降级 4090，C-ROLE-006） | REQ-047 |
| API-049 | DELETE | /api/spaces/{id}/members/{user_id} | 移除成员 | [P2] | Phase2D·Sprint-28 已实现 | 已实现（空间 admin / 全局 admin；最后一个 admin 4090；文档归属不变） | REQ-047 |
| API-050 | GET | /api/users/search?q= | 添加成员时的用户搜索（返回 id/name/email 最小字段） | [P2] | Phase2D·Sprint-28 已实现 | 已实现（空间 admin 或全局 admin；member 4030 防枚举） | REQ-047 |
| API-051 | GET/POST | /api/term-categories | 领域树查询（`parent_id?` 懒加载，空=根层）/ 新建领域 | [P1] | 维护态增强·已实现 | 已实现（REQ-048，migration 017；领域树不独立设权限；同 parent 重名 4090） | REQ-048 |
| API-052 | PATCH/DELETE | /api/term-categories/{id} | 领域改名 / 移动（`parent_id`，null=移到根，防环 4220）/ 删除（删非空 4090） | [P1] | 维护态增强·已实现 | 已实现（REQ-048，migration 017） | REQ-048 |
| API-053 | POST | /api/term-categories/reorder | 领域排序（body `parent_id`+`ordered_ids`，须等于该层全部子领域） | [P1] | 维护态增强·已实现 | 已实现（REQ-048，migration 017） | REQ-048 |
| API-054 | GET | /api/admin/users/{user_id}/spaces | 查询用户已加入空间 + 可授予空间（admin 域只读，一次返回 joined + available） | [P2] | 维护态批5·已实现（v3.7.0） | 仅全局 admin（4030）；用户不存在 4004 | REQ-050 |
| API-055 | POST | /api/auth/password-reset/request | 请求重置密码（恒响应防枚举；demo 无 SMTP，token 写后端日志人工下发） | [P2] | 维护态批5·已实现（v3.7.0） | 公开端点；恒返回"若已注册则已发送" | REQ-051 |
| API-056 | POST | /api/auth/password-reset/confirm | 重置密码（token + 新密码 → 更新 password_hash + 吊销该用户全部活跃 session） | [P2] | 维护态批5·已实现（v3.7.0） | token 无效 / 过期 / 已用 4010；密码不合规 4220 | REQ-051 |
| API-057 | GET | /api/health/live | 进程存活探针（liveness，不检查依赖） | [P2] | 维护态批17·已实现（v3.8.14） | 恒 200；`response_model=ApiEnvelope[HealthView]` | NFR-006 运维 |
| API-058 | GET | /api/health/ready | 就绪探针（readiness，demo 200 / PG `db.ping()` 失败 503+5031） | [P2] | 维护态批17·已实现（v3.8.14） | demo 200；PG 失败 503 / 5031 DB_NOT_READY | NFR-006 运维 |
| API-059 | GET/POST | /api/vault-mounts | 跨设备 vault 挂载元数据：GET 拉取本人全部设备挂载清单；POST 上报挂载事件（granted=挂载成功 / revoked=卸载软撤销） | [P2] | Wave 3·已实现（v3.11.0，2026-08-18） | 已实现（migration 015 `lumen_vault_mounts`；仅登录本人；参数非法 4220；仅元数据不存句柄/路径/正文） | REQ-018 |
| API-002 | GET | /api/spaces | 列出我的空间 | [P1] | P1-已实现 | 已实现（PG 空间 / 成员） | REQ-001/002 |
| API-003 | POST | /api/spaces/switch | 切换当前空间 | [P1] | P1-已实现 | 已实现（PG 成员校验） | REQ-002 |
| API-004 | GET | /api/documents | 文档列表 | [P1] | P1-已实现 | 已实现（PG 文档 + 权限过滤） | REQ-004 |
| API-005 | POST | /api/documents | 创建文档 | [P1] | P1-已实现 | 已实现（PG 文档持久化） | REQ-004 |
| API-006 | GET/PUT/DELETE | /api/documents/{id} | 读/改/删 | [P1] | P1-已实现 | 已实现（PG 文档 + 权限过滤） | REQ-004/005 |
| API-007 | GET | /api/documents/{id}/versions | 版本列表 | [P1] | P1-已实现 | 已实现（PG 版本历史） | REQ-006 |
| API-008 | POST | /api/documents/{id}/versions/{v}/restore | 恢复版本 | [P1] | P1-已实现 | 已实现（PG 版本恢复） | REQ-006 |
| API-009 | GET | /api/search?q= | 全文 / 语义混合搜索 | [P1] | P1-已实现 | 已实现（substring + ts_vector + pgvector 语义召回；zhparser 可选） | REQ-007 |
| API-010 | POST | /api/query | RAG 问答 / 通用对话（批3 扩：请求体增 `history` + `use_knowledge_base` + `llm_provider`，向后兼容；配套 `GET /api/llm-configs` 多通道切换） | [P1] | P1-已实现 | 已实现（pgvector 向量召回 + LLM；可配 Mock；批3 2026-08-07 扩多轮 history 与通用对话开关，2026-08-08 扩 LLM 多配置切换，见 `docs/design/ai-assistant.md`） | REQ-008 |
| API-011 | POST | /api/import | 导入文件 | [P1] | P1-已设计 | **降级实现（仅 `.md`/`.txt` 已提取文本；无 PDF/OCR）** | REQ-009/010 |
| API-012 | GET/POST | /api/terms | 术语列表 / 创建术语 | [P1] | P1-已实现 | 已实现（PG 术语存储；REQ-048 扩 `category_id`/`category`/`source` 请求·响应字段，migration 017） | REQ-036 / REQ-048 |
| API-013 | GET/PUT/DELETE | /api/terms/{id} | 术语详情 / 更新 / 删除 | [P1] | P1-已实现 | 已实现（PG 术语存储；REQ-048 扩 `category_id`/`category`/`source`，`category_id` 跨空间→4220） | REQ-036 / REQ-048 |
| API-029 | POST | /api/import/batch | 批量导入（多文件 + 文件夹，标题前缀，同名跳过） | [P1] | Phase1.5A-已实现 | — | REQ-037 |
| API-030 | GET | /api/documents/{id}/export · /api/export/space | 单文档 .md 下载 / 空间 ZIP 导出 | [P1] | Phase1.5A-已实现 | — | REQ-038 |
| API-014 | GET/POST | /api/tags | 标签列表 / 创建标签 | [P2] | Phase2A-已实现 | — | REQ-012 |
| API-031 | GET/POST/DELETE | /api/documents/{id}/tags | 文档-标签关联（列 / 打 / 移除） | [P2] | Phase2A-已实现 | — | REQ-012 |
| API-032 | GET | /api/tags/{id}/documents | 标签下可见文档列表 | [P2] | Phase2A-已实现 | — | REQ-012 |
| API-015 | POST | /api/spaces/push | 跨空间推送 | [P2] | 骨架 | — | REQ-015 |
| API-016 | GET | /api/briefs/{token} | 对外只读简报 | [愿景] | 骨架 | — | REQ-022 |
| API-017 | POST/DELETE | /api/quick-entry | 快速录入索引条目（capture / discard） | [P2] | Phase2A-已实现 | — | REQ-025 |
| API-018 | GET/POST | /api/doc-links | 内部链接 / 反向链接 | [P2] | Phase2A-已实现 | — | REQ-026 |
| API-019 | POST/GET | `/api/export-pdf`、`/api/export-pdf/{export_id}/download` | 单文档导出 / 下载 PDF | [P1] | Phase1.5B-已实现 | 已实现（Sprint-18：同步生成任务结果；v1.7.0：artifact 下载闭环） | REQ-027 |
| API-020 | POST | /api/sync/feishu | 飞书同步（webhook/拉取） | [愿景] | 骨架 | — | REQ-028 |
| API-021 | POST | /api/path | 路径推理（多跳） | [愿景] | 骨架 | — | REQ-030 |
| API-022 | GET | /api/people/{name} | 人物关系网络 | [愿景] | 骨架 | — | REQ-031 |
| API-023 | GET | /api/conflicts | 矛盾检测 | [愿景] | 骨架 | — | REQ-032 |
| API-024 | POST | /api/hypotheses | 假设检验 / 证据地图 | [愿景] | 骨架 | — | REQ-033 |
| API-025 | GET/POST | /api/signal-tracks | 信号追踪 | [愿景] | 骨架 | — | REQ-034 |
| API-026 | POST | /api/kits | 分析包 A Kit | [愿景] | 骨架 | — | REQ-035 |
| API-027 | GET/PUT/DELETE | /api/tags/{id} | 标签详情 / 更新 / 归档 | [P2] | Phase2A-已实现 | — | REQ-012 |
| API-028 | POST | /api/documents/{id}/polish | AI 润色 / 写作引用 | [P2] | Phase2B·首批核心·已实现 | 已实现（TC-P2-AI-001 通过） | REQ-014 |
| API-033 | GET | /api/spaces/{id}/timeline | **主题时间线 / 密度热条**（REQ-013a 重定位） | [P2] | Phase2B·第二 slice·本地实现完成 | task-030；运行态 API smoke / Edge headless 浏览器 smoke / 真实 PG 大数据性能 smoke 已通过 | REQ-013a/024 |
| API-034 | GET | /api/folders | 文件夹树查询（嵌套；token current_space_id；`parent_id` query，空=根层） | [P2] | Phase2B·第三 slice·已实现 | 后端已实现（task-027；路径裁定 /api/folders，2026-08-02） | REQ-039 |
| API-035 | POST | /api/folders | 新建文件夹 | [P2] | Phase2B·第三 slice·已实现 | 后端已实现（task-027） | REQ-039 |
| API-036 | PATCH/DELETE | /api/folders/{folder_id} | 移动 / 改名 / 删除文件夹（PATCH body `name`/`parent_id`，`parent_id=null`=移到根） | [P2] | Phase2B·第三 slice·已实现 | 后端已实现（task-027） | REQ-039 |
| API-037 | POST | /api/folders/reorder | 文件夹排序（body `parent_id`+`ordered_ids`，须等于该层全部子 folder） | [P2] | Phase2B·第三 slice·已实现 | 后端已实现（task-027） | REQ-039 |
| API-038 | PATCH | /api/documents/{document_id}/folder | 移动单个文档到目标文件夹或根目录（body `folder_id`，`null`=根目录） | [P2] | Phase2B·第三 slice·已实现 | 本地已实现（task-029；不新增版本 / 不重建索引） | REQ-039 |
