# UI Prototype Strategy Scaffold（UI 原型策略 / 实现前原型结构模板）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 推荐落盘位置：`ai/project-rules.md` §2.7、`docs/05-tech-spec.md`、`docs/design/frontend-interaction.md` 或独立策略记录
> 对应标准：`ai/doc-standards/ui-prototype-strategy.md`
> 定位：已有需求链和基本设计后、进入前端实现前确认原型形式、覆盖范围和验收映射；不是需求权威源。

## 0. 元信息

【撰写提要：记录适用入口、触发原因、决策状态、关联需求 / 页面 / Sprint 和更新时间。】

| 字段 | 内容 |
|---|---|
| 适用入口 / 页面范围 | |
| 触发原因 | Demo / MVP 演示、复杂表单、多状态、多角色、Mock / 降级口径等 |
| 决策状态 | 需要 / 不需要 / 豁免 / 待确认 |
| 上游探索依据 | UI brief / 需求探索原型 / 视觉效果探索 / experience brief / 无 |
| 关联文档 | `docs/design/frontend-interaction.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` |

## 1. 与需求探索原型的区别

【撰写提要：说明本策略发生在需求已基本确认、前端实现前；如果仍在探索需求，应回到 `docs/research/*ui-prototype-exploration*.md`。】

| 对象 | 当前项目适用口径 |
|---|---|
| 需求探索原型 | |
| UI 原型策略 / 实现前原型 | |

## 1.1 默认 UI 标准与实施顺序

【撰写提要：用户没有专业 UI 规范时，先给成熟产品 / 设计系统基线；再判断 UI / 原型优先、后端 / 技术验证优先、双轨并行或豁免。】

| 项 | 结论 | 依据 | 风险 / 汇合点 |
|---|---|---|---|
| 默认 UI 标准基线 | 管理后台 / 知识库工作台 / 数据密集表格 / 问答界面 / 营销页 / 其他 | | |
| 信息密度 / 字号 / 行高 | | | |
| 实施顺序 | UI / 原型优先 / 后端或技术验证优先 / 双轨并行 / 豁免 | | |

## 2. 是否需要实现前原型

【撰写提要：给出需要 / 不需要 / 豁免的判断依据、风险和补做时点。】

| 判断项 | 结论 | 依据 |
|---|---|---|
| 用户是否需要实现前预览 | | |
| 页面信息密度是否高 | | |
| 是否存在多状态 / 多角色 / 权限可见性 | | |
| Mock / 降级口径是否需要可视化 | | |
| 最终策略 | 需要 / 不需要 / 豁免 | |

## 3. 原型形式与权威位置

【撰写提要：选择 Figma / Penpot / Balsamiq / Axure / Storybook / 代码原型 / 截图标注 / 其他，并记录权威位置。】

| 原型形式 | 权威位置 | 维护人 | 更新规则 |
|---|---|---|---|
| | | | |

## 4. 覆盖范围

【撰写提要：列出覆盖页面、主流程、状态、角色、设备 / 浏览器和明确未覆盖项。】

| 范围 | 覆盖 | 未覆盖 | 说明 |
|---|---|---|---|
| 页面 / 路由 | | | |
| 主流程 | | | |
| 页面状态 | | | |
| 角色 / 权限可见性 | | | |
| 响应式 / 设备 | | | |

## 5. Mock / 降级 / 风险可见口径

【撰写提要：说明哪些能力是 Mock、降级、默认关闭或预留，以及界面上如何避免误读。】

| 能力 | 状态 | 用户可见口径 | 替换 / 启用条件 | TC-ID |
|---|---|---|---|---|
| | Mock / 降级 / 默认关闭 / 预留 | | | |

## 6. 与实现计划和验收的映射

【撰写提要：把原型覆盖项映射到 Sprint、Task 和 TC；未覆盖项不能作为必过验收。】

| 原型覆盖项 | Sprint / Task | TC-ID | 验收方式 | 未验证风险 |
|---|---|---|---|---|
| | | | | |

## 7. 回填与变更传播

【撰写提要：若原型发现新需求、接口、权限或验收目标，必须回到正式文档链路修订。】

| 发现项 | 类型 | 回填位置 | 状态 | 阻塞关系 |
|---|---|---|---|---|
| | 需求 / 接口 / 权限 / 验收 / 文案 | | 待确认 / 已回填 / 暂缓 | |

## 7.1 晋级 Gate

| Gate | 是否满足 | 证据 | 未满足影响 |
|---|---|---|---|
| UI-G-004：可视化原型确认后先回填文档体系 | 是 / 否 / 不适用 | | |
| UI-G-006：frontend-interaction → implementation prototype / Sprint | 是 / 否 / 不适用 | | |
| UI-G-007：implementation → verification | 是 / 否 / 不适用 | | |

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|
| C-001 | | | | | |
