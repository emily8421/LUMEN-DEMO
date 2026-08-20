# task-065：工作区文档与文件夹读取归属保护

> Sprint-64（维护态批39）/ REQ-011 既有桌面端体验稳健性 / TC-P2-GOV-028。
> 状态：已完成（2026-08-21，依赖 Task-064 已完成）。

## 目标

将响应归属保护接入工作区文档和文件夹读取，并由工作区编排层在空间切换时提供当前 scope。

## 依据

- `docs/08-dev-plan.md` Sprint-64 / FEP-05
- `docs/research/2026-08-19-frontend-remediation-plan.md` §7
- `docs/09-verification.md` TC-P2-GOV-028

## 修改范围

- `frontend/src/app/useAppState.ts`：向工作区集合 reload 传递当前请求 scope。
- `frontend/src/app/useDocuments.ts`：保护文档列表及其依赖 state 的提交。
- `frontend/src/app/useFolders.ts`：保护已加载文件夹和父目录批量读取的提交。

## 验收标准

1. 空间切换后，旧文档或文件夹响应不恢复已重置的工作区 state。
2. 同一空间中的显式刷新以最后一次请求结果为准。
3. 不改变文档 CRUD、文件夹树展开和既有登录失效处理。

## 禁止事项

- 不修改 API、后端、数据库、路由、UI 样式或文件夹 / 文档业务语义。
- 不在本 Task 接入术语、标签、成员、时间线或文档侧数据。

## 完成记录

- `useDocuments` 与 `useFolders` 已接入 token / space scope 校验，`useAppState` 已传递当前空间；文件夹按父节点 key 独立计票，互不丢弃并行分支结果。
- Sprint 收尾验证通过：响应归属 Vitest 5/5、全量前端 Vitest 24/24、lint、build、CSS token、file-size 与双空间浏览器回归。
