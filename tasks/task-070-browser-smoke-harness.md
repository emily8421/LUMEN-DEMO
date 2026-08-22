# task-070：浏览器 smoke 共享 CDP harness

> Sprint-66（维护态批41）/ REQ-011 既有桌面端体验质量保障 / TC-P2-GOV-030。
> 状态：已完成（2026-08-22）。不新增产品需求、API、后端、数据库、CI 或依赖。

## 目标

将本地 CDP 浏览器发现、目标页创建、会话连接、页面求值与等待逻辑收敛为单一共享 helper，并迁移一条现有浏览器 smoke 作为零依赖 PoC，降低后续 smoke 修复的重复成本。

## 依据

- `docs/08-dev-plan.md` Sprint-66 / FE-SMOKE-1
- `docs/research/2026-08-10-code-quality-maintainability-assessment.md` §4.12、TQG-012
- `docs/09-verification.md` TC-P2-GOV-030

## 修改范围

- `scripts/lib/cdp-smoke.mjs`：浏览器发现、CDP endpoint / page target、会话、求值与等待 helper。
- `scripts/smoke-folder-tree-browser.mjs`：删除本地重复的 CDP helper，改为引用共享模块。
- 附带（同任务链验证基建）：`scripts/run-sprint16-demo.ps1` 端口 IPv4 bind probe + `runtime.json` 运行态记录 + `-Stop` 按记录 PID 安全清理；`docs/env/local-demo-runbook.md` 同步口径。

## 验收标准

1. 迁移后的文件夹树 smoke 不再定义本地 `findBrowser`、`CdpSession`、`createPageTarget`、`evaluate` 或 `waitForPage`。
2. 共享 helper 在不增加依赖的前提下支持该 smoke 的浏览器启动、连接和页面等待路径。
3. `scripts/smoke-folder-tree-browser.mjs` 对真实后端与浏览器的完整 smoke 通过，fixture 与临时浏览器 profile 在收尾时清理。
4. 前端 `npm test`、lint、build、CSS token 与 file-size 检查通过。

## 禁止事项

- 不引入 Playwright、其他测试依赖或 CI workflow 改动。
- 不批量迁移其他 smoke，不修改应用、API、后端、数据库或产品交互。
- 不将已删除的 FEP-05 临时浏览器脚本重新作为长期工件引入。

## 完成记录（2026-08-22）

- **共享 helper**：`scripts/lib/cdp-smoke.mjs` 148 行，导出 `findBrowser` / `waitForDebugEndpoint` / `createPageTarget` / `CdpSession` / `evaluate` / `waitForPage` / `waitForCondition` / `sleep`，零依赖（Node 22 内置 fetch/WebSocket）；`smoke-folder-tree-browser.mjs` 删除 5 处本地重复定义（-162 行），仅保留业务 fixture 与交互断言。
- **smoke 验证**：隔离内存 Demo（`run-sprint16-demo.ps1 -Detached`，backend 18000 / frontend 5241）上连跑 3 次全过（`FOLDER_TREE_BROWSER_SMOKE ok root=5/7/9 child=6/8/10 document=203/204/205`），fixture 与临时浏览器 profile 每次收尾清理。
- **可诊断性修补（2 处，smoke 脚本自身）**：① `main().catch` 输出附加 `error.cause`（如 `ECONNREFUSED`）——此前只打印 `fetch failed` 吞掉 cause，导致 2026-08-21 失败无法定位（后裁决为 demo 服务已死，非网络问题）；② 文档移动后 click 子文件夹 label 前增加「label 可点击」等待——`runAction` 期间 `isBusy=true` 使 label 按钮 `disabled`，synthetic click 被静默丢弃，曾致复跑超时（flaky）。
- **前端质量门**：Vitest 5 files / 24 tests、ESLint 0 error、`tsc -b && vite build`（364 modules / 450.80 kB JS，与 FEP-05 基线一致）、check:css PASS、check:file-size OK 全绿。
- **验证环境清理**：`-Stop` 按 `runtime.json` 记录 PID 停止本次服务，18000/5241 无残留监听。
- **验证方法说明**：runbook 更新（端口策略 / `-Stop` 边界 / AI 必须 `-Detached`）属本任务链验证基建改动，已同步 `docs/env/local-demo-runbook.md`。

## 待确认项

- 无。
