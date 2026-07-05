# Command: submit-feedback

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run submit-feedback`
- 收集使用问题
- 把这些问题反馈给模板维护者

## 适用场景

派生项目使用模板过程中沉淀的**候选问题 / 优化点**（散落在 sync 运行记录、docs-audit 报告、check 告警、`_proposals/` 未成熟草稿），想半自动汇集后反馈给模板维护者。**扫描自动化，人工勾选上报哪些**（避免噪声淹没维护者）。

不适用：已是成熟提案（用 `/run submit-proposal`）；纯派生项目业务问题（不回流模板）。

## 必读文件

- `ai/index.md`
- 派生候选来源：`sync-records/template-sync/` 或旧路径 `docs/archive/template-sync/`（sync 运行记录可优化点）、docs-audit 报告、check 告警、`_proposals/` 草稿
- `ai/global-rules.md` §9（回流来源标识 + 去项目化）

## 执行流程

1. 扫描候选来源（sync 运行记录 / audit 报告 / check 告警 / `_proposals/` 草稿），列出可优化点。
2. 让成员**勾选**值得上报的（人工过滤，避免噪声）。
3. 选中的逐个去项目化 + 标来源（`> 来源：<派生>(owner/repo)`）。
4. `gh issue create --repo <模板仓库> --label feedback,from:<派生标识>` 开 issue（每个选中项一条，或合并一条）。
5. 返回 issue 链接，记入续接文件。

## 写入风险

在**模板仓库**开 issue（派生项目之外）；`gh` 跨仓库。不动派生文件（除续接）。**执行前确认每条已去项目化**。需 `gh auth login` + 模板仓可访问。

## 续接要求

记录扫描到的候选、成员选中项、各 issue 链接、下一步。
