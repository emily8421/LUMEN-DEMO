# Frontend Interaction Design Standard（前端交互设计细粒度标准）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 `docs/design/frontend-interaction.md` 或 `docs/design/*interaction*.md` 的细粒度标准。它是 `ai/doc-standards/design-doc.md` 的页面 / 交互型补充，不替代 `03/04/05/07/08/09`，也不替代通用 `docs/design/*` 详细设计标准。

## 1. 适用范围与触发条件

满足以下任一条件时，开发前应补前端交互设计，或在 `ai/project-rules.md` §3 / `docs/05-tech-spec.md` 写明豁免理由：

- 交付形态包含独立 Web、移动端、小程序、桌面端或其他可点击 UI。
- 项目保留 `frontend/`，且存在多页面、多入口、多角色、复杂表单、状态流、搜索 / 问答 UI、管理页或审批流。
- 验收依赖点击路径、页面状态、表单校验、权限可见性或用户操作。
- Sprint / Task 修改范围包含页面、组件、编辑器、搜索 / 问答 UI、管理页、移动端或桌面端集成。

## 2. 设计边界

- 只细化 `03/04/05/07/08/09` 已授权需求的界面呈现、状态、文案、接口依赖和验收路径。
- 不新增 PRD 未授权需求，不定义未同步到 `docs/07-api-spec.md` 的接口，不新增 `09` 未覆盖验收目标。
- 若上游来自 UI brief、参考分析、需求探索原型、视觉效果探索或 `docs/design/frontend-experience-brief.md`，必须记录用户确认依据、采纳 / 未采纳项、open items 状态和回填位置；未确认候选不得写成已确认设计。
- 前端隐藏入口、按钮禁用或路由守卫只属于可见性控制，不能替代后端接口和服务层权限边界。
- Mock / Demo / 降级能力必须在界面文案、状态和验收记录中明确用户可见口径。

## 3. 推荐文件结构

```markdown
# Frontend Interaction Design

## 0. 文档元信息
## 1. 页面 / 路由清单与 REQ 追溯
## 2. 角色、入口与权限可见性
## 3. 核心用户流与点击路径
## 4. 页面信息架构与组件职责
## 4.1 上游体验原则与确认依据
## 5. 页面状态、表单校验与文案
## 6. 接口依赖、数据来源与错误处理
## 7. 响应式、可访问性与兼容范围
## 8. UI 原型策略与可视化证据
## 9. 验收路径与 TC 追溯
## 10. 阶段增量、实现偏差与待确认项
```

## 4. 必填结构

### 4.1 文档元信息

| 字段 | 要求 |
|---|---|
| 文档状态 | 草案 / 待确认 / P{N}-已设计 / P{N}-已实现 |
| 适用 Phase | 与 `docs/03-prd.md` §3 一致 |
| 交付物形态 | Demo / MVP / 产品；不得与 Phase 混用 |
| 上游依据 | `REQ / NFR / COMP / MOD / Flow / API / TC` |
| 体验原则依据 | `docs/inputs/ui-brief.md` / `docs/research/*ui-prototype-exploration*.md` / `docs/research/*ui-visual-exploration*.md` / `docs/design/frontend-experience-brief.md` / 无 |
| 用户确认依据 | 评审日期、评审人、确认范围、未确认项和 open items 链接 |
| UI 原型策略 | 需要 / 不需要 / 豁免；引用 `ai/doc-standards/ui-prototype-strategy.md` |

### 4.2 页面 / 路由清单与 REQ 追溯

| Page-ID | 页面 / 路由 | 入口 | 角色 | 来源 REQ / NFR | Phase | 状态 | 关联 TC |
|---|---|---|---|---|---|---|---|

### 4.3 角色、入口与权限可见性

| Role / Actor | 可见页面 | 可见操作 | 前端可见性控制 | 后端权限 / API-ID | 无权限表现 | 备注 |
|---|---|---|---|---|---|---|

### 4.4 核心用户流与点击路径

每个主流程至少记录入口、关键点击、状态变化、成功出口、失败 / 无权限 / 降级路径和验收引用。

| Flow-ID | 用户目标 | 入口页面 | 步骤摘要 | 成功条件 | 异常 / 降级 | 关联 TC |
|---|---|---|---|---|---|---|

### 4.5 页面信息架构与组件职责

若输入涉及大量文档、多项目、多层目录、图谱、关系图、时间轴、看板或数据密集页面，必须说明分层信息架构、经典路径 / 逃生舱（目录树、列表、搜索）、探索视图规模限制、自动降级规则、候选 / 待确认 / 已确认关系状态，以及权限过滤和不可见节点 / 来源处理口径。

| Component-ID | 所属页面 | 职责 | 数据来源 | 状态输入 | 输出事件 | 复用 / 依赖 |
|---|---|---|---|---|---|---|

### 4.5.1 上游体验原则与确认依据

| 来源 | 已确认体验原则 | 采纳到本设计 | 未采纳 / 延后项 | 确认依据 | 回填 / Open Item |
|---|---|---|---|---|---|
| `docs/design/frontend-experience-brief.md` / `docs/research/*` / `docs/inputs/ui-brief.md` |  | 是 / 否 / 部分 |  |  |  |

### 4.6 页面状态、表单校验与文案

页面状态至少覆盖：加载、空态、错误、禁用、成功、无权限、降级、风险提示、Mock / Demo 提示。

| Page / Component | 状态 | 触发条件 | 用户可见文案 | 可操作项 | 恢复 / 重试 | 关联 TC |
|---|---|---|---|---|---|---|

### 4.7 接口依赖、数据来源与错误处理

| Page / Component | API-ID / 数据来源 | 请求时机 | 成功展示 | 错误码 / 失败态 | 脱敏 / 权限 | Mock / 降级差异 |
|---|---|---|---|---|---|---|

### 4.8 响应式、可访问性与兼容范围

| 范围 | 要求 | 验证方式 | 证据 / TC | 可延后项 |
|---|---|---|---|---|

### 4.9 UI 原型策略与可视化证据

若触发 UI 原型策略，必须引用 `docs/05-tech-spec.md`、`ai/project-rules.md` §2.7 或 `docs/design/frontend-interaction.md` 中的原型策略记录，并说明原型位置、覆盖页面 / 主流程 / 状态 / 设备范围、未覆盖项和确认状态。还应说明默认 UI 标准基线（如后台 / 知识库工作台 / 数据密集表格 / 问答界面 / 营销页）、信息密度、字号 / 行高倾向、是否偏离默认行业惯例，以及 UI / 原型优先、后端 / 技术验证优先、双轨并行或豁免的实施顺序判断。

| 原型 / 视觉项 | 形式 / 权威位置 | 默认 UI 标准基线 | 信息密度 / 布局方向 | 确认状态 | 未覆盖项 / 风险 | 关联 Gate |
|---|---|---|---|---|---|---|

### 4.10 验收路径与 TC 追溯

| REQ / NFR | Page-ID | Flow-ID | 用户操作 | 通过标准 | TC-ID | 证据路径 | 状态 |
|---|---|---|---|---|---|---|---|

### 4.11 阶段增量、实现偏差与待确认项

必须记录本 Phase 做什么、不做什么、后续 Phase 预留什么；实现后若页面、状态、接口或文案与设计不同，写入实现偏差 / 设计回写，并同步评估 `07/08/09` 影响。

## 5. 审计 checklist

- 是否每个页面 / 路由都能追溯到 REQ / NFR 和 Phase。
- 是否覆盖加载、空态、错误、禁用、成功、无权限、降级和 Mock / Demo 提示。
- 是否把权限边界落到后端 API / 服务层，而不是只靠前端隐藏。
- 是否引用或明确豁免 UI 原型策略。
- 是否记录 UI brief / research / prototype / experience brief 的用户确认依据。
- 是否把默认 UI 标准基线、信息密度和实施顺序判断落到原型策略或本设计。
- 是否把页面验收路径映射到 `09` 的 TC-ID。

## 6. 禁止项

- 禁止把前端交互设计写成新需求来源。
- 禁止定义 `docs/07-api-spec.md` 不存在或未确认的稳定接口。
- 禁止用前端路由守卫替代权限边界。
- 禁止把 Mock / 降级 UI 写成真实能力已启用。
- 禁止无验收路径直接进入前端实现。
- 禁止把未确认的视觉候选、参考产品分析或探索原型结论写成正式设计事实。
