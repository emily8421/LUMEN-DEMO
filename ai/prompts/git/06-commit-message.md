# 06 Commit message生成

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：根据本次已完成改动生成清晰、可审计的提交信息。

**目的**：让一次任务对应一次清楚的 commit，避免 “update / fix / test” 这类模糊记录。

**适用场景**：改动已完成、验证已通过、准备提交。

**不适用场景**：工作区还混有多组无关改动；应先拆分暂存或拆分任务。

**使用前准备**：提供 `git diff --stat`、关键变更点和验证结果。

**预期产出**：一条或多条候选 commit message，必要时建议拆分提交。

**使用后下一步**：人工选择提交信息，执行 `git add` / `git commit`。

```text
请根据本次修改内容，生成符合 ai/global-rules.md 规范的Commit message：
- 格式参考"完成XX模块"风格
- 避免"修改/update/test"等模糊描述
- 如本次修改跨越多个模块，拆分为多条建议的Commit message
```
