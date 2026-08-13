# task-055：前端文件膨胀拆分 Slice C——CSS 拆分

> 维护态批23 / Sprint-48 / CQ-P1-008 后续候选 E4 / governance rollout §4 轨道3 P2 剩余候选。
> 状态：**已完成（2026-08-13，Slice C CSS 拆分，bump v3.8.20）**。
> 依据：`docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3 / §8.1；`docs/05-tech-spec.md` §4.1（CSS 阈值 300）；plan（`adaptive-humming-kettle.md` Slice C）。

## 背景 / 目标

Slice B（v3.8.19）后 baseline 剩 15 个超限文件。本 Slice C 拆 4 个超限 CSS（阈值 300）：`workspace` 722 / `local-mount` 589 / `layout` 458 / `onboarding` 317。成功判定：CSS 全降到 300 内，baseline 收窄，CSS bundle 大小与拆分前一致（内容无丢失）。

## 方案

按 CSS 区块独立拆分（新文件在 `main.tsx` **原位**引入，保持在 `responsive.css` 之前；CSS 全量顺序引入，import 顺序即层叠顺序）：
- **workspace 722 → tree.css(189) + editor.css(259) + workspace.css(281)**（L113-298 文件夹树 → tree；L467-722 编辑面板 → editor）
- **local-mount 589 → local-mount-pane.css(156) + local-mount-tree.css(236) + local-doc-preview.css(127) + local-mount-menu.css(75)**（⚠ `.local-mount-pane button` 同特异性顺序约束，pane 壳在前）
- **layout 458 → topbar.css(279) + workspace-layout.css(184)**（L1-276 顶栏/用户菜单/帮助；L278-458 布局/折叠/resizer/view-nav/context-pane）
- **onboarding 317 → onboarding.css(167) + welcome.css 吸收 checklist(230)**（L125-273 welcome-checklist 并入既有 welcome.css，已验证无类冲突）
- 跨文件层叠约束：`tokens→base→topbar→workspace/tree/editor→document-mode→…→terms（依赖 .tree-*）→responsive`；editor.css 先于 document-mode.css、tree.css 先于 terms.css

## 验证包

- `npm run build` **320 modules** + CSS bundle 大小与拆分前一致（65.60 kB）+ `npm run check:file-size` OK（baseline 15→11）
- 负向探针：280 行临时文件 fail；删除后 OK
- 浏览器 smoke：demo + headless Edge 渲染登录页正常（login-panel / app-shell / 忘记密码等类齐全）
- CI PR #160 待跑（8 job）

## 完成记录

- **编码**：4 个超限 CSS 全拆（workspace 3 拆 / local-mount 4 拆 / layout 2 拆 / onboarding 2 拆），全部 <300；`main.tsx` import 原位重排（层叠约束保持）；删除原 layout.css / local-mount.css。
- **验证**：build 320 modules + CSS bundle 65.60 kB（= 拆分前，内容无丢失）+ check:file-size OK（11 基线）+ 负向探针（280 行 fail）+ 浏览器 smoke（headless Edge 登录页渲染正常）。
- **收尾**：PR #160 squash merge main `071a73b`（CI 8 job 全绿）；回写 + bump v3.8.20 直推 main。
- **残留候选**：Slice D（组件低风险）/ E（组件中风险 + baseline 清空）见 plan。

## 后续候选（不在本次范围）

- Slice D：组件拆分低风险（FolderTree 569 / TermCategoryTree 405 / TopBar 274 / ContextPane 366 / ImportFeature 335 / DocumentInspectorFeature 266）
- Slice E：组件拆分中风险（LocalMountPane 563 / DocumentsFeature 485 / WorkspaceMain 279）+ baseline 清空
