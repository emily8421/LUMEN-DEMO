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
- `docs/archive/template-sync/` 下最近一次同步运行记录（如存在）
- `ai/doc-standards/README.md`（如需要理解规范镜像定位）
- `ai/prompts/maintainers/15-post-sync-cleanup.md`

## 执行流程

1. 确认已完成 `sync-methodology` 或等价同步流程。
2. 检查工作区状态和最近同步提交。
3. 如存在同步运行记录，先读取并提取问题、待确认项和可回流优化点。
4. 使用 `15-post-sync-cleanup` 先输出审计结果与迁移计划。
5. 用户确认后再执行移动、修改或补齐。
6. 输出变更清单、待复核链接、验证建议和是否需要生成模板优化提案。

## 写入风险

可能移动或修改项目专属文档；执行实际修改前必须确认。

## 续接要求

迁移计划、同步运行记录中的问题、待确认项和可回流提案建议必须写入续接文件，避免中断后丢失。
