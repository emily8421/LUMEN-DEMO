# 派生项目模板同步运行记录：v1.64.0

> **补记录说明（2026-08-18）**：本次同步实际发生在 2026-08-18 PR #207 分支内（bootstrap → sync → feat 三 commit 搭载，squash 为 `a5741ec`），当时未写运行记录（最新记录停在 v1.62.0）。本文件为**事后补写**，依据 Git 客观事实（`a2f99d2` sync commit 36 文件 + TEMPLATE-BASE.md + upstream/CHANGELOG*）与模板仓落地评论（#350/#354-#358）还原，非当日实时记录。

## 基本信息

- 项目：LUMEN-DEMO
- 同步日期：2026-08-18（PR #207 内 commit `a2f99d2`，补记录日期同日）
- 同步前模板版本：v1.62.0（`TEMPLATE-BASE.md` 记录；经 PR #173 squash `4df2f9f` 合入，运行记录 `2026-08-14-sync-template-v1.62.0.md`）
- 目标模板版本：v1.64.0（`TEMPLATE-BASE.md` 已更新核实）
- 项目自身版本（`VERSION`）：同步时 v3.11.0（TEMPLATE-BASE「Project version at sync time」）
- 继承版本记录（`TEMPLATE-BASE.md`）：存在；Lineage type：ordinary derived project；当前同步到 v1.64.0
- 同步载体：**功能 PR 搭载**（PR #207 `feat(vault): Wave 3 收口…` 分支 `8ad5dbf` 前置两个 commit：`4561893` bootstrap + `a2f99d2` sync；非独立同步 PR）
- 实际同步提交：`a2f99d2`（`sync template v1.64.0 from ai-project-template`）；PR squash 后对应 `a5741ec`
- 操作入口：随 Wave 3 开发会话执行（非 `/run sync-methodology` 独立发起）
- AI 工具 / CLI：Claude Code（glm-5.2）

## 同步范围（v1.62.0 → v1.64.0，跨 v1.63.0 / v1.64.0 两版）

- **v1.63.0（MINOR，Batch A 两 PR）**：
  - PR A1 #362（squash `49c1f2b`）：doc-standards 02/04 引用式概述章骨架 + 00-05 元信息精简 + E6 反向同步落点约束 + 文档评估阶段归属审计（吸收回流提案 #356 / #355）。
  - PR A2 #363（squash `d028bc5`）：doc-standards 可选 OO 建模 overlay + `document-lifecycle-rules §13` 图表生成式镜像机制 + 样例脚本 `template-docs/examples/extract-diagrams.mjs` + references 参考区约定（吸收回流提案 #354 / #358）。
- **v1.64.0（MINOR，Batch B+C PR #364，squash `f51b39e`）**：形态裁剪执行落地（#351）+ `global-rules §5` 根目录三层区框架（#357 §2.2，与 #351 §2.4 合并落一处）+ pitfall 存量 AI 代码触发口径（#350）+ 场景手册指引。
- 本仓落点核对：36 文件变更（+596/-72），含 `ai/doc-standards/*` 10 件、`ai/document-lifecycle-rules.md`、`ai/global-rules.md`、`ai/session-rules.md`、`scripts/check-template.sh`、`template-docs/*`（含 `ui-knowledge/` 4 件）、`template-sync.json`、`upstream/CHANGELOG*` 2 件、`TEMPLATE-BASE.md`。

## 执行命令真实性记录

> 本节为补记录性质：原始执行日志未留存，下表按 Git 事实还原；「是否完整执行」以 commit 存在性与文件清单为准。

| 步骤 | 事实依据 | 退出结果 | 是否完整执行 | 备注 |
|---|---|---|---|---|
| bootstrap 同步脚本 | commit `4561893`（`chore: bootstrap latest sync script`） | 已入库 | 是 | 同步脚本自身被上游更新，dry-run 前置校验拦截后按提示 bootstrap |
| sync commit | commit `a2f99d2`（36 文件，`git show --stat` 核实） | 已入库 | 是 | `--preserve-project-version`（VERSION 同步时保持 v3.11.0） |
| check-derived-sync | **无当日证据留存** | 未复核 | **未执行 / 未留痕** | 补记录轮已复核：36 文件清单与 `template-sync.json` 对齐（sync commit 内含 template-sync.json 自身 + upstream 继承参考） |
| sync 运行记录 | **缺失（本文件即补写）** | — | **欠账已补** | 教训：PR 搭载同步也必须落运行记录 |
| post-sync 提案归档 | **缺失 → 2026-08-18 补做** | — | **欠账已补** | 6 份已吸收提案归档 `_archive/proposals/`，见 INDEX §2 |

## 与提案回流的对应关系

本次同步把 LUMEN 自己回流的 6 份提案成果带回本仓（闭环验证「回流 → 模板吸收 → 下行同步」链路）：

| 回流 issue | 落地 PR / 版本 | 吸收力度 |
|---|---|---|
| #356 概述章骨架 + #355 落点审计 | #362 / v1.63.0 | 全部采纳（通用化措辞） |
| #354 OO overlay + #358 图表镜像 | #363 / v1.63.0 | 全部采纳（建议 + 可选力度） |
| #350 pitfall 存量触发 | #364 / v1.64.0 | 采纳 |
| #357 根目录结构 | #364 / v1.64.0 | **部分采纳**（仅 §2.2 三层区框架；§2.1 物理归拢另立评估） |

在途：#334（Stack Adapter，2026-08-12 开，暂无维护者回应）、#370（目录划分依据，2026-08-18 开）。

## 遗留与教训

- **PR 搭载同步的收尾欠账**：功能 PR 内夹带 sync commit 时，运行记录与 post-sync 归档两步易被功能收尾吞掉——后续凡 PR 搭载 sync，合并前须确认「运行记录 + 提案归档」两件或明确记入待办。
- `check-derived-sync` 边界验证无留痕：补记录轮已做清单级复核，但「当日执行过」不可考；下次独立同步严格留痕。
