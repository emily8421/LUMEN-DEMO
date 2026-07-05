# Command: sync-methodology

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run sync-methodology`
- 更新方法论
- 同步模板方法论
- 派生项目同步模板

## 适用场景

派生项目需要同步 `ai-project-template` 的最新方法论文件，并在同步后完成边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕。

## 必读文件

- `ai/index.md`
- `git-guide.md` §5
- `ai/prompts/maintainers/12-sync-template.md`
- `template-docs/derived-sync-report-template.md`
- `scripts/sync-template.ps1`
- `scripts/check-derived-sync.ps1`

## 执行流程

1. 判断当前仓库是否为派生项目，而不是模板仓库本身。
2. 检查 Git 状态、当前 `VERSION`、同步脚本与 `template-sync.json` 是否存在。
3. 按 `git-guide.md` §5 和 `12-sync-template` 判断旧项目首次同步或 v1.6.8+ 后续同步路径。
4. 先输出标准闭环计划：dry-run / commit、`check-derived-sync`、`post-sync-cleanup`、`docs-system-audit`、项目验证建议和同步报告路径。
5. 用户确认后执行同步命令。
6. 同步后运行 `check-derived-sync`，不要用 `check-template` 验收派生项目。
7. 检查派生项目 workflow：普通 PR 不应运行模板仓 `scripts/check-template.sh`；如仍保留 `.github/workflows/template-check.yml`，提示迁移为派生项目版 `.github/workflows/project-check.yml`。
8. 触发或引导执行 `post-sync-cleanup`，先输出整理审计与迁移计划；实际移动 / 修改项目事实文档前再次确认。
9. 触发或引导执行 `docs-system-audit` 的同步后审计模式，判断旧方法生成的 `docs/00-09`、`docs/design/`、`docs/env/` 是否需按新方法回梳。
10. 给出项目验证建议；若无法运行测试 / lint / 人工验收，记录为未验证项，不写成已通过。
11. 生成或更新派生同步运行记录，推荐路径：`sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`（长期记录，与项目文档分离）；若用户暂不想提交，可先写入 `.ai/session-handoff.md`。
12. 从运行记录中判断是否存在可通用模板优化点；如有，生成去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。

## 写入风险

会修改派生项目内的模板方法论文件；执行 dry-run 之外的写入动作前必须确认。

## 续接要求

同步是多步骤闭环任务；开始后应按 `ai/session-rules.md` 记录当前同步阶段、已执行命令和下一步。同步完成后，应把边界验证结果、整理 / 审计摘要、项目验证建议、运行记录路径、回流提案判断和后续动作写入续接文件。
