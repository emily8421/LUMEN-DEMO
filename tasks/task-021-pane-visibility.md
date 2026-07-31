# Task 021：侧栏可隐藏 + 默认收起 + 三路唤出 + 记忆（Sprint-21 / REQ-011 / Phase2B Doc-First slice 3a）

> 本 task 是 Step 3 Slice 3a（布局类）：把 P1B 工作台侧栏从「纯 CSS 媒体查询显隐」升级为「JS state 驱动 + CSS class + localStorage 记忆」，落地 §9.5 Doc-First 基线。
> 触及 REQ-011 已验收默认行为，须 TC-P1-014 回归。DF-C-001 门禁已按 §9.5 基线重确认（每 slice 重跑口径）。

## 元信息

| 项 | 内容 |
|---|---|
| Sprint | Sprint-21（Phase2B Doc-First UX，slice 3a 布局） |
| REQ | REQ-011（P1B 工作台默认行为升级，**不新增 REQ**） |
| 设计 | `docs/design/frontend-interaction.md` §9.5（Doc-First 候选基线）、§9.5.6 进入实现条件 |
| 原型 | `docs/research/prototypes/2026-07-31-obsidian-inspired-*.html`（用户已认可风格） |
| 仿照 | `app/session-store.ts`（localStorage 模式，用于记忆偏好） |
| 前置 | DF-C-001 门禁过；build Node 22（project-rules §2.9，须 `volta run --node 22.17.1`） |
| 分支 | feat/step3-doc-first-ux（off main b558105） |

## 目标

文档工作台左目录（Context Pane）+ 右栏（Inspector）可隐藏、宽屏默认收起、三路唤出（顶栏图标 + Ctrl+B/Ctrl+R + 边沿热区）、偏好 localStorage 记忆（刷新持久）。不重构 P1B 三层骨架，只加可隐藏能力。

## 关键决策

1. **栏 state 独立 hook**（`usePaneLayout`）：左/右栏可见性 + 快捷键监听；不并入 useWorkspace（语义不同 + 避免膨胀）。
2. **记忆独立 store**（`pane-layout-store`）：仿 session-store，localStorage 存布尔偏好，可测、不臆胀 hook。
3. **默认收起**：宽屏也默认 collapsed（区别 P1B 仅窄屏折叠）；用户展开后记忆，刷新保留。
4. **CSS class 驱动**：`workspace-layout` 加 `pane-left-collapsed` / `pane-right-collapsed`；媒体查询降级为窄屏（<899px）强制收起兜底。
5. **唤出图标放顶栏**（TopBar）：常驻、醒目、空间够；不放 Nav Rail（已满）。
6. **快捷键输入框聚焦时禁用**：Ctrl+B/Ctrl+R 在 input/textarea 聚焦时不触发，防误触。
7. **先左后右**：左目录（workspace-layout 层，App.tsx 控制）先做；右栏 Inspector（DocumentsFeature 内）读完结构再接。
8. **不动骨架/后端/API/REQ**：只在 Context Pane / Inspector 上加可隐藏能力（§9.5.6）。

## 修改范围

| # | 文件 | 类型 | 做什么 |
|---|---|---|---|
| 1 | `frontend/src/app/usePaneLayout.ts` | 新 | 左/右栏可见性 state + Ctrl+B/R 监听（input 聚焦禁用）+ 默认收起 + 记忆读写 |
| 2 | `frontend/src/app/pane-layout-store.ts` | 新 | localStorage 存取栏偏好（仿 session-store） |
| 3 | `frontend/src/App.tsx` | 改 | 接入 usePaneLayout；workspace-layout 加 collapsed class；TopBar 传唤出回调 |
| 4 | `frontend/src/app/TopBar.tsx` | 改 | 加左/右栏唤出图标按钮 |
| 5 | `frontend/src/features/DocumentsFeature.tsx` | 改 | Inspector 右栏接可见性（编码起手先读其结构） |
| 6 | `frontend/src/styles/workspace.css`（+responsive） | 改 | class 驱动栏显隐 + 默认收起 + 边沿热区 + 窄屏兜底 |

## 验证包

- **自动门禁**：`volta run --node 22.17.1 npm run build`（tsc + vite）绿。
- **浏览器 UI smoke**：默认收起态、顶栏图标唤出、Ctrl+B/R、边沿热区、刷新后记忆持久；窄屏（<899px）强制收起。
- **回归 TC-P1-014**：REQ-011 三层布局 + Context Pane 随视图变化 + 900px 不破版 + P0/P1A 不回退。
- WSG-004：App.tsx 244→~258（< 300）；新逻辑在独立 hook/store。

## 禁止事项

- 不动后端 / API / DB / REQ。
- 不重构 P1B 三层骨架（只加可隐藏）。
- 不引 router / 组件库 / 动效库 / 移动端。
- 不做 Slice 3b（单列阅读/编辑切换）。
- VERSION MINOR + CHANGELOG 留 release。

## 待确认

- 右栏 Inspector 在 DocumentsFeature 内的具体结构（编码起手读，确认接可见性的落点）。
- DF-C-002（Live Preview）：远期，不影响本 slice。

## 完成记录

- [x] usePaneLayout + pane-layout-store（左右栏 state + Ctrl+B/R + localStorage 记忆）
- [x] App.tsx 接入 + workspace-layout pane-left-collapsed class
- [x] TopBar 唤出图标（左目录 ☰ + 右栏 ☰，title/aria/active 区分）
- [x] DocumentsFeature Inspector 接可见性（document-view-grid pane-right-collapsed）
- [x] layout.css + workspace.css class 驱动栏显隐 + 默认收起 + 窄屏兜底
- [x] build 绿（tsc -b + vite，exit 0，244 modules）
- [ ] 边沿热区唤出（未做，见偏差 F-impl-2）
- [ ] Chrome/Edge smoke + TC-P1-014 回归（待 PG+LLM 栈）

### 验证结果（2026-07-31）

- `volta run --node 22.17.1 npm run build`（tsc -b + vite build）→ **exit 0**，244 modules，1.18s。类型检查 + 构建均通过。
- WSG-004 行数：App.tsx 251 / TopBar 75 / WorkspaceMain 123 / DocumentsFeature **300（踩阈值）** / usePaneLayout 98 / pane-layout-store 38（新文件均小；App.tsx < 300）。
- **浏览器 smoke + TC-P1-014 回归待跑**：需 PG+LLM 运行栈（本会话 Docker/PG 已停）。启动栈后补：默认收起态、顶栏图标唤出、Ctrl+B、Ctrl+R、刷新记忆持久、窄屏（<899px）兜底、TC-P1-014 三层布局回归。

### 实现偏差（待回写 design §9.5）

- F-impl-1：**Ctrl+R 与浏览器刷新冲突**。§9.5 规定右栏 Ctrl+R；实现加守卫——input/textarea/contenteditable 聚焦时不拦截（仍走浏览器刷新），其他位置拦截唤出右栏。smoke 时定夺：接受 vs 右栏换键（如 Alt+R）。
- F-impl-2：**边沿热区唤出未做**。§9.5.1「边沿热区或选区触发」；minimal 首版只做顶栏图标 + 快捷键两路，边沿热区留后续（需热区元素 + 事件，增复杂度）。
- F-impl-3：左右栏切换图标均用 ☰，靠 title/aria-label/位置/active 态区分；如需不同图标 smoke 后换。
- F-impl-4：**DocumentsFeature 300 行踩 WSG-004 阈值**（+rightPaneOpen prop/解构/注释）。Slice 3b（单列编辑切换）还会改 DocumentsFeature，**启动前须先抽 inspector（versions-panel）成独立组件降行数**，否则破阈值。
