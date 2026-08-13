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

派生项目或领域模板需要同步 `ai-project-template` 的最新通用方法论文件，并在同步后完成边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕；若旧流程已完成同步提交但后续闭环缺失，本命令也用于从边界验证开始补完后续。

不适用：领域派生项目同步领域 overlay 时，应读取对应领域模板维护的 L2→L3 场景剧本（L2-to-L3 playbook）和领域同步脚本；不要让领域 L3 直接跨层同步母模板。

## 必读文件

- `ai/index.md`
- `git-guide.md` §5
- `ai/prompts/maintainers/12-sync-template.md`
- `template-docs/derived-sync-report-template.md`
- `scripts/sync-template.ps1`
- `scripts/check-derived-sync.ps1`
- `ai-records/project-registry/README.md` 与 `ai-records/project-registry/registry.md`（仅当从模板仓发起“同步至派生项目 / 同步 N 个派生”时读取）

## 执行流程

> **预检两阶段契约（失败域隔离）**：只读预检分 A 阶段（身份与安全事实：本地路径 / Git 仓 / 分支与工作区 / stash / `VERSION` / `TEMPLATE-BASE.md` lineage / registry `Sync mode`）与 B 阶段（同步能力：`scripts/sync-template.*` / `scripts/check-derived-sync.*` / `template-sync.json` / 必要运行入口）。逐项输出 `pass / fail / not-checked`、按失败域隔离——B 阶段辅助检查失败不得掩盖 A 阶段已取得的关键事实；A 阶段任一关键项失败或冲突即停，仅报告、不进入 dry-run。已知文件存在性用精确路径查询（逐条 `Test-Path` / 显式 `git` 检查），不得把目录枚举或输出格式开关当筛选。详见 `ai/prompts/maintainers/12-sync-template.md`。

1. 判断当前仓库角色：
   - 若当前在普通派生项目根目录，按常规 A13 同步流程执行。
   - 若当前在领域模板根目录，按 A13 的领域模板角色口径执行，使用 `--domain-template` 保留领域模板自身版本空间。
   - 若当前在领域派生项目且目标是同步领域标准件，停止跨层操作，转对应领域模板的 L2→L3 场景剧本。
   - 若当前在 `ai-project-template` 模板仓，且用户要求“同步至派生项目 / 同步 N 个派生 / 同步 LUMEN、zhiyan 等”，进入**模板仓发起模式**：先读取 `ai-records/project-registry/README.md` 与 `registry.md`，用 `Project` / `Aliases` / `Status` / `Path status` 解析目标项目和本地路径；不得先全盘递归找目录，除非 registry 缺失或记录不完整。
2. 模板仓发起模式下，对每个目标项目按预检两阶段契约做只读预检：A 阶段逐项检查 `Local path` 存在且 `Path status=verified`、路径是 git 仓、工作区干净、`TEMPLATE-BASE.md` lineage 与 `Sync mode` 不冲突；若路径为 missing / stale-risk，先列为待确认项并停下。A 阶段任一关键项失败或冲突即停，仅报告。
3. 进入每个派生项目后，补全 A 阶段事实（Git 状态、当前 `VERSION`、`TEMPLATE-BASE.md` 若存在、lineage 一致性）；再执行 B 阶段，逐项检查 `scripts/sync-template.*`、`scripts/check-derived-sync.*`、`template-sync.json` 与必要运行入口是否存在，记录缺项和原因，**不得抹去 A 阶段已取得的关键事实**；缺项即停或转旧项目 bootstrap 路径（步骤 7）。
4. 按 `git-guide.md` §5 和 `12-sync-template` 判断是旧项目首次同步、v1.6.8+ 后续同步，还是“已同步但只补后续”的同步后续接模式。
5. 先输出标准闭环计划；若为同步后续接模式，明确跳过 dry-run / commit，从 `check-derived-sync` 开始。
6. 用户确认后执行同步命令；普通派生项目优先使用 `--preserve-project-version` 保留项目自身 `VERSION` 并更新 `TEMPLATE-BASE.md`，领域模板改用 `--domain-template` 保留领域模板自身 `VERSION` / `CHANGELOG.md` 并更新领域版 `TEMPLATE-BASE.md`；同步后续接模式不重新执行同步命令。
7. 同步后运行 `check-derived-sync`，不要用 `check-template` 验收派生项目。
8. 检查派生项目 workflow：普通 PR 不应运行模板仓 `scripts/check-template.sh`；如仍保留 `.github/workflows/template-check.yml`，提示迁移为派生项目版 `.github/workflows/project-check.yml`。
9. 触发或引导执行 `post-sync-cleanup`，先输出整理审计与迁移计划；实际移动 / 修改项目事实文档前再次确认。
10. 触发或引导执行 `docs-system-audit` 的同步后审计模式，判断旧方法生成的 `docs/00-09`、`docs/design/`、`docs/env/` 是否需按新方法回梳。
11. 给出项目验证建议；若无法运行测试 / lint / 人工验收，记录为未验证项，不写成已通过。
12. 生成或更新派生同步运行记录，推荐路径：`sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md`（长期记录，与项目文档分离）；若用户暂不想提交，可先写入 `.ai/session-handoff.md`。
13. 检查派生项目本地 `_proposals/`、续接记录、同步运行记录和已提交到模板仓的 issue 链接，判断哪些回流提案已被模板采纳 / 决议 / 延后，并给出归档或保留建议。
14. 从运行记录中判断是否存在新的可通用模板优化点；如有，生成去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。
15. 模板仓发起模式完成后，回到模板仓更新 registry 的 point-in-time 字段（Inherited / Own ver / Last sync / Notes / Path status），但不得让 registry 替代派生仓库的同步提交、PR、`TEMPLATE-BASE.md` 或同步运行记录。

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
