# task-068：文档详情、版本与链接读取归属保护

> Sprint-64（维护态批39）/ REQ-011 既有桌面端体验稳健性 / TC-P2-GOV-028。
> 状态：已完成（2026-08-21，依赖 Task-064、Task-065 已完成）。

## 目标

使文档详情、版本、出链和反链读取绑定 token、空间和选中文档 scope，避免快速选文档或切空间后旧响应恢复侧栏 state。

## 依据

- `docs/08-dev-plan.md` Sprint-64 / FEP-05
- `docs/research/2026-08-19-frontend-remediation-plan.md` §7
- `docs/09-verification.md` TC-P2-GOV-028

## 修改范围

- `frontend/src/app/useDocuments.ts`：将当前文档 / 空间 scope 传给侧数据读取。
- `frontend/src/app/useDocumentSideData.ts`：保护详情、版本和文档链接的 state 提交。

## 验收标准

1. 选择新文档或切换空间后，旧详情、版本、出链和反链响应不能覆盖当前侧数据。
2. 失效读取不清空新选择的文档 state，也不改变现有认证错误处理。
3. 不改变文档编辑、版本恢复或链接业务语义。

## 禁止事项

- 不修改文档 API、版本模型、链接契约、编辑器或 UI 样式。
- 不把本地文件预览、AI 润色或 AI 助手读取纳入本 Task。

## 完成记录

- 文档详情、版本、出链和反链使用独立 ticket，并以 token / space / document ID 共同确定 scope。
- 旧 scope 的详情错误与认证错误不再影响新文档或新会话；Sprint 收尾的 Vitest 5/5、全量前端 Vitest 24/24、lint、build、CSS token、file-size 与双空间浏览器回归均通过。
