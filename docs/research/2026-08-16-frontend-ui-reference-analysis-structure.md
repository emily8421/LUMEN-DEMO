# Frontend UI Reference Analysis：结构维度专项（第三轮 RA——设计系统工作流步骤 2）

> 定位：承接 `2026-08-16-visual-language-audit.md`（步骤 1 审计）的 gap 表，按 ②分隔 ③投影 ④字阶 ⑤间距 ⑥圆角 ⑦状态 ⑨动效 维度重读 awesome-design-md（D 级来源，`SRC-VIS-001`）本地检出，产出 LUMEN 令牌升级（步骤 3）与去框化试点（步骤 4）的配方输入。**D 级封顶：只作方向启发，参数值须经本项目校验（对比度用 A 级门槛，参数用本身体量适配）。**
> 素材边界：本地检出 `D:\2-Project\designUI\awesome-design-md`（用户 2026-08-16 提供路径）；本文件只含自有提炼，不复制第三方原文。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 分析主题 | 结构视觉语言（分隔/投影/字阶/间距/圆角/状态/动效）配方提取 |
| 上游 | 视觉语言审计（步骤 1）；主题 RA（2026-08-16 第一轮）；ui-knowledge visual-patterns |
| 本轮精读案例 | linear / sanity / notion / claude / raycast / mintlify（6 份 DESIGN.md；与第一轮主题 RA 同池不同维度） |
| 状态 | 候选（步骤 3 令牌升级 + 步骤 4 试点的输入；未经用户确认不写规范） |
| 日期 | 2026-08-16 |

## 1. 各层配方提炼（按审计 gap 对照）

### ② 分隔与容器（P0——「满屏白框」对策）

跨案例一致的结构纪律（6 案例无一例外）：

- **一视图一容器**：页面骨架（nav / 主内容壳）各自成容器；内容元素（列表行、表单行、卡内元素）不再各自为框。
- **卡片是「例外」不是「默认」**：所有案例中 card 只用于真正并列的实体块（pricing / feature / testimonial），且**全站 padding 统一**（linear 24px、claude 32px、mintlify `{spacing.xl}`=24px）——不存在「每个列表项都是卡」的用法。
- **分隔主力是单侧线 + 留白**：sanity 明言「border-based containment serves as the primary spatial separator」——1px 单侧线用于容器边界，容器内行与行用分隔线或纯留白。
- **输入框是唯一保留全边框的行内元素**（所有案例一致）——输入需要可辨识的可交互框。

**LUMEN 项目化配方（候选）**：
- 列表项（标签行/成员行/结果行/版本行）：去全边框 → 行间 `border-bottom: 1px solid var(--line-soft)`。
- 次要按钮（secondary/工具条按钮）：白底+边框 → 幽灵式（transparent + hover `--hover` 底）；主按钮不变。
- 输入框：保留全边框，边线降档 `--line`→`--line-soft`，focus 已有环。
- 页面壳（pane/双栏壳/浮层）：保留一层边框。
- 徽章/标签 chip：保留（chip 本质是数据标记，非容器）。

### ③ 投影分级（P3，随去框化接棒）

sanity 深色哲学（「colorimetric depth」）已被 dark 主题面板阶梯采用；浅色参照 linear/mintlify：

| 档 | 案例 | LUMEN 对应 |
|---|---|---|
| 0 平贴 | sanity 默认（色彩分层，无影） | 列表行 / 去框化后的元素 |
| 1 轻浮 | mintlify 定价卡 `0 8px 24px rgba(...,0.08)`（仅 featured 一处） | `--shadow-card`（已有） |
| 2 浮层 | linear/raycast 弹窗级 | `--shadow-md/lg`（已有） |
| 3 全屏遮罩 | — | `--overlay + --shadow-xl`（已有） |

**配方**：投影只给「浮在页面上的东西」（弹窗/下拉/抽屉）+「需要强调的单个卡」（featured）；平贴元素一律不投影——**与「去框」配套，避免去框后全站加影**。

### ④ 字阶（P1）

6 案例工作台可用段（≤22px，剔除营销页 display 段）一致收敛为 **4-6 档**：

| 意图 | linear | notion | sanity | LUMEN 现状等效值（22 种收敛目标） |
|---|---|---|---|---|
| micro/标签 | 12 | 11-12 | 11-12 | **11px**（10/11px 归并） |
| caption/辅助 | 13 | 13 | 12-13 | **12px**（11.5/12/12.5px 归并——现状主力） |
| body/正文 | 14-16 | 14-16 | 15-16 | **13px**（13/13.5/14px 归并，密度偏高但为现状事实主力） |
| 强调/次标题 | 18-20 | 18 | 18-20 | **15px**（15/16px 归并） |
| 标题/卡片题 | 22 | 22 | 24 | **16px**（16/17/18px 归并，工作台标题不用营销级 22+） |

字重配方（三案例一致）：**正文 400 / 强调 500 / 标题 600** 三档封顶；sanity 明言 Don't「use heavy font weights (700+)」。LUMEN 现状 500/600/650/700/800 五档 → 收敛 **400/500/600**（650 归 600，700/800 归 600）。行高：**标题 1.2-1.3 / 正文 1.5** 两档（sanity「tight headings, relaxed body」）；LUMEN 11 种 → 3 档（1.2 控件 / 1.5 正文 / 1.45 保留给紧凑列表）。

### ⑤ 间距（P2）

案例基网格：sanity 8px 基准、linear/claude 4px 起步全 4 的倍数、raycast 含 2px 档。共同点：**全部是 2/4 网格，无奇数值**。LUMEN `--space-1..4`（4/8/12/16）已是子集；配方：**2px 网格纪律**（半档 2px 豁免于微元素 gap），字面 padding 收敛到 `--space-*` 或「垂直×水平」组合 token；现状 `5px`/`10px` 类奇数值归并到 4/6 档。

### ⑥ 圆角（P2）

案例档位惊人一致（5 案例）：**xs 3-4 / sm 5-6 / md 8 / lg 10-12 / pill**；sanity 明言 Don't「radius between 13px and 99998px」——档间不连续。LUMEN 现状 9 种字面 → **4 档**：`--radius-xs: 4px`（微元素/行内输入，归并 2/3/4px）+ `--radius-control: 6px`（控件，归并 5/6px，已有）+ `--radius-panel: 8px`（卡片/容器，归并 8/10px）+ `--radius-overlay: 12px`（浮层，归并 10/12px）+ pill 999px 豁免。

### ⑦ 状态表达（P1）

- **单一激活信号**（sanity 最明确）：全站 hover/active 统一走一个信号色（其 electric blue）；「Don't mix CTA color with interactive color in the same element」。
- **hover 分层**：案例普遍两层——轻交互（文字/图标变主色或 underline）与容器交互（底色洗 `surface-1` 级）；不存在三路以上。
- **focus 永远独立**：所有案例 focus ring 与 hover 分离、2px 实色环（sanity `0 0 0 2px` ring 式）。

**LUMEN 项目化配方（候选）**：hover 归两路——A「文字/链接类」变 `--accent-strong`（或 underline）；B「块类」底色 `--hover`。active 激活 = `--blue-soft` 底 + `--blue` 文字（现状已多数如此，收敛 stray 路径）。focus 全站 `--focus-ring`（已有），**禁裸 outline:none**（审计 3 处无补偿缺口随步骤 3 修）。

### ⑨ 动效（P3）

案例数据少（DESIGN.md 多不记录 transition），但可用档位从组件行为推断 + 第一轮 RA 已定：**0.12s ease 交互反馈**（hover/active/opacity）/ **0.2s ease 容器**（抽屉/弹窗进出）。LUMEN 现状 0.1/0.12s 归并为 0.12s 单档起步即可。

### ⑩ 图标（P4 可选）

本案池无直接图标族规范（营销页素材）；不强行推导。LUMEN 决策候选留待试点后：统一 inline SVG 线性族（成本高）vs 现状混用接受（成本低）——**建议接受现状**，规范只约束「新代码不得新增 emoji 图标于非欢迎页」。

## 2. 采纳 / 排除矩阵

| 配方 | 决定 | 理由 |
|---|---|---|
| 一视图一容器 + 列表行分隔线化 | **采纳**（步骤 4 试点验证） | 6 案例一致；正对 P0 gap |
| 次要按钮幽灵化 | **采纳**（试点） | raycast button-secondary transparent 直接对应 |
| 输入框保留框 + 边线降档 | **采纳**（试点） | 全案例一致保留输入框 |
| chip/徽章保留框 | **采纳** | 数据标记非容器 |
| 投影只给浮层 + featured | **采纳**（成文即可） | sanity Don't 条目直接支持 |
| 字阶 5 档 / 字重 3 档 / 行高 3 档 | **采纳**（步骤 3 令牌） | 三案例收敛一致；映射已按 LUMEN 现状主力对齐 |
| 间距 2px 网格 | **采纳**（步骤 3） | 全案例无奇数值 |
| 圆角 4 档 + pill | **采纳**（步骤 3） | sanity「档间不连续」纪律 |
| hover 两路 + 单一激活信号 | **采纳**（步骤 3-4） | sanity Do 条目 |
| 动效 0.12s 单档起步 | **采纳**（步骤 3） | 现状归并即可 |
| sanity 负字距 / uppercase 技术标签 | **排除** | 营销页 display 段特征，工作台不需要 |
| sanity 12px→pill 跳档禁区间 | 采纳精神（档位不连续） | 直接映射为 4 档禁区间 |
| 图标族统一 SVG | **缓议**（P4） | 本案池无依据；先约束新增不扩散 |

## 3. 令牌升级草案（步骤 3 输入）

```css
/* 字阶（5 档，映射审计 §1④ 收敛目标） */
--font-micro: 11px; --font-caption: 12px; --font-body: 13px;
--font-emphasis: 15px; --font-title: 16px;
--lh-tight: 1.2; --lh-list: 1.45; --lh-body: 1.5;
/* 字重 3 档 */
--weight-body: 400; --weight-medium: 500; --weight-title: 600;
/* 圆角 4 档 */
--radius-xs: 4px; /* 既有 control 6 / panel 8 */ --radius-overlay: 12px;
/* 分隔 */
--divider: /* = line-soft 语义别名，或直接复用 */;
/* 动效 */
--transition-fast: 0.12s ease; --transition-container: 0.2s ease;
```

## 4. 局限与边界

- 案例池为**营销页/官网** DESIGN.md，非工作台应用本体——工具内密度参照（notion 工作台、linear app 内）是推断而非记录；步骤 4 试点即验证此推断的环节。
- D 级封顶：参数档位（11/12/13/15/16px 等）是按 LUMEN 现状主力对齐后的**本项目选择**，非案例原值照抄；对比度相关问题仍以 WCAG 计算（A 级）为准。
- 图标层无素材支撑，规范只做增量约束不做迁移。
