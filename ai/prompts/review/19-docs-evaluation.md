# 19 文档评估机制（整体 / 阶段 / 单文档）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：在关键阶段转换前后，对整体文档体系、某个 PLM 阶段转换或单个文档做正式评估，判断是否可进入下一阶段。

**目的**：把“为什么认为当前文档可以继续往下走”沉淀成可审计的评估结论；评估偏阶段判断与留痕，审计偏全链路回溯找问题。

**适用场景**：评估愿景到需求、需求到总体设计、总体设计到详细设计、详细设计到实现计划、实现计划到验证、实现结果到文档回写；或评估某一份核心文档是否履行输入、输出、追溯和下游影响职责。

**不适用场景**：需要全链路回溯审计旧项目或同步后差异时，优先用 `ai/prompts/review/16-docs-system-audit.md`；编码前最后一道检查用 `ai/prompts/review/10-docs-checklist.md`；需要直接修正文档时用 `ai/prompts/docs/04-edit-single-doc.md`。

**使用前准备**：明确评估粒度与范围；准备相关 `docs/00-09`、`docs/design/`、`docs/env/`、`ai/project-rules.md` 和输入材料。

**预期产出**：评估报告草稿，包含评估摘要、范围与依据、评估维度结果、`Go / Conditional Go / No Go` 结论、阻塞项、修复建议和结构化待人工确认项。

**使用后下一步**：若用户确认需要留痕，将报告写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`；若发现需修复项，再用 `ai/prompts/docs/04-edit-single-doc.md` 或对应流程最小变更修正。

```text
请对当前项目文档做一次文档评估，不要直接修改文件。

评估粒度（任选其一）：
1. 整体评估：判断当前 docs 文档体系是否能支撑下一阶段。
2. 阶段评估：按 E1-E6 判断某个阶段转换是否可进入下一步。
3. 单文档评估：只评估一份文档的输入来源、输出职责、追溯关系和下游影响。

阶段评估码：
- E1：输入 / 愿景 → 需求阶段（00-03）
- E2：需求阶段（00-03）→ 总体设计（04-05）
- E3：总体设计（04-05）→ 详细设计（06/07/docs/design，含触发条件下的前端交互设计）
- E4：详细设计 → 实现计划（08/tasks）
- E5：实现计划（08）→ 验证（09）
- E6：实现结果 → 文档回写

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/document-lifecycle-rules.md
- ai/implementation-lifecycle-rules.md
- ai/project-rules.md（如存在）
- docs/README.md
- 与本次评估范围相关的 docs/00-09、docs/design、docs/env、输入材料
- ai/doc-standards/README.md 和 ai/doc-standards/00-09（如存在）

评估维度：

| 维度 | 判断问题 | 输出要求 |
|---|---|---|
| 完整性 | 必需文档、章节、矩阵、图表是否存在 | 列缺失项和影响 |
| 合理性 | 需求拆分、阶段归属、优先级是否符合项目目标 | 说明是否需要重分层 |
| 可行性 | 技术、资源、数据、Mock / 降级是否支撑目标 | 给出风险和验证建议 |
| 一致性 | 横切事实是否冲突或重复定义 | 指定权威源和残留位置 |
| 追溯性 | 是否能从输入追到需求、设计、计划、验证 | 列断点和悬空 ID |
| 前端交互 | UI 型项目是否已补前端交互设计或写明豁免；是否越过 PRD / API / 验收边界 | 列缺口、越界和权限边界风险 |
| 阶段边界 | 当前阶段是否混入后续功能 | 标出越界内容 |
| 可验证性 | 需求和设计是否有可验收口径 | 标出不可测条目 |
| 维护性 | 文档是否便于后续增量演进 | 标出结构化改进项 |

评估结论：
- Go：可以进入下一阶段；仅有不阻塞的 P2 优化项。
- Conditional Go：可以进入下一阶段，但必须先处理指定 P0 / P1 条件或保留明确风险接受口径。
- No Go：不得进入下一阶段；存在阻塞性缺口、追溯断点、越界或可行性风险。

问题优先级：
- P0：阻塞下一阶段或当前 Sprint。
- P1：应在相关 Sprint / Phase 前处理。
- P2：后续优化，不阻塞当前阶段。

请输出：

1. 评估摘要
   - 评估粒度、范围、结论（Go / Conditional Go / No Go）
   - 是否阻塞下一阶段
   - 最关键的 3-5 条理由

2. 评估范围与依据
   - 读取了哪些文档
   - 未读取 / 不存在 / 不适用的文档
   - 规范依据与项目事实依据

3. 评估结果
   - 整体评估 / 阶段评估 / 单文档评估三选一
   - 按评估维度逐项输出结论、证据、问题和影响

4. 合规项
   - 已满足的关键项
   - 说明证据来源

5. 问题项
   - 每项包含：ID、优先级、问题、位置、影响、建议修复方式
   - 不确定项不要写成事实

6. 风险项
   - 技术 / 资源 / 合规 / 阶段边界 / 追溯风险
   - 说明是否阻塞下一阶段

7. 修复建议
   - 按最小变更原则列出修复顺序
   - 指明应使用 `edit-single-doc`、`generate-docs`、`sync-docs-from-code`、`docs-system-audit` 或其他流程

8. 是否阻塞下一阶段
   - Go / Conditional Go / No Go
   - 若 Conditional Go，列必须满足的条件
   - 若 No Go，列停止原因和重新评估触发条件

9. 待人工确认项
   - 使用结构化表格：`ID / 待确认项 / AI 建议 / 建议依据 / 备选方案 / 取舍影响 / 阻塞关系`
   - AI 建议不得写成已确认事实

10. 报告落盘建议
   - 默认不写文件
   - 若用户确认记录，建议路径：`docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`
   - 说明落盘报告不替代 00-09，也不得放到 docs 根目录

若发现模板通用缺口，请单列“可回流模板优化建议”，但不要直接创建 `_proposals/`，除非用户确认。
```
