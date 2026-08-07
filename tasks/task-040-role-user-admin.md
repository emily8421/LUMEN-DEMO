# task-040-role-user-admin（Sprint-28 角色分层 + 用户管理 + 团队空间加入）

> Phase2D「账户与多人权限」Sprint-28。设计权威：`docs/design/accounts-auth.md` §18。**立项 2026-08-07（REQ-045/046/047，U-50/51/52，TC-P2-ACC-002）**：契约已落盘 02/01/03/08/09/06/07/accounts-auth §18；C-ROLE-001..007 已确认（2026-08-07 按 AI 建议执行）；**编码 Sprint 待启动**。

## 目标
在 Sprint-26 账号体系 + Sprint-27 权限过滤底座上补齐团队治理能力，完成「账号 → 权限 → 团队协作」的 Phase2D 闭环：
- 全局角色分层（REQ-045）：`lumen_users.role`（admin / member，默认 member）+ seed alice=admin / kira·brightlite-member=member
- 用户管理后台（REQ-046）：admin 域用户列表（姓名 / email / 角色 / 状态 / 最后登录）+ 过滤 + 改全局角色 + 禁用 / 启用（禁用后登录被拒且会话失效，不删数据、不返回 password_hash）
- 团队空间加入机制（REQ-047）：space 域成员 CRUD（按 email 搜索添加 / 改空间角色 / 移除）+ 前端空间设置成员管理；非空间 admin 无成员管理能力

## 输入文档
- `docs/design/accounts-auth.md` §18（Sprint-28 增量设计·草案）
- `docs/02-srs.md` REQ-045/046/047；`docs/01-user-requirements.md` U-50/51/52 + AC-P2-ACC-004..006
- `docs/03-prd.md` §3 Phase2D 子节（Sprint-28 段落）；`ai/project-rules.md` §1
- 现状锚点：`backend/service/auth_context.py`（get_current_user / require_space_member）、`backend/service/auth.py`（login 禁用分支 4030）、`backend/model/orm.py`（lumen_users / lumen_space_members）、`backend/repository/pg_repository.py` / `demo_repository.py`、migration 014

## 修改范围（预计，编码 Sprint 细化）
- **后端**：migration `016_user_role.sql`（`lumen_users.role` + CHECK + seed 对齐）；`service/` admin 域（list_users / update_user_role / set_user_status）+ space 域成员 service（add_member / update_member_role / remove_member / list_members）+ 受限用户搜索；`api/` 新增 admin 域 router + space 域成员 router + users/search；仓储层对应方法
- **前端**：用户管理页（admin 域：列表 / 过滤 / 行内改角色 / 禁用开关 + 二次确认）；空间设置成员管理（email 搜索添加 / 改角色 / 移除确认）；管理入口按角色显隐
- **测试**：`tests/backend/test_role.py` / `test_admin_users.py` / `test_space_members.py` + 既有 auth / permission 回归；浏览器 smoke（用户管理页 + 空间设置成员管理，admin / member 双视角）
- **回写**：`docs/09`（TC-P2-ACC-002 结果）、`docs/08`（Sprint-28 状态）、`accounts-auth.md` §18（决策确认 / 实现偏差）、`docs/06` / `docs/07`（migration 016 + admin / space 域 API 契约）
- **预期**：零新依赖（沿用既有栈）；migration 016 一个

## 验收标准
- **TC-P2-ACC-002**（AC-P2-ACC-004/005/006）：管理接口仅 admin（member 4030）+ 新注册默认 member；admin 用户列表可过滤、改角色、禁用启用（禁用后登录被拒且会话失效、接口不返回 password_hash）；空间 admin 按 email 搜索添加成员 / 改空间角色 / 移除（移除后失去空间访问、非空间 admin 4030）；seed alice=admin / kira·brightlite-member=member；demo 仓储不旁路管理鉴权
- 既有 `test_auth.py` / `test_permission.py` 与全量 backend discover 回归不破；前端 build 绿；浏览器 smoke 通过

## 禁止事项
- 不做移除用户 / 重置密码 / 邀请码 / 邀请链接 / REQ-016 多人实时协作（留候选 / 后续，C-ROLE-002/003）
- 不做角色矩阵化（`lumen_user_roles` 关联表，C-ROLE-001 备选未采）
- 不因 demo 仓储类型旁路管理鉴权（C-ROLE-004）
- 不暴露用户敏感字段（password_hash 等）；不删除用户 / 迁移文档（禁用仅 status 置位）

## 执行第一步（编码前门禁）
1. ✅ §18.8 已拍板（2026-08-07 按 AI 建议执行）：C-ROLE-005 显示 last_login_at（admin 域只读列）；C-ROLE-006 最后一个 admin 4090 保护；C-ROLE-007 全局 admin 同权 + 审计事件
2. ✅ `docs/06` 已回写（migration 016 `lumen_users.role` 字段契约 + REQ-045..047 追溯）；✅ `docs/07` 已回写（API-044..050 endpoint contract matrix + 错误码）
3. 按子步骤推进：migration + service/仓储 → admin API + 成员 API → 前端页面 → 自动化 tests → 浏览器 smoke → 回写 08/09/accounts-auth §18

## 待确认项
- **已确认（2026-08-07，按 AI 建议执行）**：C-ROLE-001 单列角色（admin/member，默认 member）；C-ROLE-002 最小集（列表 / 过滤 / 改角色 / 禁用启用；移除与重置密码留候选）；C-ROLE-003 管理员按 email 添加成员（邀请码 / 邀请链接留候选）；C-ROLE-004 seed alice=admin / kira·brightlite-member=member（内存 / PG 一致，管理入口显隐 + 后端强制鉴权）
- **已确认（2026-08-07，按 AI 建议执行）**：C-ROLE-005 用户列表显示 `last_login_at`（admin 域只读列，可排序）；C-ROLE-006 禁止移除 / 降级最后一个空间 admin（后端 4090 + 前端禁用提示）；C-ROLE-007 全局 admin 对任意空间成员管理同权（统一鉴权谓词 + 审计事件 member_added / member_role_changed / member_removed）
