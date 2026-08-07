# task-039-permission-multi-user（Sprint-27 权限多人化）

> Phase2D「账户与多人权限」Sprint-27。设计权威：`docs/design/accounts-auth.md` §17。立项 2026-08-07；**已实现（2026-08-07）**：C-ACC-001..003 已确认；全路径审计 → P0 doc-links 修复 + 多用户隔离回归 → 双用户浏览器 smoke PASS（详见 §17.6 与 09 验收记录）。

## 目标
在真实多用户账号体系上验证并补全权限过滤底座（REQ-043 / REQ-044，U-48 / U-49）：
- owner_id 跨用户过滤全路径审计与回归（列表 / 搜索 hybrid / RAG 候选 / 时间线 / 目录树计数 / 标签 / 导出 ZIP / 链接 / 快速录入）
- 私有文档按 owner 过滤回归（PRIVATE 仅 owner 可见，含同空间成员）；外部只读仅 owner 可写（写路径 4003）
- 跨用户隔离自动化回归（注册 2-3 真实用户，全路径零泄露断言）
- 空间隔离 / 切换回归（REQ-001/002：仅能访问所属空间；切换后上下文只反映目标空间）

## 输入文档
- `docs/design/accounts-auth.md` §17（Sprint-27 增量设计）
- `docs/02-srs.md` REQ-043 / 044；`docs/01-user-requirements.md` U-48 / 49 + AC-P2-ACC-001..003
- `docs/03-prd.md` §3 Phase2D 子节（Sprint-27 段落）；`ai/project-rules.md` §1
- 现状锚点：`backend/service/permission.py`（can_view_document / can_write_document / visible_document_where_clause）、`backend/service/document.py`、`backend/service/space.py`（ensure_space_access）、`backend/service/auth_context.py`（get_current_user / require_space_member）

## 修改范围（预计）
- **后端**：`backend/service/permission.py`（如审计需调整谓词）+ 各查询路径 service/API（仅修复审计发现的遗漏，不做重构）；`backend/repository/pg_repository.py` / `demo_repository.py`（如 SQL 层缺 `visible_document_where_clause` 应用则补）
- **测试**：扩展 `tests/backend/test_permission.py` + 新增多用户隔离用例（注册 2-3 真实用户逐路径断言）；浏览器 smoke（双用户交叉验证私有文档不可见）
- **回写**：`docs/09`（TC-P2-ACC-001 结果）、`docs/08`（Sprint-27 状态）、`accounts-auth.md` §17（决策确认 / 实现偏差）
- **预期零**：新依赖、migration、前端功能改动（如回归暴露问题，最小修复并记录）

## 验收标准
- **TC-P2-ACC-001**（AC-P2-ACC-001/002/003）：两个真实用户同空间——A 私有文档 B 列表 / 搜索 / 问答零命中；external 文档 B 只读不可写（4003）；注册多用户全路径（列表 / 搜索 / 问答 / 时间线 / 目录树 / 标签 / 导出 ZIP / 链接 / 快速录入）跨用户零泄露；空间隔离 / 切换回归通过（用户仅能访问所属空间）
- 既有权限 TC（TC-P1-001/002/003）与全量 backend tests 回归不破；全量 discover 通过；浏览器 smoke 通过

## 禁止事项
- 不做全局角色分层 / 用户管理后台 UI（Sprint-28）/ REQ-016 多人实时协作
- 不引新依赖 / 不改 `lumen_space_members.role` 模型 / 预期不加 migration（如审计发现需契约变更，先停下确认）
- 不做团队空间加入机制（C-ACC-001 已确认：留 Sprint-28）
- 不把「已审计但未修复」的缺口写成已通过

## 执行第一步（编码前门禁）
1. §17.5 待确认项已确认（2026-08-07 按 AI 建议执行：C-ACC-001 不进 / C-ACC-002 P0-P2 分档 / C-ACC-003 不加）
2. 先做全路径审计清单（每条路径：入口 / 过滤谓词 / 缺口，按 P0/P1/P2 分档），汇报后再编码修复
3. 按子步骤推进：审计 → 修复（P0 必修 / P1 修复 / P2 记录待确认）→ 隔离回归 tests → 浏览器 smoke → 回写 08/09/accounts-auth §17

## 待确认项（已确认 2026-08-07，按 AI 建议执行）
- C-ACC-001：团队空间加入机制**不进 Sprint-27**，留 Sprint-28 与角色 / 用户管理 UI 一起（主流：成员管理与邀请入口同屏，避免孤儿 UI）
- C-ACC-002：审计缺口按 **P0（跨用户泄露，必修，阻塞退出）/ P1（越权写 / 元数据可见，修复）/ P2（已知降级，记录并经用户确认接受）** 分档；契约变更先停下确认
- C-ACC-003：**Sprint-27 不加**用户列表 / 空间成员 API；预留契约方向（space 域成员 CRUD / admin 域用户管理）留 Sprint-28 定稿
