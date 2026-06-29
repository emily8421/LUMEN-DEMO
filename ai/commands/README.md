# AI Commands（快捷命令路由）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本目录提供 AI CLI 的快捷命令路由。命令文件只负责把“用户意图”映射到权威 SOP、Prompt 和脚本说明；完整执行细节仍以 `ai/prompts/`、`SOP.md`、`git-guide.md`、`docs/` 与项目规则为准。

## 使用方式

用户可显式输入：

```text
/run sync-methodology
/run docs-system-audit
/run post-sync-cleanup
```

也可使用自然语言：

```text
更新方法论
做文档体系审核
同步后整理项目
执行当前 Sprint
```

AI 识别到命令意图后，应：

1. 读取 `ai/index.md` 及其列出的规则文件。
2. 读取本命令索引和对应 `ai/commands/*.md`。
3. 读取命令文件列出的权威文档、Prompt 和脚本说明。
4. 说明将执行的命令、影响范围、是否只读、是否会写文件。
5. 涉及写入、安装、提交、同步或状态改变时，先取得用户确认。
6. 若任务持续多步，按 `ai/session-rules.md` 更新本地续接文件。

## 命令文件格式

每个命令文件应包含：

- 用户说法：自然语言别名与 `/run` 名称。
- 适用场景：什么时候使用，什么时候不使用。
- 必读文件：执行前必须读取的规则、Prompt、SOP 或脚本。
- 执行流程：高层步骤，不复制完整 Prompt。
- 写入风险：是否只读、何时必须确认。
- 续接要求：是否需要写入 `.ai/session-handoff.md` / `NEXT-STEPS.md`。

## 首批命令

| 命令 | 常见说法 | 路由到 |
|---|---|---|
| `sync-methodology` | 更新方法论 / 同步模板方法论 | `git-guide.md` §5、`ai/prompts/maintainers/12-sync-template.md` |
| `post-sync-cleanup` | 同步后整理项目 | `ai/prompts/maintainers/15-post-sync-cleanup.md` |
| `docs-system-audit` | 文档体系审核 / PLM 链路审计 | `ai/prompts/review/16-docs-system-audit.md` |
| `template-proposal-summary` | 汇总模板优化提案 | `ai/prompts/maintainers/11-template-proposal-summary.md` |
| `generate-docs` | 生成文档体系 / 补齐 00-09 | `ai/prompts/docs/00-generate-or-complete-docs.md` |
| `review-inputs` | 评审输入材料 | `ai/prompts/docs/01-review-inputs.md` |
| `project-review` | 项目审查 / 实现合规审查 | `ai/prompts/review/03-project-review.md` |
| `edit-single-doc` | 修订单个文档 | `ai/prompts/docs/04-edit-single-doc.md` |
| `sync-docs-from-code` | 代码反向同步文档 | `ai/prompts/docs/07-sync-docs-from-code.md` |
| `phase-upgrade` | Phase 升级评估 | `ai/prompts/planning/08-phase-upgrade.md` |
| `docs-checklist` | 开发前文档检查 | `ai/prompts/review/10-docs-checklist.md` |
| `run-dev-task` | 执行 Sprint / 执行任务 | `ai/prompts/dev/02-run-task.md` |
| `fix-bug` | 修 Bug / 修复缺陷 | `ai/prompts/dev/05-fix-bug.md` |
| `sprint-summary` | Sprint 总结 / 验收总结 | `ai/prompts/dev/09-sprint-summary.md` |
| `collect-env` | 采集本机环境 | `ai/prompts/setup/13-collect-env.md`、`scripts/collect-env.ps1` |
| `new-project` | 新建派生项目 | `ai/prompts/setup/14-new-project.md`、`scripts/new-project.sh` |
| `commit-message` | 生成提交信息 | `ai/prompts/git/06-commit-message.md` |

## 维护规则

- 命令文件不得复制大段 Prompt 正文，避免与 `ai/prompts/` 双写漂移。
- 新增高频 Prompt 或 SOP 时，应评估是否需要新增 / 更新命令入口。
- 删除或重命名 Prompt 时，必须同步更新命令路由和 `template-sync.json`。
