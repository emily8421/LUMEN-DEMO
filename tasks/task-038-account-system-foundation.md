# task-038-account-system-foundation（Sprint-26 账号体系基础）

> Phase2D「账户与多人权限」首个 Sprint。设计权威：`docs/design/accounts-auth.md`。立项 2026-08-07；编码待启动（先过 §执行第一步 RG-011 PoC + 确认 §待确认项）。

## 目标
把 Demo 占位账号侧（无密码 / 3 seed 用户 / 手撸 token）升级为真实多用户账号体系，为团队验证与 Sprint-27/28 多人权限打基础（REQ-040 / REQ-041 / REQ-042，U-45 / U-46 / U-47）：
- 账户注册（bcrypt 哈希）/ 凭证登录（bcrypt verify + 不透明 token session）/ 登出·会话管理（撤销 + TTL + 续期轮换 + 多设备会话）
- `lumen_users` 扩列 + `lumen_sessions` 新表（migration 014）
- 统一 `get_current_user`（FastAPI `Depends`，收敛 13 router 复制）
- 基础登录 / 注册页（独立路由，替换 `App.tsx` 内联表单）+ 登出
- demo 模式 env 开关 + 物理隔离护栏（PG 强制真实认证 / 内存仓储允许 demo）
- 登录失败锁定 + 审计日志 + 密钥 env 注入

## 输入文档
- `docs/design/accounts-auth.md`（核心设计：§3 流程 / §4 密码哈希 / §5 不透明 token / §6 get_current_user / §7 demo 物理隔离 / §8 migration 014 数据契约 / §9 auth API / §10 安全 / §11 readiness gate / §16 待确认项）
- `docs/02-srs.md` REQ-040 / 041 / 042；`docs/01-user-requirements.md` U-45 / 46 / 47 + AC-P2-AUTH-001 / 002 / 003
- `docs/03-prd.md` §3 Phase2D 子节；`ai/project-rules.md` §1
- 现状盘点锚点：`backend/model/orm.py:25`（lumen_users）、`backend/service/auth.py:25`（create_demo_token 手撸 HMAC）、`backend/api/auth.py:30`（login 零秘密）、13 router `_read_token_payload`、`backend/migrations/005_sprint8_seed_demo.sql:14`（seed id=1/2/3）

## 修改范围（较大，编码时按子步骤推进）
- **后端**：
  - 新增 `backend/service/auth_context.py`（`get_current_user` / `get_current_user_optional` / `require_space_member` 依赖项）
  - 改 `backend/service/auth.py`（不透明 token `secrets.token_urlsafe` + session，替换手撸 HMAC）
  - 改 `backend/api/auth.py`（register / login / logout / refresh / sessions endpoint；login 改为凭证校验）
  - 改 13 router（spaces / documents / rag / search / terms / imports / export / folders / doc_links / tags / quick_entry / timeline 等，收敛到 `Depends(get_current_user)`，删除各自 `_read_token_payload`）
  - 新增 migration `014_account_sessions.sql`（`lumen_users` 扩列 + `lumen_sessions`）
  - repository（Pg + demo）：注册 / 登录 / session CRUD；demo 模式物理隔离（PG 强制真实，demo_repository 允许 demo 快捷登录）
  - `backend/requirements.txt`：+ `passlib[bcrypt]`
- **前端**：
  - 新增独立登录 / 注册页（路由，替换 `App.tsx:251` 内联表单）
  - 改 `app/useSession.ts` / `app/session-store.ts` / `api/client.ts`（token 机制适配）
  - TopBar 用户菜单加登出 + 多设备会话
- **回写**：`docs/05`（TCD-011 + RG-011/012/013 回写 Go）、`docs/06`（lumen_users 扩列 + lumen_sessions + migration 014）、`docs/07`（auth API 契约 + API-001 login 契约变）、`docs/08`、`docs/09`、`accounts-auth.md` §15 实现偏差
- **测试**：新增 `tests/backend/test_auth.py` + 浏览器 smoke（登录/注册页）

## 验收标准
- **TC-P2-AUTH-001**（AC-P2-AUTH-001/002/003）：注册 → 凭证登录 → 鉴权访问受保护 API；重复标识拒绝；密码 bcrypt 哈希存储非明文；错误凭证失败 + 连续失败锁定 + 不枚举账号；登出后 token 失效 + TTL 过期 + 续期轮换旧 token 失效 + 多设备会话查询/撤销；demo 开关 PG 强制真实 / 内存允许 demo；跨用户隔离不泄露（私有文档仅 owner 可见）
- **RG-011**（bcrypt PoC）Go；**RG-012**（token session 单测：撤销/过期/枚举）Go；**RG-013**（跨用户隔离回归）Go
- 后端 `tests/backend/test_auth.py` + 浏览器 smoke 通过；既有 TC 回归不破；demo 模式下 `run-sprint16-demo`（内存仓储）仍可用

## 禁止事项
- 不做权限多人化实质改造（owner_id 跨用户过滤回归）/ 全局角色分层 / 用户管理后台 UI / REQ-016 多人实时协作（均 Sprint-27/28）
- 不引 JWT / python-jose / 自实现 token 协议（用不透明 token + `secrets` 标准库）
- 不破坏 demo 模式（`run-sprint16-demo` 内存仓储继续可用；seed id=1/2/3 保留）
- 不改 `lumen_space_members.role`（空间级角色保留，全局角色留 Sprint-28）
- 不明文存储 / 日志记录密码

## 执行第一步（编码前门禁）
1. **RG-011 bcrypt PoC**：`pip install passlib[bcrypt]` + `hash/verify` 最小验证 → Go 后回写 `docs/05` RG-011 + TCD-011 + §1 技术栈 / §2.1 依赖矩阵
2. 确认 `accounts-auth.md` §16 待确认项（C-AUTH-001..006）后再开始编码
3. 按 子步骤推进：migration 014 → 后端 auth service/api → 13 router 收敛 → 前端登录/注册页 → 锁定/审计/密钥 → 回写 05/06/07/08/09

## 待确认项（编码前拍板）
见 `docs/design/accounts-auth.md` §16：C-AUTH-001 注册空间归属 / C-AUTH-002 登录标识（email vs external_id）/ C-AUTH-003 锁定阈值 / C-AUTH-004 审计日志粒度 / C-AUTH-005 密码策略 / C-AUTH-006 bcrypt vs Argon2id。

## 完成记录
（编码 Sprint-26 后回填：实际表字段 / API 错误码 / get_current_user 落地范围 / demo 开关实测 / 13 router 收敛清单 / TC 结果 / 版本 bump v3.0）
