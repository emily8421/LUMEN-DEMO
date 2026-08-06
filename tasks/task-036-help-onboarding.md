# task-036-help-onboarding（Sprint-25 帮助手册 L0+L1）

## 目标
帮助体系首版（Sprint-25，REQ-011 可用性收口，不新增 REQ）：
- **L0**：`docs/env/user-guide.md` 按任务导向重组，作为应用内帮助唯一内容源。
- **L1**：登录后首次引导 3 步（新建文档 → 保存后去搜索 → 去问答提问，可跳过）+ 欢迎页新手清单 + 「示例文档未建索引」提示 + 各视图空状态引导 + 顶栏帮助速查（分类速查 + 轻量过滤 + 完整手册链接）。
设计见 `docs/design/help-onboarding.md`（Flow-H-001 / §3 空状态映射 / §6 L0+L1）。

## 输入文档
- docs/design/help-onboarding.md（Flow-H-001 / §3 空状态映射 / §6 L0+L1）
- docs/08-dev-plan.md Sprint-25；docs/09-verification.md TC-P2-HELP-001
- docs/env/user-guide.md（重组对象）；frontend-interaction.md §9.5（Doc-First 基线）

## 修改范围
- docs/env/user-guide.md（L0 重组）
- frontend：新增 `app/onboarding-store.ts`、`features/OnboardingGuide.tsx`、`styles/onboarding.css`；修改 `features/WelcomeFeature.tsx`、`features/SearchFeature.tsx`、`features/QueryFeature.tsx`、`features/TagsFeature.tsx`、`features/TimelineFeature.tsx`、`app/TopBar.tsx`、`app/WorkspaceMain.tsx`、`app/App.tsx`、`main.tsx`
- 新增 `scripts/smoke-help-onboarding-browser.mjs`（浏览器自动化 smoke）
- 回写：docs/08、docs/09、docs/design/help-onboarding.md、docs/design/00-index.md

## 验收标准
- TC-P2-HELP-001：新用户路径（登录 → 首次引导 3 步 → 各视图空状态有下一步 → 首页提示「示例文档未建索引」）；帮助可检索到「导入」；内容源单一来源核对
- `volta run --node 22.17.1 npm run build` 绿；`node scripts/smoke-help-onboarding-browser.mjs` 通过；既有 TC-P1-014 回归不破

## 禁止事项
- 不引第三方 help / onboarding 库；不改后端 / API / 权限；不一次性实现 L2-L4（留后续）

## 完成记录（2026-08-06）
- 已实现 L0+L1 并通过自动化验证（build 273 modules + `scripts/smoke-help-onboarding-browser.mjs` 浏览器 smoke 通过）；人工浏览器 smoke 待用户确认后补记。
- 编号注记：multi-mount 候选任务单原拟 task-036，因本任务占用顺延为 task-037（记录在案，见 handoff）。