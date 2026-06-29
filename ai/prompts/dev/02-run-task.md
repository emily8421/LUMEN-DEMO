# 02 单任务执行 / 切换工具续接

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：执行 `docs/08-dev-plan.md` 中的单个 Sprint，或在切换 AI 工具 / 新会话时续接当前任务。

**快捷命令**：`/run run-dev-task`（自然语言：执行当前 Sprint / 执行任务 / 继续开发任务）。

**目的**：让 AI 在明确输入、范围和验收标准内小步实现，避免一次性扩展整个系统。

**适用场景**：03-09 已通过人工审核，当前要开发某个 Sprint 或继续未完成任务。

**不适用场景**：需求、架构或技术方案还未确认；这种情况先回到 `ai/prompts/docs/01-review-inputs.md` 或 `ai/prompts/review/10-docs-checklist.md`。

**使用前准备**：确认当前 Sprint 的目标、输入文档、修改范围、验收标准和禁止事项已写在 `docs/08-dev-plan.md` 或 `tasks/` 中。

**续接要求**：输出执行计划后，按 `ai/session-rules.md` 写入 / 更新 `.ai/session-handoff.md`（兼容 `NEXT-STEPS.md`）；每完成一个步骤、修改文件后或遇到阻塞时刷新当前进度与下一步。

**预期产出**：实现方案、受影响文件清单、代码 / 文档改动、验证方式与执行结果。

**使用后下一步**：运行验证；若通过，用 `ai/prompts/dev/09-sprint-summary.md` 总结 Sprint，必要时用 `ai/prompts/git/06-commit-message.md` 生成 commit message。

```text
请执行：docs/08-dev-plan.md 中的 Sprint-X

执行前请先阅读：
- ai/index.md 列出的全部规则文件
- docs/03-prd.md（相关章节）
- docs/07-api-spec.md（若本项目有对外接口，阅读相关接口）
- docs/06-db-design.md（若本任务涉及持久化，阅读相关表结构）

当前进度：已完成A，下一步需要B

要求：
1. 先说明实现方案
2. 本任务涉及文档或代码变更时，先按 `ai/document-lifecycle-rules.md` 说明上游依据与下游影响；列出将新增或修改的文件（限制1~3个）
3. 确认不超出本任务范围
4. 再开始生成代码
5. 完成后说明修改了哪些文件，以及如何验证
```
