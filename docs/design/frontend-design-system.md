# Frontend Design System：LUMEN 前端视觉语言与组件呈现规范

> **定位**：LUMEN 前端视觉语言的**唯一权威规范**（设计事实）。目标：任何人在任何新界面做视觉决策时，都能从本文件查到依据，不需要即兴发挥——尤其是 AI 生成代码时按本文件 + `tokens.css` + CI 门禁执行，而非各写各的。
>
> **输入与证据链**：`docs/research/2026-08-16-visual-language-audit.md`（10 层现状实证）→ `2026-08-16-frontend-ui-reference-analysis-structure.md`（6 案例配方）→ `feat/design-system-tokens` 分支 4 commits（令牌升级 + 字面归并 + 去框化试点与铺开，用户 2026-08-16 确认照单全收）。主题层（四套 `[data-theme]`）规范见 brief §3.1.1，本文件管**跨主题一致**的结构维度。
>
> **与其他文档的关系**：brief 管体验方向（为什么这样设计）；本文件管实现规则（具体怎么做）；`frontend-interaction.md` 管页面流/状态/接口（交互层）；三者冲突时各归各域。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 版本 | v1.0（2026-08-16 首版，随设计系统工作流步骤 5 成文） |
| 适用范围 | `frontend/src/styles/*.css` 全部组件样式 + 新页面/新组件开发 |
| 唯一定义点 | `frontend/src/styles/tokens.css`（色值/字阶/间距/圆角/动效参数单点） |
| 执行保障 | `scripts/check-frontend-css.mjs`（CI）+ `ai/project-rules.md` §5.1 CSS 纪律 |
| 变更流程 | 见 §4 治理 |
| 回流标记 | §1/§2 各层规则为母模板 `ui-knowledge` PAT-VIS 候选素材（§5） |

## 1. 基础层（10 项，三段式：规则 → token 对照 → 边界）

### 1.1 色彩

- **规则**：组件 CSS 零字面色值；一切颜色经 `var(--*)` 引用；四套主题（light/dark/paper/legacy）只改 tokens.css 的 `[data-theme]` 值，组件文件无主题分支选择器；语义色（green/red/amber/blue）成套使用（主色+soft+border），状态表达不只靠颜色（配图标/文字）。新增颜色先登记 token 再使用，登记前过 WCAG 对比度计算（正文 ≥4.5:1 / 大字·组件 ≥3:1）。
- **token 对照**：`--bg/--panel/--panel-soft/--panel-raised`、`--text/--text-2/--text-3/--muted/--faint`、`--blue*`（主色系）、`--green*/--red*/--amber*`（语义系）、`--hover/--overlay/--shadow-*/--focus-ring/--avatar-bg`。
- **边界**：`--faint` 仅禁用态（WCAG 豁免）；legacy 主题 2 处历史对比度缺陷留证不改（对照价值）；代码块固定深色 `--code-bg` 四套同值（C-RA-002 拍板）。

### 1.2 分隔与容器（去框化配方——本规范核心）

- **规则**：**一视图一容器**——页面骨架（pane/双栏壳/浮层）各自成容器；内容元素不再各自为框。分隔四手段按序选用：

| 手段 | 何时用 | token |
|---|---|---|
| 留白 | 同组元素内部 | `--space-*` |
| 分隔线 | 同容器内的列表行（末行无线） | `--line-soft` |
| 边框 | 真正的容器边界（一视图一层） | `--line` |
| 投影 | 浮层（弹窗/下拉/抽屉）+ featured 卡 | `--shadow-*` |

- **规则细化**：① 列表项（标签行/成员行/结果行/版本行）去独立框，行间 `border-bottom: 1px solid var(--line-soft)`；② 次要按钮（`button.secondary`）幽灵化——透明底无边框，hover 淡洗色；主按钮实色不变；③ **输入框是唯一保留全边框的行内元素**（输入需要可辨识框），边线用 `--line-soft`；④ chip/徽章/键帽保留淡边（数据标记非容器）；⑤ danger 变体保留语义描边（破坏性操作需可辨识）；⑥ 数据表格（markdown td）保留全边框（表格语义）。
- **token 对照**：`--line`（容器）/ `--line-soft`（行分隔 + 输入框 + 行内控件淡边）。
- **边界**：容器壳/浮层/品牌触发器（顶栏头像·帮助）/分组控件壳（模式切换组）保留 `--line`——判定清单见步骤 4 铺开 commit（`945849a`）。

### 1.3 投影分级

- **规则**：投影只给「浮在页面上的东西」+「需要强调的单个卡」；平贴元素一律不投影。四档：0 平贴（无影）→ 1 轻浮（`--shadow-card`，卡片）→ 2 浮层（`--shadow-sm/md/lg`，下拉/弹窗/抽屉）→ 3 全屏遮罩（`--overlay + --shadow-xl`）。dark 主题例外：色彩分层（面板阶梯）优先于投影（colorimetric depth）。
- **token 对照**：`--shadow-card/sm/md/lg/xl/drawer/accent`；`--overlay`。
- **边界**：去框化后**不得**全站补投影（sanity 反浮起纪律）。

### 1.4 字阶（5 档）

- **规则**：字号只准用 5 档 token；新场景先归档再取值：

| token | 值 | 用途 |
|---|---|---|
| `--font-micro` | 11px | 标签/角标/占位 |
| `--font-caption` | 12px | 辅助说明/按钮/输入 |
| `--font-body` | 13px | 正文（全站基准） |
| `--font-emphasis` | 15px | 次级标题/强调 |
| `--font-title` | 16px | 视图标题/面板题 |

- **边界**：5 处语义特例豁免（hero 标题 26px / emoji 图标 22px / 术语标题 1.25rem / FAB 图标 20px / 行内代码 0.92em）——display/图标/相对缩放语义不在工作台字阶内；新增特例须登记本表。

### 1.5 字重与行高

- **规则**：字重 3 档 `--weight-body(400)/--weight-medium(500)/--weight-title(600)`，**不用 700+**（sanity 纪律；650 历史遗留已归 600）。行高 3 档：`--lh-tight(1.2)` 控件与标题 / `--lh-list(1.45)` 紧凑列表 / `--lh-body(1.5)` 正文。
- **边界**：继承场景（`font: inherit`）随父级。

### 1.6 间距

- **规则**：2px 网格纪律——间距取值只允许 `--space-1..4`（4/8/12/16）、其 2px 半档（2/6/10/14）或 24/32 大档；奇数值（5px 等）禁止新写。padding 优先用 token；「垂直×水平」组合写法（如 `2px 8px`）中每个值同样守网格。
- **token 对照**：`--space-1..4`。
- **边界**：1px 属分隔线宽非间距；图标内嵌微调允许 ±1px 但须注释。

### 1.7 圆角（4 档 + pill）

- **规则**：`--radius-xs(4px)` 微元素（chip/键帽/行内小件）/ `--radius-control(6px)` 控件（按钮/输入）/ `--radius-panel(8px)` 卡片容器 / `--radius-overlay(12px)` 浮层；胶囊 `999px` 与圆 `50%` 豁免。**档间不连续**：禁止 13px~998px 区间取值（sanity 纪律）。
- **边界**：`0`（无圆角）用于满宽贴边元素（树行/导航项）。

### 1.8 状态表达

- **规则**：hover 两路——文字/链接类变 `--accent-strong`（或 underline）；块类（列表行/图标钮）底色洗 `--hover`。**单一激活信号**：active = `--blue-soft` 底 + `--blue` 文字（导航项加 border-left 指示条）。focus 永远独立：全站 `--focus-ring`（实色 3px，四套主题各配过 3:1）；**禁裸 `outline: none`**——必须同规则写 `:focus-visible` 补偿（2026-08-16 修复 3 处历史缺陷）。
- **token 对照**：`--hover/--blue-soft/--blue/--accent-strong/--focus-ring`。
- **边界**：disabled 用 `--faint` + opacity 0.5-0.7（WCAG 豁免正文门槛）。

### 1.9 密度与行高节奏

- **规则**：高密度工作台（brief §3.2）：列表行高 22-28px 区间；工具栏 32-34px；行高节奏按 1.5 用 `--lh-*` 三档。
- **边界**：阅读态（markdown 正文/文档预览）密度放宽。

### 1.10 动效

- **规则**：两档——`--transition-fast(0.12s ease)` 交互反馈（hover/active/opacity）/ `--transition-container(0.2s ease)` 容器（抽屉/弹窗进出）。新动效先归档再写。
- **边界**：无进场动画堆叠；`prefers-reduced-motion` 适配列为候选（未实现，登记不阻塞）。

### 1.11 图标

- **规则（增量约束）**：新代码**不得新增 emoji 图标**于欢迎页/引导页之外的功能界面；功能性图标用 inline SVG（现状 5 文件）。emoji 既有使用（MarkdownToolbar/LocalMount/CommandPalette/Welcome）维持不扩散。
- **边界**：图标族统一迁移列为 P4 可选（未立项）。

## 2. 组件契约层（8 类，以 base.css + 既有组件为事实标准）

| 类 | 契约要点 |
|---|---|
| 按钮 | primary 实色（`--blue` 底 `--on-accent` 字，hover `--accent-strong`）；secondary 幽灵（透明底，hover `--hover`）；danger 语义描边（`--red-border` + `--red-soft` 底）；disabled `--faint`+opacity；焦点 `--focus-ring`；尺寸高 28（小）/32（默认）/36（大）三档 |
| 输入 | 全站唯一保留全边框的行内元素；边线 `--line-soft`；focus 由 `--focus-ring` 接管；select 同输入；textarea 行高 `--lh-list` |
| 列表 | 行 = 分隔线（`--line-soft`，末行无线）非框；行内主操作 hover 洗 `--hover`；激活项 `--blue-soft`+`--blue`；行高 22-28px |
| 卡片 | 真正并列实体块才用卡（`--radius-panel` + `--line` 边 + `--shadow-card`）；padding 统一 `--space-3..4`；**列表项不是卡** |
| 浮层 | 弹窗/下拉/抽屉 = `--panel-raised` + `--line` + `--shadow-md/lg/xl`（按量级）+ `--radius-overlay/panel`；遮罩 `--overlay` |
| 导航 | 垂直导航项：无圆角满宽 + active `border-left` 指示条 + `--blue-soft` 底；顶栏触发器：圆形（`--line` 边）品牌元素保留 |
| 反馈 | 语义消息 = 语义色三件套（主色+soft+border）+ 图标/文字辅助；toast/横幅用 `--panel-raised`+`--shadow-*` 浮层规则 |
| 编辑器 | 工具栏按钮幽灵化（文字 hover 变主色无底块）；md 预览区透明融入面板；代码块固定 `--code-bg/--code-text`；行内代码 `--code-inline-*` |

**新增组件 checklist**（§4 治理引用）：① 颜色全 token（新色先登记+对比度校验）② 分隔手段按 §1.2 选（先问「这是容器吗」）③ 字号/字重/圆角/间距按档位 ④ hover 两路 + focus 环 ⑤ 单文件 ≤300 行 ⑥ `check:css` + `check:file-size` 本地过。

## 3. 模式层（衔接 frontend-interaction.md，不重复定义）

| 模式 | 视觉侧规则（交互侧见 interaction） |
|---|---|
| 空态 | 居中 `--muted` 文案 + 可选操作按钮（幽灵 secondary）；不用插画 |
| 加载 | 既有骨架/文案惯例维持；不新增 spinner 风格 |
| 错误/权限 | 语义色三件套 + 固定文案口径（brief §3.3：不泄露越权信息等） |
| 表单校验 | 错误文案 `--red` 置于字段下；字段边线错误态 `--red-border` |
| 行内编辑 | 编辑行保留淡框（`--line-soft`+`--panel-soft` 底，输入语义） |

## 4. 治理

- **token 变更流程**：改值（同语义）直接改 tokens.css + 四套主题同步 + 对比度复核（涉色值）；**加值**（新 token）先在本文件对应层登记用途再落 CSS；**删值**查全站引用为零才可删。
- **CI 门禁清单**：`check-frontend-css`（零字面色值）现有；字号/字重/圆角白名单检查为步骤 6 扩展项（token 引用或 §1.4/1.7 豁免表内值）；`check:file-size`（300 行 ratchet）现有。
- **规则冲突裁决**：本文件 vs brief——视觉实现规则归本文件，体验方向归 brief；发现冲突先改本文件并在 commit 说明。
- **豁免登记**：任何偏离本规范的取值（特例字号/奇数间距/区间外圆角）必须登记在对应层的边界小节，未登记即 CI/评审拦截对象。

## 5. 回流清单（跨仓候选，不在本仓决定）

| 候选 | 形态 | 证据 |
|---|---|---|
| 「一视图一容器 + 分隔四手段」 | PAT-VIS 候选 | 步骤 4 试点（用户确认）+ 31 处铺开定性清单 |
| 「字阶/字重/圆角档位收敛路径」 | PAT-VIS 候选 | 22→5 档 / 5→3 档 / 9→4 档机械归并实证 |
| 「令牌单点 → 多主题」 | 已在主题评估登记 | v3.9.0 + 评估文档 5 条增量结论 |
| 「视觉语言审计方法（10 层盘点）」 | 方法论候选 | audit 文档三层结构（实证→定性→可参数化） |
| Do/Don't 写法（sanity 范式） | 知识层写法候选 | 本文件 §1 各层「边界」小节 |

---

*本文件由设计系统工作流（charter 步骤 5）产出；规则全部带实证来源，修订须同步 tokens.css 与 CI 门禁。*
