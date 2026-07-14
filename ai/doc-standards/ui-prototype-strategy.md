# UI Prototype Strategy Standard（UI 原型策略 / 实现前原型细粒度标准）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 UI 原型策略 / 实现前原型的记录标准。它适用于已有 `00-03` 需求链、体验原则和基本设计后，进入前端实现前的可视化门禁；不同于 `template-docs/ui-prototype-exploration-template.md` 所描述的“需求探索原型”。若仍在 UI brief、参考分析、需求探索原型或视觉效果探索阶段，应先按 `ai/document-lifecycle-rules.md` §5.2.1 推进，不得把探索稿写成实现前原型已确认。

## 1. 适用范围与触发条件

满足前端交互设计触发条件，且存在以下任一情况时，应选择并记录 UI 原型策略，或写明豁免理由：

- 用户需要在实现前看到界面效果或点击路径。
- 交付物形态为 Demo / MVP，演示体验会影响验收判断。
- 页面信息密度高，包含列表、详情、搜索、问答、管理页、看板、复杂表单或数据密集界面。
- 主流程依赖点击路径验收，或存在多状态：加载、空态、错误、禁用、成功、无权限、降级、风险提示。
- 存在多角色、多租户、权限可见性、数据隔离或敏感字段展示。
- Mock / Demo / 降级能力需要在界面上明确用户可见口径。
- 需求或正式交互设计只描述功能，没有说明布局基线、信息密度、默认视觉标准、实现顺序或用户确认依据。

## 2. 与需求探索原型的区别和探索链路边界

| 类型 | 使用时点 | 权威位置 | 能否驱动实现 | 主要输出 |
|---|---|---|---|---|
| UI brief / 输入补齐 | UI 输入不足或发散时 | `docs/inputs/ui-brief.md` / `docs/research/*ui-brief*.md` | 否；确认后回填正式链路 | UI 类型、参考产品、信息密度、设备范围、视觉禁区 |
| 需求探索原型 | `00-03` 定稿前 | `docs/research/YYYY-MM-DD-ui-prototype-exploration.md` | 否；确认后回填需求链 | 需求假设、页面流、用户反馈 |
| 视觉效果探索 | 需求方向存在但视觉 / 密度 / IA 未确认时 | `docs/research/*ui-visual-exploration.md`、`prototype.html`、截图 | 否；确认后回填体验原则或正式设计 | 视觉候选、已确认视觉方向、失败反馈 |
| Frontend Experience Brief | 探索结论已被用户确认、但尚未进入正式交互设计时 | `docs/design/frontend-experience-brief.md` | 否；作为正式交互设计上游输入 | 已确认体验原则、信息架构方向、阶段边界 |
| UI 原型策略 / 实现前原型 | `00-03`、体验原则和前端交互设计已有后 | `ai/project-rules.md` §2.7、`docs/05-tech-spec.md` 或 `docs/design/frontend-interaction.md` | 仅在承接已授权需求时可作为实现参考 | 原型形式、覆盖范围、证据与验收映射 |

## 3. 推荐记录位置

- 简单项目：记录在 `ai/project-rules.md` §2.7。
- 技术方案相关：记录在 `docs/05-tech-spec.md` 的 UI 原型策略 / 前端约束段落。
- UI 型项目：记录在 `docs/design/frontend-interaction.md`，并引用 `template-docs/ui-prototype-strategy-template.md`。
- 探索阶段：使用 `template-docs/ui-prototype-exploration-template.md`、`docs/research/*ui-visual-exploration.md` 或 `template-docs/frontend-experience-brief-template.md`，不要写成 UI 原型策略已确认。

## 4. 必填字段

| 字段 | 要求 |
|---|---|
| 策略状态 | 需要 / 不需要 / 豁免 / 待确认 |
| 原型形式 | Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 低保真草图 / 其他 |
| 权威位置 | 链接、仓库路径、Storybook 路径、截图目录或报告路径 |
| 覆盖范围 | 页面、主流程、关键状态、角色 / 权限、响应式设备或浏览器范围 |
| 未覆盖项 | 明确哪些页面、状态、角色、设备或异常暂不覆盖 |
| Mock / 降级口径 | 用户可见提示、替换真实能力的条件和后续任务 |
| 与文档关系 | 映射到 `REQ / Page-ID / Flow-ID / API-ID / TC-ID` |
| 确认状态 | 待评审 / 已评审 / 条件通过 / 退回修改 |
| 默认 UI 标准基线 | 说明采用的成熟产品 / 设计系统基线、信息密度、字号 / 行高倾向和偏离默认的理由 |
| 实施顺序判断 | UI / 原型优先、后端 / 技术验证优先、双轨并行或豁免，并说明依据、风险和汇合点 |
| 用户确认依据 | 记录评审人、日期、确认范围、未确认项、回填位置和 open items |
| 晋级 Gate | 至少检查 UI-G-004 / UI-G-006：确认后先回填文档体系；进入 Sprint 前页面流、状态、权限、接口依赖和验收路径闭合 |
| 豁免理由 | 不做原型时必须说明原因、风险、影响范围和补做时点 |

## 5. 默认 UI 标准与实施顺序

AI 不应把字体、密度、导航模式、布局基线等专业判断从零抛给用户。没有特殊品牌规范、指定设计系统、竞品偏好或行业要求时，应先给出行业常用基线并让用户确认方向。

| UI 类型 | 默认参考风格 | 默认密度 / 字号 | 说明 |
|---|---|---|---|
| 管理后台 / 表单系统 | Ant Design / Fluent / Atlassian 类后台 | 正文 13–14px，label / meta 11–12px | 适合 CRUD、配置、权限、列表筛选 |
| 知识库 / 文档工作台 | Notion / Obsidian / Linear / 飞书文档类生产力工具 | 正文 13–14px，列表行 36–48px | 适合文档编辑、搜索、来源阅读、侧栏导航 |
| 数据密集表格 | Data grid / BI / issue tracker | 正文 12–13px，行高 32–40px | 适合记录、日志、指标、告警和批量操作 |
| 聊天 / 问答界面 | ChatGPT / Slack / Copilot 类问答 | 正文 14–15px，消息气泡或阅读区 | 适合长答案阅读、多轮对话和来源引用 |
| 营销落地页 / 展示页 | 官网 / Landing page | 正文 16px+，标题更大 | 适合品牌展示，不适合高密度工作台 |

实施顺序按风险选择：

| 场景 | 建议优先级 | 说明 |
|---|---|---|
| 用户体验、演示效果、操作路径是成败关键 | UI / 原型优先 | 先确认页面方向和点击路径，再实现功能，避免后期返工 |
| 外部依赖、数据流、模型、性能或资源是成败关键 | 后端 / 技术验证优先 | 先做最小技术验证，同时记录 UI 暂缓原因、后续确认时点和风险 |
| UI 与后端都高风险 | 双轨并行 | 后端做最小 vertical slice，前端做静态 / Mock 原型，二者在接口契约处汇合 |
| 纯内部脚本、CLI、无点击界面 | 豁免 UI Gate | 记录豁免理由和影响范围即可 |
| 既有成熟设计系统已指定 | 设计系统优先 | 按组件库 / token 出原型，避免自造样式 |

## 6. 原型形式选择建议

| 场景 | 推荐形式 | 理由 |
|---|---|---|
| 早期确认信息架构 | 低保真草图 / 截图标注 | 低成本，避免提前锁死技术方案 |
| 工程驱动 Demo | 代码原型 + Mock 数据 + 截图 / smoke 证据 | 接近实现，便于验收路径复用 |
| 多角色 / 高保真协作 | Figma / Penpot | 便于评审视觉、权限可见性和设计系统 |
| 组件库或复杂组件 | Storybook | 便于状态覆盖和组件级验收 |
| 只需流程确认 | Balsamiq / Axure / 流程图 | 聚焦点击路径和状态转换 |

## 7. 晋级 Gate、验收与回填

| Gate | 从 | 到 | 本标准关注点 |
|---|---|---|---|
| UI-G-004 | prototype confirmation | document-system update | 可视化原型确认后，先回填 UI 原型策略 / experience brief / frontend-interaction / open items，不直接进入实现 |
| UI-G-006 | frontend-interaction | implementation prototype / Sprint | 页面流、状态、权限、接口依赖、验收路径闭合，设计评审为 Go / Conditional Go |
| UI-G-007 | implementation | verification | 验证命令、人工步骤、截图或 smoke 证据写入 `09` |

| 原型覆盖项 | 回填位置 | 验收入口 |
|---|---|---|
| 页面 / 路由 | `docs/design/frontend-interaction.md` | Page-ID / Flow-ID |
| 新需求或范围变化 | `01/02/03` + open items | 用户确认后再进入设计 |
| 新接口或数据字段 | `06/07` | API-ID / Table / Field |
| 点击验收路径 | `09` | TC-ID / 证据路径 |
| 实现偏差 | `docs/design/frontend-interaction.md` §实现偏差 | Sprint 完成包 |

## 8. 审计 checklist

- 是否明确区分需求探索原型与实现前 UI 原型策略。
- 是否已识别 UI brief、参考分析、视觉探索或 experience brief 是否仍未完成。
- 是否记录默认 UI 标准基线、信息密度和偏离默认的理由。
- 是否记录 UI / 原型优先、后端 / 技术验证优先、双轨并行或豁免。
- 是否记录原型形式、权威位置、覆盖范围、未覆盖项和确认状态。
- 是否覆盖 Mock / 降级 / 风险提示的用户可见口径。
- 是否映射到 `frontend-interaction`、`08` Sprint 和 `09` TC。
- 是否把原型发现的新需求、接口、权限或验收变化回到正式文档链路。
- 是否完成 UI-G-004 / UI-G-006 / UI-G-007 对应回填与验证记录。

## 9. 禁止项

- 禁止用原型替代 `00-09`、前端交互设计或 `09` 验收记录。
- 禁止让原型新增未授权需求、接口、表字段、权限规则或验收目标。
- 禁止把探索原型写成已确认实现前原型。
- 禁止把未覆盖状态、角色或设备默认视为已验收。
- 禁止把用户未确认的视觉候选、信息架构候选或 AI 默认建议写成正式设计事实。
- 禁止可视化原型确认后绕过 `frontend-interaction`、`08`、`09` 直接编码。
