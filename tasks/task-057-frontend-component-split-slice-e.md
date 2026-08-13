# task-057：前端文件膨胀拆分 Slice E——组件拆分·中风险 + baseline 收窄

> 维护态批25 / Sprint-50 / CQ-P1-008 候选 E4 收口 / GOV-015 / governance rollout §4 轨道3 P2 剩余候选。
> 状态：**已完成（2026-08-13，Slice E 组件拆分·中风险，baseline 5→2，bump v3.8.22）**。
> 依据：`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1（GOV-015）；`docs/05-tech-spec.md` §4.1（.ts/.tsx 阈值 250）；plan（`gentle-churning-narwhal.md` Slice E）。

## 背景 / 目标

Slice D（v3.8.21）后 baseline 剩 5 个超限文件（3 个 .tsx 组件 + useAppState/useDocuments 两个登记例外）。本 Slice E 拆 3 个中风险 .tsx 组件到 250 内，baseline 收窄到 2（两登记例外保留）。成功判定：3 个组件全出基线，无行为回归，baseline 5→2。

## 方案

纯位移重构 + 共享抽取（各新文件补 §4.2.5 JSDoc）：
- **WorkspaceMain 279 → 248**：抽 `app/WorkspaceMainDocuments.tsx`（documents 视图分支三元 LocalDocPreview / DocumentsFeature + 收敛子 Props）；主文件 8 视图分支 + Props 接口。
- **DocumentsFeature 485 → 234**（→ `features/documents/`）：`useSplitDragController`（split 拖拽）+ `useEditorUndoStack`（撤销栈）+ `MarkdownToolbar`（MD 工具栏）+ `DocumentEditorForm`（编辑表单，textareaRef 三方共享内聚：撤销 / AI 选区 / MD 插入）+ `DocumentPreviewPane`（预览，read / split 共用）。
- **LocalMountPane 563 → 140**（→ `features/local-mount/`）：`useLocalMountImport`（导入编排 API-029）+ `LocalMountHeader`（头 / 徽章 / 空态 / needs-auth）+ `LocalMountImportBar`（确认条 / 操作条）+ `LocalMountTreeView`（递归树，302→242）+ `LocalMountContextMenus`（Dir / File 右键菜单展示）+ `useInlineEdit`（内联编辑态）+ `LocalMountInlineInput`（输入框展示）。
- import 更新：`app/context-pane/ContextPane.tsx`（LocalMountPane → `features/local-mount/`）、`app/WorkspaceMainDocuments.tsx`（DocumentsFeature → `features/documents/`）；删 2 个旧文件。

## 验证包

- `npm run lint` 0 + `tsc` 0 + `npm run build` **350 modules**（+13 文件，无新依赖）+ CSS bundle **65.60 kB**（不变）
- `npm run check:file-size` OK（baseline 5→2）+ 负向探针（280 行临时文件 fail）
- 浏览器 smoke：`smoke-vault-local-mount-browser.mjs` OK（登录 alice → documents 视图 → `.local-mount-pane` 渲染，LocalMountHeader「▾本地挂载 未挂载 挂载 vault」+ 空态，secure / FSA / IDB true，无运行时错误）；DocumentsFeature 编辑器深度交互（textareaRef）需 PG 模式 smoke（demo 登录方式不兼容），靠 tsc / lint + 纯位移语义保证
- CI PR #162 **8 job 全绿**（backend-integration PG 48 / mypy / schema-diff / frontend-build / lint / project-check / ruff / backend-test）

## 完成记录

- **编码**：3 个超限 .tsx 组件纯位移拆分（WorkspaceMain 抽 1 文件；DocumentsFeature 拆 5 文件；LocalMountPane 拆 7 文件）；textareaRef 三方共享内聚于 DocumentEditorForm；LocalMountTreeView 二次拆（右键菜单 + 内联输入）；baseline 重生成 5→2。PR #162 squash merge main `9f5c967`（CI 8 job 全绿）。
- **验证**：lint 0 + tsc 0 + build 350 modules（+13 文件，CSS 65.60 kB 不变）+ check:file-size OK（2 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（smoke-vault-local-mount OK）。
- **收尾**：回写 + bump v3.8.22 直推 main。
- **E4 收口**：前端文件膨胀拆分 E4（Slice A-E，v3.8.18→v3.8.22）全闭环，baseline 19→2（剩 useAppState / useDocuments 两核心编排 hook 登记例外）。
