# 03 项目审查

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：审查当前项目文档或实现是否符合模板规则与已确认设计。

**目的**：发现需求越界、架构偏离、技术栈不一致、DB/API 不一致和 Phase 边界风险。

**适用场景**：完成一轮设计、实现或阶段交付后，需要进行合规性审查。

**不适用场景**：只想检查 03-09 文档是否可进入编码；这种情况优先用 `ai/prompts/review/10-docs-checklist.md`。

**使用前准备**：准备相关 `docs/03-09`、当前实现状态和需要审查的范围。

**预期产出**：合规项、问题项、风险项和修复建议。

**使用后下一步**：对问题项拆分任务；若涉及单文档修订，用 `ai/prompts/docs/04-edit-single-doc.md`；若涉及代码修复，用 `ai/prompts/dev/02-run-task.md` 或 `ai/prompts/dev/05-fix-bug.md`。

```text
请根据 ai/index.md 列出的全部规则文件及 docs/03-09，审查当前项目，输出：
（若项目尚未编码、只想审 03-09 文档质量，改用 `ai/prompts/review/10-docs-checklist.md` 逐项核对）

1. 合规项
2. 问题项（是否超出当前Phase范围 / 是否存在技术栈偏离 / 是否存在未按API或DB设计实现的部分 / UI 型项目是否缺少前端交互设计或把前端隐藏当作权限边界 / 是否存在追溯链断点或上游变更未传播）
3. 风险项
4. 修复建议
```
