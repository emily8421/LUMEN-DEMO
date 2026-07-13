# 派生项目模板同步运行记录模板

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本模板用于派生项目完成 `ai-project-template` 方法论同步后，记录真实同步过程、问题与可回流优化点。建议保存到派生项目：

```text
sync-records/template-sync/YYYY-MM-DD-sync-template-vX.Y.Z.md
```

> 长期记录路径为 `sync-records/template-sync/`，与项目开发文档（`docs/`）分离，便于团队审计和回流提案扫描。若用户暂不想提交长期记录，可先写入 `.ai/session-handoff.md` 作为临时续接文件。

## 基本信息

- 项目：
- 同步日期：
- 同步前模板版本：
- 目标模板版本：
- 项目 / 领域模板自身版本（`VERSION`）：
- 继承版本记录（`TEMPLATE-BASE.md`）：存在 / 不存在；Lineage type：ordinary derived project / domain template；当前同步到：
- 同步分支：
- 实际同步提交（非 PR merge commit）：
- 操作入口：`/run sync-methodology` / 手动命令
- AI 工具 / CLI：

## 执行命令

- dry-run：
- commit：
- 是否使用版本保留标志：`--preserve-project-version`（普通派生）/ `--domain-template`（领域模板）/ 无（沿用旧语义）；若与仓库 `TEMPLATE-BASE.md` Lineage type 冲突，记录脚本停止提示
- check-derived-sync（记录传入的 `<sync-commit>`；若 `HEAD` 是 PR merge commit，不要用 merge commit 代替同步提交）：
- 是否触发 PowerShell fallback（sync / check）：
- post-sync-cleanup：
- docs-system-audit（同步后审计）：
- 项目验证建议 / 已执行验证：

### 命令真实性记录

| 步骤 | 实际命令 / 动作 | 退出结果 | 是否完整执行 | 是否等价替代 | 是否生成独立报告 | 备注 |
|---|---|---|---|---|---|---|
| dry-run 预览 |  |  | 是 / 否 | 是 / 否 | 不适用 |  |
| commit / 同步 |  |  | 是 / 否 | 是 / 否 | 不适用 |  |
| check-derived-sync |  |  | 是 / 否 | 是 / 否 | 不适用 |  |
| post-sync-cleanup |  |  | 完整执行 / 轻量执行 / 未执行 | 是 / 否 | 是 / 否 |  |
| docs-system-audit |  |  | 完整执行 / 轻量执行 / 未执行 | 是 / 否 | 是 / 否 |  |
| 项目验证 |  |  | 是 / 否 | 是 / 否 | 不适用 |  |

> 说明：只读抽查或摘要只能标为“轻量执行”，不得写成“完整执行”。工具异常下采取等价安全动作时，必须记录替代依据和未覆盖项。

> 填写范例（dry-run 行）：实际命令 `bash scripts/sync-template.sh --dry-run`；退出结果 `EXIT=0，预览 12 文件变更（3 新增 / 9 修改）`；是否完整执行 `是`；备注 `无差异时不提交`。

## A13 完成判据矩阵

| A13 步骤 | 证据 | 状态 | 若非完成，原因 | 下一步 |
|---|---|---|---|---|
| 标准闭环计划 |  | 完成 / 未完成 |  |  |
| dry-run 预览 |  | 完成 / 等价替代 / 失败 |  |  |
| commit + 边界验证 |  | 完成 / 等价替代 / 失败 |  |  |
| post-sync-cleanup |  | 完整执行 / 轻量执行 / 未执行 |  |  |
| docs-system-audit |  | 完整执行 / 轻量执行 / 未执行 |  |  |
| 提案回流收口 |  | 完成 / 部分完成 / 未执行 |  |  |
| 同步报告留痕 |  | 完成 / 未完成 |  |  |

> 若仍存在 `轻量执行`、`未执行`、`失败`、`部分完成` 或无法判断项，本次只能标记为“同步主链完成，A13 闭环尚有剩余项”，不得写成“A13 完整闭环完成”。

> 填写范例（dry-run 预览行）：证据 `dry-run 输出摘要 + EXIT=0`；状态 `完成`。（commit + 边界验证行：证据 `同步提交 abc1234 + check-derived-sync 通过`；状态 `完成`。）

## 同步结果

- 是否成功：
- 新增 / 修改的方法论文件：
- `VERSION` / `CHANGELOG.md` 是否保持项目 / 领域模板自身版本：
- `TEMPLATE-BASE.md` 是否新增 / 更新继承模板版本（领域版含 `Domain standards scope`）：
- 项目专属文件是否被误改：
- 是否新增 / 刷新 `ai/doc-standards/00-09`：
- 是否残留旧 `docs/_scaffold/`：

## 同步后整理摘要

- 是否执行 `/run post-sync-cleanup`：
- README / `ai/project-rules.md` / docs 分区是否需整理：
- 已处理项：
- 待确认项：
- 建议回写 / 后续迁移任务：

## 文档体系审计摘要

- 是否执行 `/run docs-system-audit` 同步后审计模式：
- 规范基线缺口：
- 可接受兼容差异：
- 项目事实风险：
- 回梳计划摘要：

## 项目验证建议

- 建议运行的测试 / lint / 文档检查 / 人工验收：
- 已执行验证与结果：
- 未验证项与原因：

## 遇到的问题

- Git / gh / Git Bash / PowerShell / 网络问题（如触发 fallback，请记录脚本输出的 fallback 标识与结果）：
- `gh issue create` / `submit-proposal` 问题（认证、重复 issue、`--body-file`、标签缺失、来源标签降级）：
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

## 提案回流收口

> 目录关系：`_proposals/` 是收件箱（待处理 / 候选）；已被模板采纳或决议的提案应移动到 `_archive/proposals/` 留痕。仅有远端 `closed` 不得自动归档，须能从 VERSION / CHANGELOG / PR 判断处理结果。

- 扫描范围：`_proposals/` / `.ai/session-handoff.md` / `sync-records/template-sync/` / 模板仓 issue 链接
- 已确认被模板采纳或已有决议的提案：
- 已归档到 `_archive/proposals/` 的本地提案：
- 仍需保留在 `_proposals/` 的提案：
- 无法判断是否已处理的 issue / 提案与待确认项：

| 本地提案 | 模板 issue / PR | 远端状态 | 关闭原因 / 处理结果 | 本地动作建议 |
|---|---|---|---|---|
|  |  | open / closed / merged | 已采纳 / 已拒绝 / 部分采纳 / 延后 / 不明 | 归档 / 保留 / 新建 follow-up / 等待 |

> 仅有 `closed` 不得自动归档；必须能从 VERSION、CHANGELOG、PR 或 issue 说明判断处理结果，否则保留或标记为待确认。

## 后续动作

- 是否需要 `/run post-sync-cleanup`：
- 是否需要 `/run docs-system-audit`：
- 是否需要按审计结果回梳 `docs/00-09` / `docs/design` / `docs/env`：
- 是否需要补项目验证入口：
- 是否需要人工清理旧目录：
- 是否需要同步回模板仓库：
