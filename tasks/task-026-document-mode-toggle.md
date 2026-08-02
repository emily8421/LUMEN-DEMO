# Task 026：文档阅读 / 编辑单列切换（Sprint-21 / REQ-011 / Phase2B Doc-First slice 3b）

> 设计依据：`docs/design/frontend-interaction.md` §9.5.4。用户 2026-07-31 确认：文档工作区从默认“编辑 + 预览并排两列”改为单列为主；右上角切换“阅读 / 编辑”，并排仅作为宽屏可选手动模式。
> 前置：F-impl-4 要先拆 `DocumentsFeature` inspector，避免在超 WSG-004 行数状态下继续堆 UI。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3b） |
| REQ | REQ-011（P1B 工作台体验收口，不新增 REQ / API / DB / TC） |
| 设计 | `docs/design/frontend-interaction.md` §9.5.4 |
| 分支 | `feat-slice-3d-import-modal`（接在 Slice 3d 本地提交后继续） |
| 前置 | Slice 3d 已本地提交 `c4cf867`；3b 启动前先拆 inspector |

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `features/DocumentInspectorFeature.tsx` | 新 | 从 `DocumentsFeature` 抽出版本历史 / 反向链接 / 标签 / AI 润色侧栏 |
| 2 | `features/DocumentsFeature.tsx` | 改 | 增加阅读 / 编辑 / 并排模式；默认阅读单列，新建默认编辑；接入抽出的 inspector |
| 3 | `styles/workspace.css` | 改 | 增加模式切换 segmented controls、单列编辑与阅读态样式 |
| 4 | `app/TopBar.tsx` / `App.tsx` | 改 | smoke 反馈收口：快速录入入口移到顶栏右侧，用户入口改为右上角头像 |
| 5 | `app/WorkspaceMain.tsx` | 改 | 移除全局快速录入独占行，保留首页快速录入入口透传 |
| 6 | `styles/{layout,quick-entry,responsive,document-inspector}.css` | 改/新 | 顶栏操作组、头像弹出层、右侧栏 tab 与响应式收口 |

## 验证包

- build：`cd frontend && volta run --node 22.17.1 npm run build`。
- WSG-004：`DocumentsFeature.tsx` 行数下降，3b 不继续堆单文件。
- TC-P1-014 回归：文档默认阅读、编辑单列、并排手动开启、栏显隐、900px 不破版。
- REQ-014 回归：编辑态 textarea selection 仍可触发 AI 润色；阅读态不引入 Live Preview。
- UX smoke 反馈回归：右上角用户头像、顶栏快速录入、右侧栏 tab 化。

## 禁止事项

- 不引入富文本 / Live Preview 编辑器依赖。
- 不改后端 / API / DB。
- 不改 AI 润色 `useTextareaSelection` 机制。
- 不把并排作为默认。

## 完成记录

- [x] DocumentInspectorFeature 抽出
- [x] 阅读 / 编辑 / 并排模式切换
- [x] 默认阅读单列；新建默认编辑
- [x] smoke 反馈：用户入口改为顶栏右上角头像 + 轻量弹出信息
- [x] smoke 反馈：快速录入从 `workspace-action-bar` 移到顶栏右侧，移除主区空白行
- [x] smoke 反馈：右侧栏改为 `版本 / 链接 / 标签 / AI` tab，仅展示当前面板
- [x] CSS 拆分：`document-mode.css` / `import-modal.css` / `document-inspector.css`，`workspace.css` 293 行
- [x] build 绿（2026-08-01：`cd frontend && volta run --node 22.17.1 npm run build`，252 modules）
- [x] `git diff --check` 通过（仅 CRLF warning）
- [x] 本地页面可访问：`http://127.0.0.1:5173` 返回 HTTP 200
- [ ] Playwright 自动化 smoke：本地未安装 `playwright`，未临时新增依赖
- [ ] TC-P1-014 / REQ-014 smoke 回归
