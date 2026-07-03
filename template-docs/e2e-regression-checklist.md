# L3 端到端回归清单（模板发布前）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本清单是 `ai-project-template` **MINOR / MAJOR 发布前**的 L3 端到端回归项，在专用测试派生项目（或临时派生项目）上跑，确认模板改动没有破坏同步链路、批量同步、场景引导、文档生成等端到端能力。

> 这是**模板维护者**发布门；派生项目不跑。可自动化部分用 `scripts/e2e-sync-check.sh`，不可自动化部分人工跑，结果记到 `template-docs/e2e-report-template.md`。

## 如何建 / 用专用测试派生项目 `ai-project-template-e2e`

专用测试派生项目（private，回归专用）只需建一次：

```bash
gh repo create emily8421/ai-project-template-e2e --private
bash scripts/new-project.sh ai-project-template-e2e --account <你的账号> --visibility private
# 或本地-only：bash scripts/new-project.sh ai-project-template-e2e --local --no-remote
```

每次回归：进 `ai-project-template-e2e` 目录，把它同步到待发布的模板版本，再按下表跑。

## 回归项

| # | 项 | 步骤 | 预期 | 通过判据 | 自动 |
|---|---|---|---|---|---|
| R1 | 同步链路 | bootstrap sync 脚本 → `sync-template --dry-run` → `--commit` | 只动同步清单文件，不覆盖项目专属 | dry-run 无项目专属文件；commit 成功 | ✅ `e2e-sync-check.sh`（经 check-template 的 doc-standards 镜像自检） |
| R2 | check-derived-sync | 同步后跑 `check-derived-sync` | 通过 | 退出 0 | ✅ `e2e-sync-check.sh` |
| R3 | sync-all-derived 批量 | `sync-all-derived.sh <含 e2e 的父目录> --dry-run` | 识别 e2e 并预览同步 | 汇总无失败 | ✅ `e2e-sync-check.sh` 烟测 |
| R4 | 场景引导路由 | `/run scenario` 在 零资产 / 模板仓 / 派生项目 三种 cwd | 分别路由到 A0 / A2 或 C / A3–A14 | 路由正确 | ❌ 人工 |
| R5 | 文档生成 | `/run review-inputs` + `/run generate-docs` | 产出 00-09 + REQ 覆盖 | 骨架齐全 | ❌ 人工 |
| R6 | PowerShell fallback | 模拟 Git Bash 不可用 → `sync-template.ps1` / `check-derived-sync.ps1` | 进 PowerShell fallback 并完成 | fallback 标识 + 完成 | ❌ 人工（环境模拟） |

## 跑法

```bash
# 可自动化部分（R1/R2/R3 + check-template 全量）
bash scripts/e2e-sync-check.sh

# 人工部分（R4/R5/R6）：在 e2e 项目按上表跑，结果记到 e2e-report-template.md
```

## 通过标准

- R1–R3（自动化）全过。
- R4–R6（人工）无阻断问题；发现问题记报告 + 判断是否阻塞发布。
- 出 `template-docs/e2e-report-template.md` 报告，确认后再发版。

> MAINTAINERS 发布 Checklist 已纳入 L3 步：MINOR / MAJOR 发布前必须跑本清单 + 报告确认。
