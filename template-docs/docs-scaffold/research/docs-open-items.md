# 待确认事项总览（Docs Open Items）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 本文件是 `docs/research/YYYY-MM-DD-docs-open-items.md` 的结构模板副本，不是项目事实。Open items 只做未决事项索引，不替代 `00-09`、`docs/design/*`、`tasks/*` 或 `ai/project-rules.md` 的权威记录。
>
> 兼容示例：`template-docs/docs-open-items.example.md` 暂时保留，用于展示填充样例；本文件作为 scaffold 正式结构模板。

## 1. 汇总范围

**撰写提要**：说明本次扫描哪些文档、报告、任务单和续接记录，哪些未扫描以及原因。

- 汇总日期：YYYY-MM-DD
- 汇总触发：文档生成 / 文档评估 / 体系审计 / 编码前检查 / Phase 升级前检查 / 会话续接
- 读取依据：`docs/00-09`、`docs/design/*`、`docs/research/*`、`tasks/*`、`.ai/session-handoff.md`
- 未扫描范围与原因：

## 2. 去重与合并说明

**撰写提要**：说明如何合并来自不同文档的同一待确认项，保留哪个 ID 作为主 ID，以及映射关系。

| 主 ID | 合并来源 | 合并理由 | 保留 / 关闭处理 |
|---|---|---|---|
| OI-001 | `docs/03-prd.md`、`.ai/session-handoff.md` | 同一阶段范围问题 | 保留 OI-001，关闭重复项 |

## 3. 门禁结论

**撰写提要**：判断当前是否可进入下一阶段或 Sprint，并列出最关键原因。

- 结论：Go / Conditional Go / No Go
- 阻塞阶段或 Sprint：生成 03 前 / 进入 04 前 / 生成 08 前 / 编码前 / Phase 升级前
- 最关键原因：

## 4. 待确认事项总览

**撰写提要**：每条必须包含 AI 建议、依据、备选方案、取舍影响和回填位置；AI 建议不得写成已确认事实。

| ID | 提出时间 | 来源 | 待确认事项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 | 需确认节点 | 阻塞关系 | 回填位置 | 当前状态 | 关闭依据 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OI-001 | YYYY-MM-DD | `docs/03-prd.md` §3 |  |  |  |  |  | 编码前 | 阻塞 / 条件阻塞 / 不阻塞 | `docs/03-prd.md`、`ai/project-rules.md` | 待确认 / 已确认 / 暂缓 / 关闭 / 转任务 |  |

## 5. 回填建议

**撰写提要**：说明用户确认后应回填哪些权威文档，避免 open items 成为孤立清单。

- `OI-001`：确认后回填 `docs/...`。
- 需要同步更新的下游文档：
- 不建议回填的位置及原因：

## 6. 后续动作

**撰写提要**：给出最小闭环动作，区分必须先确认、可延后和已转任务的事项。

1. 请用户确认阻塞项。
2. 回填权威文档或任务单。
3. 重新运行 `docs-open-items` 或 `docs-evaluation` 复核门禁。
