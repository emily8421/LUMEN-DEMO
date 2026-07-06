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
做文档评估
做技术环境评估 / 技术路线评估
补前端交互设计 / 补 UI 设计
同步后整理项目
执行当前 Sprint
读取续接点 / 继续上次
```

> **场景优先**：当用户说出的是**具体场景意图**（如「帮我新建项目」「帮我准备输入」「帮我规划阶段」「帮我打磨文档」）而非某个具体 command 时，AI 应先走 `/run scenario`（见 `ai/commands/scenario.md`），由 `template-docs/scenario-guides.md` 先产出「做什么 + 为什么」引导计划，确认后再路由到具体 command 执行。新手首次打开 AI CLI 也走此路径。

AI 识别到命令意图后，应：

1. 读取 `ai/index.md` 及其列出的规则文件。
2. 读取本命令索引和对应 `ai/commands/*.md`。
3. 读取命令文件列出的权威文档、Prompt 和脚本说明。
4. 说明将执行的命令、影响范围、是否只读、是否会写文件。
5. 涉及写入、安装、提交、同步或状态改变时，先取得用户确认。
6. 若任务持续多步，按 `ai/session-rules.md` 更新本地续接文件。

若命令输出会写入正式文档、任务单或续接文件中的“待人工确认项”，不得只列问题；应包含 AI 建议、建议依据、备选方案、取舍影响和阻塞关系，并明确 AI 建议不等于用户已确认事实。

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
| `scenario` | 我想<场景> / 帮我<做某事> / 新手引导 | `template-docs/scenario-guides.md`（元命令：先产出引导计划，再路由到具体 command） |
| `sync-methodology` | 更新方法论 / 同步模板方法论 / 已同步但没做后续 / 补完同步后流程 | `git-guide.md` §5、`ai/prompts/maintainers/12-sync-template.md` |
| `post-sync-cleanup` | 同步后整理项目 | `ai/prompts/maintainers/15-post-sync-cleanup.md` |
| `docs-system-audit` | 文档体系审核 / PLM 链路审计 | `ai/prompts/review/16-docs-system-audit.md` |
| `docs-evaluation` | 文档评估 / 阶段转换评估 / 单文档评估 | `ai/prompts/review/19-docs-evaluation.md` |
| `tech-env-evaluation` | 技术环境评估 / 技术路线评估 / 依赖安装验证 / 本机能不能跑 | `ai/prompts/review/20-tech-env-evaluation.md` |
| `template-proposal-summary` | 汇总模板优化提案 | `ai/prompts/maintainers/11-template-proposal-summary.md` |
| `generate-docs` | 生成文档体系 / 补齐 00-09 | `ai/prompts/docs/00-generate-or-complete-docs.md` |
| `review-inputs` | 评审输入材料 | `ai/prompts/docs/01-review-inputs.md` |
| `project-review` | 项目审查 / 实现合规审查 | `ai/prompts/review/03-project-review.md` |
| `edit-single-doc` | 修订单个文档 / 补前端交互设计 / 补 UI 设计 | `ai/prompts/docs/04-edit-single-doc.md` |
| `sync-docs-from-code` | 代码反向同步文档 | `ai/prompts/docs/07-sync-docs-from-code.md` |
| `phase-upgrade` | Phase 升级评估 | `ai/prompts/planning/08-phase-upgrade.md` |
| `docs-checklist` | 开发前文档检查 | `ai/prompts/review/10-docs-checklist.md` |
| `run-dev-task` | 执行 Sprint / 执行任务 | `ai/prompts/dev/02-run-task.md` |
| `fix-bug` | 修 Bug / 修复缺陷 | `ai/prompts/dev/05-fix-bug.md` |
| `sprint-summary` | Sprint 总结 / 验收总结 | `ai/prompts/dev/09-sprint-summary.md` |
| `collect-env` | 采集本机环境 | `ai/prompts/setup/13-collect-env.md`、`scripts/collect-env.ps1` |
| `new-project` | 新建派生项目 | `ai/prompts/setup/14-new-project.md`、`scripts/new-project.sh` |
| `commit-message` | 生成提交信息 | `ai/prompts/git/06-commit-message.md` |
| `submit-proposal` | 提交提案给维护者 / 回流模板 | `ai/prompts/maintainers/17-submit-proposal.md`（跨仓库开 issue） |
| `submit-feedback` | 收集使用问题反馈给模板 | `ai/prompts/maintainers/18-submit-feedback.md`（半自动汇集 + 开 issue） |

## 维护规则

- 命令文件不得复制大段 Prompt 正文，避免与 `ai/prompts/` 双写漂移。
- 新增高频 Prompt 或 SOP 时，应评估是否需要新增 / 更新命令入口。
- 删除或重命名 Prompt 时，必须同步更新命令路由和 `template-sync.json`。
