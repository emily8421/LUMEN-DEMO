# task-067：标签、成员与时间线读取归属保护

> Sprint-64（维护态批39）/ REQ-011 既有桌面端体验稳健性 / TC-P2-GOV-028。
> 状态：已完成（2026-08-21，依赖 Task-064 已完成）。

## 目标

为已具备 token / currentSpaceId 上下文的标签、空间成员和时间线读取加入统一响应归属校验。

## 依据

- `docs/08-dev-plan.md` Sprint-64 / FEP-05
- `docs/research/2026-08-19-frontend-remediation-plan.md` §7
- `docs/09-verification.md` TC-P2-GOV-028

## 修改范围

- `frontend/src/app/useTags.ts`：保护空间标签、文档标签和标签文档读取。
- `frontend/src/app/useSpaceMembers.ts`：保留现有 effect cleanup，并保护显式成员 reload 与搜索结果。
- `frontend/src/app/useTimeline.ts`：保护手动时间线读取，避免空间切换后旧结果回填。

## 验收标准

1. 空间或文档选择变化后，旧标签 / 成员 / 时间线响应不写入 state。
2. 失效响应保持静默，不显示误导性的错误或成功提示。
3. 不改变标签 CRUD、成员角色管理或时间线查询的 API 语义。

## 禁止事项

- 不修改成员权限、标签数据模型、时间线 API 或 UI 样式。
- 不把 token-only 读取误纳入空间竞态改造。

## 完成记录

- 标签、文档标签与标签文档读取使用独立 ticket；成员列表、成员搜索及手动时间线读取已在提交前校验当前 scope。
- 保留成员 effect cleanup；Sprint 收尾的 Vitest 5/5、全量前端 Vitest 24/24、lint、build、CSS token、file-size 与双空间浏览器回归均通过。
