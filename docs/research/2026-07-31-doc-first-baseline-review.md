# 前端 Doc-First 基线评审与方向留痕（2026-07-31）

> 定位：阶段性评审与决策留痕（research），记录从「Obsidian 风格文档优先」期望到 `frontend-interaction §9.5` Doc-First 候选基线的评估过程、决策依据与剩余步骤。不是正式需求 / 设计 / 验收事实；正式基线以 `docs/design/frontend-interaction.md §9.5` 为准。

## 0. 元信息

| 项 | 内容 |
|---|---|
| 报告类型 | 阶段评审 + 决策留痕（research） |
| 日期 | 2026-07-31 |
| 触发 | 用户提出 Obsidian 风格期望（简洁 / 文档为主 / 目录可隐藏 / 右栏默认隐藏 / 关系图谱）+ 提供 obsidian 截图 |
| 评估对象 | `frontend-interaction.md`（§9.3 少容器清爽稿）、`frontend-workspace-redesign.md`、`frontend-experience-brief.md`、`ai-polish.md`、`timeline.md`、`08/09/03` |
| 视觉参考 | `docs/inputs/images/obsidian-graph-*.png`（3 张，PIL 实测均浅色）；`docs/research/prototypes/2026-07-31-obsidian-inspired-*.html`（A/B/C 三原型，用户认可） |
| 结论 | P1B 工作台已实现达标；Phase2B 前端整体 Conditional Go；Doc-First 候选基线已立（§9.5），不授权编码 |

## 1. 背景：新基准的确立

用户实测后希望前端从「工具台（多栏常驻、功能平铺）」迁移到「内容为中心、工具边缘化、按需呼出」的阅读器范式（Obsidian 风）。PIL 客观分析（CDN 识图链路因 Windows 反斜杠路径失败，改用 .NET 本地直读）确认三张参考图均为浅色主题，尤其关系图谱是浅色背景（非深色）。

## 2. 当前状态评审（结论）

- **P1B 工作台（REQ-011，TC-P1-014）**：已实现达标，三层骨架保留，不推翻。
- **REQ-014 AI 润色**：已闭环（PR#89–95 / v1.1.0 / TC-P2-AI-001 live 通过），且天然符合 Doc-First（选区唤出、默认折叠）——降低改基线阻力。
- **文档状态滞后**：ai-polish / interaction / 08 / 03 残留「前端 half 待实现」旧表述（已回写，见 §3）。
- **frontend-interaction §9.3**：偏「少容器三区并列」，落后于 Doc-First「默认隐藏」方向（已立 §9.5 候选基线覆盖）。
- **关系图谱**：愿景候选（Phase2B 不含，先时间轴后关联图）。
- **时间轴**：设计骨架，D-T-001 数据来源 / Page-ID 待定稿。

## 3. 本轮已执行（2026-07-31）

**Step 1 文档状态同步**（REQ-014 回写 5 处）：
- `ai-polish.md`（当前状态 + 日期）、`frontend-interaction.md`（当前状态 + 日期）、`08` Sprint-19、`03-prd` REQ-014；`09` TC-P2-AI-001 已是通过无需改；`03-prd` 指针已切（核实澄清 Agent B 之前误判）。

**Step 2 Doc-First 候选基线**：
- `frontend-interaction.md` 新增 §9.5（核心原则 / 默认落地页 / 密度预设 / 编辑模式 / 图谱时间轴 / 进入条件）。
- `frontend-experience-brief.md` 新增 FEB-P-009。
- 产出 3 个探索原型：`docs/research/prototypes/2026-07-31-obsidian-inspired-{doc-focus,classic-tree,graph}.html`。

## 4. 关键决策记录（用户 2026-07-31）

| 决策点 | 选择 | 依据 |
|---|---|---|
| 默认落地页 | 首页 / 空间总览 / 欢迎页（不直接进上次文档） | 用户拍板 |
| 正文阅读列限宽 | ~800–880px（代码 / 表格 ~960–1040px） | 主流文档产品中段 + 中文每行 50–55 字 + 兼容代码块 |
| 编辑 / 预览模式 | 单列切换为主（右上角图标），并排为可选；Live Preview 远期候选 | 与限宽兼容；行级实时需富文本编辑器（重投入），近期 textarea 零依赖切换先拿 80% 收益 |
| A/B 两原型 | 都保留（统一栏系统的两种预设，非两套界面） | 按视图自动默认密度，降低用户切换成本 |
| 关系图谱 | 维持愿景候选（Phase2B 不含） | 先时间轴后关联图；团队多空间权限过滤复杂 |

## 5. 剩余步骤（待启动）

- **Step 3 窄范围 UX 重构**：在 P1B 底座加「栏可隐藏 + 默认收起 + 三路唤出 + 单列编辑切换」；触及 REQ-011 已验收默认行为，需新 Sprint + Chrome/Edge smoke + TC-P1-014 回归；不改后端 API；**门禁口径 DF-C-001 已确认（2026-07-31）：每 UI slice 前重跑（Step 3 拆 3a/3b 两 slice 各自重跑）**。
- **Step 4 Sprint-20 时间轴**：独立视图、主体优先、过滤器默认隐藏；先补 `timeline.md` Page-ID/Flow-ID + `frontend-interaction` 时间轴映射 + 确认 D-T-001 数据来源。

## 6. 待确认项

| ID | 待确认 | AI 建议 | 时机 |
|---|---|---|---|
| DF-C-001 ✅已确认（2026-07-31） | Sprint-11 UI/WSG 门禁口径：草案保留 vs 每 UI slice 重跑 | **采「每 UI slice 前重跑」**（Doc-First 改默认行为，需回归） | Step 3 启动前（已确认） |
| DF-C-002 | Live Preview（行级实时编辑）是否做、选哪个编辑器 | 远期候选；引富文本编辑器前先 Spike（CodeMirror 6 / Tiptap / Milkdown） | Step 3 之后 |
| DF-C-003 | 时间轴数据来源（D-T-001）、色阶（D-T-003） | 选候选 A（不建表，复用 lumen_documents + tags/links）先行 | Step 4 启动前 |

## 7. 引用

- 正式基线：`docs/design/frontend-interaction.md §9.5`
- 体验原则：`docs/design/frontend-experience-brief.md` FEB-P-009
- 原型：`docs/research/prototypes/2026-07-31-obsidian-inspired-*.html`
- 参考：`docs/inputs/images/obsidian-graph-*.png`
