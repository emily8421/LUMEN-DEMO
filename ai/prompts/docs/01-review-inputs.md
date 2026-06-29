# 01 输入材料评审与入口判定（生成前）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在生成或补齐 docs 文档体系前，先评审现有输入是否足够、应归入哪种入口模式，以及应采用哪个文档剖面。

**目的**：避免 AI 把模糊想法直接扩写成完整需求；先把愿景、小工具描述、PRD / SRS、任务说明或现有系统事实整理为可审计输入，再决定是否进入 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成文档体系。

**适用场景**：只有愿景文档但不确定是否足够；只有一段小工具 / 小系统描述；输入材料混合了场景、功能、用户操作和约束，难以判断属于 vision、00、01、02 还是 03；或从外部文档 / 现有系统事实开始。

**不适用场景**：已经有通过人工确认的完整 docs，当前只要执行 Sprint；这种情况用 `ai/prompts/dev/02-run-task.md`。代码事实和 docs 不一致时，用 `ai/prompts/docs/07-sync-docs-from-code.md`。

**使用前准备**：提供当前已有的任意输入材料；若能提供 `docs/env/local-env.md`、`ai/project-rules.md` 初稿或运行环境约束，一并提供。没有也可以先评审，但必须把缺口列为待确认。

**预期产出**：输入类型判断、推荐文档剖面、生成准备度、缺口清单、最小输入摘要和下一步建议。

**使用后下一步**：若 Ready / Conditionally Ready，把本节输出的“最小输入摘要”和“约束”复制到 `ai/prompts/docs/00-generate-or-complete-docs.md`；若 Not Ready，先回答最少补充问题。

```text
请先评审我提供的输入材料是否足以生成 / 补齐 docs 文档体系，不要直接生成文档。

输入材料来源（任选一种或多种）：

1. 粘贴正文：
   （可直接粘贴愿景、小工具描述、PRD、SRS、任务说明、外部文档摘要或现有系统说明）

2. 文件路径：
   - docs/vision/product-vision.md
   - docs/inputs/initial-brief.md
   - docs/inputs/client-prd.md
   - docs/research/topic-summary.md
   - docs/decisions/ADR-0001-title.md

3. 文件夹路径：
   - docs/vision/
   - docs/inputs/
   - docs/inputs/<topic>/

如果提供文件夹，请先盘点文件清单，列出将读取 / 忽略 / 无法读取的文件，不要直接生成文档。

请先阅读 ai/index.md 列出的全部规则文件，尤其：
- ai/document-lifecycle-rules.md
- ai/project-rules.md
- docs/README.md

请输出：

1. 输入类型判断
   - 属于 Vision-first / Scenario-first / URS-first / SRS-first / PRD-first / Existing-system / Task-first / Small-tool brief / External-input 中哪一种
   - 判断依据是什么
   - 若输入混合多类内容，说明主入口和辅助输入分别是什么
   - 若输入来自文件夹，说明每个文件的材料类型、版本新旧、是否重复或冲突

2. 推荐文档剖面
   - Full / Standard / Lean / Existing-system
   - 哪些 docs 必须生成或保留
   - 哪些 docs 可以省略或极简化，省略依据是什么

3. 生成准备度
   - Ready：可以进入 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 补齐文档体系
   - Conditionally Ready：可以生成，但必须标注若干“待确认”
   - Not Ready：缺口太大，先补输入

4. 缺口清单
   - 必须补充的问题
   - 可后续确认的问题
   - 不应由 AI 猜测的问题

5. 最小输入摘要
   - 用 5-10 条把当前输入整理成“待人工确认”的项目 brief
   - 标明来源是当前输入材料的摘要，不要伪装成原始需求来源
   - 对小工具 / 小系统，至少提炼：目标用户、要解决的问题、输入、输出、核心操作流、非目标、验收方式

6. 下一步建议
   - 如果可生成，给出应复制给 `ai/prompts/docs/00-generate-or-complete-docs.md` 的输入摘要和约束
   - 如果不可生成，列出最少需要用户回答的问题
   - 如涉及外部文档或横切事实，指出权威源建议和引用同步风险
   - 如输入材料位于 `docs/inputs/`，说明哪些应继续保留为原始输入，哪些应映射到 `00-09`、`docs/decisions/`、`docs/research/` 或 `docs/meetings/`
```
