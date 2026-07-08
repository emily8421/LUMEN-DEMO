# 09 Sprint验收总结

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在一个 Sprint 完成后，对照验收标准做收尾总结。

**快捷命令**：`/run sprint-summary`（自然语言：Sprint 总结 / 验收总结 / 总结当前任务）。

**目的**：判断本 Sprint 是否真正完成，并沉淀修改文件、验证结果和建议提交信息。

**适用场景**：单个 Sprint 的实现和验证已经完成，准备提交或进入下一 Sprint。

**不适用场景**：还没有运行验证，或验收标准本身不清楚；应先补验证或修订 `docs/08-dev-plan.md`。

**使用前准备**：提供 Sprint 条目、实际改动、关联 REQ / Task / Test Case、测试 / 自检结果、验收证据和未完成事项。

**续接要求**：总结完成后，把已完成项、未完成项、风险、验证结果和下次优先事项写入 / 更新续接文件；长期进度和验收事实必须建议回写 `docs/08-dev-plan.md` / `docs/09-verification.md`，handoff 不替代正式记录。

**预期产出**：逐项验收结果、文件清单、验证证据、`docs/09-verification.md` 验收记录 / Sprint 验收包更新建议、commit message 建议、是否进入下一 Sprint 的判断。

**使用后下一步**：通过则提交；未通过则拆出修复任务或回到 `ai/prompts/dev/02-run-task.md`。

```text
请对照 docs/08-dev-plan.md 中 Sprint-X 的验收标准，逐项核对当前实现：

输出：
1. 验收标准逐项结果（通过/未通过+原因）
2. 关联 REQ / Sprint / Task / Test Case 核对
3. 本 Sprint 修改/新增的文件清单
4. 验证命令 / 人工步骤 / 日志 / 截图等证据摘要
5. Sprint 完成包：改动文件、验证命令 / 人工步骤、验证结果、关联提交 / PR、`docs/09-verification.md` 验收记录、残留风险、下一步
6. 需要回写 `docs/08-dev-plan.md` 的进度摘要 / Sprint 状态，以及需要写入 `docs/09-verification.md` 的验收记录、Sprint 验收包、风险与未验证项；若暂不落盘，说明原因、风险和补做时点
7. 建议的 Commit message
8. 是否可以进入下一个 Sprint；若 Mock / 降级为条件通过，说明不等价真实能力和补验时点
```
