# AGENTS.md

本项目的 AI 行为规范入口见 `ai/index.md`。开始分析、设计、编码或任何会改变项目状态的任务前，必须先阅读 `ai/index.md` 与 `ai/rules-core.md`，再按 `ai/index.md` 的任务路由读取对应规则包；任务类型不明确或规则覆盖不足时，回退读取完整规则包。仅当用户只要求“读取续接点 / 继续上次 / resume”且不要求继续执行任务时，可先按 `ai/session-rules.md` §3.1 快速续接模式做最小只读恢复；一旦进入后续执行，仍须回到 `ai/index.md` 规则路由流程。

## Checkpoint 节拍（codex 长任务防跑飞，每次进入都先读这段）

> 完整规则见 `ai/session-rules.md` §3.3 与 `ai/rules-core.md` §4；本段是入口前置，确保长任务中不被遗忘。

- 搜索批次（≥3 文件 / 全仓 grep）后，先回任务原点汇报“发现什么 / 还差什么 / 是否仍相关”，再继续。
- 命令失败、超时、sandbox / network / 权限错误、CI pending → 立即停并汇报，不连续重试、不继续后续步骤。
- push / 创建或合并 PR / 关闭 issue / 删除分支 / 发布 / 装依赖 / 破坏性命令 → 单步等确认。
- 低风险只读与已授权范围内编辑可合并小批次，批次末 1–3 行汇报即可，不必每步停下。
- 新增规则前先问：能否合并或删除既有规则？防跑飞靠更少更硬更自动触发，不靠更多规则。

> Sync notice: This entry file is maintained by the template sync. Derived projects normally should not edit it directly; update `ai/index.md` routing or upstream reusable changes.
