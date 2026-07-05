# 19 阶段 / Sprint / 验证闭环规划

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在文档体系成型后，基于 `docs/03-09` 规划 Phase、Sprint、Task 和验证闭环。

**目的**：把完整设计拆成可执行、可验证、可验收的小步计划，避免直接从总体设计跳到编码。

**适用场景**：Scenario A9；文档体系已通过审计，准备规划当前 Phase 的 Sprint 和验证包。

**不适用场景**：当前 Phase 已接近完成、只需评估能否进入下一 Phase；此时使用 `ai/prompts/planning/08-phase-upgrade.md`。

**使用前准备**：确认已阅读 `ai/implementation-lifecycle-rules.md`，并准备 `docs/03-prd.md`、`docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`；涉及持久化 / 对外接口时还需 `docs/06-db-design.md`、`docs/07-api-spec.md`。

**预期产出**：Phase 划分建议、当前 Phase Sprint 列表、Task 拆分建议、每个 Sprint 的测试等级 / 验证包、需写入 `docs/08-dev-plan.md` 与 `docs/09-verification.md` 的草稿。

**使用后下一步**：人工确认后，用 `ai/prompts/docs/04-edit-single-doc.md` 分别修订 `docs/08-dev-plan.md` 和 `docs/09-verification.md`；确认当前 Sprint 后再用 `ai/prompts/dev/02-run-task.md` 执行。

```text
请基于当前项目文档规划 Phase / Sprint / Task / 验证闭环。

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/implementation-lifecycle-rules.md
- docs/03-prd.md
- docs/04-architecture.md
- docs/05-tech-spec.md
- docs/08-dev-plan.md
- docs/09-verification.md
- docs/06-db-design.md（如本项目涉及持久化）
- docs/07-api-spec.md（如本项目有对外接口）

输出：
1. 当前 Phase 边界核对：允许 / 禁止 / 下一阶段预告 / 退出标准
2. 当前 Phase Sprint 列表：目标、覆盖 REQ / 功能、修改范围、验收方式
3. Task 拆分建议：哪些 Sprint 需要拆 `tasks/task-00X-xxx.md`，原因是什么
4. 每个 Sprint 的测试等级 / 验证包：单元、集成、系统 / E2E、验收、回归、资源验证是否适用及原因
5. 需要写入 `docs/08-dev-plan.md` 的草稿
6. 需要写入 `docs/09-verification.md` 的草稿
7. 待人工确认项

要求：
- 不直接修改文件，先输出规划草稿等待确认。
- 不得把后续 Phase 功能列为当前 Phase 必做或必过。
- 每个 Sprint 必须可追溯到 REQ、设计章节和 Test Case。
```
