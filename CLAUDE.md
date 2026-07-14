# CLAUDE.md

本项目的 AI 行为规范入口见 `ai/index.md`。开始分析、设计、编码或任何会改变项目状态的任务前，必须先阅读 `ai/index.md` 与 `ai/rules-core.md`，再按 `ai/index.md` 的任务路由读取对应规则包；任务类型不明确或规则覆盖不足时，回退读取完整规则包。仅当用户只要求“读取续接点 / 继续上次 / resume”且不要求继续执行任务时，可先按 `ai/session-rules.md` §3.1 快速续接模式做最小只读恢复；一旦进入后续执行，仍须回到 `ai/index.md` 规则路由流程。
> Sync notice: This entry file is maintained by the template sync. Derived projects normally should not edit it directly; update `ai/index.md` routing or upstream reusable changes.
