# Command: sync-methodology

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run sync-methodology`
- 更新方法论
- 同步模板方法论
- 派生项目同步模板

## 适用场景

派生项目需要同步 `ai-project-template` 的最新方法论文件。

## 必读文件

- `ai/index.md`
- `git-guide.md` §5
- `ai/prompts/maintainers/12-sync-template.md`
- `template-docs/derived-sync-report-template.md`
- `scripts/sync-template.ps1`
- `scripts/check-derived-sync.ps1`

## 执行流程

1. 判断当前仓库是否为派生项目，而不是模板仓库本身。
2. 检查 Git 状态、当前 `VERSION`、同步脚本与 `template-sync.json` 是否存在。
3. 按 `git-guide.md` §5 和 `12-sync-template` 判断旧项目首次同步或 v1.6.8+ 后续同步路径。
4. 先输出 dry-run / commit 计划和风险点。
5. 用户确认后执行同步命令。
6. 同步后运行 `check-derived-sync`，不要用 `check-template` 验收派生项目。
7. 生成或建议生成派生同步运行记录，推荐路径：`docs/archive/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`。
8. 从运行记录中判断是否存在可通用模板优化点；如有，生成去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。
9. 输出同步后整理建议，通常下一步是 `post-sync-cleanup`。

## 写入风险

会修改派生项目内的模板方法论文件；执行 dry-run 之外的写入动作前必须确认。

## 续接要求

同步通常是多步骤任务；开始后应按 `ai/session-rules.md` 记录当前同步阶段、已执行命令和下一步。同步完成后，应把运行记录路径、回流提案判断和后续动作写入续接文件。
