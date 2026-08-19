# Frontend UI Reference Analysis Template（前端参考分析记录模板）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 推荐落盘路径：`docs/research/YYYY-MM-DD-frontend-ui-reference-analysis.md`
> 定位：UI Exploration to Delivery Pipeline 中「前端参考分析」阶段的项目级产物（`ai/document-lifecycle-rules.md` §5.2.1）。它把 `template-docs/ui-knowledge/` 的通用知识转换为当前项目的参考依据包，供探索原型和正式交互设计消费。它不是需求权威源，不替代 `docs/design/frontend-interaction.md`、UI 原型策略、`08` 或 `09`；未经用户确认的内容不得写成已确认需求、接口或验收目标。

## 0. 文档元信息

| 项 | 内容 |
|---|---|
| 项目 / 入口 |  |
| 分析主题 |  |
| UI brief 来源 | `docs/inputs/ui-brief.md` / `docs/research/*ui-brief*.md` / 当前会话 |
| 产品类型 | 知识工作台 / 管理后台 / 表单流程 / 营销页 / 数据密集 / 其他 |
| 分析状态 | 候选 / 已采纳待回填 / 已回填 |
| 生成日期 | YYYY-MM-DD |
| 引用知识版本 | 模板 vX.Y.Z（`template-docs/ui-knowledge/`） |
| 建议回填位置 | `docs/design/frontend-experience-brief.md` / `docs/design/frontend-interaction.md` / UI 原型策略 / `08` / `09` / open items |

## 1. UI brief 与问题定义

【撰写提要：从 UI brief / 输入材料提炼本次分析要回答的问题；区分已确认输入与待确认假设。】

- 待设计的界面 / 流程：
- 要解决的用户问题：
- 已确认的输入偏好（来自 UI brief）：
- 不在本次分析范围：

## 2. 产品类型 / 用户任务 / 设备 / 约束

【撰写提要：明确 scope，决定从知识库命中哪些维度与模式（见 `ui-knowledge/README.md` §3 §5）。】

| 维度 | 当前项目情况 |
|---|---|
| 产品类型 |  |
| 主要用户与任务 |  |
| 设备范围 | 桌面 / 移动 / 平板 / 自助终端 |
| 输入方式 | 鼠标键盘 / 触控 / 语音 |
| 关键状态 | 加载 / 空 / 错误 / 权限 / 冲突 / AI 不确定 |
| 风险等级 | 低 / 中 / 高（是否涉及不可逆操作或敏感数据） |

## 3. 候选知识记录与来源

【撰写提要：按 scope 从 `ui-knowledge/visual-patterns.md`、`interaction-patterns.md` 命中相关模式，只列命中记录；每条引用 `PAT-*` / `PRN-*` ID 与 `SRC-*` 来源。不加载全部知识。】

| 引用 ID | 类型 | 要解决的问题 | 建议摘要 | 适用 / 不适用 | 证据等级 | 来源 |
|---|---|---|---|---|---|---|
| `PAT-INT-NNN` |  |  |  |  | A/B/C/D | `SRC-*` |
| `PAT-VIS-NNN` |  |  |  |  | A/B/C/D | `SRC-*` |

## 4. 采纳 / 调整 / 排除矩阵及理由

【撰写提要：本节是防机械套用的关键。对 §3 每条候选给出项目级判断；排除项必须写理由，让人能复核 AI 排除了什么，而不只看到采纳了什么。】

| 引用 ID | 决定 | 项目化改写 | 理由 | 回填位置 |
|---|---|---|---|---|
| `PAT-INT-NNN` | 采纳 / 调整 / 排除 |  |  |  |

## 5. 页面 / 流程 / 状态 / 恢复 / 可访问性 / 响应式输入

【撰写提要：参考分析必须覆盖状态、恢复、可访问性和响应式，不能只覆盖颜色与布局（见提案验收）。此处为下游交互设计提供输入，不是最终设计。】

- **页面与流程**：
- **关键状态**（加载 / 空 / 错误 / 成功 / 禁用 / 无权限 / 降级）：
- **错误恢复与撤销**：
- **可访问性**（键盘焦点 / 对比度 / 语义 / 读屏）：
- **响应式**（断点 / 触控目标 / 窄屏重排）：

## 6. 视觉方向与明确禁区

- **视觉方向**（引用 `PAT-VIS-*`，说明密度 / 层级 / 配色 / 布局倾向）：
- **明确禁区**（本项目不采用的视觉，如强品牌色、大留白营销风等）：

## 7. 冲突 / 待确认项 / 需用户研究验证的假设

【撰写提要：候选模式之间冲突、与项目约束冲突、或证据不足以决定时，列在此处；标注是否阻塞下游。使用 `C-RA-NNN` 编号。】

| ID | 待确认项 | AI 建议 | 建议依据 | 阻塞关系 |
|---|---|---|---|---|
| `C-RA-001` |  |  |  | 阻塞 / 条件阻塞 / 不阻塞 |

## 8. UI-G-002 判断及下游回填

【撰写提要：晋级 Gate `UI-G-002`（reference analysis → exploration prototype）要求已列出 AI 建议、建议依据、备选方案、取舍影响和待确认项（`document-lifecycle-rules.md` §5.2.1）。核对后给出判断。】

- **UI-G-002 是否满足**：满足 / 条件满足（列出条件）/ 不满足
- **AI 建议 / 依据 / 备选 / 取舍影响**：见 §3 §4 §7
- **下游回填清单**：
  - → `docs/design/frontend-experience-brief.md`（已确认体验原则）：
  - → `docs/design/frontend-interaction.md`（页面流 / 状态 / 权限 / 接口依赖）：
  - → UI 原型策略：
  - → `docs/08-dev-plan.md` / `docs/09-verification.md`（仅在用户确认后）：
  - → open items（未确认项）：
- **建议晋级目标**：`docs/research/*ui-prototype-exploration*.md` / experience brief / 正式交互设计

## 边界声明

- 本文件是参考分析阶段产物，状态为「候选 / 已采纳待回填」；未经用户确认，不得把其中内容写成已确认需求、接口、权限、Sprint 必过项或验收目标。
- 引用的 `PAT-*` / `SRC-*` 来自模板知识库；项目级采纳决定只写在本文件与下游正式设计，不回写模板知识库。
- 视觉候选（D 级）只作方向启发；交互、可访问性和恢复结论须以规范来源（A/B 级）或项目验证为准。
- 若输入不足或无参考需要，可写豁免并说明理由，不强行产出长分析。
