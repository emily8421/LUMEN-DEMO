# Command: resume

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run resume`
- 读取续接点
- 继续上次
- 恢复上下文
- 看看现在做到哪了

## 适用场景

用户只想知道当前仓库可从哪里继续，但尚未明确要求执行远端 issue / PR、同步、合并、关闭、清理或编码任务。

## 不适用场景

- 用户已明确要求执行当前 Sprint / 修 bug / 同步模板 / 关闭 issue / 合并 PR；应直接路由到对应 command。
- 用户明确要求联网核对远端状态；可先说明会离开快速续接模式，再按对应命令执行。

## 必读文件

- `ai/index.md`（只确认快速续接例外；不展开读取全部规则）
- `ai/session-rules.md` §1、§3.1
- `.ai/session-handoff.md`；若不存在，再读 `NEXT-STEPS.md`

## 执行流程

1. 进入 `ai/session-rules.md` §3.1 的快速续接模式。
2. 只运行本地只读检查：`git status --short --branch`、`git log --oneline -3`、`git stash list`，并读取 `VERSION`。
3. 读取续接文件的元数据、当前状态、下次优先做和阻塞 / 待确认。
4. 比对 Git 客观事实与 handoff 的分支、HEAD、VERSION 和任务进度。
5. 输出恢复摘要：当前分支 / 版本 / 最近提交、handoff 新鲜度、可继续事项、待确认项、未复核远端事项。
6. 若 handoff stale，停止深挖旧记录，不联网、不继续执行任务，等待用户确认下一步。
7. 若用户确认继续执行任务，退出快速续接模式，回到 `ai/index.md` 全量规则读取与对应 command 流程。

## 写入风险

默认只读，不写文件、不联网、不改远端状态。若用户要求更新续接文件或继续执行任务，必须先说明修改范围并按项目写入确认规则执行。

## 续接要求

快速续接本身通常不更新 handoff；只有发现 handoff stale 且用户确认要修正本地续接记录时，才更新 `.ai/session-handoff.md`。
