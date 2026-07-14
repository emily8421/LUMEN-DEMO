# Command: ui-prototype-exploration

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run ui-prototype-exploration`
- 先看原型
- 先做页面原型确认需求
- Demo 前先确认交互
- 先别定技术栈，先画界面流程
- 做一个低保真原型给用户确认
- 做视觉效果探索
- 分析参考产品 / 截图怎么用于本项目
- 先确认信息架构和界面密度

## 适用场景

用户还在构思系统，想通过低保真 UI 原型、页面流、可点击草图、截图标注、视觉效果探索或静态 Mock 与用户 / 客户确认需求、信息架构、视觉方向和状态反馈；通常发生在正式 `00-03` 定稿、架构和技术路线选择前，或发生在 UI brief 之后、正式 `frontend-interaction` 之前。

不适用于已有 `00-03`、`frontend-interaction` 且准备编码前确认实现效果的场景；这类应转 UI 原型策略 / 实现前原型（`ai/doc-standards/ui-prototype-strategy.md` + `ai/prompts/docs/04-edit-single-doc.md`）。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md` §5.2.1、§10.2
- `docs/README.md`
- `template-docs/ui-brief-intake-template.md`
- `template-docs/ui-prototype-exploration-template.md`
- `ai/prompts/docs/22-ui-prototype-exploration.md`
- `docs/inputs/*`、`docs/vision/product-vision.md`、`docs/00-03`（如存在）

## 执行流程

1. 先声明本次是“需求探索原型”，不是正式需求、架构、技术栈、接口、数据库、任务或验收事实。
2. 收敛最小输入：目标用户、核心场景、主任务、非目标、成功标准、参考产品 / 截图、信息密度、设备范围、视觉禁区和需通过原型确认的问题；缺 UI brief 时先转 A25。
3. 判断原型主类型：需求探索原型 / 视觉效果探索 / 实现前 UI 原型。若是实现前 UI 原型，停止并转 UI 原型策略，不在本命令内继续。
4. 给出原型形式选项与 AI 推荐，不强制 Figma，不提前锁技术栈；没有用户特殊要求时，先给出成熟产品 / 设计系统基线、信息密度和布局建议。
5. 输出页面 / 视图清单、主流程、关键状态、文案 / 信息密度注意点、视觉候选和待确认假设；大规模 IA / 图谱 / 数据密集 UI 必须给分层、经典路径和降级规则。
6. 默认只在会话中输出；若用户确认落盘，推荐写入 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`，视觉探索可写 `docs/research/YYYY-MM-DD-ui-visual-exploration.md` 或同目录原型证据。
7. 用户确认后，列出应回填到 `00-03`、`docs/design/frontend-experience-brief.md`、`frontend-interaction` 或 open items 的候选内容和下一步命令（通常 `review-inputs` / `generate-docs` / `edit-single-doc`）。

## 写入风险

默认只读。落盘探索报告、视觉探索证据、回填 `00-03`、experience brief 或修改正式文档前必须确认。需求探索原型和视觉效果探索都不是需求权威源；确认后的内容必须回填权威文档后才可进入正式设计或实现。

## 续接要求

如果原型评审后仍有关键假设未确认，应写入 open items 或 `.ai/session-handoff.md`，并标明回填位置和阻塞节点。
