# 02 单任务执行 / 切换工具续接

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：执行 `docs/08-dev-plan.md` 中的单个 Sprint，或在切换 AI 工具 / 新会话时续接当前任务。

**快捷命令**：`/run run-dev-task`（自然语言：执行当前 Sprint / 执行任务 / 继续开发任务）。

**目的**：让 AI 在明确输入、范围和验收标准内小步实现，避免一次性扩展整个系统。

**适用场景**：03-09 已通过人工审核，当前要开发某个 Sprint 或继续未完成任务。

**不适用场景**：需求、架构或技术方案还未确认；这种情况先回到 `ai/prompts/docs/01-review-inputs.md` 或 `ai/prompts/review/10-docs-checklist.md`。

**使用前准备**：确认当前 Sprint / Task 的目标、输入文档、修改范围、测试等级 / 验证包、验收标准和禁止事项已写在 `docs/08-dev-plan.md` 或 `tasks/` 中，并已能关联 `docs/09-verification.md` 的 Test Case。若任务触发真实运行依赖，确认已有技术路线与环境支撑评估或明确跳过记录。

**续接要求**：输出执行计划后，按 `ai/session-rules.md` 写入 / 更新 `.ai/session-handoff.md`（兼容 `NEXT-STEPS.md`）；每完成一个步骤、修改文件后或遇到阻塞时刷新当前进度与下一步。

**预期产出**：实现方案、受影响文件清单、代码 / 文档改动、验证方式与执行结果。

**使用后下一步**：运行验证；若通过，用 `ai/prompts/dev/09-sprint-summary.md` 总结 Sprint，必要时用 `ai/prompts/git/06-commit-message.md` 生成 commit message。

```text
请执行：docs/08-dev-plan.md 中的 Sprint-X

执行前请先阅读：
- ai/index.md 列出的全部规则文件
- ai/implementation-lifecycle-rules.md
- docs/03-prd.md（相关章节）
- docs/08-dev-plan.md（当前 Sprint / Task）
- docs/09-verification.md（关联 Test Case / 验证包）
- docs/research/*tech-env-evaluation*.md（若本任务涉及 backend / frontend / docker / 数据库 / 本机模型 / 外部 API 等真实运行依赖）
- docs/07-api-spec.md（若本项目有对外接口，阅读相关接口）
- docs/06-db-design.md（若本任务涉及持久化，阅读相关表结构）

当前进度：已完成A，下一步需要B

要求：
1. 先说明实现方案
2. 本任务涉及文档或代码变更时，先按 `ai/document-lifecycle-rules.md` 说明上游依据与下游影响；再按 `ai/implementation-lifecycle-rules.md` 列出关联 REQ / Sprint / Task / Test Case、预期修改文件（限制1–3个）和验证方式
3. 写入前列出全部预计文件、变更摘要、风险和验证方式，等待我确认；修改后输出 `git status` 摘要和文件清单
4. 若任务涉及真实运行依赖但缺少技术环境评估，先停止并建议运行 `tech-env-evaluation`；若用户明确跳过，记录跳过原因、风险、影响范围和补做时点
5. 执行前必须核对当前 Sprint / Task 的关联 REQ、TC-ID、验证包和任务拆分规则；缺少 TC-ID、验证命令 / 人工步骤或验收口径时，先回到 `08/09` 补齐，不得直接编码
6. 若任务涉及 DB / API，实现前必须核对对应表字段、API-ID、错误码、权限边界、契约状态和 TC-ID；`草案` / `候选` / `默认关闭` / `目标设计` / `Mock` 不得直接作为真实实现依据，除非用户确认风险接受或先做 Spike / PoC
7. 确认不超出当前 Phase 和本任务范围
8. 再开始生成代码
9. 完成后说明修改了哪些文件、运行了哪些验证、结果如何、需要形成的 Sprint 完成包，以及哪些进度、验收记录、缺陷 / 回归、风险或未验证项需要回写 `08/09`；若暂不落盘，说明原因、风险和补做时点
```
