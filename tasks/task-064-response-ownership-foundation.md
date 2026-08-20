# task-064：响应归属工具与会话空间读取保护

> Sprint-64（维护态批39）/ REQ-011 既有桌面端体验稳健性 / TC-P2-GOV-028。
> 状态：已完成（2026-08-21）。不新增产品需求、API、后端、数据库或依赖。

## 目标

建立可单测的前端请求归属工具，使同一 scope 中只有最后发起的异步读可以提交；token 或空间变化后，旧响应立即失效。将其接入会话空间列表读取。

## 依据

- `docs/08-dev-plan.md` Sprint-64 / FEP-05
- `docs/research/2026-08-19-frontend-remediation-plan.md` §7
- `docs/09-verification.md` TC-P2-GOV-028

## 修改范围

- `frontend/src/app/response-ownership.ts`：纯请求 scope / generation 归属工具。
- `frontend/src/app/response-ownership.test.ts`：scope 切换与旧响应晚到的 Vitest 用例。
- `frontend/src/app/useSession.ts`：为空间列表 reload 接入归属校验。

## 验收标准

1. 同一 scope 中，后发请求可提交，先发请求晚到时被拒绝。
2. token 或空间变化后，旧 scope 的空间列表响应不写入 state。
3. `npm test`、lint 与 build 通过。

## 禁止事项

- 不修改 `frontend/src/api/client.ts`、认证 API、token 持久化或登录失效处理。
- 不引入 AbortController、测试依赖或浏览器测试框架。

## 完成记录

- 已新增纯请求归属工具与 5 个 Vitest 时序用例；`useSession.reloadSpaces()` 与空间切换均按 token scope 校验，切换使用独立 ticket，避免与空间列表刷新互相作废。
- Sprint 收尾验证通过：定向 Vitest 5/5、全量前端 Vitest 24/24、lint、build、CSS token、file-size；浏览器受控逆序空间切换回归通过。
