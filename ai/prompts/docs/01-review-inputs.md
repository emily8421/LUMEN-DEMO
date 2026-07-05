# 01 输入材料评审与入口判定（生成前）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在生成或补齐 docs 文档体系前，先评审现有输入是否足以生成 / 更新 `docs/vision/product-vision.md`，再判断入口模式和文档剖面。

**目的**：避免 AI 把模糊想法直接扩写成完整愿景或完整需求；先把 `docs/inputs/` 中的愿景草稿、小工具描述、PRD / SRS、任务说明或现有系统事实整理为可审计输入，评估愿景就绪度并补齐缺口，再决定是否生成 / 更新 product-vision 和进入 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成文档体系。

**适用场景**：`docs/inputs/` 为空；只有愿景草稿但不确定是否足够；只有一段小工具 / 小系统描述；输入材料混合了场景、功能、用户操作和约束，难以判断属于 vision、00、01、02 还是 03；或从外部文档 / 现有系统事实开始。

**不适用场景**：已经有通过人工确认的完整 docs，当前只要执行 Sprint；这种情况用 `ai/prompts/dev/02-run-task.md`。代码事实和 docs 不一致时，用 `ai/prompts/docs/07-sync-docs-from-code.md`。

**使用前准备**：优先把当前已有的任意输入材料放入 `docs/inputs/`；若能提供 `docs/env/local-env.md`、`ai/project-rules.md` 初稿或运行环境约束，一并提供。没有输入材料也可以先启动评审，但必须输出最小输入内容清单并逐项请用户确认。

**预期产出**：输入盘点、Product Vision 就绪度、缺口矩阵、最小补充清单、评估报告建议路径、推荐文档剖面和下一步建议。

**使用后下一步**：若 Product Vision Ready / Conditionally Ready，把本节输出的“愿景输入摘要”和“约束”复制到 `ai/prompts/docs/00-generate-or-complete-docs.md`，用于生成 / 更新 `docs/vision/product-vision.md` 并继续生成 docs；若 Not Ready，先按最小补充清单回答问题，补齐后再次运行本评审。

```text
请先评审我提供的输入材料是否足以生成 / 更新 docs/vision/product-vision.md，并判断是否能继续生成 / 补齐 docs 文档体系；不要直接生成 product-vision 或 00-09。

输入材料来源（任选一种或多种）：

1. 粘贴正文：
   （可直接粘贴愿景、小工具描述、PRD、SRS、任务说明、外部文档摘要或现有系统说明）

2. 文件路径：
   - docs/inputs/initial-brief.md
   - docs/inputs/client-prd.md
   - docs/inputs/input-review-report.md
   - docs/vision/product-vision.md（仅用于兼容已有愿景或复评，不作为新项目默认输入入口）
   - docs/research/topic-summary.md
   - docs/decisions/ADR-0001-title.md

3. 文件夹路径：
   - docs/inputs/
   - docs/inputs/<topic>/
   - docs/vision/（仅用于兼容已有愿景或复评）

如果提供文件夹，请先盘点文件清单，列出将读取 / 忽略 / 无法读取的文件，不要直接生成文档。

请先阅读 ai/index.md 列出的全部规则文件，尤其：
- ai/document-lifecycle-rules.md
- ai/project-rules.md
- docs/README.md

请输出：

1. 输入盘点与类型判断
   - 是否存在 `docs/inputs/` 材料；若为空，直接进入“最小输入内容清单”，不得编造愿景
   - 属于 Inputs-first / Vision-first / Scenario-first / URS-first / SRS-first / PRD-first / Existing-system / Task-first / Small-tool brief / External-input 中哪一种
   - 判断依据是什么
   - 若输入混合多类内容，说明主入口和辅助输入分别是什么
   - 若输入来自文件夹，说明每个文件的材料类型、版本新旧、是否重复或冲突

2. Product Vision 就绪度
   - Ready：足以生成 / 更新 `docs/vision/product-vision.md`
   - Conditionally Ready：可以生成 / 更新，但必须标注若干“待确认”
   - Not Ready：缺口太大，先补输入
   - 说明是否能形成完整产品图景、典型场景和核心能力边界
   - 若可生成，给出 product-vision 的来源锚点和应保留的待确认项

3. 愿景缺口矩阵
   - 目标用户 / 使用者
   - 问题、价值或业务目标
   - 典型场景与用户故事
   - 核心能力与优先级
   - 输入、输出、数据或外部依赖
   - 边界、非目标、禁区
   - 成功标准、验收方式或演示口径
   - 阶段倾向（Demo / MVP / 产品）
   - 运行环境、技术、资源、合规和风险约束
   - 每项标注：已具备 / 部分具备 / 缺失；依据；AI 建议；是否必须人工确认

4. 最小补充清单
   - 若 `docs/inputs/` 为空，给出可直接逐项回答的最小输入内容清单
   - 若材料不足，只列生成 product-vision 必需的最少问题，按优先级排序
   - 每个问题给出 AI 推荐选项或建议答案（如可从材料推断），并说明依据；不能推断时明确“需人工确认”
   - 明确补齐后仍需再次运行本评审，不得直接跳到生成文档

5. 愿景输入摘要
   - 用 5-10 条把当前输入整理成“待人工确认”的 product-vision brief
   - 标明来源是当前输入材料的摘要，不要伪装成原始需求来源
   - 对小工具 / 小系统，至少提炼：目标用户、要解决的问题、输入、输出、核心操作流、非目标、验收方式

6. 推荐文档剖面
   - Full / Standard / Lean / Existing-system
   - 哪些 docs 必须生成或保留
   - 哪些 docs 可以省略或极简化，省略依据是什么
   - 若 product-vision 尚未 Ready，只能给出暂定剖面，不得进入正式生成

7. 评估报告与下一步建议
   - 若 Not Ready 或 Conditionally Ready，建议将评估报告保存到 `docs/inputs/input-review-report.md` 或 `docs/inputs/<topic>/input-review-report.md`
   - 如果可生成 product-vision，给出应复制给 `ai/prompts/docs/00-generate-or-complete-docs.md` 的愿景输入摘要和约束
   - 如果不可生成，列出最少需要用户回答的问题
   - 如涉及外部文档或横切事实，指出权威源建议和引用同步风险
   - 说明哪些原始材料应继续保留在 `docs/inputs/`，哪些可提炼到 `docs/vision/product-vision.md`，哪些应映射到 `00-09`、`docs/decisions/`、`docs/research/` 或 `docs/meetings/`
```
