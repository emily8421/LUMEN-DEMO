# Task 025：导入入口弹窗化（Sprint-21 / REQ-037 / Phase2B Doc-First slice 3d）

> Doc-First §9.5.1 少容器原则：ContextPane 常驻导入区（导航 + 文档上下文 + 导入入口三角色）抢屏，导入是低频操作。
> 方向依据：docs/design/frontend-workspace-redesign.md §L90「导入入口不再常驻全局侧栏，建议放文档视图 toolbar 的『导入』次级按钮」。
> 用户 2026-08-01 决策：容器 = 居中弹窗 modal + 遮罩；触发 = DocumentsFeature toolbar「导入」按钮。
> 详细设计：docs/design/frontend-interaction.md §9.5.8（F-impl-11）。
> 触及 Phase1.5A 已验收导入路径（REQ-037 / TC-P1-015 / PATH-P15A-001），改入口形态、不改导入能力。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3d） |
| REQ | REQ-037（批量导入入口形态，不新增 REQ / API / DB / TC） |
| 设计 | docs/design/frontend-interaction.md §9.5.8（F-impl-11） |
| 分支 | main（本地未提交改动） |
| 前置 | slice 3a/3c smoke + TC-P1-014 回归闭环（PR #97 合并）后再编码 |

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `features/ImportFeature.tsx` | 新 | 导入弹窗 modal（遮罩 + 移植现有 import-panel 表单：drop-zone + 文件夹选择 + 权限 + 文件列表 + 「批量导入」按钮 + 结果摘要/逐条）；ESC / 点遮罩关闭 |
| 2 | `features/DocumentsFeature.tsx` | 改 | workspace-toolbar 加「导入」次级按钮（onOpenImport 触发 ImportFeature）；接 open / onClose props |
| 3 | `app/ContextPane.tsx` | 改 | 移除 import-panel section + 导入相关 props（importDraft / onImportDraftChange / importFiles / onImportFilesChange / importInputKey / lastImportSummary / lastImportItems / onImport）+ 仅导入使用的 helper（selectFiles / handleDrop / selectedFileLabel） |
| 4 | `app/WorkspaceMain.tsx` / `App.tsx` | 改 | 导入 state/hook（useImport）从 ContextPane props 链改接到 ImportFeature；onImported 跨域回调语义不变；导入 modal open state |
| 5 | `styles/workspace.css` | 改 | `.import-modal` / 遮罩 / 弹窗内表单样式（沿用既有 compact-form / drop-zone 视觉，去 context-footer 约束） |

## 关键决策

1. **modal 而非抽屉**（用户决策）：居中弹窗 + 遮罩聚焦导入；放弃右侧抽屉。
2. **toolbar 触发而非 ContextPane / TopBar**（用户决策）：导入是文档操作，入口在文档工具栏语义自然；ContextPane 3a 后默认收起，入口不宜放深处。
3. **复用 useImport + api/imports，不改导入契约**：API-029 / `importBatchDocuments` / 后端 `service/imports` 一律不动；只换承载 UI 容器（常驻 section → modal）。
4. **ContextPane 减负**：移除导入区后 ContextPane 回归「导航 + 文档上下文」两角色，贴合 §9.5.1。
5. **导入 state 归属**：useImport 留 App 层（runAction / setNotice / onImported 跨域），ImportFeature 经 props 接表单 state；编码时按最小 props 透传定。

## 验证包

- build：`cd frontend && volta run --node 22.17.1 npm run build`（绿；Node 锁定见 project-rules §2.9）。
- **DF-C-001 门禁**：编码前重跑 Sprint-11 UI/WSG（Page-ID / Flow-ID / TC / WSG 范围确认）。
- **TC-P1-015 回归**：modal 内拖拽 / 文件夹选择 / 权限 / 逐条结果 / 同名跳过 全部可用（导入能力不变）。
- **TC-P1-014 回归**：ContextPane 结构变更后栏显隐（3a）行为不受影响。
- Chrome/Edge smoke：导入按钮触发 modal、导入流程、关闭交互、导入后文档列表刷新。

## 禁止事项

- 不改导入 API 契约（API-029）/ useImport 逻辑 / 后端 service/imports / DB。
- 不新增 REQ / API / DB / TC（TC-P1-015 是回归，非新增）。
- 不重构 P1B 三层骨架（导入从 section 抽成 modal 是组件抽取）。
- 不引新依赖（modal 用原生 div + CSS，不引组件库）。

## 待确认（编码前，已按设计推荐默认执行）

见 docs/design/frontend-interaction.md §9.5.8 F-impl-11-C1..C3：导入成功是否自动关闭（C1）、导入中是否禁用关闭（C2）、与 slice 3b 拆 inspector 顺序（C3）。

- C1：已按推荐实现为导入成功后自动关闭 modal，完成摘要继续走全局 notice / lastImportSummary。
- C2：已按推荐实现为导入中禁用关闭按钮、ESC 与遮罩关闭。
- C3：已按推荐先做 3d；DocumentsFeature 行数仍超 WSG-004，拆 inspector 留给 3b 前置。

## 完成记录

- [x] ImportFeature modal 新建
- [x] DocumentsFeature toolbar「导入」按钮
- [x] ContextPane 移除 import-panel + 导入 props
- [x] App / WorkspaceMain 导入 state 接线调整
- [x] workspace.css modal 样式
- [x] build 绿（2026-08-01：`volta run --node 22.17.1 npm run build`，248 modules）
- [x] DF-C-001 门禁 + TC-P1-015 / TC-P1-014 回归 + Chrome/Edge smoke（2026-08-01：用户确认 smoke 通过；08/09 已回写）
