# task-066：术语与领域分类读取归属保护

> Sprint-64（维护态批39）/ REQ-011 既有桌面端体验稳健性 / TC-P2-GOV-028。
> 状态：已完成（2026-08-21，依赖 Task-064 已完成）。

## 目标

让术语列表和术语领域树在空间切换、显式刷新或旧响应晚到时，只提交当前 scope 的结果。

## 依据

- `docs/08-dev-plan.md` Sprint-64 / FEP-05
- `docs/research/2026-08-19-frontend-remediation-plan.md` §7
- `docs/09-verification.md` TC-P2-GOV-028

## 修改范围

- `frontend/src/app/useAppState.ts`：向术语和领域分类 reload 传递当前请求 scope。
- `frontend/src/app/useTerms.ts`：保护术语列表读取提交。
- `frontend/src/app/useTermCategories.ts`：保护根节点、父节点和批量领域读取提交。

## 验收标准

1. 切换空间后，旧术语或领域分类响应不能覆盖当前 state。
2. 同一 scope 的后发刷新覆盖先发刷新，不改变创建、编辑、移动或删除的业务行为。
3. 与 Task-064 的 Vitest 时序语义一致。

## 禁止事项

- 不新增术语 API、字段、依赖或 UI 功能。
- 不在本 Task 修改标签、成员、时间线或文档侧数据。

## 完成记录

- 已将 token / space scope 校验接入术语列表与术语领域树的根节点、父节点及批量读取；领域树按父节点 key 独立计票。
- 未改变创建、编辑、移动或删除行为；Sprint 收尾的 Vitest 5/5、全量前端 Vitest 24/24、lint、build、CSS token、file-size 与双空间浏览器回归均通过。
