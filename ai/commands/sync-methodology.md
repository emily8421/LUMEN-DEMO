# Command: sync-methodology

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

## 用户说法

- `/run sync-methodology`
- 更新方法论
- 同步模板方法论
- 派生项目同步模板
- 已同步但没做后续
- 补完同步后流程
- 同步后续接

## 适用场景

派生项目需要同步 `ai-project-template` 的最新方法论文件，并在同步后完成边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕；若旧流程已完成同步提交但后续闭环缺失，本命令也用于从边界验证开始补完后续。

## 必读文件

- `ai/index.md`
- `git-guide.md` §5
- `ai/prompts/maintainers/12-sync-template.md`
- `template-docs/derived-sync-report-template.md`
- `scripts/sync-template.ps1`
- `scripts/check-derived-sync.ps1`

## 执行流程

1. 判断当前仓库是否为派生项目，而不是模板仓库本身。
2. 检查 Git 状态、当前 `VERSION`、`TEMPLATE-BASE.md`（若存在）、同步脚本与 `template-sync.json` 是否存在。
3. 按 `git-guide.md` §5 和 `12-sync-template` 判断是旧项目首次同步、v1.6.8+ 后续同步，还是“已同步但只补后续”的同步后续接模式。
4. 先输出标准闭环计划；若为同步后续接模式，明确跳过 dry-run / commit，从 `check-derived-sync` 开始。
5. 用户确认后执行同步命令；普通派生项目优先使用 `--preserve-project-version` 保留项目自身 `VERSION` 并更新 `TEMPLATE-BASE.md`，领域模板改用 `--domain-template` 保留领域模板自身 `VERSION` / `CHANGELOG.md` 并更新领域版 `TEMPLATE-BASE.md`；同步后续接模式不重新执行同步命令。
6. 同步后运行 `check-derived-sync`，不要用 `check-template` 验收派生项目。
7. 检查派生项目 workflow：普通 PR 不应运行模板仓 `scripts/check-template.sh`；如仍保留 `.github/workflows/template-check.yml`，提示迁移为派生项目版 `.github/workflows/project-check.yml`。
8. 触发或引导执行 `post-sync-cleanup`，先输出整理审计与迁移计划；实际移动 / 修改项目事实文档前再次确认。
9. 触发或引导执行 `docs-system-audit` 的同步后审计模式，判断旧方法生成的 `docs/00-09`、`docs/design/`、`docs/env/` 是否需按新方法回梳。
10. 给出项目验证建议；若无法运行测试 / lint / 人工验收，记录为未验证项，不写成已通过。
11. 生成或更新派生同步运行记录，推荐路径：`sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`（长期记录，与项目文档分离）；若用户暂不想提交，可先写入 `.ai/session-handoff.md`。
12. 检查派生项目本地 `_proposals/`、续接记录、同步运行记录和已提交到模板仓的 issue 链接，判断哪些回流提案已被模板采纳 / 决议 / 延后，并给出归档或保留建议。
13. 从运行记录中判断是否存在新的可通用模板优化点；如有，生成去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。

## A13 完成判据门禁

同步任务结束前必须输出 A13 完成判据矩阵，至少包含：

| A13 步骤 | 证据 | 状态 | 若非完成，原因 | 下一步 |
|---|---|---|---|---|
| 标准闭环计划 | 用户确认记录 / 计划 | 完成 / 未完成 |  |  |
| dry-run 预览 | 命令与输出摘要 | 完成 / 等价替代 / 失败 |  |  |
| commit + 边界验证 | 同步提交 + `check-derived-sync` | 完成 / 等价替代 / 失败 |  |  |
| post-sync-cleanup | 审计摘要 / 报告路径 | 完整执行 / 轻量执行 / 未执行 |  |  |
| docs-system-audit | 审计摘要 / 报告路径 | 完整执行 / 轻量执行 / 未执行 |  |  |
| 提案回流收口 | issue 状态 + 归档建议 | 完成 / 部分完成 / 未执行 |  |  |
| 同步报告留痕 | `sync-records/template-sync/*` | 完成 / 未完成 |  |  |

状态语义：`完成` / `完整执行` 表示按命令或 Prompt 标准流程执行；`等价替代` 表示工具异常下采取等价安全动作且记录替代依据；`轻量执行` 表示只读抽查或摘要，不等于完整命令执行；`未执行` / `失败` 必须列原因和下一步。

若矩阵仍存在 `轻量执行`、`未执行`、`失败` 或无法判断项，最终回答不得称“A13 完整闭环完成”，只能称“同步主链完成，A13 闭环尚有剩余项”，并列出补完路径。

## 写入风险

会修改派生项目内的模板方法论文件；执行 dry-run 之外的写入动作前必须确认。

## 续接要求

同步是多步骤闭环任务；开始后应按 `ai/session-rules.md` 记录当前同步阶段、已执行命令和下一步。同步完成后，应把边界验证结果、整理 / 审计摘要、提案回流收口结论、项目验证建议、运行记录路径、回流提案判断和后续动作写入续接文件。
