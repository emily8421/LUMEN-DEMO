# 04 单文档修订

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：只修订某一份文档或某个章节，不启动完整初始化流程。

**目的**：在变更原因明确时，保持文档局部更新并维持跨文档一致性。

**适用场景**：PRD 新增/调整需求、API 契约变化、DB 设计变化、Phase 标签需要同步等。

**不适用场景**：需要重新生成或补齐 03-09 全套文档；这种情况先用 `ai/prompts/docs/01-review-inputs.md` 评审输入材料，再用 `ai/prompts/docs/00-generate-or-complete-docs.md`。

**使用前准备**：明确要修订的文档、变化原因、关联需求和受影响章节。

**预期产出**：修订方案、修改后的文档内容、影响范围说明。

**使用后下一步**：用 `ai/prompts/review/10-docs-checklist.md` 或相关审查项检查一致性，再继续开发或提交。

```text
docs/07-api-spec.md 需要修订：（说明变化原因，例如PRD新增了XX需求）

请先阅读：
- ai/index.md 列出的全部规则文件
- docs/03-prd.md（相关章节）
- docs/07-api-spec.md（当前内容）

要求：
1. 只修改 docs/07-api-spec.md，不重新生成其他文档
2. 先说明本次修订的范围和理由
3. 修订前先按 `ai/document-lifecycle-rules.md` 判断该文档的上游输入、变更类型与下游影响
4. 局部变更如影响 docs/06-db-design.md 或 08-dev-plan.md，先指出影响清单和同步计划，等待确认后再处理，不要自行连带修改
5. 横切事实 / 约束变更除外：必须主动列出所有受影响文档、权威源与引用同步计划，并在获得本次修改授权后按计划更新和做聚焦一致性检查
```
