# 派生项目模板同步运行记录：v1.61.4

## 基本信息

- 项目：LUMEN-DEMO
- 同步日期：2026-08-13
- 同步前模板版本：v1.60.2（`TEMPLATE-BASE.md` 记录；main 经 PR #121 squash `665ba86` 合入）
- 目标模板版本：v1.61.4（`git fetch ... ai-project-template main` + `git show FETCH_HEAD:VERSION` 核实）
- 项目自身版本（`VERSION`）：v3.8.13（使用 `--preserve-project-version` 保持）
- 继承版本记录（`TEMPLATE-BASE.md`）：存在；Lineage type：ordinary derived project；当前同步到 v1.61.4
- 同步分支：`chore/sync-template-v1.61.4`
- 实际同步提交（非 PR merge commit）：`6df559f`（`sync template v1.61.4 from ai-project-template`）；提案归档提交 `b2ddc7e`
- 操作入口：`/run sync-methodology`（模板仓发起模式，经 `ai-records/project-registry/registry.md` 解析 LUMEN）
- AI 工具 / CLI：Codex

## 执行命令

- dry-run：`powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run > sync.log 2>&1`；EXIT=0；变更 22 文件（`Δ` 行计数），禁止路径零真实触及
- commit：`powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit --preserve-project-version > sync-commit.log 2>&1`；EXIT=0；生成 `6df559f`
- 是否使用版本保留标志：`--preserve-project-version`（普通派生）；与 `TEMPLATE-BASE.md` Lineage type 一致，无冲突
- check-derived-sync：`powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1`（HEAD=`6df559f`）；EXIT=0；22 个同步清单内变更全部合规
- 是否触发 PowerShell fallback（sync / check）：否
- post-sync-cleanup：轻量执行（只读整理审计；无需要迁移的项目文件）
- docs-system-audit（同步后审计）：轻量执行（只读摘要；完整全链路审计留待单独排期）
- 项目验证建议 / 已执行验证：已执行 `git diff --check` 等价边界核验（`git show --name-only --stat HEAD` 无项目专属文件）；CI 全量待 push/PR 后观察

### 命令真实性记录

| 步骤 | 实际命令 / 动作 | 退出结果 | 是否完整执行 | 是否等价替代 | 是否生成独立报告 | 备注 |
|---|---|---|---|---|---|---|
| dry-run 预览 | `sync-template.ps1 --dry-run > sync.log 2>&1` | EXIT=0，22 文件变更，无越界 | 是 | 否 | 不适用 | 目标版本 v1.61.4；版本机制为保留本地 VERSION、更新 TEMPLATE-BASE.md |
| commit / 同步 | `sync-template.ps1 --commit --preserve-project-version > sync-commit.log 2>&1` | EXIT=0，提交 `6df559f` | 是 | 否 | 不适用 | 22 个方法论文件；`VERSION` 保持 v3.8.13 |
| check-derived-sync | `check-derived-sync.ps1` | EXIT=0，边界检查通过 | 是 | 否 | 不适用 | 22 文件全合规；版本机制双信号通过 |
| post-sync-cleanup | 只读整理审计（docs 结构 / README / project-rules / 环境约束 / workflow） | 无文件迁移需求 | 轻量执行 | 否 | 否 | 输出摘要见下 |
| docs-system-audit | 同步后审计模式只读摘要 | 无 P0 阻塞项 | 轻量执行 | 否 | 否 | 完整审计建议单独排期 |
| 项目验证 | `git show --name-only --stat HEAD` 边界核验 + 前轮 `git diff --check` 建议 | 通过 | 是 | 是 | 不适用 | CI 全量待 push/PR 后观察 |

## A13 完成判据矩阵

| A13 步骤 | 证据 | 状态 | 若非完成，原因 | 下一步 |
|---|---|---|---|---|
| 标准闭环计划 | registry 解析 + 两阶段预检逐项 pass/fail + 逐项目同步计划 | 完成 | — | — |
| dry-run 预览 | `sync.log` EXIT=0；22 变更；禁止路径零真实触及；版本机制正确 | 完成 | — | — |
| commit + 边界验证 | 同步提交 `6df559f` + `check-derived-sync.ps1` 通过（22 文件全合规） | 完成 | — | — |
| post-sync-cleanup | 只读整理审计：docs 根目录无游离文件、无 `_scaffold` 残留、workflow 已用 project-check、版本机制双信号通过 | 轻量执行 | 仅做只读审计与摘要，未执行文件迁移（无迁移需求） | 前轮遗留 2 项 P2（docs/01、docs/02 历史标题层级/编号连续性）可延后 |
| docs-system-audit | 同步后审计只读摘要：本轮 sync 未触碰 `ai/doc-standards/*`，规范基线无新增缺口 | 轻量执行 | 未做完整全链路回溯审计 | 按需单独排期完整审计 |
| 提案回流收口 | 4 份归档（`b2ddc7e`）+ 1 份保留（#334 暂缓）；决策矩阵见下 | 完成 | — | — |
| 同步报告留痕 | 本记录 `sync-records/template-sync/2026-08-13-sync-template-v1.61.4.md` | 完成 | — | 待 push/PR 后回填 PR 链接 |

> 结论：本次标记为「同步主链完成，A13 闭环尚有剩余项」（post-sync-cleanup 与 docs-system-audit 为轻量执行）。

## 同步结果

- 是否成功：是
- 新增 / 修改的方法论文件：22（见 `6df559f` 文件清单：ai/ 规则、ai/prompts/、ai/commands/、template-docs/、CONTRIBUTING.md、git-guide.md、TEMPLATE-BASE.md、upstream/CHANGELOG* 等）
- `VERSION` / `CHANGELOG.md` 是否保持项目 / 领域模板自身版本：是（`VERSION`=v3.8.13）
- `TEMPLATE-BASE.md` 是否新增 / 更新继承模板版本：是（Current synced template version: v1.61.4；Synced at: 2026-08-13；Project version at sync time: v3.8.13）
- 项目专属文件是否被误改：否（禁止路径零触及）
- 是否新增 / 刷新 `ai/doc-standards/00-09`：否（本轮同步无 doc-standards 变更）
- 是否残留旧 `docs/_scaffold/`：否

## 同步后整理摘要

- 是否执行 `/run post-sync-cleanup`：轻量执行（只读审计 + 迁移计划）
- README / `ai/project-rules.md` / docs 分区是否需整理：否（docs/ 根目录仅 README + 00-09 + 分区子目录；`docs/references/` 为项目专属例外且已在 project-rules 声明；README 标准版块齐全；`ai/project-rules.md §2.4` 项目版本管理已存在；`docs/env/local-env.md` 存在；workflow 仅有 `project-check.yml`，无 `template-check.yml` 残留）
- 已处理项：本轮无 docs 迁移需求
- 待确认项：
  1. `docs/01-user-requirements.md` 与 `docs/02-srs.md` 历史标题层级 / 编号连续性（v1.60.2 同步记录遗留，P2 可延后）。
  2. v1.60.2 同步运行记录（2026-08-09）中「推送 / PR 未执行」与 main 历史不符——实际经 PR #121 squash `665ba86` 合入；建议后续修订旧记录或接受差异。
- 建议回写 / 后续迁移任务：无强制迁移；完整 docs-system-audit 可单独排期

## 文档体系审计摘要

- 是否执行 `/run docs-system-audit` 同步后审计模式：轻量执行（只读摘要）
- 规范基线缺口：无（本轮 sync 未刷新 `ai/doc-standards/*`，v1.61.4 相对 v1.60.2 无新增文档规范基线）
- 可接受兼容差异：docs/01、docs/02 历史标题层级 / 编号连续性（前轮遗留，P2）
- 项目事实风险：无新发现
- 回梳计划摘要：无 P0 阻塞项；完整全链路审计建议在后续任务中单独排期执行

## 项目验证建议

- 建议运行的测试 / lint / 文档检查 / 人工验收：`git diff --check`；push/PR 后观察 `project-check.yml`（后端单元 / PG integration / ruff / mypy / 前端 eslint）
- 已执行验证与结果：`check-derived-sync.ps1` 通过；`git show --name-only --stat` 边界核验通过；`VERSION`/`TEMPLATE-BASE.md` 双版本核对通过
- 未验证项与原因：CI 全量未跑（等待 push/PR 后由远端 CI 验证；本地未运行业务测试，因本轮仅同步方法论文件、不涉及业务代码）

## 遇到的问题

- 沙箱 / 权限：`git fetch` 写入 `.git/FETCH_HEAD` 被沙箱拒绝（Permission denied），经提权后成功——环境问题，非模板问题。
- 网络 / 代理：registry 备注 LUMEN 使用代理 `127.0.0.1:7897`，但该端口当前未监听；直连 GitHub fetch 成功（本机网络当前可用）。后续如受限，按 `git-guide.md §5.7` 配 git / gh 代理。
- 前轮记录过时：v1.60.2 运行记录「推送 / PR 未执行」与 main 实际（PR #121 squash `665ba86`）不符；registry 亦曾标注「未复查 PR 记录」。已在本记录澄清。
- 同步脚本问题：无。

## 可优化点归纳

| 问题 | 是否项目专属 | 是否建议回流模板 | 建议提案 |
|---|---|---|---|
| registry 备注的代理端口未监听但直连可用 | 环境问题 | 否 | 无 |
| v1.60.2 运行记录「推送/PR 未执行」与 main 历史不符 | 项目记录过时 | 否 | 无（后续修订旧记录） |
| 同步 / 边界检查 / 归档全链路工作正常，无方法论缺口 | 否 | 否 | 无 |

## 已生成的回流提案

- 无（本次未生成新 `_proposals/TEMPLATE-UPGRADE-*.md`）

## 提案回流收口

- 扫描范围：`_proposals/`（5 份）+ 模板仓 issue #332/#333/#334/#335（+ #290 DEFER 不涉及 LUMEN 提案）
- 已确认被模板采纳或已有决议的提案：4 份（见决策矩阵）
- 已归档到 `_archive/proposals/` 的本地提案：4 份（`b2ddc7e`）
- 仍需保留在 `_proposals/` 的提案：1 份（stack-adapters-fastapi-react，对应 #334 暂缓）
- 无法判断是否已处理的 issue / 提案与待确认项：无

| 本地提案 | 模板 issue / PR | 远端状态 | 关闭原因 / 处理结果 | 本地动作建议 |
|---|---|---|---|---|
| `TEMPLATE-UPGRADE-universal-code-consistency-supplement.md` | issue #332 / PR #341 | closed / merged | 已采纳（#332 退回重写稿，v1.61.4 PATCH 落地 `global-rules §2.1` 应用说明） | 归档 |
| `TEMPLATE-UPGRADE-web-profile-code-consistency.md` | issue #333 / PR #338 | closed / merged | 部分采纳（#333 Batch A，v1.61.2 落地 `template-docs/web-fullstack-profile.md §9`） | 归档 |
| `TEMPLATE-UPGRADE-ai-code-governance-routing-map.md` | issue #335 | closed | 已替代处理（选 A 不引入；gap A/B 落地 v1.61.3「去重声明必填 + 自动检查归位」，PR #339） | 归档 |
| `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` | 拆分至 A/B/C（#332/#333/#334） | — | 实证索引·已拆分，不单独回流 | 归档 |
| `TEMPLATE-UPGRADE-stack-adapters-fastapi-react.md` | issue #334 | open | 延后（证据与成熟度不足，待 ≥2 独立项目实证） | 保留 |

## 后续动作

- 是否需要 `/run post-sync-cleanup`：轻量执行已覆盖；无强制迁移
- 是否需要 `/run docs-system-audit`：可单独排期完整审计
- 是否需要按审计结果回梳 `docs/00-09` / `docs/design` / `docs/env`：仅 docs/01、docs/02 两项 P2 可延后
- 是否需要补项目验证入口：否（project-check.yml 已含后端/前端验证）
- 是否需要人工清理旧目录：否
- 是否需要同步回模板仓库：是（push 同步分支 + 创建 PR；随后更新 `ai-records/project-registry/registry.md` point-in-time 字段）