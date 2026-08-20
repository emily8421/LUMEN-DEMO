# task-061：根 ErrorBoundary

> Sprint-62（维护态批37）/ REQ-011 既有桌面端体验稳健性修复 / TC-P2-GOV-026。
> 状态：已完成（2026-08-20，实现 + 全部本地验证通过，待用户确认提交方式）。不新增需求、API、后端逻辑、依赖、测试框架或阶段范围。

## 目标

当 React 子树发生渲染或生命周期异常时，避免整页白屏：向用户展示不含内部细节的页面级恢复界面，并在浏览器控制台保留原始错误，供本地排查。

## 依据

- `docs/research/2026-08-19-frontend-remediation-plan.md` §5：FEP-03。
- `docs/design/frontend-interaction.md` §4：状态、空态与错误态。
- `docs/08-dev-plan.md`：Sprint-62。
- `docs/09-verification.md` §5.3：TC-P2-GOV-026。

## 修改范围

- 新增 `frontend/src/components/ErrorBoundary.tsx`：无依赖 React 类组件，使用 `getDerivedStateFromError` 进入恢复态，以 `componentDidCatch` 记录 `console.error`。
- `frontend/src/main.tsx`：在既有 `React.StrictMode` 内，以 ErrorBoundary 包裹 `App` 根子树。
- 新增 `frontend/src/styles/error-boundary.css`：复用现有设计令牌，提供页面级恢复布局、文本层级和焦点可见的恢复按钮。
- 回写 `docs/08-dev-plan.md`、`docs/09-verification.md` 和 `docs/design/frontend-interaction.md`。

## 验收标准

1. 本地临时受控子树异常会进入包含“重新加载”按钮的恢复 UI；用户不可见异常消息、堆栈或 component stack。
2. 点击或键盘激活“重新加载”会调用 `window.location.reload()`；按钮复用全局焦点和主题令牌。
3. `componentDidCatch` 通过 `console.error` 记录原始 `Error` 与 React component stack；正常路径不额外输出错误。
4. 移除本地临时受控 `throw` 后，登录与工作区正常渲染；lint、build、CSS / file-size 检查和既有认证浏览器 smoke 通过。

## 禁止事项

- 不添加运行时或开发依赖，不新增 Vitest、路由或错误上报服务。
- 不改 API、后端、认证状态、业务错误文案、持久化数据或其他 FEP Backlog 项。
- 不把 ErrorBoundary 表述为可捕获事件处理、异步回调或 React 根节点初始化异常。
- 本地受控 `throw` 仅用于验证，验证后必须移除，不得提交测试开关。

## 完成记录

- **实现（2026-08-19）**：`components/ErrorBoundary.tsx`（`getDerivedStateFromError` 进恢复态、`componentDidCatch` 记 `console.error`、`role="alert"` + `aria-live="assertive"` 恢复 UI）+ `styles/error-boundary.css`（全令牌化）+ `main.tsx` 在 `React.StrictMode` 内包裹 `App`。零依赖、零 API / 后端改动。
- **验证（2026-08-20，全链本地环境：lumen-pg + 后端 :18000 + Vite localhost:5173）**：
  - 受控异常浏览器验证（CDP 真实 Chrome，URL 参数门控临时 throw，验证后已还原）：9/9 断言 PASS——恢复 UI 渲染 / 无堆栈泄露 / alert 语义 / console 留痕（boundary 日志 + 原始错误）/ reload 按钮真实导航 / 正常路径登录页渲染无恢复 UI。
  - 既有认证浏览器 smoke：`scripts/smoke-auth-browser.mjs` `result: PASS`（含 API 子集断言；`--debug-port` 避开本机 9226 被外部进程占用）。
  - `lint`（0/0）、`build`（446.05 kB）、`check:css`、`check:file-size` 全绿。
- **验收**：TC-P2-GOV-026 通过，详见 `docs/09-verification.md` §5.3。边界重申：不覆盖事件处理、异步回调或 React 根节点初始化异常。
- **环境插曲（非本任务缺陷）**：上轮会话宿主环境 `Path`/`PATH` 重复键导致 `Start-Process` 抛 `ArgumentException`，浏览器验证被阻断；本会话环境已修复后完成验证。默认 debug 端口 9226 被本机外部进程（marscode ckg_server）占用，smoke 以 `--debug-port` 换端口运行。
