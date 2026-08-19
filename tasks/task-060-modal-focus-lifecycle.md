# task-060：弹层焦点生命周期

> Sprint-61（维护态批36）/ REQ-011 既有桌面端体验修复 / TC-P2-GOV-025。
> 状态：已完成（2026-08-19，v3.13.5）。不新增需求、API、后端逻辑、依赖或阶段范围。

## 目标

为六个会阻断背景交互的既有弹层建立一致的焦点生命周期：打开后的初始焦点、Tab / Shift+Tab 圈定，以及关闭后回到触发元素。

## 依据

- `docs/research/2026-08-19-frontend-code-evaluation.md`：FE-A11Y-2。
- `docs/research/2026-08-19-frontend-remediation-plan.md`：FEP-02。
- `docs/design/frontend-interaction.md` §2 / §3.1 / §6：REQ-011 桌面端体验。
- `docs/09-verification.md` §5.2：TC-P2-GOV-025。

## 修改范围

- 新增 `frontend/src/features/shared/useModalFocus.ts`：无依赖的焦点管理 hook。
- 接入 `CommandPalette`、`PasswordResetModal`、`ImportFeature`、`QuickEntryFeature`、`OnboardingGuide`、`UserSpacesDrawer`。
- 新增浏览器 smoke，断言各弹层的 dialog 语义、初始焦点、Tab 循环和焦点归还。
- 回写 Sprint-61 与验收记录。

## 验收标准

1. 六个对象打开后焦点进入弹层，第一个与最后一个可聚焦元素之间的 Tab / Shift+Tab 循环不逸出到背景页面。
2. 关闭后焦点回到打开该对象的触发元素；既有 Esc、遮罩点击与 busy 限制保持不变。
3. `PasswordResetModal` 与 `UserSpacesDrawer` 具备 `aria-modal="true"`；带遮罩的用户空间抽屉按模态 dialog 验收。
4. lint、build、CSS/file-size 检查和焦点浏览器 smoke 通过。

## 禁止事项

- 不改 API、后端、认证状态、导入或快速录入业务流程。
- 不引入第三方无障碍组件库。
- 不将轻量 popover、原生 `window.confirm` 或 AI 助手抽屉纳入本任务。

## 完成记录

- **2026-08-19（v3.13.5）完成**：
  - 新增 `frontend/src/features/shared/useModalFocus.ts`（无依赖焦点生命周期 hook），接入六对象；`PasswordResetModal` / `UserSpacesDrawer` 补 `aria-modal="true"`。
  - `QuickEntryFeature` 拆分 `features/quick-entry/QuickEntryResult.tsx`（结果区抽离，主文件 258 → 217 行，解 file-size ratchet）。
  - `CommandPalette` 补面板级 Esc（`.cmdk-panel` 层 Escape 关闭，补齐模态键盘语义）。
  - 验证：lint 0 / build 445.38 kB / `check:css` PASS / `check:file-size` OK；`scripts/smoke-auth-browser.mjs` 扩展焦点断言 PASS。
  - 回写：08 Sprint-61 + 09 §5.2 TC-P2-GOV-025 + CHANGELOG 双件（v3.13.5）+ handoff。
  - 验收记录：**TC-P2-GOV-025 通过**（六对象初始焦点 / Tab 圈定 / 关闭焦点归还 / aria-modal；机器断言全绿，读屏人工抽查延后）。
