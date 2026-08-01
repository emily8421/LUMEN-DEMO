# Task 024：documents 空态引导（A 方案）（Sprint-21 / REQ-011 / Phase2B Doc-First slice 3c 收尾）

> smoke 反馈（2026-08-01）：documents 视图无选中文档时中间空表单，左目录收起后无从选中 → 显得空（smoke #1 的 documents 视图版本）。
> 用户决策 A 方案：无选中时中间渲染引导卡（提示 + [展开左目录][新建文档] 按钮）替代空表单。不碰 paneLayout（Q3 决策保持 3a 记忆）。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3c 收尾） |
| REQ | REQ-011（documents 空态 UX，不新增 REQ） |
| 设计 | docs/design/frontend-interaction.md §9.5.7 F-impl-10 |
| 分支 | feat/step3-doc-first-ux |

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `features/DocumentEmptyState.tsx` | 新 | 空态引导卡（提示 + [展开左目录]/[新建文档] 按钮） |
| 2 | `features/DocumentsFeature.tsx` | 改 | editor-panel 内三元：无选中 + 非新建 → DocumentEmptyState 替代 editor-form；接 onExpandLeftPane prop |
| 3 | `app/WorkspaceMain.tsx` | 改 | 透传 onExpandLeftPane 给 DocumentsFeature |
| 4 | `App.tsx` | 改 | 传 onExpandLeftPane={() => paneLayout.setLeftPaneOpen(true)}（强制展开不误触收起） |
| 5 | `styles/workspace.css` | 改 | `.document-empty-state` 空态样式 |

## 关键决策

1. **落点在 editor-panel 内三元**（非 document-view-grid 层）：右栏（inspector）默认收起不可见，空态时引导卡占满中间，无需包裹整个 grid。
2. **展开左目录用 setLeftPaneOpen(true)**（非 toggle）：强制展开，避免已展开时误触收起。
3. **DocumentsFeature 312 行超 WSG-004 阈值**：A 方案 +空态 +onExpandLeftPane 后超 300；软阈值 build 不失败，F-impl-4 加重，slice 3b 拆 inspector（versions-panel）时降。

## 完成记录

- [x] DocumentEmptyState 新建 + DocumentsFeature editor-panel 三元
- [x] onExpandLeftPane prop 链（DocumentsFeature ← WorkspaceMain ← App.setLeftPaneOpen(true)）
- [x] 空态样式（.document-empty-state）
- [x] build 绿（exit 0，247 modules）
- [x] WSG：workspace.css 294 < 300；DocumentsFeature 312 超 300（F-impl-4，3b 拆）
- [ ] Chrome/Edge smoke（待 PG+LLM 栈）：documents 无选中显示引导卡 + [展开左目录]/[新建文档] 可用
