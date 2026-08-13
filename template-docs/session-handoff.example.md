# AI Session Handoff Example

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.
>
> 本文件是本地会话续接记录样例。真实续接文件建议使用 `.ai/session-handoff.md`，兼容旧路径 `NEXT-STEPS.md`，并保持在 `.gitignore` 中。

## 元数据

- Updated at: 2026-07-07 21:30 +08:00
- Status: active / closed / stale-risk
- Branch: main
- HEAD: <short-sha> <commit subject>
- VERSION: vX.Y.Z / 不适用
- Remote snapshot: 未复核 / open issue 为空 / open PR 为空 / 其他摘要（写明复核时间）

## 活跃 worktree

> 记录除主工作区外的活跃 worktree。创建 worktree 后立即登记；合并进 main 或明确废弃后移除 worktree 并从本段清除登记。无则写「无」。

- 路径 / 分支 / 主题：`D:\tmp\<repo>-<topic>` / `change/<topic>` / <一句话主题>
- 未提交改动摘要：<n> 个文件未提交（<文件清单>）
- 处置：待救回 / 待丢弃 / 已合并待清理

## 当前任务

一句话说明正在处理什么。

## 当前进度

- 已完成：
- 进行中：
- 未完成：

## 执行计划

1. ...
2. ...
3. ...

## 最近改动

- 新增：
- 修改：
- 删除：

## 下次优先做

1. ...
2. ...

## 阻塞 / 待确认

- ...

## 恢复命令

- `git status --short --branch`
- `git worktree list`
- `git diff -- ...`
- `bash scripts/check-template.sh`
