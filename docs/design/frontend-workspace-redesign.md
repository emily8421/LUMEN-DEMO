# 详细设计：前端工作台系统化重设计（frontend-workspace-redesign）

> 定位：本文是 Phase1 Demo 后续前端体验收口的**工作台级详细设计**，承接 `docs/design/frontend-interaction.md`、`docs/research/2026-07-11-frontend-ux-evaluation.md`、`docs/research/2026-07-11-frontend-p1-structure-exploration.md`、`docs/08-dev-plan.md` 与 `docs/09-verification.md`。
> 本文只定义既有 P1 功能在桌面工作台中的信息架构、视觉密度、组件拆分与验收口径，不新增需求、后端接口、权限规则、移动端能力或 Phase2 功能。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 设计对象 | LUMEN React 前端工作台（COMP-001）系统化 UI / UX 重设计 |
| 文档路径 | `docs/design/frontend-workspace-redesign.md` |
| 可视化原型 | `docs/design/frontend-workspace-redesign-prototype.html` |
| 覆盖 REQ | REQ-011 桌面端体验；承载既有 REQ-001..010、REQ-036 页面能力 |
| 所属阶段 | `[P1]` 后续体验收口：Sprint-10（P1B） |
| 交付物形态 | Demo 工作台体验优化，不改变 Demo closure 结论 |
| 当前状态 | P1B-已实现（用户确认 HTML 原型方向；React 工作台重构已完成，构建 + Chrome / Edge 900px smoke 通过） |
| 设计来源 | 用户反馈：“每个块太大，需要系统性考虑操作界面”；P1A 后 quick polish 验证通过但不足以解决根因 |
| 下游影响 | 确认后新增 / 更新 Sprint；重构 `frontend/src/App.tsx`、`frontend/src/styles.css`，可选拆分组件 |

## 1. 问题复盘

P1A 已解决“三栏常驻、搜索 / 问答 / 术语被右栏挤压”的结构问题，但当前界面仍保留 Demo 原型的卡片堆叠风格：

| 问题 | 表现 | 根因 | 影响 |
|---|---|---|---|
| 区块过大 | 顶栏、侧栏、主区、结果、答案、预览都像大卡片 | `.card` 作为主布局单位，而非仅用于内容对象 | 第一屏信息量低，用户感觉“块大、空、散” |
| 上下文不聚焦 | 搜索 / 问答时左侧仍常驻文档与导入 | 左栏承担了导航、文档上下文、导入入口三种角色 | 非当前任务的信息抢占屏幕 |
| 操作层级不清 | 编辑、预览、版本、来源、术语表单都用相似视觉重量 | 缺少 Toolbar / Pane / Inspector / Row 的层级系统 | 用户难以判断主操作与辅助操作 |
| 密度无规范 | 字号、间距、列表行高、输入框高度各自调整 | 没有工作台密度 token | 局部压缩无法形成统一体验 |
| 反馈通道单一 | 全局 sticky status-bar 既显示成功也显示错误 | 没有 toast / inline notice / form helper 的分层反馈 | 操作结果可见但不自然 |

结论：下一步不应继续“压 padding”，而应把前端改成**生产力工具型知识库工作台**。

## 2. 设计目标

### 2.1 用户体验目标

- **任务聚焦**：文档、搜索、问答、术语四类任务只呈现与当前任务相关的信息。
- **高信息密度**：900px 高度下，搜索能看到至少 5 条结果；术语能看到至少 8 条；文档编辑能看到至少 12 行正文。
- **低视觉噪声**：减少大圆角、大阴影、大卡片堆叠；用分隔线、工具栏、列表行表达层级。
- **来源可追溯**：搜索结果、问答来源仍可打开文档；删除 / 恢复仍二次确认。
- **Demo 稳定**：Chrome / Edge 桌面 900px 可完成主流程，无全局横向滚动。

### 2.2 非目标

- 不引入 `react-router`、组件库、全局状态管理或新后端接口。
- 不做移动端适配；`<768px` 只保证不横向破版，不承诺手机体验。
- 不新增标签视图、图谱、时间轴、AI 润色、跨空间推送、多人协作等 P2 / 愿景能力。
- 不把前端隐藏入口作为权限边界；权限仍以后端为准。

## 3. 目标信息架构

整体从“卡片页”改为“三层工作台”：

```text
┌────────────────────────────────────────────────────────────┐
│ TopBar：产品名 / 当前空间 / 用户 / 全局状态                 │ 44–52px
├───────┬────────────────────┬───────────────────────────────┤
│ Nav   │ Context Pane       │ Workspace                     │
│ 56px  │ 0 / 240 / 280px    │ 当前任务主工作区              │
│       │ 随视图变化         │ 文档 / 搜索 / 问答 / 术语      │
└───────┴────────────────────┴───────────────────────────────┘
```

| 区域 | 职责 | 设计规则 |
|---|---|---|
| TopBar | 产品识别、空间上下文、用户、全局反馈入口 | 高度固定；不使用大卡片；空间选择放顶部，避免占侧栏纵向空间 |
| Nav Rail | 一级任务入口：文档 / 搜索 / 问答 / 术语 | 56px 窄栏；图标 / 首字 + label tooltip；选中态用左边线 + 浅底 |
| Context Pane | 当前视图的上下文列表或筛选 | 文档视图显示文档列表；术语视图显示术语列表；搜索 / 问答默认收起或显示轻量筛选 |
| Workspace | 当前任务的主操作区 | 使用 Toolbar + Content + Inspector，而非嵌套大卡片 |
| Inspector | 版本、来源、元信息等辅助信息 | 仅在相关视图出现；900px 下可折叠 / 下沉 |

## 4. 视图设计

### 4.1 文档视图

```text
Nav │ Documents Pane          │ Workspace
    │ + 新建                  │ Toolbar：标题输入 / 权限 / 保存 / 删除
    │ 文档 A  team · v3       │ ┌ 编辑 | 预览 ┐        Inspector：版本
    │ 文档 B  private · v1    │ │ Markdown 编辑区 │      v3 当前
    │ ...                     │ │ 可见 12+ 行    │      v2 恢复
```

- 文档列表用行式列表，不用卡片；行高 40–48px。
- 文档主区顶部是紧凑 toolbar：标题、权限、保存、删除。
- 编辑 / 预览建议用同区 Tab：默认编辑；预览不再作为独立大块常驻。
- 版本历史作为 Inspector：宽屏右侧 240–280px；窄桌面下折叠为“版本”按钮 / 下方抽屉。
- 导入入口不再常驻在全局侧栏，建议放文档视图 toolbar 的“导入”次级按钮或文档列表底部折叠区。

### 4.2 搜索视图

```text
Nav │ Context Pane（可收起） │ Workspace
    │ 最近搜索 / 筛选        │ Toolbar：搜索框 + 搜索按钮
    │                        │ 结果列表：标题 / 权限 / 版本 / 摘要
```

- 搜索框为单行主输入，高 36–40px；回车触发搜索。
- 结果采用列表行，不用结果卡片；行高 72–96px。
- 每条结果整行可点击，打开文档并切换到文档视图。
- 摘要使用紧凑 Markdown；后续可加命中高亮，但本轮不强制。

### 4.3 问答视图

```text
Nav │ Context Pane（可收起） │ Workspace
    │ 可选：当前空间提示     │ 问题输入（2 行，可扩展）
    │                        │ 答案正文（Markdown 阅读区）
    │                        │ Inspector / 下方：来源列表
```

- 问题输入默认 2 行，可纵向扩展，不占据过多首屏。
- 答案不再使用大蓝底盒子；采用阅读区正文 + 轻量标题 / 左边线。
- 来源列表与答案同屏可见：宽屏右侧 Inspector，窄桌面下放答案下方。
- 来源可点击打开文档；术语来源不可打开时显示类型标识。

### 4.4 术语视图

```text
Nav │ Terms Pane             │ Workspace
    │ + 新建                 │ Toolbar：当前编辑状态
    │ 触发延迟  已确认       │ 表单：标准名称 / 定义 / 别名 / 状态
    │ 开关延迟  待确认       │ Actions：保存 / 删除 / 重置
```

- 术语列表进入 Context Pane，行高 44–56px，状态用小 badge。
- 术语编辑表单位于 Workspace，不和列表同一大卡片堆叠。
- 删除仍二次确认；保存成功用 toast 或 inline notice。

## 5. 视觉密度规范

### 5.1 Token

| Token | 建议值 | 用途 |
|---|---:|---|
| `--space-1` | 4px | 文本内小间距 |
| `--space-2` | 8px | 控件间距、列表行内 padding |
| `--space-3` | 12px | 面板内 padding |
| `--space-4` | 16px | 页面主间距 |
| `--radius-control` | 6px | input / button / badge |
| `--radius-panel` | 8px | pane / popover |
| `--font-body` | 13px | 列表、表单、辅助正文 |
| `--font-main` | 14px | 主正文、输入 |
| `--font-title` | 18px | 视图标题 |
| `--row-compact` | 40px | 文档列表行 |
| `--row-regular` | 48px | 术语 / 导航说明行 |

### 5.2 视觉规则

- 主布局区域不使用 `.card` 风格；使用 `pane`、`toolbar`、`list-row`、`inspector`。
- 默认取消大面积阴影；仅 popover / drawer 使用轻阴影。
- 大卡片数量控制：同一视图首屏不超过 1 个强调卡片；普通内容用行 / 分隔线。
- 选中态：浅蓝底 + 左边线 / 边框，不用大块深色按钮。
- 操作按钮：主操作蓝色；危险操作红色描边或轻底，不默认大红块常驻。

## 6. 组件拆分设计

| 组件 | 职责 | 输入状态 | 输出动作 |
|---|---|---|---|
| `AppShell` | 顶层布局、TopBar、Nav、ContextPane、Workspace | session、activeView、notice/error | 切换视图、空间切换 |
| `TopBar` | 产品名、空间选择、用户、状态入口 | spaces、currentSpace、session | `onSpaceChange` |
| `PrimaryNav` | 一级任务入口 | activeView、isBusy | `onViewChange` |
| `ContextPane` | 按视图渲染文档列表 / 术语列表 / 筛选 | activeView、documents、terms | 选择文档、选择术语、新建 |
| `DocumentsWorkspace` | 文档编辑、预览、版本 Inspector、导入入口 | selectedDocument、draft、versions | 保存、删除、恢复、导入 |
| `SearchWorkspace` | 搜索框、结果列表 | searchTerm、searchResults | 搜索、打开文档 |
| `QueryWorkspace` | 问题输入、答案、来源 | question、queryResult | 提问、打开来源 |
| `TermsWorkspace` | 术语编辑表单 | selectedTerm、termDraft | 保存、删除、新建 |
| `FeedbackLayer` | toast / inline notice / error | notice、error | 自动消失 / 关闭 |

> 实现可先在 `App.tsx` 内拆小组件，确认稳定后再移动到 `frontend/src/components/*`。不引新依赖。

## 7. 响应式规则

| 宽度 | 布局 | 说明 |
|---|---|---|
| `>=1200px` | TopBar + 56px Nav + 260px ContextPane + Workspace + 可选 Inspector | 标准桌面工作台 |
| `900–1199px` | TopBar + 56px Nav + 220px ContextPane + Workspace；Inspector 下沉或折叠 | 主要验收宽度，必须无横滚 |
| `768–899px` | TopBar + 56px Nav + 可折叠 ContextPane + 单列 Workspace | 仅保证桌面窄窗可用，不承诺移动体验 |
| `<768px` | 不作为 Phase1 验收范围 | 不做移动端适配 |

## 8. 交互与反馈

- 成功反馈：保存 / 删除 / 恢复 / 导入成功使用 toast 或顶部轻量 notice，3–5 秒后可消失。
- 错误反馈：全局错误在 TopBar 下方或 Workspace 顶部显示；字段错误放字段下方。
- 加载态：按钮 disabled + 文案变化；长操作可在 workspace 顶部显示细进度条。
- 危险操作：删除文档、删除术语、恢复版本必须保留 `window.confirm` 或后续统一 confirm dialog。
- 键盘：本轮不强制实现快捷键；可预留 `/` 聚焦搜索、`Ctrl+S` 保存。

## 9. 可视化原型

- 原型文件：`docs/design/frontend-workspace-redesign-prototype.html`
- 原型定位：低保真但可点击的视觉对齐稿，用于确认布局、密度、任务聚焦与视觉层级。
- 原型不连接后端，不替代正式 React 实现。
- 用户确认原型后，才能进入代码重构。

## 10. 验收标准

| ID | 验收项 | 标准 |
|---|---|---|
| UX-P1B-AC-001 | 任务聚焦 | 文档 / 搜索 / 问答 / 术语切换时，Workspace 只显示当前任务相关内容 |
| UX-P1B-AC-002 | 块密度 | 主布局不再依赖大 `.card` 堆叠；首屏同级大块数量明显减少 |
| UX-P1B-AC-003 | 搜索信息量 | 900px 高度下搜索结果首屏至少可见 5 条列表行 |
| UX-P1B-AC-004 | 术语信息量 | 900px 高度下术语列表首屏至少可见 8 条 |
| UX-P1B-AC-005 | 文档编辑信息量 | 900px 高度下 Markdown 编辑区至少 12 行可见 |
| UX-P1B-AC-006 | 来源可追溯 | 搜索结果、问答文档来源可打开文档并切换到文档视图 |
| UX-P1B-AC-007 | 危险操作 | 删除文档、删除术语、恢复版本保留二次确认 |
| UX-P1B-AC-008 | 桌面响应式 | Chrome / Edge 900px 宽度无全局横向滚动 |
| UX-P1B-AC-009 | 验证 | `npm.cmd run build` 通过；Chrome / Edge 900px smoke 覆盖四视图主流程 |

## 11. 建议实施顺序

1. 用户已查看并确认 `frontend-workspace-redesign-prototype.html` 的总体方向（反馈：“比之前舒服多了”）。
2. 已新增 Sprint-10（P1B）到 `docs/08-dev-plan.md`，并在 `docs/09-verification.md` 增加 TC-P1-014。
3. 已重构前端骨架：TopBar、Nav Rail、Context Pane、Workspace 分层。
4. 已重写 `styles.css` 为 token + layout + component 分层，弱化主布局大卡片依赖。
5. 已跑 `npm.cmd run build` 与 Chrome / Edge 900px smoke，并回填验收记录。

## 12. 待确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| UX-P1B-C-001 | 是否采用“三层工作台”：Nav Rail + Context Pane + Workspace | 已确认并实现 | 解决“每个块太大”和任务不聚焦的根因 | 继续 P1A 左侧大侧栏 | 已按采纳方案落地 |
| UX-P1B-C-002 | Context Pane 是否按视图变化 | 已确认并实现 | 搜索 / 问答时不应常驻文档导入 | 侧栏始终显示文档列表 | 已按采纳方案落地 |
| UX-P1B-C-003 | 文档预览是否改为 Tab / 同区切换 | 部分实现：预览仍同屏但被收敛为工作区内轻量 pane | 避免编辑 + 预览上下两个大块 | 保留上下预览 | 当前实现已通过 smoke；若仍需更高密度，可后续改 Tab |
| UX-P1B-C-004 | 是否引入组件库 | 暂缓 | 当前问题是信息架构和密度；组件库会引新依赖 | 引入 Ant Design / MUI | 观感成熟但依赖、改动和样式覆盖成本更高 |
| UX-P1B-C-005 | 是否提交当前 quick polish | 暂不提交，作为试验稿参考 | 用户反馈仍觉得块大；应先确认系统设计 | 直接提交 | 可能固化不满意的样式方向 |
