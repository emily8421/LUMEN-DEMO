# 账户与认证设计（accounts-auth）

> 定位声明：本文是 Phase2D「账户与多人权限」Sprint-26「账号体系基础」的详细设计（`docs/design/*`，非平凡子系统 + 安全边界）。承接 REQ-040 / REQ-041 / REQ-042（U-45 / U-46 / U-47），不新增 `03` 未批准需求、`06` 未同步表、`07` 未同步接口。状态：**设计草案 · 待人工确认**（2026-08-07 立项）；编码 Sprint-26 待启动，启动前需确认本文 §15 待确认项。

## 0. 元信息

| 项 | 值 |
|---|---|
| 阶段 | Phase2D（账户与多人权限 · 团队验证） |
| 覆盖 REQ | REQ-040 账户注册 / REQ-041 凭证登录 / REQ-042 登出·会话管理 |
| 覆盖 U-ID | U-45 / U-46 / U-47 |
| 验收 | TC-P2-AUTH-001（AC-P2-AUTH-001 / 002 / 003） |
| 状态 | 设计定稿 · Sprint-26 编码完成（2026-08-07）；TC-P2-AUTH-001 自动化通过；偏差见 §15 |
| 上游依据 | `docs/03-prd.md` §3 Phase2D 子节、`docs/02-srs.md` REQ-040..042、`ai/project-rules.md` §1 |
| 下游影响 | `docs/05-tech-spec.md` readiness gate（RG 待补）+ 认证技术栈、`docs/06-db-design.md` `lumen_users` 扩列 + `lumen_sessions` + migration 014、`docs/07-api-spec.md` auth API、`docs/08-dev-plan.md` Sprint-26、`docs/09-verification.md` TC-P2-AUTH-001 |
| 范围外（留 Sprint-27/28） | 权限多人化实质改造（owner_id 跨用户过滤回归）、全局角色分层、用户管理后台 UI、REQ-016 多人实时协作 |

## 1. 背景与目标

**现状（盘点已确认，详见 §1.1）**：项目已有完整的「空间 + 文档三级权限」过滤底座（DB 字段 + service 谓词 + SQL/检索层过滤），但**账号侧是 Demo 占位**——`lumen_users` 只有 `id / external_id / name`、登录只传 `external_id` 不要密码（`backend/api/auth.py:30`）、token 是手撸 HMAC 非 JWT（`backend/service/auth.py:25`）、3 用户 seed 硬编码 alice=1 / kira=2 / brightlite-member=3、前端默认填 alice 直接进。**无密码 / 无注册 / 无登出 / 无用户管理 / 无全局角色 / 零 auth 库依赖**。

**目标**：把 Demo 占位账号侧升级为真实多用户账号体系，为团队验证和 Sprint-27/28 多人权限打基础。从「无密码直登 + 手撸 token」升级到「bcrypt 凭证 + 不透明 token session + 统一鉴权 + demo 模式物理隔离」。

### 1.1 关键硬约束（基于代码事实）

| # | 约束 | 锚点 |
|---|---|---|
| 1 | `lumen_users` 缺 `password_hash / email / status / 全局 role`，`external_id` 同时充当登录标识 + 显示名 | `backend/model/orm.py:25` |
| 2 | login 零秘密校验（只查 external_id 存在就发 token） | `backend/api/auth.py:30` |
| 3 | token 手撸 HMAC，签名密钥默认 `"local-demo-signing-key"`，无库 / 无 refresh / 无撤销 | `backend/service/auth.py:25`、`backend/api/auth.py:11` |
| 4 | **13 个 router 各自复制 `_read_token_payload`，无中心 `get_current_user`** | `backend/api/spaces.py:69` 等 13 处 |
| 5 | 3 用户 ID 被 seed 冻结（alice=1/kira=2/brightlite-member=3），被 demo token 流程和测试契约依赖 | `backend/migrations/005_sprint8_seed_demo.sql:14`、`backend/repository/demo_repository.py:33` |
| 6 | role 模型是空间级（`lumen_space_members.role: admin/member`），无全局角色 | `backend/model/orm.py:48` |
| 7 | 风险 / Gate 评估空白：无 RG/RISK 覆盖真实账号 / 凭证 / 多用户隔离 | `docs/05/09` |

## 2. 范围边界（Sprint-26 做什么 / 不做什么）

**做（Sprint-26 账号体系基础）**：
- 账户注册（REQ-040）：登录标识 + 密码 → bcrypt 哈希 → 建 `lumen_users` + 默认个人空间
- 凭证登录（REQ-041）：bcrypt verify → 发不透明 token + 建 `lumen_sessions`；失败锁定
- 登出 / 会话管理（REQ-042）：撤销 session、TTL 过期、续期轮换、多设备会话查询/撤销
- `lumen_users` 扩列 + `lumen_sessions` 新表（migration 014）
- 统一 `get_current_user`（FastAPI `Depends`，收敛 13 router）
- 基础登录 / 注册页（独立路由，替换内联表单）
- 登录失败锁定 + 审计日志 + 密钥 env 注入
- **demo 模式保留为 env 开关 + 物理隔离护栏**（PG 强制真实认证，内存仓储允许 demo）

**不做（Sprint-27/28+）**：权限多人化实质改造（owner_id 跨用户过滤回归）、全局角色分层、用户管理后台 UI、REQ-016 多人实时协作。

## 3. 认证流程

```mermaid
flowchart TD
  R[注册 REQ-040] -->|bcrypt 哈希| DB1[(lumen_users + 默认空间)]
  L[登录 REQ-041] -->|bcrypt verify| V{凭证正确?}
  V -->|是| S[发不透明 token + 建 lumen_sessions]
  V -->|否| F[失败计数 → 锁定]
  S --> U[统一 get_current_user 鉴权]
  U --> A[访问受保护 API]
  LO[登出 REQ-042] -->|撤销 session| DB2[(lumen_sessions revoked)]
  RF[续期轮换] -->|发新 token 旧失效| DB2
```

### 3.1 注册（REQ-040）
1. 客户端提交 `{ login_id, password, name? }`（`login_id` = email 或 external_id，见 §15 C-AUTH-002）。
2. 后端校验：`login_id` 不重复、`password` 满足最小长度（见 §15 C-AUTH-005）；不满足返回 4220（参数错误）。
3. `passlib.hash.bcrypt.hash(password)`（cost=12）→ 存 `lumen_users.password_hash`（带 `$2b$` 前缀，passlib 自动识别算法）。
4. 建 `lumen_users` 行（status=active）+ 默认个人空间（`lumen_spaces` 一行 + `lumen_space_members` role=admin，见 §15 C-AUTH-001）。
5. 注册成功直接发登录会话（复用 §3.2 登录发 token 逻辑），返回 `{ token, user, current_space_id }`。
6. 审计日志：`register_success` / `register_duplicate`。

### 3.2 凭证登录（REQ-041）
1. 客户端提交 `{ login_id, password, current_space_id? }`。
2. 查 `lumen_users`（by login_id）；**无论账号是否存在，都走 bcrypt 计算**（恒定时序，防账号枚举）。
3. 账号不存在或 `bcrypt.verify` 失败 → 失败计数 +1（`failed_login_count`），达阈值锁定（`locked_until`，见 §15 C-AUTH-003）；返回统一错误「凭证错误或账号不存在」（不区分，防枚举）。
4. 成功 → 清零失败计数、刷 `last_login_at`、发不透明 token + 建 `lumen_sessions`（§5）。
5. 审计日志：`login_success` / `login_failed` / `login_locked`。

### 3.3 登出 / 会话撤销（REQ-042）
1. `POST /api/auth/logout`：置当前 session `revoked_at = now`（或删行）→ token 立即失效。
2. 多设备会话：`GET /api/auth/sessions` 列当前用户活跃会话；`DELETE /api/auth/sessions/{id}` 撤销指定会话。

### 3.4 续期轮换
1. token 将过期时（或显式 `POST /api/auth/refresh`）：校验当前 session 有效 → 发新 token（新 `lumen_sessions` 行或轮换 token_hash）→ 旧 token 失效。
2. **轮换（rotation）**：每次续期发新 token，旧 token 立即失效；**重用检测（reuse detection）留 P3**（被撤销 token 再用 → 全家族撤销，Sprint-26 不做）。

## 4. 密码哈希

- **算法**：bcrypt（`passlib[bcrypt]`），cost factor = 12。
- **存储**：`lumen_users.password_hash` 存 passlib 标准串（`$2b$12$...`），带算法前缀，passlib 自动识别。
- **rehash-on-login 迁移路径**：将来升级 Argon2id 时，登录 `bcrypt.verify` 成功后检测 `password_hash` 前缀，若为旧算法则用新算法 rehash 回写——无缝迁移。
- **不存明文、不日志记录密码**。
- **为什么 bcrypt 而非 Argon2id**：bcrypt 成熟、FastAPI/passlib 一等支持、生态最广；OWASP 列为可接受替代。Argon2id 面向未来但本阶段无刚需（见 §15 C-AUTH-006）。

## 5. token 机制（不透明 token + session 表）

- **生成**：`secrets.token_urlsafe(32)`（256bit，Python 标准库，**零新 token 依赖**）。
- **存储**：`lumen_sessions.token_hash`（存 SHA-256 hash 不存明文，防 DB 泄露后 token 可用）；明文 token 只返回给客户端一次。
- **载荷**：token 本身不携带 claims（不透明）；服务端查 `lumen_sessions` 得 `user_id / current_space_id / session_id`。等价于当前 `TokenPayload`（user_id / current_space_id / exp）由 session 行承载。
- **TTL**：8h（沿用现有），滑动续期（§3.4）。
- **撤销**：`revoked_at` 置位或删行 → 下次请求查库即失效。
- **为什么不用 JWT / 手撸 HMAC**：见 `docs/03-prd.md` Phase2D 进入标准评估记录——手撸 HMAC 是自实现密码学协议（OWASP 反模式）；JWT 的 stateless 优势在「撤销表」存在时白费。不透明 token 最简最稳最易撤销，单体 FastAPI + PG 最务实（PG 单行索引查询，demo 规模无压力；大规模加 Redis 留后续）。

## 6. 统一 `get_current_user`

- 新增 `backend/service/auth_context.py`：提供 FastAPI 依赖项 `get_current_user`（必选）/ `get_current_user_optional`（可选）/ `require_space_member(space_id)`。
- 从 `Authorization: Bearer <token>` 解析 → 查 `lumen_sessions`（有效 + 未过期 + 未撤销）→ 返回 `TokenContext(user_id, current_space_id, session_id, user)`。
- **收敛 13 router**：spaces / documents / rag / search / terms / imports / export / folders / doc_links / tags / quick_entry / timeline 等全部改用 `Depends(get_current_user)`，删除各自复制的 `_read_token_payload`。
- demo 模式下（§7），`get_current_user` 走 demo 快捷分支（直接信任 `external_id`，不查 session），仅在内存仓储生效。

## 7. demo 模式 + 物理隔离护栏

- **实现口径**（偏差 D-3/D-4，见 §15）：demo 模式由**仓储类型**决定（`DemoRepository.is_demo=True`），未实现设计中的 `LUMEN_ENABLE_DEMO_AUTH` env 开关；生产护栏为启动断言 fail-fast。
- **物理隔离**（最稳，根治生产旁路风险）：
  - **PG 仓储（`PgRepository`）**：强制真实认证——所有登录必须 bcrypt 凭证；`get_current_user` 不解析 HMAC demo token（仅内存仓储走 demo 快捷分支）。
  - **内存仓储（`demo_repository`，`run-sprint16-demo` 用）**：允许 demo 快速登录（seed 用户无密码 + 兼容旧 HMAC demo token），用于本地演示 / 测试。
- **启动护栏**：`main.py` lifespan 断言 `LUMEN_ENV=production` 时不得使用 demo 仓储，否则 fail-fast（`RuntimeError: [AUTH] LUMEN_ENV=production must not use the demo repository`）。
- **seed 用户处置**（偏差 D-2）：migration 014 统一为 alice/kira/brightlite-member 设置 demo 密码 `demo-pass-1234` + email（PG 强制凭证登录）；内存仓储保留 `password_hash=None` 的无密码快捷登录语义。
- **密钥**：`LUMEN_DEMO_TOKEN_KEY` 仅用于内存仓储的 HMAC demo token 兼容（保留本地默认值；PG 模式不使用该路径）。

## 8. 数据契约（migration 014）

> 正式回写 `docs/06-db-design.md` 在编码 Sprint-26；此处为设计层字段契约。

### 8.1 `lumen_users` 扩列
```sql
ALTER TABLE lumen_users ADD COLUMN password_hash VARCHAR(255);      -- bcrypt $2b$12$...，demo seed = NULL
ALTER TABLE lumen_users ADD COLUMN email VARCHAR(255);              -- 登录标识候选（见 C-AUTH-002）
ALTER TABLE lumen_users ADD COLUMN status VARCHAR(20) DEFAULT 'active';  -- active / disabled / pending
ALTER TABLE lumen_users ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE lumen_users ADD COLUMN failed_login_count INT DEFAULT 0;
ALTER TABLE lumen_users ADD COLUMN locked_until TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lumen_users_email ON lumen_users(email) WHERE email IS NOT NULL;
```
- 全局角色（role）**本阶段不加**（所有人普通用户）；Sprint-28 角色分层时加 `role` 列或 `lumen_user_roles` 关联表。

### 8.2 `lumen_sessions` 新表
```sql
CREATE TABLE lumen_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES lumen_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256(token) hex
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,                    -- NULL = 活跃
  last_used_at TIMESTAMPTZ,
  client_ua TEXT,                            -- 审计/多设备识别
  client_ip VARCHAR(64)
);
CREATE INDEX idx_lumen_sessions_user ON lumen_sessions(user_id) WHERE revoked_at IS NULL;
```
- 不存明文 token；撤销 = `revoked_at` 置位（保留审计行）或 TTL 过期清理 job（留后续）。

## 9. API 契约（auth API）

> 正式回写 `docs/07-api-spec.md` 在编码 Sprint-26；编号待分配（现有 auth 域仅 API-001 login）。

| endpoint | 方法 | 用途 | 权限 | 关键错误 |
|---|---|---|---|---|
| `/api/auth/register` | POST | 注册（§3.1） | 公开 | 4220 参数 / 4090 重复标识 |
| `/api/auth/login` | POST | 凭证登录（§3.2，替换现无密码 login） | 公开 | 4010 凭证错误（统一，防枚举）/ 4030 锁定 |
| `/api/auth/logout` | POST | 登出当前会话（§3.3） | 已认证 | — |
| `/api/auth/refresh` | POST | 续期轮换（§3.4） | 已认证（有效 session） | 4010 session 无效 |
| `/api/auth/sessions` | GET | 列当前用户活跃会话 | 已认证 | — |
| `/api/auth/sessions/{id}` | DELETE | 撤销指定会话 | 已认证（owner） | 4004 不存在 / 4030 越权 |

- **契约变更**：现 `POST /api/auth/login`（API-001，入参 `{external_id, current_space_id?}`，不要密码）→ 改为 `{login_id, password, current_space_id?}` + bcrypt verify。属于对外契约破坏性变更，呼应 Phase 跨越 MAJOR 版本（§13）。
- 错误码沿用现有体系（4010 鉴权失败 / 4030 锁定 / 4004 不存在 / 4090 冲突 / 4220 参数），正式映射在编码时回写 `docs/07`。

## 10. 安全控制

| 控制 | 措施 | 阶段 |
|---|---|---|
| 密码哈希 | bcrypt cost 12 | Sprint-26 |
| 登录失败锁定 | `failed_login_count` / `locked_until`（阈值见 C-AUTH-003） | Sprint-26 |
| 审计日志 | register / login_success / login_failed / login_locked / logout（粒度见 C-AUTH-004） | Sprint-26 |
| 密钥管理 | 签名/会话密钥 env 注入，禁默认值，生产 fail-fast | Sprint-26 |
| HTTPS | token 必须走 HTTPS（生产）；本机 demo HTTP 可接受，文档标注 | Sprint-26（生产部署） |
| CSRF | Bearer header 天然免疫 CSRF（沿用现有 `Authorization` header，不入 cookie） | 已满足 |
| 速率限制 | 登录端点速率限制（防暴力）——复用锁定机制兜底；独立 rate limiter（如 slowapi）留 P2 | 锁定 Sprint-26 / limiter P2 |
| 账号枚举 | 登录失败统一错误，恒定时序 bcrypt 计算 | Sprint-26 |

## 11. readiness gate

进入编码 Sprint-26 前，以下 gate 需 Go（正式 RG-ID 在 `docs/05` 分配，候选 RG-011..013）：

| 候选 RG | 主题 | 验证方式 | 结论 |
|---|---|---|---|
| RG-011 | 密码哈希选型（bcrypt，不采用 passlib） | 本机 `pip install bcrypt` + hash/verify 最小验证 | **Go（2026-08-07 PoC）**：bcrypt 5.0.0 / Python 3.14.3，cost 12 ≈0.21s，恒定时序 |
| RG-012 | token session 安全（密钥 env、TTL、撤销、续期轮换、恒定时序） | 单测覆盖撤销/过期/续期轮换/枚举 | **Go（2026-08-07 单测）**：`tests/backend/test_auth.py` |
| RG-013 | 跨用户隔离回归 | 注册两个真实用户，验证私有文档仅 owner 可见、跨用户不泄露 | **Go（2026-08-07）**：test_auth.py 注册用户 + 个人空间隔离断言 |

> RG-011 已作为编码第一步完成本机 PoC（2026-08-07）；RG-012/013 靠单测 + 回归 TC 覆盖，均 Go。

## 12. 失败 / 降级

- **DB 不可用**：注册/登录/会话查询返回 5000，不静默降级（认证失败必须明确）。
- **密钥缺失**：启动 fail-fast，不发 token。
- **bcrypt 库不可用**：登录/注册返回 5030（依赖不可用），不降级为明文。
- **LLM 无关**：本子系统不涉及 LLM，无 LLM 降级路径。

## 13. 版本与契约影响

- **版本**：Phase2C → Phase2D 是 Phase 跨越 + 对外契约破坏性变更（login 入参改、API-001 契约变），按 `ai/project-rules.md` §2.8.1 应 **bump MAJOR v3.0**，时机为 Sprint-26 验收发布。
- **migration**：014 = `lumen_users` 扩列 + `lumen_sessions`；`lumen_vault_mounts`（原 Wave 3 预占 014）顺延 015，回写 `docs/06`。

## 14. 验收追溯

- **TC-P2-AUTH-001**（`docs/09` 待定义，批次 3）：覆盖 AC-P2-AUTH-001/002/003——
  1. 注册新账号 → 凭证登录成功 → 鉴权访问受保护 API；重复标识拒绝；密码 bcrypt 哈希存储（查库非明文）。
  2. 错误密码失败；连续失败 N 次锁定；登录失败不区分账号是否存在。
  3. 登出后原 token 再用被拒；session TTL 过期失效；续期轮换后旧 token 失效；多设备会话可查询/撤销。
  4. demo 模式开关：PG 强制真实 / 内存允许 demo；生产环境 fail-fast。
- 自动化位置：后端 `tests/backend/test_auth.py`（待建）；浏览器 smoke 覆盖登录/注册页。

## 15. 实现偏差 / 设计回写

> Sprint-26（2026-08-07）编码后回填。偏差均未越出 Phase2D 边界；正式契约以 `docs/06-db-design.md` / `docs/07-api-spec.md` 为准。

| # | 设计（§章节） | 实际实现 | 原因 / 影响 |
|---|---|---|---|
| D-1 | §8.2 `lumen_sessions` 无 `current_space_id` 列 | migration 014 补入 `current_space_id BIGINT REFERENCES lumen_spaces(id) ON DELETE SET NULL` | §5 会话载荷需承载当前空间；登录 / 切空间写会话行 |
| D-2 | §7 seed 用户 `password_hash = NULL`（demo-only） | migration 014 为 3 个 seed 用户统一设置 bcrypt demo 密码（`demo-pass-1234`）并补 email | PG 集成测试 / 真实路径需凭证；NULL 语义仅保留在内存仓储 |
| D-3 | §7 env 开关 `LUMEN_ENABLE_DEMO_AUTH` | **未实现**；demo 模式由仓储类型决定（`DemoRepository.is_demo=True`） | 更简且更硬的物理隔离：PG 仓储天然强制真实凭证 |
| D-4 | §7 启动告警日志 `[DEMO AUTH ENABLED — NOT FOR PRODUCTION]` | 未单独实现日志告警；改为启动期断言 fail-fast（`LUMEN_ENV=production` + demo 仓储拒绝启动） | 护栏更硬；demo 可见性靠仓储类型 + 文档标注 |
| D-5 | §7 密钥「禁默认值」 | `LUMEN_DEMO_TOKEN_KEY` 保留本地默认值（仅内存仓储 HMAC 兼容使用；PG 模式不走该路径） | demo 兼容所需；生产路径不依赖默认密钥 |
| D-6 | §9 login 入参 `{login_id, password, current_space_id?}` | 实现为 `login_id` + `password` + 可选 `external_id`（demo 别名）+ 可选 `current_space_id`；错误码 4010（凭证）/ 4030（锁定/禁用）/ 4090（重复 email）/ 4220（参数）/ 4004（会话不存在） | `external_id` 兼容旧 demo 客户端；错误码与 §10 对齐 |
| D-7 | 前端「独立登录/注册页（独立路由）」 | 实现为 `App.tsx` 登录面板内登录/注册 **tab 切换**（`authMode`），未引入 router | 最小改动、不引路由依赖；页面形态留 Sprint-27/28 前端收口 |
| D-8 | §14「浏览器 smoke 覆盖登录/注册页」 | 后端自动化已通过；浏览器 smoke 与 demo 启动验证**待用户确认**（RISK-P2-AUTH-001） | 本机环境限制；后续补 headless / 人工 smoke |
| D-9 | §6 收敛 13 router | 已收敛：spaces / documents / rag / search / terms / imports / export / folders / doc_links / tags / quick_entry / timeline 等改用 `Depends(get_current_user)`；内存仓储保留 HMAC demo token 兼容分支 | `get_current_user` 先查 session、demo 仓储再回退 demo token |


## 16. 待确认项（编码前需拍板）

| ID | 待确认项 | AI 建议 | 依据 | 备选 | 取舍 / 阻塞 |
|---|---|---|---|---|---|
| C-AUTH-001 | 注册空间归属 | 自建个人空间（每新用户一个默认私有空间，role=admin） | 最简、不阻塞；团队空间邀请留 Sprint-27/28 | 邀请码加入 / 管理员分配 | 影响注册流程；不阻塞设计 |
| C-AUTH-002 | 登录标识 | email（用户友好、可找回） | 主流；external_id 现状作显示名/句柄 | external_id（现状）/ username | 影响 `login_id` 字段；不阻塞 |
| C-AUTH-003 | 登录失败锁定阈值 | 5 次 / 15min 锁定 15min | 主流默认 | 3 次 / 10 次 | 调参项；不阻塞 |
| C-AUTH-004 | 审计日志粒度 | 最小：register / login_success / login_failed / login_locked / logout | 安全合规最小集 | 更细（session 续期/撤销） | 影响 `lumen_audit_log` 是否新建表（建议先用日志，表留后续） |
| C-AUTH-005 | 密码策略 | 最小长度 8（NIST 长度优先，不强制复杂度） | NIST 2017 主流 | 长度 12 / 加复杂度 / HIBP breach 检查（P3） | 调参项；不阻塞 |
| C-AUTH-006 | bcrypt vs Argon2id | bcrypt 起步 | 成熟、生态广；rehash 路径可后续升 Argon2id | 直接 Argon2id | 不阻塞；差异小 |

> **确认记录（2026-08-07 编码前）**：C-AUTH-001..006 均按 AI 建议落地——C-AUTH-001 注册自建个人空间（role=admin）；C-AUTH-002 登录标识 email（兼容 external_id 别名）；C-AUTH-003 锁定阈值 5 次 / 15min；C-AUTH-004 审计最小集（register / login_success / login_failed / login_locked / logout，结构化日志，不新建表）；C-AUTH-005 密码策略 8–64 字符；C-AUTH-006 bcrypt（cost 12，不采用 passlib）。`docs/01 §4` 的 U-45「注册空间归属待确认」随之关闭。

## 17. Sprint-27 权限多人化设计（增量·草案）

> 定位：Phase2D「账户与多人权限」Sprint-27 增量设计（2026-08-07 立项·草案待人工确认）。承接 REQ-043 / REQ-044（REQ-001/002/003 扩展，U-48 / U-49），在 Sprint-26 账号体系之上做权限过滤实质改造与回归。编码前需确认 §17.5 待确认项（C-ACC-001..003）。

### 17.1 目标与范围

- **目标**：在真实多用户账号体系上验证并补全权限过滤底座——任何用户只能看到其所属空间的可见文档；私有文档仅 owner 可见；外部只读仅 owner 可写；列表 / 搜索 / 问答 / 时间线 / 目录树 / 标签 / 导出 / 链接 / 快速录入等全部查询路径跨用户零泄露。
- **做（Sprint-27）**：owner_id 跨用户过滤全路径审计与回归、私有按 owner 过滤回归、外部只读仅 owner 可写回归、跨用户隔离自动化回归、空间隔离 / 切换回归（REQ-001/002/003 扩展）。
- **不做（Sprint-28+）**：全局角色分层 / 用户管理后台 UI（Sprint-28）、REQ-016 多人实时协作；不引新依赖；预期零 migration（`lumen_documents.owner_id` 等字段已存在）。

### 17.2 现状（代码事实锚点，2026-08-07 盘点）

| # | 事实 | 锚点 |
|---|---|---|
| 1 | 权限谓词已集中：`can_view_document`（space_id 相等 + 空间成员 + PRIVATE→owner_id == user_id）、`can_write_document`（external 仅 owner 可写）、`filter_visible_documents`、`visible_document_where_clause`（SQL 层） | `backend/service/permission.py` |
| 2 | 文档 CRUD / 链接 / folder document_count / quick_entry 已走可见性谓词 | `backend/service/document.py`、`backend/service/doc_links.py`、`backend/service/folder.py` |
| 3 | 空间成员校验：`ensure_space_access` + `list_memberships()`；`lumen_space_members.role` 为空间级 admin/member | `backend/service/space.py`、`backend/model/orm.py:48` |
| 4 | 鉴权已收敛：`get_current_user` / `get_current_user_optional` / `require_space_member` | `backend/service/auth_context.py` |
| 5 | RG-013（跨用户隔离回归）Go（2026-08-07）：注册用户 + 个人空间隔离断言 | `tests/backend/test_auth.py`、`docs/05-tech-spec.md` RG-013 |

### 17.3 设计决策（草案）

| # | 决策 | AI 建议 | 依据 / 备选 |
|---|---|---|---|
| D-ACC-001 | owner 过滤统一 | 全查询路径统一复用 `can_view_document` / `visible_document_where_clause`（列表 / 搜索 hybrid / RAG 候选 / 时间线 / 目录树计数 / 标签 document_count / 导出 ZIP / 链接 / 快速录入），逐路径审计并修复遗漏 | 谓词已集中，审计成本低；避免路径级复制导致漂移 |
| D-ACC-002 | 私有按 owner 过滤 | PRIVATE → `owner_id == user_id`（含同空间成员）；external 仅 owner 可写（写路径 4003） | 已实现（permission.py）；Sprint-27 补回归断言 |
| D-ACC-003 | 空间隔离 / 切换回归 | 真实账号下回归 REQ-001/002：仅能访问所属空间；切换后上下文只反映目标空间 | 已有 `is_space_member` / `ensure_space_access` / `current_space_id` 会话承载 |
| D-ACC-004 | 隔离回归测试形态 | 扩展 `tests/backend/test_permission.py` + 新增多用户隔离用例（注册 2-3 真实用户，逐路径断言零泄露） | RG-013 已铺底；全路径矩阵比单路径更可信 |
| D-ACC-005 | 团队空间加入机制 | **Sprint-27 不做**，留 Sprint-28 与角色 / 用户管理 UI 一起；Sprint-27 隔离回归使用注册自建个人空间 + seed 同空间成员数据 | C-AUTH-001 备选（邀请码加入 / 管理员分配）；保持 Sprint-27 聚焦隔离可信 |
| D-ACC-006 | 前端改动 | 预期零前端改动（过滤在 service/SQL 层）；若回归暴露前端可见性问题，最小修复并记录 | 隔离是服务端职责；前端只消费过滤后结果 |

### 17.4 验证方案

- 后端：`tests/backend/test_permission.py` 扩展 + 新增多用户隔离用例；既有权限 TC（TC-P1-001/002/003）回归不破；全量 backend discover 通过。
- 浏览器 smoke：登录两个真实用户，交叉验证私有文档不可见（Sprint-27 实现时执行）。
- 零 migration / 零新依赖声明：`06` / `07` 预期无契约变更；若审计发现需补字段 / API，先停下说明并走契约修订。

### 17.5 待确认项（编码前拍板）

| ID | 待确认项 | AI 建议 | 依据 | 备选 | 取舍 / 阻塞 |
|---|---|---|---|---|---|
| C-ACC-001 | 团队空间加入机制（邀请码 / 管理员分配）是否进 Sprint-27 | 不进，留 Sprint-28 与角色 / 用户管理 UI 一起 | 主流（Notion / 语雀 / 飞书知识库 / Confluence）：空间成员由创建者或管理员主动添加 / 邀请链接加入，与成员管理页强绑定；只做邀请不做管理页 = 孤儿 UI；邀请码有枚举 / 过期 / 滥用成本；3-5 人团队最简路径 = 空间设置加成员 | 进 Sprint-27（范围扩大） | 影响范围与验收；不阻塞隔离回归 |
| C-ACC-002 | 全路径审计中发现的既有泄露缺口处理 | 分档：P0 跨用户泄露必修（阻塞退出）；P1 越权写 / 元数据可见修复；P2 已知降级记录并由用户确认接受；契约变更先停下确认 | 安全隔离按 fail-closed，发现即修；不得把「已审计未修复」写成已通过 | 全部记录为已知风险推迟 | 安全边界；P0 阻塞退出标准 |
| C-ACC-003 | 是否新增用户列表 / 空间成员类 API（团队空间加入时用） | Sprint-27 不加；预留契约方向（空间成员 CRUD 走 space 域、用户管理走 admin 域），Sprint-28 立项时定稿 | 消费者是 Sprint-28 成员管理 UI（YAGNI）；提前暴露用户信息面有枚举风险；避免两轮破坏性契约变更 | 提前加 | 范围蔓延 |

> **确认记录（2026-08-07）**：用户按 AI 建议执行——C-ACC-001 不进 Sprint-27（留 Sprint-28 与角色 / 用户管理 UI 一起）；C-ACC-002 按 P0/P1/P2 分档修复，P0 阻塞退出标准；C-ACC-003 Sprint-27 不加（契约方向预留：空间成员 CRUD 走 space 域、用户管理走 admin 域）。可选增强（文档列表「创建者」列 / tooltip 强化归属认知）不纳入本 Sprint，另行评估。
