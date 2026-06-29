# 08 Phase升级评估

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：评估项目是否可以从当前 Phase 进入下一 Phase。

**目的**：先确认当前阶段完成度，再草拟下一阶段允许 / 禁止 / 预告边界，避免提前解锁愿景功能。

**适用场景**：当前 Phase 的 Sprint 基本完成，准备规划下一阶段。

**不适用场景**：当前 Phase 验收尚未完成或核心缺陷未关闭；应先用 `ai/prompts/dev/09-sprint-summary.md` 做验收总结。

**使用前准备**：准备当前 `ai/project-rules.md`、`docs/03-prd.md` 路线图、`docs/08-dev-plan.md` 完成情况和验证结果。

**预期产出**：当前 Phase 完成情况、下一 Phase 解锁清单、`ai/project-rules.md` §1 更新草稿。

**使用后下一步**：人工确认 Phase 边界后，再用 `ai/prompts/docs/04-edit-single-doc.md` 修订相关文档；不要让 AI 直接推进阶段。

```text
项目准备从当前Phase进入下一Phase。

请阅读：
- ai/project-rules.md（当前Phase边界）
- docs/03-prd.md、docs/08-dev-plan.md

输出：
1. 当前Phase的完成情况核对
2. 下一Phase可以解锁的功能/技术清单
3. 针对 ai/project-rules.md 的"Phase边界"一节，给出更新后的内容草稿
   （允许/禁止/下一阶段预告三段式），等待人工确认后再实际修改该文件
```
