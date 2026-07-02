# 派生项目模板同步运行记录模板

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本模板用于派生项目完成 `ai-project-template` 方法论同步后，记录真实同步过程、问题与可回流优化点。建议保存到派生项目：

```text
docs/archive/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md
```

如只是临时续接，可先写入 `.ai/session-handoff.md`；如发现可通用模板优化，再转写为去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。

## 基本信息

- 项目：
- 同步日期：
- 同步前模板版本：
- 目标模板版本：
- 同步分支：
- 操作入口：`/run sync-methodology` / 手动命令
- AI 工具 / CLI：

## 执行命令

- dry-run：
- commit：
- check-derived-sync：
- 是否触发 PowerShell fallback（sync / check）：
- post-sync-cleanup：

## 同步结果

- 是否成功：
- 新增 / 修改的方法论文件：
- 项目专属文件是否被误改：
- 是否新增 / 刷新 `ai/doc-standards/00-09`：
- 是否残留旧 `docs/_scaffold/`：

## 遇到的问题

- Git / gh / Git Bash / PowerShell / 网络问题（如触发 fallback，请记录脚本输出的 fallback 标识与结果）：
- 同步脚本问题：
- Prompt / 快捷命令理解问题：
- 文档说明不清：
- 派生项目专属冲突：

## 可优化点归纳

| 问题 | 是否项目专属 | 是否建议回流模板 | 建议提案 |
|---|---|---|---|
|  |  |  |  |

## 已生成的回流提案

- `_proposals/TEMPLATE-UPGRADE-xxx.md`

## 后续动作

- 是否需要 `/run post-sync-cleanup`：
- 是否需要 `/run docs-system-audit`：
- 是否需要人工清理旧目录：
- 是否需要同步回模板仓库：
