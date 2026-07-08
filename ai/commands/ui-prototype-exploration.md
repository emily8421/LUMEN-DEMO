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

## 适用场景

用户还在构思系统，想通过低保真 UI 原型、页面流、可点击草图、截图标注或静态 Mock 与用户 / 客户确认需求；通常发生在正式 `00-03` 定稿、架构和技术路线选择前。

## 必读文件

- `ai/index.md`
- `ai/document-lifecycle-rules.md` §10.2
- `docs/README.md`
- `template-docs/ui-prototype-exploration-template.md`
- `ai/prompts/docs/22-ui-prototype-exploration.md`
- `docs/inputs/*`、`docs/vision/product-vision.md`、`docs/00-03`（如存在）

## 执行流程

1. 先声明本次是“需求探索原型”，不是正式需求、架构、技术栈、接口、数据库、任务或验收事实。
2. 收敛最小输入：目标用户、核心场景、主任务、非目标、成功标准和需通过原型确认的问题。
3. 给出原型形式选项与 AI 推荐，不强制 Figma，不提前锁技术栈。
4. 输出页面 / 视图清单、主流程、关键状态、文案 / 信息密度注意点和待确认假设。
5. 默认只在会话中输出；若用户确认落盘，推荐写入 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`。
6. 用户确认后，列出应回填到 `00-03` 的候选内容和下一步命令（通常 `review-inputs` / `generate-docs` / `edit-single-doc`）。

## 写入风险

默认只读。落盘探索报告、回填 `00-03` 或修改正式文档前必须确认。需求探索原型不是需求权威源；确认后的内容必须回填权威文档后才可进入设计或实现。

## 续接要求

如果原型评审后仍有关键假设未确认，应写入 open items 或 `.ai/session-handoff.md`，并标明回填位置和阻塞节点。
