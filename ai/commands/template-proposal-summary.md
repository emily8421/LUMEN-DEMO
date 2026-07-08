# Command: template-proposal-summary

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run template-proposal-summary`
- 汇总模板优化提案
- 处理 proposals
- 模板提案汇总

## 适用场景

在 `ai-project-template` 模板仓库中处理提案收件箱：`_proposals/TEMPLATE-UPGRADE-*.md`、带 `proposal` / `feedback` 标签的 GitHub issue，以及标题为 `TEMPLATE-UPGRADE:` 的 open issue。

## 必读文件

- `ai/index.md`
- `CONTRIBUTING.md`
- `MAINTAINERS.md`
- `CHANGELOG.md`
- `README.md`
- `_proposals/README.md`
- `ai/prompts/maintainers/11-template-proposal-summary.md`
- `_proposals/TEMPLATE-UPGRADE-*.md`
- `_proposals/_remote-issues/*.md`（若存在）
- GitHub issue：`gh issue list --label proposal`、`gh issue list --label feedback`、以及 open issue 中标题匹配 `TEMPLATE-UPGRADE:` 的条目；正文分析前先刷新到 `_proposals/_remote-issues/issue-<number>.md`
- 派生项目回流的同步运行观察提案（如由 `derived-sync-report-template` 提炼而来）

## 执行流程

1. 确认当前在模板仓库维护分支。
2. 读取全部待处理本地提案、可选 `*-patch.md` 和既有 `_proposals/_remote-issues/*.md`。
3. 查询 GitHub issue；issue 查询同时覆盖 `proposal` / `feedback` 标签和标题为 `TEMPLATE-UPGRADE:` 的 open issue。
4. 对缺失或过期的 issue 镜像先刷新到 `_proposals/_remote-issues/issue-<number>.md`；远端正文只允许用于生成 / 刷新镜像，关闭 / 评论 / 标签仍以远端 GitHub 为准。
5. 做镜像路径确认：列出本轮参与分析的 `_proposals/_remote-issues/issue-<number>.md` 路径、`Updated` 和 `Mirrored at`；没有本地镜像路径的 issue 不得进入正文分析。
6. 若已误读远端正文但尚未落镜像，丢弃该轮分析结论，先刷新镜像，再重新读取本地镜像继续。
7. 对 issue 做 triage：补建议标签、确认来源、检查是否已去项目化；含客户、账号、路径敏感信息时停止并请人工处理。
8. 输出去重、冲突、依赖和分批计划；分批遵循“一批一范围、报告先行、事实与模板分离、去重可审计、可续接”。
9. 列出拟修改文件、版本影响、验证方式、归档计划和 issue 关闭 / 后续标记计划。
10. 人工确认后再进入实际修改。

## 写入风险

汇总分析本身只读；落地修改和归档提案前必须确认。

## 续接要求

汇总计划必须写入续接文件，避免长任务中断后丢失执行路线。
