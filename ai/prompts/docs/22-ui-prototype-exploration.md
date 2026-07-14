# 22 需求探索原型（UI Prototype Exploration）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在正式 `00-03` 需求文档定稿、架构和技术路线选择前，用轻量 UI 原型帮助用户确认需求、页面结构、主流程、状态、信息密度和文案方向；也用于 UI brief 之后、正式前端交互设计之前的视觉效果探索和大规模信息架构探索。

**快捷命令**：`/run ui-prototype-exploration`（自然语言：先看原型 / 先做页面原型确认需求 / Demo 前先确认交互 / 先别定技术栈先画界面流程）。

**目的**：把“想法阶段的界面和流程讨论”与“已确认需求 / 架构 / 实现设计”分开，避免 UI 想象直接变成 PRD、技术栈、接口或任务。

**适用场景**：用户正在构思系统，想先看低保真原型、页面流、可点击草图、截图标注、视觉效果探索或静态 Mock 来与用户 / 客户确认需求、信息架构、视觉方向和状态反馈；尤其适用于 Demo 前、生成 00-03 前、技术栈尚未确定前，或 UI brief 已补齐但正式 `frontend-interaction` 尚未定稿前。

**不适用场景**：替代 `00-03` 正式需求、替代 `docs/design/frontend-interaction.md`、替代 `ai/project-rules.md` §2.7 UI 原型策略、替代 `09` 验收记录，或直接生成生产代码。

**使用前准备**：读取 `ai/index.md`、`ai/document-lifecycle-rules.md §5.2.1 / §10.2`、`docs/README.md`、`template-docs/ui-brief-intake-template.md` 和 `template-docs/ui-prototype-exploration-template.md`。若已有输入材料，读取 `docs/inputs/*`、`docs/vision/product-vision.md` 或当前会话中的用户描述；若缺参考产品、演示主线、页面结构、信息密度、设备范围或视觉禁区，先转 A25 UI Brief Intake 补齐，不要直接画原型。

**预期产出**：需求探索原型方案、视觉候选、页面 / 流程 / 状态草案、待确认假设、用户反馈记录位、晋级 Gate 判断、建议回填到 `00-03` / experience brief / frontend-interaction / open items 的候选内容和下一步建议。默认不写文件；若用户确认，可落盘到 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`，视觉探索可落盘到 `docs/research/YYYY-MM-DD-ui-visual-exploration.md` 或同目录原型证据。

```text
请先做需求探索原型，不要直接定架构、技术栈、接口、数据库或编码任务。

触发场景（可任选）：
1. 用户说“我想先看原型 / 先做页面原型确认需求”。
2. 用户说“先别定技术栈，先把界面和流程画出来”。
3. 用户希望 Demo 前先与客户 / 用户确认交互。
4. 输入材料还不足以生成完整 00-03，但可以通过页面和流程原型澄清需求。
5. UI brief 已补齐，但仍需要确认视觉方向、信息密度、分层信息架构、经典路径或大规模 UI 降级规则。

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/document-lifecycle-rules.md §5.2.1（UI Exploration to Delivery Pipeline）与 §10.2（需求探索原型边界）
- docs/README.md（文档分区规则）
- template-docs/ui-brief-intake-template.md
- template-docs/ui-prototype-exploration-template.md
- docs/inputs/*、docs/vision/product-vision.md、docs/00-03（如已存在）

执行要求：
1. 先说明本次原型定位：探索 / 待确认，不是正式需求、架构、技术栈、接口、数据库、任务或验收事实。
2. 先收敛最小输入：目标用户、核心场景、用户目标、主任务、非目标、成功标准、参考产品 / 截图、页面结构、信息密度、设备范围、视觉禁区和需要通过原型确认的问题；若 UI brief 缺失，先输出 UI 输入缺口并建议写入 `docs/inputs/ui-brief.md` 或 `docs/research/YYYY-MM-DD-ui-brief-intake.md`。
3. 先判断原型主类型：需求探索原型 / 视觉效果探索 / 实现前 UI 原型（只能选一个主类型）。若属于实现前 UI 原型，停止本命令并转 UI 原型策略 / `edit-single-doc`，不得把实现前确认混入需求探索。
4. 输出 2-3 个原型形式选项并推荐一种：低保真草图 / Figma / Penpot / 截图标注 / HTML 静态页 / 代码静态 Mock / 其他；没有用户特殊要求时，AI 应给出默认成熟产品 / 设计系统基线、信息密度和布局建议。
5. 生成页面 / 视图清单、主流程草案、关键状态（加载 / 空态 / 错误 / 禁用 / 成功 / 无权限 / 降级 / 风险提示）、文案 / 信息密度注意点和视觉候选；每个候选要标状态：视觉候选 / 已确认视觉方向 / 视觉验证失败。
6. 若输入出现大量文档、多项目、多层目录、图谱、关系图、时间轴、看板或数据密集信号，必须输出分层信息架构、经典路径 / 逃生舱、探索视图节点规模限制、自动降级规则、候选 / 待确认 / 已确认关系状态和权限过滤口径。
7. 明确每个页面、流程、状态和视觉项的“假设状态”：探索 / 待确认 / 用户已确认 / 不做。
8. 输出“用户反馈记录位”和“待确认假设 / open items”，字段必须包含 AI 建议、建议依据、备选方案、取舍影响和回填位置。
9. 输出“建议回填路径”：`00-03` 候选需求、`docs/design/frontend-experience-brief.md` 已确认体验原则、`frontend-interaction` 设计输入、`08/09` 后续验收建议或 open items；明确未回填前不是正式事实。
10. 输出晋级 Gate 判断：UI-G-002（参考分析到探索原型）、UI-G-003（探索原型到 experience brief）、UI-G-004（可视化原型确认后先回填文档体系）。未满足时说明阻塞影响。
11. 如果用户要求落盘，建议路径为 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`；视觉探索建议 `docs/research/YYYY-MM-DD-ui-visual-exploration.md` 或同目录原型证据；并先说明写入目的、影响范围、预计变更、风险和验证方式，等待确认后再写。

边界：
- 不要把原型中的页面、按钮、接口、数据字段或状态直接写成已确认需求。
- 不要在需求探索原型阶段锁定前端框架、后端框架、数据库、模型、第三方服务或部署方案。
- 不要把原型作为验收通过证据。
- 用户确认后的内容必须回填 `00-03`，再进入 `04-05` 和后续设计 / 实现链路。
- UI brief 只补齐交互输入，不替代需求探索原型；需求探索原型也不替代 UI brief 中的来源锚点和用户确认记录。
- 视觉效果探索只产生候选或已确认视觉方向，不绑定组件库 / 技术栈，不把颜色 / 动效 / 字体写成必过验收，除非 `09` 已新增对应 TC。
- 可视化原型确认后不得直接编码；必须先检查是否回填 `00-03`、experience brief、`frontend-interaction`、UI 原型策略、`08` 和 `09`。

请输出：
1. 原型定位与边界声明。
2. 最小输入摘要与缺口。
3. 原型形式选项对比与 AI 推荐。
4. 原型主类型判断和边界说明。
5. 页面 / 视图清单。
6. 主流程草案。
7. 关键状态、视觉候选与信息密度。
8. 大规模 IA / 图谱 / 数据密集 UI 降级规则（如触发）。
9. 待确认假设 / open items。
10. 建议回填到 `00-03` / experience brief / frontend-interaction / open items 的候选内容。
11. 晋级 Gate 判断与下一步：继续迭代原型 / 用户评审 / 回填 00-03 / 写 experience brief / 进入 generate-docs / 转 UI 原型策略。
```
