# Task 022：欢迎页首屏 / 默认落地页（Sprint-21 / REQ-011 / Phase2B Doc-First slice 3c-1）

> 本 task 是 Step 3 Slice 3c 的第一半（首屏类）：登录后默认落地从「documents 空态」改为「home 欢迎引导页」，落地 §9.5.2 默认落地页。
> 解 smoke 反馈 #1（登录后主体空）。与 task-023（视觉收口，#3）同属 Slice 3c，门禁一次（DF-C-001 slice 级）。
> 触及 REQ-011 已验收默认行为，须 TC-P1-014 回归。DF-C-001 门禁已重跑（build 绿 + WSG 静态，2026-08-01）。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3c 视觉/首屏） |
| REQ | REQ-011（默认落地页升级，**不新增 REQ**） |
| 设计 | `docs/design/frontend-interaction.md` §9.5.2（默认落地页）、§9.5.6（进入实现条件） |
| 解反馈 | smoke #1（登录后主体空） |
| 仿照 | 既有 features/*.tsx 组件风格 + 回调复用（不加新 hook） |
| 前置 | DF-C-001 门禁 baseline 过（build + WSG 静态）；build Node 22（project-rules §2.9，须 `volta run --node 22.17.1`） |
| 分支 | feat/step3-doc-first-ux（off main b558105，含 slice 3a） |

## 目标

登录后默认落地到「home」欢迎引导页：欢迎语 + 4 个功能卡片（新建文档 / 搜索 / 问答 / 快速录入）+ 一句轻指引；点卡片切到对应视图或动作。首页进入 ViewNav 首位可返回。不带数据列表（纯引导定位；smoke 嫌空再迭代）。

## 关键决策

1. **新增 `home` 视图为默认落地**：`useWorkspace` 默认 `'documents'` → `'home'`；不直接进上次文档（§9.5.2）。
2. **home 进 ViewNav 首位**（label「首页」）：保证从其他视图可返回首页；否则首页成「只进不出」。
3. **WelcomeFeature 纯引导**：欢迎语 + 4 卡片 + 轻指引，**不带数据列表**（用户决策 2026-08-01；smoke #1 要的是「有内容/引导」而非「空」，纯引导定位足够，嫌空再补最近文档）。
4. **卡片复用既有回调**：onNavigate(`setActiveView`) + onCreateDocument(`handleCreateDocument`) + onOpenQuickEntry(`quickEntry.open`)；**不加新 hook / 不加新 API**。
5. **handleSpaceChanged 落地改 `home`**：切空间后回到首页总览（一致性，原落 `documents`）。属行为变化，TC-P1-014 回归确认。
6. **不碰 paneLayout**：左目录保持 slice 3a 记忆偏好（用户决策 2026-08-01；§9.5.3「首页展开左目录」留 smoke 后定夺）。
7. **welcome.css 新文件**：workspace.css 已 256 行近 WSG-004 阈值，首页样式不塞进去，独立 welcome.css。

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `frontend/src/app/WorkspaceViewNav.tsx` | 改 | `ActiveView` 加 `'home'`；`workspaceViews` 首位加「首页」 |
| 2 | `frontend/src/app/useWorkspace.ts` | 改 | 默认 `activeView` `'documents'` → `'home'` |
| 3 | `frontend/src/features/WelcomeFeature.tsx` | 新 | 欢迎引导页：欢迎语 + 4 功能卡片 + 轻指引 |
| 4 | `frontend/src/app/WorkspaceMain.tsx` | 改 | 加 `home` 分支渲染 WelcomeFeature；接 `onNavigate`/`onCreateDocument` 透传 |
| 5 | `frontend/src/App.tsx` | 改 | 透传 `setActiveView`+`handleCreateDocument` 给 WorkspaceMain；`handleSpaceChanged` 落地 `home` |
| 6 | `frontend/src/styles/welcome.css` | 新 | 欢迎页样式（居中、卡片、轻指引） |
| 7 | `frontend/src/main.tsx` | 改 | 引入 `welcome.css` |

## 验证包

- **自动门禁**：`volta run --node 22.17.1 npm run build`（tsc + vite）绿。
- **WSG-004 静态**：App.tsx <300（251→~256）、WorkspaceMain <300（123→~140）、workspace.css 不增、welcome.css 新文件小。
- **浏览器 UI smoke（待 PG+LLM 栈）**：登录落地首页非空、4 卡片可切（新建/搜索/问答/快速录入）、首页可从 ViewNav 返回、刷新仍落地首页。
- **回归 TC-P1-014**：REQ-011 三层布局 + Context Pane 随视图变化 + 900px 不破版 + P0/P1A 不回退（home 为新增视图，不破坏既有 documents/search/query/terms/tags）。

## 禁止事项

- 不动后端 / API / DB / REQ。
- 不重构 P1B 三层骨架（只加 home 视图 + WelcomeFeature）。
- 不碰 paneLayout（slice 3a 成果）。
- 不做 task-023 视觉收口（另一 task）。
- 不做 Slice 3b（单列阅读/编辑切换）。
- 不引 router / 组件库 / 动效库 / 移动端。
- VERSION MINOR + CHANGELOG 留 release。

## 待确认

- 首页纯引导是否够「不空」：smoke 后定夺，嫌空补「最近文档 3 条」轻数据（不另起 slice）。
- handleSpaceChanged 落地改 home 的行为变化：TC-P1-014 回归确认。

## 完成记录

- [x] 门禁 baseline 重跑（build 绿 + WSG 静态，2026-08-01）
- [x] WorkspaceViewNav 加 home 视图（首位「首页」）
- [x] useWorkspace 默认 activeView → 'home'
- [x] WelcomeFeature 新建（欢迎语 + 4 功能卡片 + 轻指引）
- [x] WorkspaceMain 加 home 分支 + onNavigate/onCreateDocument props
- [x] App.tsx 透传 setActiveView/handleCreateDocument + handleSpaceChanged 落 home
- [x] welcome.css 新建 + main.tsx 引入
- [x] build 绿（tsc -b + vite，exit 0，246 modules）
- [ ] Chrome/Edge smoke + TC-P1-014 回归（待 PG+LLM 栈）
