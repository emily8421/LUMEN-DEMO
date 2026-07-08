# 21 待确认事项总览（Open Items）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：扫描项目文档、设计文档、评估 / 审计报告、任务单和续接记录中的待人工确认项，生成或更新待确认事项总览。

**快捷命令**：`/run docs-open-items`（自然语言：汇总待确认事项 / 生成 open items / 编码前自检未决项）。

**目的**：让阻塞项、条件阻塞项、风险接受项和回填位置集中可见，避免待确认项散落在多份文档里影响阶段推进、编码和 Phase 升级。

**适用场景**：完整文档体系生成后、文档评估 / 审计后、进入编码前、Phase 升级前，或用户询问“还有哪些没确认”。

**不适用场景**：替代 `docs/00-09`、`docs/design/*` 或 `tasks/*` 的事实记录；确认事项一旦有人工结论，必须回填权威文档。

**使用前准备**：确认已阅读 `ai/index.md`、`ai/document-lifecycle-rules.md`、`docs/README.md`，并知道本次是只读汇总还是需要落盘。

**预期产出**：待确认事项总览、门禁结论、回填建议、报告落盘建议和需用户确认的下一步。

```text
请汇总当前项目的待确认事项总览，不要默认修改文件。

触发场景（可任选）：
1. 文档体系生成过程中更新 open items。
2. 文档评估 / 审计后汇总阻塞项。
3. 编码前检查未决项。
4. Phase 升级前检查下一阶段阻塞项。
5. 会话续接时恢复未确认事项。

请先阅读：
- ai/index.md 列出的全部规则文件
- ai/document-lifecycle-rules.md，尤其 §6.1、§6.2、§7.1、§10.1
- docs/README.md
- docs/00-09（按项目形态存在则读取）
- docs/design/*、docs/research/*、docs/decisions/*、tasks/*（如存在）
- .ai/session-handoff.md 或 NEXT-STEPS.md（如存在，仅作为本地续接输入，不替代正式文档）

扫描范围：
- 正式文档中的“待人工确认项 / 待确认事项 / 风险接受 / 待技术验证 / Mock / 降级 / 默认关闭 / 候选 / 预留”。
- 文档评估、体系审计、技术环境评估、验证报告中的 Conditional Go / No Go 条件。
- 任务单、开发计划、Sprint 总结和续接记录中的阻塞项。
- 用户当前输入中新提出但尚未写入正式文档的问题。

输出字段：

| 字段 | 要求 |
|---|---|
| ID | 使用 `OI-001` 递增；若已有稳定 ID，保留并映射。 |
| 提出时间 | 使用绝对日期；无法确认时写“待确认”，不要猜测。 |
| 来源 | 文件路径、章节、用户输入、评估报告、任务单或续接记录。 |
| 待确认事项 | 需要人工判断的问题。 |
| AI 建议 | 推荐选项；必须标明是建议，不是已确认事实。 |
| 建议依据 | 上游输入、规则、约束、证据、风险或经验判断。 |
| 备选方案 | 2-3 个可选方案；没有可行备选时说明原因。 |
| 取舍影响 | 成本、复杂度、阶段范围、验证、合规、用户体验或维护影响。 |
| 需确认节点 | 例如生成 03 前、进入 04 前、生成 08 前、编码前、Phase 升级前、发布前。 |
| 阻塞关系 | 阻塞 / 条件阻塞 / 不阻塞。 |
| 回填位置 | 确认后应回填的 `docs/`、`docs/design/`、`tasks/`、`ai/project-rules.md` 或 README。 |
| 当前状态 | 待确认 / 已确认 / 暂缓 / 关闭 / 转任务。 |
| 关闭依据 | 人工确认记录、文档回填位置、PR / commit / 会议记录；未关闭时留空或写“待确认”。 |

门禁规则：
- 进入设计阶段前，检查是否存在阻塞 `00-03` 的待确认项。
- 进入详细设计 / 计划阶段前，检查技术选型、接口 / DB 契约、交互方案、验证策略是否仍有阻塞项。
- 编码前必须检查 open items；阻塞项未关闭或未被明确风险接受，不得开始对应 Sprint。
- Phase 升级前必须检查与下一阶段相关的阻塞项。
- open items 只做总览，不替代事实文档；用户确认后必须回填权威文档或任务单。

请输出：
1. 汇总范围与读取依据。
2. 去重规则和合并说明。
3. 待确认事项总览表。
4. 门禁结论：Go / Conditional Go / No Go，说明阻塞阶段或 Sprint。
5. 回填建议：按最小变更原则列出应回填哪些文件。
6. 落盘建议：默认 `docs/research/YYYY-MM-DD-docs-open-items.md`；若建议长期固定入口 `docs/open-items.md`，必须说明需同步 `docs/README.md` 定位。
7. 需要用户立即确认的问题。

若用户确认落盘，再写入报告；否则只在会话中输出，并说明“尚未成为正式项目事实”。
```
