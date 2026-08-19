# 待确认事项总览示例

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

> 建议落盘路径：`docs/research/YYYY-MM-DD-docs-open-items.md`。
> 若项目决定长期维护固定入口 `docs/open-items.md`，请同步更新 `docs/README.md` 说明其定位；open items 总览只做未决事项索引，不替代 00-09、`docs/design/*`、`tasks/*` 或 `ai/project-rules.md` 的事实记录。

## 1. 汇总范围

- 汇总日期：YYYY-MM-DD
- 汇总触发：文档生成 / 文档评估 / 体系审计 / 编码前检查 / Phase 升级前检查 / 会话续接
- 读取依据：列出 `docs/00-09`、`docs/design/*`、`docs/research/*`、`tasks/*`、续接记录等。

## 2. 门禁结论

- 结论：Go / Conditional Go / No Go
- 阻塞阶段或 Sprint：如生成 03 前、进入 04 前、生成 08 前、编码前、Phase 升级前。
- 最关键原因：列 3-5 条。

## 3. 待确认事项总览

| ID | 提出时间 | 来源 | 待确认事项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 | 需确认节点 | 阻塞关系 | 回填位置 | 当前状态 | 关闭依据 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OI-001 | YYYY-MM-DD | `docs/03-prd.md` §3 | 示例：Phase1 是否包含账号体系 | 建议暂不包含 | 当前阶段目标是 Demo，账号体系会扩大范围 | 1. 暂不做；2. 只做 Mock；3. 纳入 Phase1 | 影响工期、验证和安全边界 | 编码前 | 阻塞 | `docs/03-prd.md`、`ai/project-rules.md` | 待确认 |  |

## 4. 回填建议

- `OI-001`：用户确认后回填 `docs/03-prd.md` §3 和 `ai/project-rules.md` §1。

## 5. 后续动作

1. 请用户确认阻塞项。
2. 回填权威文档。
3. 重新运行 `docs-open-items` 或 `docs-evaluation` 复核门禁。
