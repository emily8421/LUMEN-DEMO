# task-056：前端文件膨胀拆分 Slice D——组件拆分

> 维护态批24 / Sprint-49 / CQ-P1-008 后续候选 E4 / governance rollout §4 轨道3 P2 剩余候选。
> 状态：**已完成（2026-08-13，Slice D 组件拆分，bump v3.8.21）**。
> 依据：`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.1（.ts/.tsx 阈值 250）；plan（`adaptive-humming-kettle.md` Slice D）+ 组件 explore 结论（FolderTree/TermCategoryTree 共享内联编辑器与菜单关闭 useEffect，泛化递归树不做）。

## 背景 / 目标

Slice C（v3.8.20）后 baseline 剩 11 个超限文件（9 个 .tsx 组件 + useAppState/useDocuments 两个登记例外）。本 Slice D 拆 6 个低风险 .tsx 组件到 250 内。成功判定：6 个组件全出基线，共享 `app/tree/` 抽取消除重复且不引入行为回归，baseline 收窄到 5。

## 方案

纯位移重构 + 共享抽取（各新文件补 §4.2.5 JSDoc）：
- **FolderTree 569 → `app/folder-tree/` + 共享 `app/tree/`**：FolderTree ≈160（主组件 + props + TreeMenuState 导出）+ FolderNode ≈190 + DocumentRow ≈140；共享 `TreeInlineEditor` ≈90（FolderInlineEditor 与 CategoryInlineEditor 100% 重复）+ `useTreeMenuDismiss` ≈28（FolderNode/DocumentRow/CategoryNode 三处逐字相同菜单关闭 useEffect）。
- **TermCategoryTree 405 → `app/term-category-tree/`**：TermCategoryTree ≈160（主组件 + TermRow + 类型导出）+ CategoryNode ≈165；复用共享 tree/。**不做**泛化递归树。
- **TopBar 274 → `app/topbar/`**：TopBar ≈120（品牌块 + 空间选择 + 快速录入 + 装配）+ HelpPopover ≈80（help state 内聚自持，HELP_ENTRIES 随搬）+ UserMenu ≈45（自持 userMenuOpen）+ PaneToggles ≈35。
- **ContextPane 366 → `app/context-pane/`**：ContextPane ≈150（文档域派生逻辑 + 装配）+ FolderTreeHeader ≈95（处理器回调传入）+ TermsContextPane ≈95 + ContextInfoList ≈40（搜索/问答 info-list DRY）。
- **ImportFeature 335**（主文件留在 `features/`）：`features/import-files.ts` ≈125（FileSystemEntryLike/filterImportable/collectDroppedFiles/normalizeImportPath 随搬 + fileListToSelections 新 helper 消除两处重复映射）+ `features/import/ImportDropZone` ≈45 + `ImportResultsList` ≈40（renderImportResults 转组件）+ 主文件 ≈150。
- **DocumentInspectorFeature 266 → `features/document-inspector/`**：主文件 ≈130（tab 状态 + AI tab + 装配）+ InspectorVersionsTab ≈50（markdownExcerpt 随搬）+ InspectorLinksTab ≈45 + InspectorTagsTab ≈90（newTagName state 随迁）。
- import 更新：`App.tsx`（→`app/topbar/TopBar`）、`app/WorkspaceShell.tsx`（ContextPane→`app/context-pane/`）、`features/DocumentsFeature.tsx`（→`./document-inspector/`）；删 5 个旧文件。

## 验证包

- `npm run lint` 0 + `tsc` 0 + `npm run build` **337 modules**（+17 文件，无新依赖）+ CSS bundle **65.60 kB**（不变）
- `npm run check:file-size` OK（baseline 11→5）+ 负向探针（280 行临时文件 fail）
- 浏览器 smoke：真实登录 alice（PG 凭证）→ 工作区渲染全部拆分组件 + 文件夹右键菜单（FolderNode）/ 内联编辑器（TreeInlineEditor）/ Esc 关闭 / 折叠 + 文档行右键菜单（DocumentRow）/ 文档侧栏四 tab（DocumentInspectorFeature），无运行时 / JS 错误
- CI PR #161 待跑（8 job）

## 完成记录

- **编码**：6 个超限 .tsx 组件全拆 + 共享 `app/tree/` 抽取（TreeInlineEditor / useTreeMenuDismiss，消除 ~170 行重复）；`App.tsx`/`WorkspaceShell.tsx`/`DocumentsFeature.tsx` import 更新；删 `app/FolderTree.tsx`/`app/TermCategoryTree.tsx`/`app/TopBar.tsx`/`app/ContextPane.tsx`/`features/DocumentInspectorFeature.tsx`；baseline 重生成 11→5。
- **验证**：lint 0 + tsc 0 + build **337 modules**（+17 文件，CSS 65.60 kB 不变）+ check:file-size OK（5 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（`.tmp/sliceD-workspace-smoke.mjs`：真实登录 alice → 工作区渲染全部拆分组件 + 文件夹右键菜单/内联编辑器/Esc 关闭/折叠 + 文档行菜单 + 侧栏四 tab，无运行时/JS 错误）。
- **收尾**：PR #161 squash merge main `8ea9031`（CI 8 job 全绿）；回写 + bump v3.8.21 直推 main。
- **残留候选**：Slice E（组件拆分·中风险 + baseline 清空：LocalMountPane 563 / DocumentsFeature 485 / WorkspaceMain 279 + useAppState 339 / useDocuments 286 登记例外）见 plan。

## 后续候选（不在本次范围）

- Slice E：组件拆分中风险（LocalMountPane / DocumentsFeature / WorkspaceMain）+ baseline 清空（useAppState/useDocuments 两登记例外另议）
