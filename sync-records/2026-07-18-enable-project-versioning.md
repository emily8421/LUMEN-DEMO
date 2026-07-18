# LUMEN-DEMO 项目自有版本机制启用记录 — v0.1.0

> post-sync-cleanup 留痕。落地 `sync-records/template-sync/2026-07-17-sync-template-v1.54.1.md`「后续动作：版本机制完整启用」。

## 基本信息

- 项目：LUMEN-DEMO（ordinary derived project）
- 日期：2026-07-18
- 分支：`chore/enable-project-versioning`
- 启用 commit：`f91c09e chore(versioning): 启用 LUMEN-DEMO 项目自有版本机制 v0.1.0`
- 触发：v1.54.1 同步后 `check-derived-sync` 非阻断提示「派生项目版本机制未启用」

## 改动（5 文件）

| 文件 | 改动 |
|---|---|
| `VERSION` | `v1.47.1` → `v0.1.0`（项目自有版本起点；原值系模板沿用） |
| `CHANGELOG.md` | 顶部新增项目版本段 + `## v0.1.0` 基线条目；模板历史下移至「## 历史模板同步记录（保留）」 |
| `TEMPLATE-BASE.md` | `Project version at sync time`: v1.47.1 → v0.1.0 |
| `ai/project-rules.md` | 新增 §2.8 项目版本管理（PATCH/MINOR/MAJOR 语义 + bump 规则 + 发布动作 + CI 校验说明） |
| `.github/workflows/project-check.yml` | 新建，含 VERSION↔CHANGELOG 版本一致性校验 + whitespace + derived sync boundary |

## 关键决策

- **起点版本号 v0.1.0**：重置干净自有起点，切割模板版本号；对齐 `zhiyan-digital-cs-platform`（v0.3.0）思路。VERSION 原值 v1.47.1 是模板沿用值，非项目自有版本。
- **覆盖防护**：VERSION/CHANGELOG **保留在 `template-sync.json` 清单**（不删，删了过不了 `check-template.sh` 自检）；靠 `--preserve-project-version`（ordinary 派生自动启用）防同步覆盖。
- **章节位置 §2.8**：`check-derived-sync` 按字符串「项目版本管理」检测（不挑编号）；脚本提示亦建议 §2.8；贴 LUMEN §2.x 项目约束系列。
- **参考实现**：`zhiyan-digital-cs-platform`（已启用 v0.3.0，project-check.yml + project-rules §7）。

## 验证

- `check-derived-sync`：✓ 派生项目版本机制已启用（project-check.yml 含版本一致性校验 + ai/project-rules.md 含「项目版本管理」规则）
- 本地模拟 CI 版本校验：VERSION=v0.1.0 ↔ CHANGELOG 顶部第一个版本标题 v0.1.0 一致，三段式 + 顶部一致性校验通过

## 后续

- push `chore/enable-project-versioning` + PR + 合并（PR 上 CI 自检 project-check.yml）
- 更正母模板 memory `derived-project-lumen-demo.md`（双版本正常 → 原沿用模板版本，2026-07-18 启用自有版本机制 v0.1.0）
- （可选）母模板 registry 更新 LUMEN 版本机制状态
