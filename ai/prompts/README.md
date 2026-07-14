# Prompt Library

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录保存详细 Prompt 模板。AI CLI 场景优先使用 `ai/commands/` 快捷命令路由；`INIT-PROMPT.md` 是轻量索引；完整 Prompt 按场景拆分在本目录下。

## 使用规则

1. 先阅读 `ai/index.md` 列出的规则文件。
2. 若用户说的是常见操作意图（如“更新方法论”“文档体系审核”“执行当前 Sprint”），先按 `ai/commands/README.md` 选择快捷命令。
3. 命令文件会路由到本目录下的详细 Prompt；需要手工使用时，再按 `INIT-PROMPT.md` 的场景索引打开对应文件。
4. Prompt 不是需求本身；若输入不足，先补输入或使用 `ai/prompts/docs/01-review-inputs.md` / `/run review-inputs` 做入口判定。
5. 多步骤任务应按 `ai/session-rules.md` 更新本地续接文件。

## 分类

| 目录 | 用途 |
|---|---|
| `docs/` | 文档体系生成、输入评审、需求探索原型、单文档修订、文档反向同步 |
| `dev/` | 单任务开发、Bug 修复、Sprint 验收 |
| `review/` | 项目审查与 docs checklist |
| `planning/` | Phase / Sprint 规划与 Phase 升级评估 |
| `setup/` | 环境采集与新建派生项目 |
| `git/` | Commit message 辅助 |
| `maintainers/` | 模板维护、同步和提案汇总 |

> 若是第一次准备机器环境，先看 `template-docs/env-setup.md`，再运行 `scripts/check-prereqs.ps1`；环境准备脚本属于仓库脚本，不属于可复制给 AI 的 Prompt。
