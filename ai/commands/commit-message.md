# Command: commit-message

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run commit-message`
- 生成提交信息
- 写 commit message
- 总结 diff

## 适用场景

准备提交前，需要根据实际 diff 生成清晰提交信息。

## 必读文件

- `ai/index.md`
- `ai/prompts/git/06-commit-message.md`
- `git status --short`
- `git diff --stat`
- 必要时读取具体 diff

## 执行流程

1. 只基于实际 diff 总结，不编造未发生的改动。
2. 给出推荐 commit message 和备选说明。
3. 如 diff 混杂，建议拆分提交。
4. 若用户下一步要 push / 创建 PR / 合并 PR，提醒先运行 `scripts/check-github-context.ps1` 做只读预检，确认当前仓库、分支、remote、`gh` 账号和仓库权限。

## 写入风险

默认只读；不自动执行 `git commit`。

## 续接要求

若提交前仍有验证或拆分建议，应写入续接文件。
