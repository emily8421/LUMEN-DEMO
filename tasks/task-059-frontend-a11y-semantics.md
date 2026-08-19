# task-059：前端无障碍语义

> Sprint-61（维护态批36）/ REQ-011 既有桌面端体验修复 / TC-P2-GOV-024。
> 状态：编码 + 自动验证完成，读屏人工抽查延后（2026-08-19）。不新增需求、API、后端逻辑、依赖或阶段范围。

## 目标

修复状态信息对辅助技术不可见、登录/注册 tabs 语义不完整两个已确认问题，并避免同一次失败被读屏重复播报。

## 依据

- `docs/research/2026-08-19-frontend-code-evaluation.md`：P2 / P3、FE-A11Y-1。
- `docs/research/2026-08-19-frontend-remediation-plan.md`：FEP-01（复评修订后口径）。
- `docs/design/frontend-interaction.md` §2 / §3.1 / §6：登录页与 REQ-011 桌面端体验。
- `docs/09-verification.md` §5.2：TC-P2-GOV-024。

## 修改范围

- `frontend/src/components/StatusBar.tsx`：普通状态使用 polite live region，错误使用 assertive alert；error 存在时 notice 不进入 live region。
- `frontend/src/features/auth/AuthShell.tsx`：实现完整 tabs / tabpanels、roving tabindex 与方向键 / Home / End 切换。
- `frontend/src/styles/auth.css`：保证 `.login-panel form[hidden]` 不被既有表单布局规则覆盖。
- `scripts/smoke-auth-browser.mjs`：扩展 DOM 与键盘断言，保留原有认证主流程。

## 验收标准

1. notice 与 error 更新可被辅助技术播报；同一失败仅播报 error，不重复播报通用 notice。
2. 登录 / 注册 tab 使用 `role="tab"`、`aria-selected`、`aria-controls`，对应 panel 使用 `role="tabpanel"` 与 `aria-labelledby`；两个 panel 常驻 DOM，非选中项 `hidden` 且不进入 Tab 序。
3. `ArrowLeft` / `ArrowRight` 循环切换并聚焦激活 tab，`Home` / `End` 分别跳至首个 / 最后一个 tab。
4. lint、build、CSS 检查和认证浏览器 smoke 通过；NVDA 或 Windows 讲述人完成一次登录成功 / 失败抽查。

## 禁止事项

- 不修改登录、注册、密码重置 API、认证状态模型或业务文案。
- 不引入第三方无障碍组件库，不触及 FEP-02 弹层焦点生命周期、FEP-03 ErrorBoundary 或 FEP-05 刷新竞态。

## 完成记录

- **实现（2026-08-19）**：`StatusBar.tsx` notice 挂 `role="status"` + `aria-live={error ? 'off' : 'polite'}`，error 挂 `role="alert"`（error 存在时 notice 退出 live region，避免双播报）；`AuthShell.tsx` 双 form 常驻 DOM（`role="tabpanel"` + `aria-labelledby` + `hidden`）、tabs 补 `role` / `aria-selected` / `aria-controls` / roving tabindex（`tabIndex` 0/-1）、`ArrowLeft`/`ArrowRight`/`Home`/`End` 键盘切换且焦点随激活 tab；`auth.css` 补 `.login-panel form[hidden] { display: none }`（防 `display:grid` 覆盖 UA 隐藏，未用 `!important`）。
- **自动验证（2026-08-19）**：ESLint 0/0；build 443.49 kB / 1.24s；`check:css` PASS；`check:file-size` PASS；`smoke-auth-browser.mjs` 扩展断言连跑 2 次 PASS。证据见 `docs/09-verification.md` §5.2。
- **插曲与教训**：smoke 键盘断言初版同步连发合成事件读到期前状态（"End key mismatch"），根因为 React setState 异步批处理——测试须逐键等渲染帧再采样；已在脚本内注释说明。独立 CDP 会话验证组件行为正确，未改组件。
- **人工读屏抽查**：用户裁决延后（2026-08-19），待补做后回填 09 §5.2；任务在抽查完成前保持「进行中」口径，不宣称完全验收。
