# Document Standards（文档规范镜像）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录用于保存模板 `docs/00-09` 撰写规范在派生项目中的只读镜像。

## 定位

- `ai/doc-standards/00-09` 是 AI 使用的文档标准 / 审计基线，不是项目事实文档。
- 派生项目自己的需求、设计、计划和验证事实仍写在 `docs/00-09`。
- 本目录由 `scripts/sync-template.*` 下行同步刷新；派生项目不应手工修改镜像文件。
- AI 做文档体系审计、生成回梳或章节完整性检查时，可将本目录作为规范对照。

## 待人工确认项基线

`docs/00-09` 和 `docs/design/*` 的“待人工确认项”应采用结构化表格，而不是纯问题列表。最低字段为：`ID`、`待确认项`、`AI 建议`、`建议依据`、`备选方案`、`取舍影响 / 阻塞关系`。AI 建议只用于辅助判断，用户确认前不得写成已确认事实；确认后应回填到权威文档或续接文件。

## 前端交互设计基线

UI 型项目的前端交互设计属于条件性 `docs/design/*` 详细设计，推荐路径为 `docs/design/frontend-interaction.md`。其职责是承接 `03/04/05/07/08/09`，细化页面信息架构、路由清单、核心用户流、组件职责、状态 / 空态 / 错误态、表单校验、文案、接口依赖、响应式与可访问性、验收路径和阶段增量。该文档不得新增未授权需求、接口或验收目标；前端隐藏入口、按钮禁用或路由守卫只能作为可见性控制，不能替代后端接口和服务层权限边界。

## 与旧路径的关系

旧路径 `docs/_scaffold/00-09` 是 v1.18.x 的规范镜像位置。迁移期内，审计提示词和边界检查可兼容旧路径；长期主路径为 `ai/doc-standards/00-09`。
