# UI Prototype Strategy Standard（UI 原型策略 / 实现前原型细粒度标准）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 UI 原型策略 / 实现前原型的记录标准。它适用于已有 `00-03` 需求链与基本设计后、进入前端实现前的可视化门禁；不同于 `template-docs/ui-prototype-exploration-template.md` 所描述的“需求探索原型”。

## 1. 适用范围与触发条件

满足前端交互设计触发条件，且存在以下任一情况时，应选择并记录 UI 原型策略，或写明豁免理由：

- 用户需要在实现前看到界面效果或点击路径。
- 交付物形态为 Demo / MVP，演示体验会影响验收判断。
- 页面信息密度高，包含列表、详情、搜索、问答、管理页、看板、复杂表单或数据密集界面。
- 主流程依赖点击路径验收，或存在多状态：加载、空态、错误、禁用、成功、无权限、降级、风险提示。
- 存在多角色、多租户、权限可见性、数据隔离或敏感字段展示。
- Mock / Demo / 降级能力需要在界面上明确用户可见口径。

## 2. 与需求探索原型的区别

| 类型 | 使用时点 | 权威位置 | 能否驱动实现 | 主要输出 |
|---|---|---|---|---|
| 需求探索原型 | `00-03` 定稿前 | `docs/research/YYYY-MM-DD-ui-prototype-exploration.md` | 否；确认后回填需求链 | 需求假设、页面流、用户反馈 |
| UI 原型策略 / 实现前原型 | `00-03` 已有、前端实现前 | `ai/project-rules.md` §2.7、`docs/05-tech-spec.md` 或 `docs/design/frontend-interaction.md` | 仅在承接已授权需求时可作为实现参考 | 原型形式、覆盖范围、证据与验收映射 |

## 3. 推荐记录位置

- 简单项目：记录在 `ai/project-rules.md` §2.7。
- 技术方案相关：记录在 `docs/05-tech-spec.md` 的 UI 原型策略 / 前端约束段落。
- UI 型项目：记录在 `docs/design/frontend-interaction.md`，并引用 `template-docs/ui-prototype-strategy-template.md`。
- 仅探索阶段：使用 `template-docs/ui-prototype-exploration-template.md`，不要写成 UI 原型策略已确认。

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
| 豁免理由 | 不做原型时必须说明原因、风险、影响范围和补做时点 |

## 5. 原型形式选择建议

| 场景 | 推荐形式 | 理由 |
|---|---|---|
| 早期确认信息架构 | 低保真草图 / 截图标注 | 低成本，避免提前锁死技术方案 |
| 工程驱动 Demo | 代码原型 + Mock 数据 + 截图 / smoke 证据 | 接近实现，便于验收路径复用 |
| 多角色 / 高保真协作 | Figma / Penpot | 便于评审视觉、权限可见性和设计系统 |
| 组件库或复杂组件 | Storybook | 便于状态覆盖和组件级验收 |
| 只需流程确认 | Balsamiq / Axure / 流程图 | 聚焦点击路径和状态转换 |

## 6. 验收与回填

| 原型覆盖项 | 回填位置 | 验收入口 |
|---|---|---|
| 页面 / 路由 | `docs/design/frontend-interaction.md` | Page-ID / Flow-ID |
| 新需求或范围变化 | `01/02/03` + open items | 用户确认后再进入设计 |
| 新接口或数据字段 | `06/07` | API-ID / Table / Field |
| 点击验收路径 | `09` | TC-ID / 证据路径 |
| 实现偏差 | `docs/design/frontend-interaction.md` §实现偏差 | Sprint 完成包 |

## 7. 审计 checklist

- 是否明确区分需求探索原型与实现前 UI 原型策略。
- 是否记录原型形式、权威位置、覆盖范围、未覆盖项和确认状态。
- 是否覆盖 Mock / 降级 / 风险提示的用户可见口径。
- 是否映射到 `frontend-interaction`、`08` Sprint 和 `09` TC。
- 是否把原型发现的新需求、接口、权限或验收变化回到正式文档链路。

## 8. 禁止项

- 禁止用原型替代 `00-09`、前端交互设计或 `09` 验收记录。
- 禁止让原型新增未授权需求、接口、表字段、权限规则或验收目标。
- 禁止把探索原型写成已确认实现前原型。
- 禁止把未覆盖状态、角色或设备默认视为已验收。
