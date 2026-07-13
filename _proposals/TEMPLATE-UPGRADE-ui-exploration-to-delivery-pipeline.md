# TEMPLATE-UPGRADE-ui-exploration-to-delivery-pipeline

> 来源：LUMEN Demo T2.1（emily8421/LUMEN-DEMO）派生项目回流。
> 去项目化说明：本文提炼自 UI 型派生项目的前端设计探索链路，不包含具体客户资料、私有路径、真实业务敏感内容或不可公开的运行信息。示例中的产品名 / 文档名均可在模板化落地时替换为通用占位。

## 1. 背景与问题

当前模板已经有若干 UI 相关机制：

- `review-inputs`：评审原始输入是否足以进入需求 / 文档体系。
- `ui-prototype-exploration`：在需求未确认前做需求探索原型。
- `edit-single-doc`：修订 `docs/design/frontend-interaction.md` 等正式设计文档。
- UI 原型策略 / Gate：实现前确认是否需要代码原型、截图、HTML 原型等。
- 已有派生提案：`TEMPLATE-UPGRADE-ui-brief-intake-guidance-scenario.md`、`TEMPLATE-UPGRADE-v1.44.0-ui-prototype-gate.md`。

但在实际 UI 型项目中，常见路径并不是一次性从输入跳到 `frontend-interaction`，而是：

```text
输入材料
  → 前端交互需求分析 / 竞品·参考分析
  → 需求探索原型与视觉效果探索
  → 体验 Brief / 前端体验原则确认
  → 正式设计文档（frontend-interaction / 子系统设计）
  → 实现计划与代码实现
  → 验证与验收回填
```

如果模板没有明确这条路径，会出现几类问题：

1. **把输入材料直接写成正式设计**：竞品分析、用户发散稿、视觉探索稿尚未确认，却被写入 `docs/design/frontend-interaction.md`。
2. **混淆“需求探索原型”和“实现前 UI 原型”**：前者用于澄清需求和交互方向，后者用于实现前确认视觉 / 点击路径；二者输入、状态、回填目标不同。
3. **缺少“视觉效果探索”位置**：配色、密度、信息架构、经典 / 探索模式、空态文案等尚未到正式设计，却也不应散落在对话中。
4. **没有晋级门槛**：AI 容易从 research 直接进入 design 或实现，而没有“用户确认 / open items / 回填位置”的门禁。
5. **实现与验证回填被割裂**：UI 探索结论如果最终被实现，需要回到 `08/09` 与验收记录；若未确认，则不得成为 Sprint 必过项。

## 2. 拟改目标

新增一条模板级 UI 探索到交付的标准路径，明确每一步的产物、状态、禁止项、晋级条件和回填位置：

1. 原始输入与 UI brief 补齐。
2. 前端交互需求分析 / 参考分析。
3. 需求探索原型与视觉效果探索。
4. 体验 Brief / 前端体验原则确认。
5. 正式前端交互设计。
6. 实现前 UI 原型 / UI 原型策略。
7. 计划、实现、验证和回写。

同时，建议新增一个**独立场景**，用于 AI 主动引导客户 / 用户输入或确认交互需求：AI 可以提出默认方案、给出依据与备选方案，引导客户确认信息架构、交互原型、视觉方向、设备范围、状态反馈和实现边界。该场景不直接进入实现；只有当可视化原型或低保真方案经过用户确认后，才允许更新文档体系中关于交互原型和交互设计的正式描述。

目标不是强制所有项目都走满流程，而是为 UI 高风险、演示体验关键、输入材料发散、视觉方向未定的项目提供默认治理路径，并让“客户输入 / AI 推荐 / 用户确认 / 原型评审 / 文档回填 / 实现验证”有可审计闭环。

## 3. 建议新增标准路径

### 3.0 建议新增独立场景：UI Interaction Discovery / Frontend Interaction Intake

建议在 `template-docs/scenario-guides.md` 中新增一个独立场景，例如：

```text
A5.7 UI Interaction Discovery（前端交互需求发现与原型确认）
```

该场景用于以下用户说法：

- “帮我梳理前端交互需求 / 页面应该怎么设计”。
- “我有几个参考产品 / 截图 / 视觉想法，帮我分析怎么用于本项目”。
- “先确认交互原型 / 视觉效果，再写正式设计”。
- “AI 先推荐一个界面方案，我来确认”。
- “客户还不知道要什么界面，请 AI 引导客户输入”。

场景目标：

1. **引导输入**：AI 主动追问或给默认建议，覆盖 UI 类型、核心用户、主任务、信息架构、首屏目标、参考产品、设备范围、信息密度、视觉禁区、状态反馈、权限 / 降级提示。
2. **给出推荐**：AI 输出 1～3 个候选交互方案，每个方案带建议依据、适用条件、风险、取舍影响和不进入当前阶段的内容。
3. **确认原型**：用户确认低保真 / 静态 HTML / 代码 mock 等可视化原型方案，或要求继续迭代。
4. **形成回填决策**：确认后先更新文档体系中关于交互原型 / UI 原型策略 / 体验原则的描述，再进入正式交互设计文档。
5. **独立评审**：交互设计应独立成文，便于评估、评审和后续实现前检查，而不是散落在 `03/04/05/08/09` 或对话记录中。

该场景与既有场景的关系：

| 场景 / 命令 | 职责 | 与本场景关系 |
|---|---|---|
| `review-inputs` | 评审输入是否足以生成文档 | 本场景承接 UI 相关输入不足或发散的情况 |
| UI Brief Intake | 补齐 UI 基础偏好和演示目标 | 可作为本场景的前置或第一步 |
| `ui-prototype-exploration` | 输出需求探索原型记录 | 本场景可路由到该命令产出低保真原型 |
| `edit-single-doc` | 修订正式文档 | 只有用户确认原型 / 体验原则后才进入 |
| UI Prototype Gate | 实现前 UI 原型确认 | 本场景位于更早阶段，解决“要做什么交互”和“确认哪个方向” |

### 3.1 UI Exploration to Delivery Pipeline

建议在 `ai/document-lifecycle-rules.md`、`template-docs/scenario-guides.md` 或 `docs/README.md` 中加入如下路径说明：

```text
docs/inputs/*
  → 输入评审 / UI Brief Intake
  → docs/research/YYYY-MM-DD-frontend-ui-reference-analysis.md
  → docs/research/YYYY-MM-DD-ui-prototype-exploration.md
  → （可选）docs/research/YYYY-MM-DD-ui-visual-exploration.md / prototype.html
  → docs/design/frontend-experience-brief.md（已确认体验原则）
  → docs/design/frontend-interaction.md / 其他 docs/design/*
  → docs/08-dev-plan.md / tasks/*
  → frontend/* / tests / prototype code
  → docs/09-verification.md
```

### 3.2 产物状态与职责矩阵

| 阶段 | 推荐产物 | 状态 | 职责 | 禁止项 | 晋级条件 |
|---|---|---|---|---|---|
| 原始输入 | `docs/inputs/*` | 原始 / 未评审 | 保存用户材料、竞品说明、截图整理、发散想法 | 不直接当作需求或设计事实 | 完成输入评审或 UI brief 补齐 |
| UI brief 补齐 | `docs/inputs/ui-brief-intake.md` 或 `docs/research/*ui-brief*.md` | 待确认 | 补齐 UI 类型、参考产品、信息密度、首屏目标、设备范围、视觉禁区 | 不替代原型或正式设计 | 用户确认关键偏好或接受 AI 默认建议 |
| 前端交互参考分析 | `docs/research/*frontend-ui-reference-analysis.md` | 候选 / 分析 | 对竞品 / 参考材料做抽取、取舍、阶段建议 | 不直接新增 REQ / API / 验收 | 输出建议与待确认项 |
| 需求探索原型 | `docs/research/*ui-prototype-exploration.md` | 探索 / 待确认 | 用低保真线框、流程和状态澄清需求 / 信息架构 / 视觉方向 | 不决定架构、技术栈、接口、数据库、任务排期 | 用户确认候选需求 / 体验原则，或要求继续视觉原型 |
| 视觉效果探索 | `docs/research/*ui-visual-exploration.md`、`prototype.html`、截图 | 探索 / 待确认 | 验证配色、密度、模式切换、首屏观感、可读性 | 不作为实现完成或验收通过证据 | 用户确认视觉方向或要求调整 |
| 体验 Brief | `docs/design/frontend-experience-brief.md` | 已确认设计输入 | 沉淀已确认体验原则、阶段边界、视觉 / 信息架构方向 | 不写未确认方案；不定义 API / DB | 可回填 `frontend-interaction` |
| 正式交互设计 | `docs/design/frontend-interaction.md` | 设计事实 | 页面 / 路由、用户流、状态、权限可见性、接口依赖、验收路径 | 不新增未授权需求 / 接口 / 验收目标 | 可进入 `08/09` 和实现前 UI 原型 |
| 实现前 UI 原型 | 代码原型 / HTML / Storybook / 截图证据 | 实现前确认 | 验证正式设计的视觉与点击路径 | 不替代 `09`；不新增需求 | 用户确认 + 计划 / 验证项就绪 |
| 实现与验证 | `frontend/*`、`08`、`09` | 实现 / 已验证 | 按任务实现并验收 | 不实现 research 未确认内容 | 验证记录回写 `09` |

## 4. 关键规范与约束建议

### 4.1 区分两类原型

建议模板明确区分：

| 类型 | 触发时机 | 目的 | 产物位置 | 是否可驱动实现 |
|---|---|---|---|---|
| 需求探索原型 | 正式需求 / 体验原则未确认前 | 澄清信息架构、页面流、状态、视觉方向和候选需求 | `docs/research/*ui-prototype-exploration.md` | 否；确认后需回填正式文档 |
| 实现前 UI 原型 | 需求 / 体验原则 / 正式交互设计已确认后 | 验证实现前视觉、点击路径、组件密度和交付效果 | `docs/design/*prototype*`、`frontend/` mock、截图记录 | 可作为实现输入，但仍需 `08/09` |

禁止把需求探索原型中的页面、按钮、颜色、接口或状态直接写成已确认需求或 Sprint 必过项。

### 4.2 增加晋级 Gate

每一步进入下一步前，建议至少检查：

| Gate | 从 | 到 | 必须满足 |
|---|---|---|---|
| UI-G-001 | inputs | reference analysis | 输入材料定位明确：竞品 / 用户发散 / 会议 / 截图 / 需求输入 |
| UI-G-002 | reference analysis | exploration prototype | 已列出 AI 建议、依据、备选方案、取舍影响和待确认项 |
| UI-G-003 | exploration prototype | experience brief | 用户确认哪些候选进入正式体验原则；未确认项进入 open items |
| UI-G-004 | prototype confirmation | document-system update | 已确认的可视化原型方案已回填 UI 原型策略 / 体验 brief / open items；未确认项未进入正式设计 |
| UI-G-005 | experience brief | frontend-interaction | 已确认阶段边界：P1 / P2 / 愿景，且不新增未授权 REQ；交互设计独立成文，便于评估与评审 |
| UI-G-006 | frontend-interaction | implementation prototype / Sprint | 页面流、状态、权限、接口依赖、验收路径已闭合；设计评审结论为 Go / Conditional Go |
| UI-G-007 | implementation | verification | 验证命令 / 人工步骤 / 截图 / smoke 证据已记录到 `09` |

### 4.2.1 可视化原型确认后的文档回填规则

当低保真线框、静态 HTML、代码 mock、截图标注或其他可视化原型被用户确认后，AI 不应直接进入实现。建议模板要求先检查和回填：

| 回填对象 | 回填内容 | 说明 |
|---|---|---|
| `docs/research/*ui-prototype-exploration.md` | 用户确认结果、被采纳方案、未采纳方案、open items 状态 | 保留探索过程和取舍依据 |
| `docs/design/frontend-experience-brief.md` | 已确认体验原则、信息架构、视觉 / 密度 / 文案方向、阶段边界 | 作为正式交互设计的上游输入 |
| `docs/design/frontend-interaction.md` 或独立交互设计文档 | 页面 / 视图、用户流、状态、权限可见性、接口依赖、验收路径 | 独立成文，便于评估与评审 |
| `docs/08-dev-plan.md` | 若进入实现，新增或更新 Sprint / Task、禁止事项、验收标准 | 未排期前不写入当前 Sprint |
| `docs/09-verification.md` | 若进入实现或 UI 原型验收，新增对应 TC / smoke / 截图证据位置 | research 原型不等于验收通过 |

禁止项：

- 用户未确认的原型方案不得进入 `frontend-interaction` 的已确认设计。
- 可视化原型确认不等于实现排期确认；进入实现仍需 `08/09`。
- 原型中的按钮、接口、数据字段、权限规则不得绕过 `02/03/06/07` 直接实现。
- 若视觉方向只被“偏好确认”，不得把颜色 / 动效写成必过验收，除非 `09` 明确增加视觉验收项。

### 4.3 视觉探索的特殊约束

视觉效果探索需要额外状态标签：

- `视觉候选`：配色、字体、密度、卡片 / 列表 / 图谱风格尚未确认。
- `已确认视觉方向`：用户确认可进入体验 brief 或正式设计。
- `视觉验证失败`：用户认为不符合调性，需回到探索稿。

视觉探索不得：

- 绑定具体组件库或前端技术栈，除非 `05-tech-spec` 已确认。
- 把颜色 / 动效 / 字体写成验收标准，除非 `09` 已新增对应 TC。
- 用“好看”替代可读性、密度、权限提示、错误态、空态、降级态等可验证标准。

### 4.4 大规模 UI / 信息架构探索约束

当输入材料出现“大量文档 / 多项目 / 多层目录 / 图谱 / 关系图 / 时间轴 / 看板 / 数据密集”等信号时，建议模板提示 AI 输出：

1. 分层信息架构，而非单屏铺满。
2. 经典路径 / 逃生舱，例如目录树、列表、搜索。
3. 探索视图的节点规模限制和自动降级规则。
4. “候选关系 / 待确认关系 / 已确认关系”的状态区分。
5. 权限过滤和不可见节点 / 来源的处理口径。

## 5. 建议修改位置

| 文件 | 建议修改 |
|---|---|
| `ai/document-lifecycle-rules.md` | 在 UI 原型 / 专题讨论附近新增“UI Exploration to Delivery Pipeline”路径与 Gate |
| `docs/README.md` | 在 `docs/research/` 说明中补充前端交互参考分析、需求探索原型、视觉探索、体验 brief 的分区关系 |
| `ai/commands/README.md` | 为“输入材料 → 前端交互需求分析 → 需求探索原型 → 体验 brief → 正式设计”增加自然语言路由说明 |
| `ai/commands/ui-prototype-exploration.md` | 强化“需求探索原型”与“实现前 UI 原型”的区别 |
| `ai/prompts/docs/22-ui-prototype-exploration.md` | 增加视觉效果探索、分层 IA、经典 / 探索模式、可视化降级、回填 Gate 字段 |
| `template-docs/ui-prototype-exploration-template.md` | 增加“视觉候选”“已确认需求候选”“晋级 Gate”“建议回填路径”小节 |
| `ai/prompts/docs/04-edit-single-doc.md` | 若依据来自 research / prototype，要求说明用户确认记录和 open item 关闭状态 |
| `template-docs/scenario-guides.md` | 新增独立场景 `UI Interaction Discovery / Frontend Interaction Intake`：AI 引导客户输入、推荐方案、确认交互原型、回填正式文档 |
| `ai/commands/README.md` / 新命令文件 | 可选新增 `ui-interaction-discovery` 命令，路由“引导客户确认前端交互需求 / 先确认交互原型”等自然语言 |

## 6. 建议新增 / 调整模板字段

### 6.0 独立交互设计文档建议

建议模板明确：当 UI 交互复杂、需要客户评审、存在多模式 / 多状态 / 多层级信息架构 / 视觉探索时，应独立产出交互设计文档，避免把交互方案散落在 `03`、`04`、`05` 或实现计划中。

推荐路径：

```text
docs/design/frontend-interaction.md
```

复杂项目可拆分：

```text
docs/design/customer-app-interaction.md
docs/design/admin-console-interaction.md
docs/design/frontend-experience-brief.md
```

独立交互设计文档至少覆盖：

- 目标用户 / 场景 / 主任务。
- 页面 / 视图 / 路由清单。
- 信息架构、导航、模式切换和面包屑 / 逃生路径。
- 用户流与状态机。
- 加载 / 空态 / 错误 / 禁用 / 成功 / 无权限 / 降级 / 风险提示。
- 权限可见性与后端权限边界说明。
- 接口依赖和不可新增接口约束。
- UI 原型 / 可视化原型的确认状态与证据位置。
- 验收路径和回填到 `08/09` 的建议。
- 待确认项和设计评审结论。

### 6.1 需求探索原型模板新增字段

建议 `template-docs/ui-prototype-exploration-template.md` 增加：

```markdown
## 原型类型

- 类型：需求探索原型 / 视觉效果探索 / 实现前 UI 原型（只能选一个主类型）
- 是否可驱动实现：否 / 条件是 / 是
- 晋级目标：open items / experience brief / frontend-interaction / 08/09

## 视觉候选

| 视觉项 | 候选方向 | 依据 | 状态 | 回填位置 |

## 晋级 Gate

| Gate | 是否满足 | 证据 | 未满足影响 |
```

### 6.2 体验 Brief 推荐结构

如模板接受 `docs/design/frontend-experience-brief.md`，建议结构为：

```markdown
# Frontend Experience Brief

> 定位：已确认体验原则与 UI 方向，不替代 frontend-interaction。

## 0. 元信息
## 1. 已确认体验原则
## 2. 信息架构方向
## 3. 视觉 / 密度 / 文案方向
## 4. 阶段边界（P1 / P2 / 愿景）
## 5. 不进入实现的候选项
## 6. 回填到 frontend-interaction / 08 / 09 的建议
## 7. 待确认项
```

## 7. 与既有提案关系

| 既有提案 / 规则 | 覆盖内容 | 本提案补充内容 |
|---|---|---|
| `TEMPLATE-UPGRADE-ui-brief-intake-guidance-scenario.md` | UI 输入补齐、参考产品、密度、首屏目标 | 本提案承接 UI brief 之后的完整探索 → 设计 → 实现 → 验证路径 |
| `TEMPLATE-UPGRADE-v1.44.0-ui-prototype-gate.md` | 实现前 UI 原型 Gate、行业默认视觉标准 | 本提案区分需求探索原型、视觉探索和实现前 UI 原型 |
| `ui-prototype-exploration` 命令 | 需求探索原型 | 本提案要求补充晋级 Gate、视觉候选、回填目标和状态转换 |
| `edit-single-doc` | 修订正式文档 | 本提案要求 research / prototype 晋级到 design 前必须有用户确认依据 |
| 本提案新增独立场景 | 客户交互需求引导与确认 | 把“AI 引导客户输入 / AI 推荐方案 / 用户确认原型 / 文档回填 / 独立交互设计评审”串成可执行路径 |

## 8. 验收标准

模板维护者落地后，应满足：

1. AI 能在用户给出 UI 参考材料时，先输出 `research` 分析，而不是直接改正式设计。
2. AI 能判断何时做需求探索原型，何时做实现前 UI 原型。
3. AI 能把视觉探索结论标为候选，等待用户确认后再进入 `frontend-experience-brief` 或 `frontend-interaction`。
4. AI 能在客户输入不足时主动提出交互方案问题集和 AI 推荐方案，而不是等待用户给出专业 UI brief。
5. AI 能在可视化原型确认后，先更新 UI 原型策略 / experience brief / frontend-interaction 等文档，再进入实现计划。
6. AI 能在正式实现前检查 `frontend-interaction`、`08`、`09` 是否已有页面流、状态、权限、接口和验收路径。
7. AI 不会把 research / prototype 中未确认内容写入 Sprint 必过项。
8. 对大规模信息架构 / 图谱类 UI，AI 会主动提出分层、经典路径和降级规则。

## 9. 影响面

- 规则文件：`ai/document-lifecycle-rules.md`、`docs/README.md`。
- 命令路由：`ai/commands/README.md`、`ai/commands/ui-prototype-exploration.md`，可选新增 `ai/commands/ui-interaction-discovery.md`。
- Prompt：`ai/prompts/docs/22-ui-prototype-exploration.md`、`ai/prompts/docs/04-edit-single-doc.md`。
- 模板文档：`template-docs/ui-prototype-exploration-template.md`，可选新增 `template-docs/frontend-experience-brief-template.md`。
- 场景引导：`template-docs/scenario-guides.md`。

## 10. 版本影响建议

- 变更类型：模板方法论增强。
- 建议版本：minor（例如 `v1.48.x` 或后续 minor）。
- 兼容性：向后兼容；不要求既有项目补齐该链路，但新 UI 型项目和后续 UI 重构可按该路径执行。

## 11. 待维护者确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| UI-PIPE-001 | 是否新增完整 UI Exploration to Delivery Pipeline | 建议新增 | 当前模板已有分散机制，但缺少端到端晋级路径 | 仅增强现有 UI 原型命令 | 只增强单点仍可能混淆探索原型与实现原型 |
| UI-PIPE-002 | 是否新增 `frontend-experience-brief` 模板 | 建议新增可选模板 | research 到 frontend-interaction 之间需要“已确认体验原则”承接层 | 直接回填 frontend-interaction | 容易把候选与正式设计混在一起 |
| UI-PIPE-003 | 是否把视觉效果探索作为独立 research 类型 | 建议纳入 `docs/research/*ui-visual-exploration*` | 配色 / 密度 / 风格常需单独评审，不等同需求探索 | 合并到 ui-prototype-exploration | 简化文件数量，但状态可能混乱 |
| UI-PIPE-004 | 是否把大规模 IA / 图谱降级规则写入模板 | 建议写入为触发提示 | 图谱 / 关系图常在大规模数据下失效，需默认提醒 | 仅由具体项目判断 | 容易重复踩坑 |
| UI-PIPE-005 | 是否要求 research / prototype 晋级 design 前记录用户确认依据 | 建议要求 | 防止未确认探索结论进入正式设计和实现 | 只在最终总结提醒 | 约束弱，难审计 |
| UI-PIPE-006 | 是否新增独立 `UI Interaction Discovery` 场景 | 建议新增 | 用户往往不会给专业交互需求，AI 需要主动引导输入、推荐方案并推动确认 | 并入 UI Brief Intake 或 ui-prototype-exploration | 并入后容易继续混淆“补输入”“做探索原型”“实现前原型” |
| UI-PIPE-007 | 可视化原型确认后是否强制先回填文档体系 | 建议强制 | 原型确认只是设计输入确认，不等于实现排期或验收通过 | 允许直接进入实现 | 容易绕过 frontend-interaction / 08 / 09，导致验收不可追溯 |
| UI-PIPE-008 | 是否要求复杂交互设计独立成文 | 建议要求 | 独立交互设计便于客户评审、AI 审查、实现前检查和后续回写 | 合并在 04 / 05 / 08 | 易散落、难评审、难验证 |

## 12. 非目标

- 不规定具体 UI 风格、组件库、配色或技术栈。
- 不要求所有 UI 项目必须生成所有中间文档。
- 不替代 `frontend-interaction`、`08`、`09` 的正式设计与验收职责。
- 不把低保真原型或视觉探索作为验收通过证据。
