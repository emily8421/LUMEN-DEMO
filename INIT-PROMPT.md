# 常用 Prompt 模板索引

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件是 Prompt Library 的轻量索引。AI CLI 可优先使用 `ai/commands/` 快捷命令路由；完整 Prompt 仍保留在 `ai/prompts/`，用于需要查看详细执行模板时读取。

## 使用方式总览

1. **优先用快捷命令**：用户可说“评审输入材料”“生成文档体系”“更新方法论”，或输入 `/run review-inputs`、`/run generate-docs`、`/run sync-methodology`；AI 先读取 `ai/commands/README.md` 与对应命令文件。
2. **再读取详细 Prompt**：命令文件只做路由，AI 仍需读取其指向的 `ai/prompts/`、`SOP.md`、`git-guide.md` 或脚本说明。
3. **按任务阶段选择**：开发用 `run-dev-task`，审查用 `project-review` / `docs-checklist`，局部文档变更用 `edit-single-doc`，修 Bug 用 `fix-bug`。
4. **收尾时使用辅助入口**：提交前用 `commit-message`，代码与文档不一致用 `sync-docs-from-code`，阶段升级用 `phase-upgrade`，Sprint 完成用 `sprint-summary`。
5. **模板同步与维护**：新建派生项目用 `new-project`，采集本机环境用 `collect-env`；派生项目同步模板方法论用 `sync-methodology`；同步后整理项目专属内容用 `post-sync-cleanup`；模板仓库处理 `_proposals/` 时用 `template-proposal-summary`。

| 当前场景 | 快捷命令 | Prompt 文件 | 主要目的 |
|---|---|---|---|
| 需要多入口生成 / 补齐完整 docs | `/run generate-docs` | `ai/prompts/docs/00-generate-or-complete-docs.md` | 从愿景、需求、PRD、任务或现有系统输入生成 / 补齐文档体系 |
| 输入材料不确定、要先评审 | `/run review-inputs` | `ai/prompts/docs/01-review-inputs.md` | 判断入口模式、文档剖面、生成准备度和缺口 |
| 要实现某个 Sprint / 切换 AI 工具续接 | `/run run-dev-task` | `ai/prompts/dev/02-run-task.md` | 限定范围执行单任务，避免跨范围改动 |
| 要审查项目或实现是否合规 | `/run project-review` | `ai/prompts/review/03-project-review.md` | 按需求、架构、技术、DB/API、边界和追溯维度审查 |
| 单独修订一份 docs 文档 | `/run edit-single-doc` | `ai/prompts/docs/04-edit-single-doc.md` | 在规则约束下做局部文档更新 |
| 修复 Bug | `/run fix-bug` | `ai/prompts/dev/05-fix-bug.md` | 先定位和提出最小方案，再改代码 |
| 需要生成提交信息 | `/run commit-message` | `ai/prompts/git/06-commit-message.md` | 根据实际改动给出清晰 commit message |
| 代码实现与 docs 不一致 | `/run sync-docs-from-code` | `ai/prompts/docs/07-sync-docs-from-code.md` | 先把事实差异同步回文档 |
| 准备进入下一 Phase | `/run phase-upgrade` | `ai/prompts/planning/08-phase-upgrade.md` | 评估当前完成度并草拟 Phase 边界更新 |
| Sprint 做完要验收 | `/run sprint-summary` | `ai/prompts/dev/09-sprint-summary.md` | 对照验收标准总结是否完成 |
| 生成 03-09 后人工验收 | `/run docs-checklist` | `ai/prompts/review/10-docs-checklist.md` | 在编码前拦住文档空洞、越界和自相矛盾 |
| 模板仓库汇总派生项目提案 | `/run template-proposal-summary` | `ai/prompts/maintainers/11-template-proposal-summary.md` | 读取 `_proposals/` 并形成模板优化计划 |
| 派生项目同步模板方法论 | `/run sync-methodology` | `ai/prompts/maintainers/12-sync-template.md` | 按 SOP 执行 `sync-template.sh` 下行同步并创建 PR |
| 需要采集本机资源约束 | `/run collect-env` | `ai/prompts/setup/13-collect-env.md` | 自动生成 `docs/env/local-env.md` 并补人工确认项 |
| 需要从模板新建派生项目 | `/run new-project` | `ai/prompts/setup/14-new-project.md` | 调用 `scripts/new-project.sh` 创建项目并完成初始化入口 |
| 同步后整理派生项目 | `/run post-sync-cleanup` | `ai/prompts/maintainers/15-post-sync-cleanup.md` | 审计 docs 分区、README、project-rules 与运行环境约束，先出迁移计划再执行 |
| 项目成型后回溯审计全链路 | `/run docs-system-audit` | `ai/prompts/review/16-docs-system-audit.md` | 用 document-lifecycle-rules 回溯审视 PLM 链路合理性、可行性与一致性，先出报告不改文件 |

> 原则：Prompt 不是需求本身。AI 只能基于 `docs/`、`ai/document-lifecycle-rules.md`、`ai/project-rules.md` 与人工确认的信息工作；如果输入不足，先补输入，不要让 AI 猜。生成或修改任何项目事实文档前，必须按文档生命周期规则声明上游输入、约束来源、允许修改范围和下游影响。
