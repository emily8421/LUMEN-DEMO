# Command: post-sync-cleanup

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run post-sync-cleanup`
- 同步后整理项目
- 方法论同步后清理
- 整理项目专属内容

## 适用场景

派生项目完成模板方法论同步后，需要审计 docs 分区、README、project-rules 与运行环境约束。

## 必读文件

- `ai/index.md`
- `docs/README.md`
- `ai/project-rules.md`
- `docs/env/local-env.md`（如存在）
- `ai/doc-standards/README.md`（如需要理解规范镜像定位）
- `ai/prompts/maintainers/15-post-sync-cleanup.md`

## 执行流程

1. 确认已完成 `sync-methodology` 或等价同步流程。
2. 检查工作区状态和最近同步提交。
3. 使用 `15-post-sync-cleanup` 先输出审计结果与迁移计划。
4. 用户确认后再执行移动、修改或补齐。
5. 输出变更清单、待复核链接和验证建议。

## 写入风险

可能移动或修改项目专属文档；执行实际修改前必须确认。

## 续接要求

迁移计划和待确认项必须写入续接文件，避免中断后丢失。
