# 07 文档反向同步

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：当实现结果与 `docs/` 中的设计产生差异时，先把事实同步回文档。

**目的**：避免代码已经改变但文档仍描述旧事实，导致后续 AI 或人按错误设计继续开发。

**适用场景**：实现中发现原设计不可行、子系统流程 / 状态机偏差、接口字段调整、DB 字段调整、权限边界变化、Mock / 降级差异、验收口径变化等。

**不适用场景**：实现超出当前 Phase 或新增未经批准功能；这种情况应先审查是否越界，而不是直接改文档背书。

**使用前准备**：列出实际实现与文档差异、变化原因、涉及文件和是否仍在 Phase 边界内。

**预期产出**：受影响文档的修订建议、章节清单和边界确认。

**使用后下一步**：文档确认后再继续开发；如需补代码，用 `ai/prompts/dev/02-run-task.md` 或 `ai/prompts/dev/05-fix-bug.md`。

```text
本次代码实现与 docs/ 中的设计存在以下差异：（说明差异点）

请：
1. 先按 `ai/document-lifecycle-rules.md` 判断代码事实对应的 task / Sprint / REQ、变更类型和下游影响
2. 若代码实现超出已批准需求或当前 Phase，优先标记为越界风险，而不是直接把越界事实写入需求文档
3. 对仍在边界内的差异，更新 docs/ 中受影响的文档（如 `docs/design/*` 的实现偏差 / 设计回写区、`06-db-design.md`、`07-api-spec.md`），使文档与实际实现一致
4. 若实现结果包含子系统行为偏差、流程 / 状态机变化、权限边界变化、Mock / 降级条件通过、验证事实、Sprint 完成状态、缺陷 / 回归结果或残留风险，必须说明对 `docs/design/*`、`docs/08-dev-plan.md`、`docs/09-verification.md` 和 handoff 的回写影响；长期事实不得只留在 handoff 或 PR 描述中
5. 说明更新了哪些文档、哪些章节，以及 `REQ / NFR → Phase → Design Point → Sprint / Task → TC-ID` 追溯链是否仍完整
6. 若发现未确认决策或实现与文档差异需要人工选择，输出结构化待确认项：`ID / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`
7. 文档更新确认后，再继续后续开发
```
