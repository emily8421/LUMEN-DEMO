# AI 任务启动入口

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

首次在本模板项目里启动 AI 工作时，从这里入手——下面 4 个入口覆盖场景引导 / 命令 / 速查 / Prompt（明细表见各权威位置）。AI 工具会自动读取 `ai/index.md` 规则；本文件是给人看的入口：

- **场景引导**（说一个场景 → AI 给「做什么+为什么」引导计划）→ `template-docs/scenario-guides.md`
- **场景 → 命令速查** → `SOP.md` 场景索引
- **单点命令路由**（`/run ...`）→ `ai/commands/README.md`
- **完整 Prompt**（按场景拆分）→ `ai/prompts/README.md`

> 原则：Prompt 不是需求本身。AI 只能基于 `docs/`、`ai/document-lifecycle-rules.md`、`ai/project-rules.md` 与人工确认的信息工作；输入不足先补输入，别让 AI 猜。
