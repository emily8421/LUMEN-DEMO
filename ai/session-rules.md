# Session Rules（AI 会话续接与断点恢复规则）

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本文件定义 AI CLI / 多 AI 工具协作时的本地会话续接规则。它只管理“任务状态交接”，不替代 `docs/`、`tasks/`、`_proposals/` 或 Git 提交记录。

## 1. 续接文件定位与裁决优先级

默认本地续接文件：

```text
.ai/session-handoff.md
```

兼容旧文件（仅读旧项目时兜底，新项目不再创建）：

```text
NEXT-STEPS.md
```

- `.ai/session-handoff.md` / `NEXT-STEPS.md` 只用于本地会话断点恢复，不是项目事实文档，不进入正式提交（均已 gitignore），不得替代 `docs/08-dev-plan.md` 的进度摘要或 `docs/09-verification.md` 的验证证据 / 验收记录。handoff 虽为本地 gitignored 文件，但体积仍受 §6.1 rollup 约束，不得无限膨胀。
- 续接文件不得记录 token、密钥、账号密码、客户敏感数据或无法提交到仓库的隐私事实；只记录任务状态、文件路径、命令和待确认项。待确认项应尽量包含 AI 建议、建议依据、备选方案、取舍影响和阻塞关系，避免只留下无法续接的问题清单。

**裁决优先级**（恢复上下文时按此链判定，高优先级覆盖低优先级）：

1. **Git 客观事实**（`git status --short --branch` / `git log` / `git stash list` / `git worktree list` / 当前分支 / 未提交 diff）——永远最新、永远可信。
2. **`.ai/session-handoff.md`**——主观记录，提供任务意图 / 计划 / 待确认项，但可能过时。
3. **`NEXT-STEPS.md`**——仅当 handoff 不存在时的兼容兜底。
4. **冲突仲裁**：任何续接文件与 Git 事实冲突时，**以 Git 为准 + 停下问用户**，不得直接覆盖项目文件。

**主动中断 vs 被动中断**（决定 handoff 可不可信，进而决定恢复依据）：

| 中断类型 | 触发 | handoff 状态 | 恢复依据 |
|---|---|---|---|
| 主动中断 | 用户主动停下 / AI 按 §4 正常收尾 | 新鲜（含本次任务计划与进度） | handoff 给意图 + Git 给事实，交叉核对 |
| 被动中断 | AI CLI 撞 token / 时间上限被强制断、来不及写 handoff；或切换到另一个 AI CLI 接手 | 缺失或停留在上一个任务 | **Git 为唯一可信锚点**，handoff 仅作参考，重建后向用户确认 |

> 关键：被动中断（含跨 CLI 接手）是高频场景，此时不能信任 handoff 的新鲜度，必须以 Git 客观事实重建上下文。跨 Claude / Codex / Cursor 等 CLI 时，续接文件 + Git 是公共状态，换 CLI 不丢上下文。

> worktree 内被动中断（会话在独立 worktree 里工作到一半被断，改动未提交）适用同一裁决：以该 worktree 的 Git 事实（分支 / HEAD / 未提交 diff）为锚点重建上下文；handoff「活跃 worktree」段的登记仅作意图参考（见 §3 / §6 / §8），不替代 Git 事实。

## 2. 工具运行时元数据边界

会话恢复必须优先依据项目定义的 Session Handoff 机制完成，恢复结论只能来自以下可审计来源：

1. Git 客观事实：当前分支、HEAD、工作区、stash、diff、最近提交。
2. 项目续接文件：`.ai/session-handoff.md`，兼容兜底 `NEXT-STEPS.md`。
3. 项目正式文档：`docs/`、`tasks/`、`ai/commands/`、`ai/prompts/`。
4. 用户在当前会话中明确提供的信息。

CLI 或 AI 工具自身产生的运行时元数据，包括但不限于 `~/.claude/sessions/`、`~/.claude/projects/`、`memory/`、`subagents/`、cache、trace、history、conversation dump、agent meta 文件，仅可作为调试信息或用户明确要求时的辅助参考，不得直接作为项目续接依据。

未经 Git 状态、项目续接文件或项目文档交叉验证，不得据此推断当前任务、当前阶段、未完成工作、待办事项、Agent / SubAgent 仍在运行、项目事实或设计结论。

如果确需引用工具运行时元数据，必须明确标注信息来源、可信度和验证状态；无法验证的内容只能标记为“推测信息”，不得作为继续执行任务的事实依据。

## 3. 新会话恢复流程

**流程分流**：若用户只要求“读取续接点”“继续上次”“恢复上下文”“resume”或类似表达，且没有要求继续执行远端 issue / PR、同步、合并、关闭、清理、分析、设计、编码或写入任务，先执行 §3.1 快速续接模式；该模式是对 `ai/index.md` 规则路由的场景化裁剪。若快速摘要后用户要求继续执行具体任务，或恢复过程发现需要进入分析 / 设计 / 编码 / 写入，必须回到本节完整流程，先读取 `ai/index.md` 与 `ai/rules-core.md`，再按任务路由读取对应规则包；无法判断时读取完整规则回退包。

AI 每次在项目中开始分析、设计或编码前，应按以下顺序恢复上下文（**先取 Git 客观事实，再读续接文件**，避免被过时记录先入为主）：

1. 读取 `ai/index.md` 与 `ai/rules-core.md`，并按任务类型读取对应规则包；无法判断时读取 `ai/index.md` 的完整规则回退包。
2. 不得先扫描 CLI 私有会话、Memory、SubAgent 或 Cache 目录来推断项目续接点；如用户明确要求检查此类目录，只能按 §2 作为调试信息处理。
3. 运行只读状态检查：`git status --short --branch`、`git log --oneline -8`、`git stash list`、`git worktree list`，确认当前分支、工作区是否干净、最近提交；若除主工作区外存在活跃 worktree，报告其路径 / 分支 / HEAD 是否落后主仓 / 是否含未提交改动，作为恢复上下文的一部分。
4. 读取 `.ai/session-handoff.md`；若不存在，再读 `NEXT-STEPS.md`。
5. **交叉核对，判主动 / 被动中断**：
   - handoff 记录的任务 / 分支 / 进度与 Git 一致 → 主动中断，handoff 可信，进入第 6 步。
   - handoff 缺失，或与 Git 冲突（分支不符 / 进度落后 / 孤儿改动）→ **被动中断（含跨 CLI 接手）**，以 Git 为唯一锚点重建上下文，handoff 仅作参考。
6. 如（可信）续接文件或 Git 状态指向具体文件或任务，再读取相关 `docs/`、`tasks/`、`ai/prompts/` 或 `ai/commands/` 文件。
7. 向用户简述恢复状态：当前任务、已完成、下一步、待确认项，并列出依据来源（Git / handoff / docs / 当前用户输入）；若为被动中断且上下文无法完全重建，列出不确定项。
8. 若续接记录与 Git 状态冲突，先说明冲突并请求确认，不得直接覆盖项目文件。

### 3.1 快速续接模式

当用户只说“读取续接点”“继续上次”“恢复上下文”“resume”或类似表达，且没有明确要求继续执行远端 issue / PR、同步、合并、关闭、清理或编码任务时，默认进入**快速续接模式**。目标是在约 2 分钟内给出可行动的恢复摘要，而不是做完整审计。

快速续接模式只服务“恢复摘要”，不是分析、设计、编码或任务执行入口；因此默认不展开读取任务规则包。最小规则读取范围为：入口规则中的快速续接例外说明、`ai/session-rules.md` §1 / §3.1，以及必要时的 `ai/commands/resume.md`。一旦用户要求继续执行任务，或需要修改文件、联网复核远端、处理 issue / PR、同步、提交、清理分支、分析设计或编码，立即退出快速续接模式，按 `ai/index.md` 的对应 command / 任务路由读取规则；无法判断时读取完整规则回退包。

Windows / PowerShell 环境读取中文规则或续接文件时，如输出出现乱码但命令成功，先判定为编码输出问题，不得把乱码当作文件损坏、续接缺失或规则事实。应使用显式 UTF-8 重读最小必要文件后再继续，例如：

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Path ai/session-rules.md -Encoding UTF8 -Raw
```

快速续接模式默认只做本地只读检查：

1. `git status --short --branch`
2. `git log --oneline -3`
3. `git stash list`
4. `git worktree list`（除主工作区外存在活跃 worktree 时，作为恢复摘要的上下文一并报告）
5. 读取 `VERSION`（若存在）
6. 读取 `.ai/session-handoff.md` 的元数据、当前状态、下次优先做和阻塞 / 待确认；若不存在，再读 `NEXT-STEPS.md`

快速续接模式默认**不做**：

- 不联网，不查询 GitHub issue / PR / Actions，不刷新远端镜像。
- 不读取大段历史文档、完整 `CHANGELOG.md`、全部 `_proposals/` 或归档目录。
- 不继续执行任务、不关闭 issue、不删除分支、不提交 / 推送。
- 不把过期 handoff 的“下次优先做”直接当作当前事实。

裁决规则：

- 若 handoff 的 `Branch`、`HEAD`、`VERSION` 或当前任务进度与 Git 客观事实一致，可判定 handoff 新鲜，并输出下一步建议。
- 若 handoff 缺少元数据，或其分支 / HEAD / 版本 / 进度明显落后于 Git，立即标记为 `handoff stale`；以 Git 客观事实和用户当前输入为准，handoff 仅作参考，不继续深挖旧记录。
- 若 Git 工作区 dirty、存在 stash、当前分支与 handoff 分支不同，或用户贴出的中断日志与 handoff 冲突，先列出冲突和不确定项，等待用户确认。
- 远端状态只可写成“未复核”；只有用户明确要求“继续处理远端 issue / PR”或“执行下一步”时，才切换到对应命令并按写入确认规则执行。

快速续接输出至少包含：当前分支与工作区、最近提交 / 版本、handoff 新鲜度（fresh / stale / missing）、可继续事项、待确认项、未复核的远端事项。

### 3.2 同会话规则复用边界

规则路由读取仍是进入分析、设计、编码、模板维护、PR / 合并闭环或任何状态变更前的强制门禁；快速续接升级为执行任务时，必须先读取 `ai/index.md` 与 `ai/rules-core.md`，再按任务路由读取对应规则包；无法判断时读取完整规则回退包。

在同一个未中断会话中，若已完成上述规则路由读取，且满足以下全部条件，后续顺序治理步骤可复用已加载规则，不必重复读取无关规则包：

- 本轮没有修改 `ai/index.md`、`ai/*-rules.md`、`ai/commands/*`、相关 `ai/prompts/*`、`AGENTS.md`、`CLAUDE.md` 或 `.cursor/rules/project-rules.mdc` 等规则 / 入口文件。
- 后续步骤仍属于同一任务链的 edit / amend / push / PR checks / merge closure / handoff 等连续收尾动作，没有切换到新的命令、提案、项目、仓库角色或需求范围。
- 当前上下文仍能明确追溯已读取的规则版本、任务边界、修改范围、验证方式和待确认项。

出现以下任一情况时，必须重新读取相关规则；若无法判断影响范围，则回到完整规则回退包：规则 / 入口文件被修改或同步，用户切换任务或命令，跨仓库 / 跨角色后规则来源不确定，发生长时间中断或上下文压缩，续接记录与 Git 事实冲突，或即将执行的动作不在已加载规则覆盖范围内。

### 3.3 Checkpoint Mode（短输出 / 检查点模式）

Checkpoint Mode 是非快速续接任务的执行中防跑飞协议；触发条件见 `ai/rules-core.md`。它不替代任务路由、写入确认或正式验收记录，只约束 AI 每一步怎么执行、汇报和停止。

执行要求：

1. **风险分级确认**：Checkpoint Mode 不等于所有小动作都逐次等待用户确认；本地只读、限定范围搜索和用户已授权范围内的本地编辑可合并为小批次执行，批次后短汇报。
2. **高风险单步确认**：push、创建 / 合并 PR、关闭 issue、删除分支、发布 release、强制覆盖、安装依赖、写入未知范围或破坏性命令仍必须单步确认。
3. **一步一汇报**：对远端状态变更、长验证、跨仓库操作、权限 / sandbox 故障处理等高风险动作，一次只做一个小步骤；每步后用 1–3 行说明结果、证据位置、下一步和是否需要确认。
4. **失败即停**：命令失败、超时、权限不足、sandbox / network 错误、CI pending 或输出异常时，先停止并说明错误类别与建议下一步；不得连续重试或继续串行执行后续步骤。
5. **长输出摘要**：成功的长输出检查只保留命令、退出码 / 结论和关键摘要；失败、警告或不稳定结果保留最小可定位片段，不能用摘要掩盖失败细节。
6. **远端短轮询**：GitHub issue / PR / Actions 只读查询可在用户授权的远端阶段内合并执行；CI pending 即汇报 pending，不长时间等待。
7. **续接可恢复**：每个阶段性节点应输出可复制的续接摘要；若任务形成可继续状态，按 §4 / §5 维护 `.ai/session-handoff.md`，但不得让 handoff 替代正式文档、提案、PR 或验证记录。

## 4. 自动更新触发点

当本轮工作形成可续接任务时，AI 应主动维护续接文件，不等用户额外提醒。典型触发点：

- 输出多步骤执行计划后：记录当前任务、执行计划和下一步。
- 开始多步骤任务前：记录任务目标、影响范围、预计修改文件和验证方式。
- 完成计划中的一个步骤后：更新已完成 / 进行中 / 未完成状态。
- 准备修改文件前：记录预期变更文件、修改原因和风险点。
- 完成文件修改后：记录实际新增 / 修改 / 删除文件、验证结果和下一步。
- 遇到阻塞或待确认项时：记录阻塞原因、待确认问题、AI 建议、建议依据、备选方案、取舍影响和是否阻塞当前 Sprint / Phase。
- 完成 Sprint / Phase 收口、或连续多轮文档修改后：可运行 `docs-health-review` 对文档体系做一次收尾梳理（识别臃肿 / 重复 / 结构退化 / 状态滞后），整理须遵守 `ai/global-rules.md` §8.4 整理例外。
- 结束回复前：若仍有未完成任务，刷新“下次优先做”。
- 结束回复前（hotspot 收尾自检）：若本轮命中 §4.1 任一触发条件，**默认写入本地 `.ai/token-hotspots/` 单条记录（不询问、不上传）**；若本地未汇总记录累计 ≥3 份，按 §4.2 提示 rollup。
- 结束回复前（pitfall 收尾自检）：若本轮产生坑 / 问题 / 教训观察（bug、流程坑、低效行为导致返工或缺陷；纯 token 成本仍归 §4.1 hotspot），**默认写入本地 `.ai/pitfalls/` 单条记录（不询问、不上传）**；若本地未汇总记录累计 ≥3 条，按 §4.3 提示 rollup。
- 结束回复前（handoff rollup 自检）：若续接文件 Latest checkpoint 达 §6.1 触发阈值（累计 ≥N 个或 ≥M 行），提示按 rollup 流程压缩旧 checkpoint + 归档原文到 `.ai/session-handoff-archive/`，避免续接文件无限膨胀。

纯只读问答、一次性解释或没有形成后续任务的对话，可以不更新续接文件。

### 4.1 Token 热点观察触发

token hotspot 是可选的 AI 协作观察记录，用于记录上下文读取成本、重复读取、可优化点和质量影响；它不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。

**路径分层（v1.57.2 起）**：

| 类型 | 路径 | Git 语义 |
|---|---|---|
| 单条原始记录（默认） | `.ai/token-hotspots/YYYY-MM-DD-<task-slug>.md` | gitignored，**纯本地、不询问、不上传** |
| 阶段汇总（提炼后的有价值结论） | `ai-records/token-hotspots/SUMMARY.md`、`ai-records/token-hotspots/summaries/` | **入库**，需用户确认并走 PR |

单条记录是过程性材料，默认只本地保留；只有被提炼进汇总、值得跨会话 / 跨项目参考的结论才入库。派生项目启用此机制时，需自行在 `.gitignore` 补 `.ai/token-hotspots/`（`.gitignore` 不纳入下行同步，各项目自行维护）。

当一次连续任务命中以下任一情况时，AI **必须在每次任务收尾（§4 触发点）做 hotspot 自检**：命中触发条件则默认本地写入 `.ai/token-hotspots/YYYY-MM-DD-<task-slug>.md`（不询问、不上传），不命中则跳过。默认写入是硬行为——不是“问用户是否记录”的可询问项：

- 从快速续接进入分析 / 设计 / 写入任务后，又完整读取 `ai/index.md` 及其规则清单。
- 执行模板维护、提案评估、文档审计、同步整理、编码实现、PR / CI 闭环等较长任务，并多次读取大文件、长日志或重复运行大输出命令。
- `scripts/check-template.*`、CI 日志、GitHub PR / Actions 状态、`_proposals/` / `_archive/` / `ai/prompts/` 等成为主要上下文成本。
- 用户询问 token 消耗、上下文热点、是否触发 hotspot，或显式要求记录本轮热点。

写入与处置协议：

- **默认本地、不询问、不上传**：单条 hotspot 记录默认写入 gitignored 的 `.ai/token-hotspots/`，AI 直接写入即可，不需要每次询问“保留 / 提交 / 删除”，也不进入正式提交。
- **“不提交”不等于“删除”**：用户说“不用上传 / 不提交远端”时，AI 必须保留本地记录，**不得自动删除**；删除本地记录必须由用户明确说出“删除”。
- **三选一仅用于入库决策**：只有当用户考虑把某条记录**入库**（写进 `ai-records/token-hotspots/`）时，AI 才给出三选一——保留本地不入库 / 作为观察材料提交走 PR / 删除；用户说“提交 / 走 PR”才按模板维护流程切分支、提交、push、PR。
- 记录不得包含 token、密钥、账号密码、客户敏感数据、完整对话正文或无法提交到仓库的隐私事实；只记录任务类型、文件路径、命令类别、热点判断、质量影响和优化建议。
- 若 `.ai/token-hotspots/` 不存在，首次创建目录无需等待确认（本地观察材料，已 gitignore）；若需写入入库路径 `ai-records/token-hotspots/`，首次创建前仍需说明并等待用户确认。

验证证据摘要约定：

- 对成功的长输出检查（如 `scripts/check-template.*`、CI / Actions 状态、批量文档扫描），默认只在回复、handoff 或 hotspot 记录中保留命令名、退出码 / check 结论、关键摘要和失败链接（如有），避免把完整成功日志重复带入工作上下文。
- 若检查失败、结果不稳定、用户要求审计原始证据，或成功日志中包含必须人工复核的警告 / 风险路径，应保留失败片段、警告片段、日志链接或最小可定位上下文；不得用摘要掩盖失败细节。

### 4.2 累计 summary 触发（rollup）

单条 hotspot 记录在本地累计后，应主动提示阶段性汇总，提炼出入库的 `SUMMARY.md`，避免重复热点分散、不回流。**汇总循环**：本地攒若干条单条 → 提炼成 SUMMARY 入库 → 本地单条可清理 / 归档。AI 收尾自检（§4 触发点）时顺带核对本地未汇总计数；累计 ≥3 份即按 rollup 流程提示，不靠事后想起。

- 当本地 `.ai/token-hotspots/` 有 **3 份及以上未被 summary 覆盖**的记录时，AI 在相关任务收尾前应提示“已有多份 token hotspot 记录，建议生成 / 更新阶段性 summary”，并询问是否把提炼结论写入入库路径 `ai-records/token-hotspots/SUMMARY.md`（单条仍留本地）。
- 若已有 `SUMMARY.md`，且上次 summary 后本地又新增 **3 份及以上**记录，AI 应提示更新。
- 若用户显式询问 token 消耗、hotspot 机制、“为什么没有 summary”或要求“分析 hotspots / 形成 summary”，AI 可直接按授权生成 / 更新。
- summary（入库）的写入边界严于单条：默认识别并询问，不得静默创建 / 修改；首次创建或更新 `SUMMARY.md` 前需说明目标路径、内容类别和隐私过滤口径，并按 `ai/project-rules.md` §6 取得确认。
- summary 不替代 handoff、正式文档、验证记录或模板提案；可复用的模板改进须另起 `_proposals/TEMPLATE-UPGRADE-*.md`，已转提案的记录不重复作为同一问题的 summary 输入（除非用户明确要求复盘）。
- 已纳入 SUMMARY 的记录不得再次计入 3 份阈值；旧记录状态缺失时，AI 应先按 SUMMARY 覆盖边界判断，无法判断时列为“需人工确认”，不得直接重复纳入。

summary 最小结构（写入 `SUMMARY.md` 时参考）：

```text
# Token Hotspot 汇总：<日期范围>

## 0. 覆盖边界
- 已覆盖记录（本地 .ai/token-hotspots/）：<日期或文件名清单>
- 未覆盖记录：<日期或文件名清单>
- 下一次 rollup 起点：从 <date> 起，只统计 `汇总状态：未汇总` 的本地记录

## 1. 汇总范围（记录日期、任务类型、主要热点）
## 2. 为什么触发 / 为什么此前未触发
## 3. 重复热点模式（规则读取 / 文档读取 / 代码探索 / 验证日志 / 环境诊断 等）
## 4. 已形成的改进建议（区分必须保留 / 应压缩 / 应沉淀 / 应拆会话）
## 5. 模板回流判断（是否需要形成 _proposals/ 提案，去项目化边界）
```

单条 hotspot 记录**必须填写**汇总状态字段（新记录必填；旧记录不强制改写，逐步补齐），方便识别 rollup 范围与避免重复分析：

```text
- 汇总状态：未汇总 / 已纳入 SUMMARY.md（<日期或范围>） / 已转提案 <path-or-url> / 本地保留不提交 / 已归档 <path>
- 处置状态（可选）：本地未提交 / 已提交 PR #<n> / 已合并 <commit> / 已删除（用户确认）
```

> 上述“必填”为写入时的字段完整性要求（AI 自觉），**不引入 `scripts/check-template.sh` 自检断言或 CI 门禁**，与 `template-docs/rd-data-chain.md` §4「无自检门禁、避免过度治理」一致。

### 4.3 坑 / 问题观察日志（pitfall observation log）

pitfall observation log 是可选的 AI 协作观察记录，与 §4.1 token-hotspot 平行：**token-hotspot 管 AI 开发的上下文 / 成本热点，pitfall 管 AI 引入或踩到的坑 / 问题 / 教训**（bug、流程执行坑、低效行为导致的返工或缺陷）。pitfall 记录既覆盖「当场踩的坑」，也覆盖「维护中发现的存量 AI 代码问题」——后者是检验与完善代码生成规范的主要输入。它是定期审视的原始材料，不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 或 `_proposals/`。

**路径分层（v1.61.1 起）**：

| 类型 | 路径 | Git 语义 |
|---|---|---|
| 单条原始记录（默认） | `.ai/pitfalls/YYYY-MM-DD-<short-name>.md` | gitignored，**纯本地、不询问、不上传** |
| 阶段汇总（提炼后的有价值结论） | `ai-records/pitfalls/SUMMARY.md`、`ai-records/pitfalls/summaries/` | **入库**，需用户确认并走 PR；**默认不建**，只有提炼出值得跨会话 / 跨项目参考的脱敏结论时才创建 |

单条记录是过程性材料，默认只留本地；只有被提炼进汇总、值得跨会话 / 跨项目参考的结论才入库。派生项目启用此机制时，需自行在 `.gitignore` 补 `.ai/pitfalls/`（`.gitignore` 不纳入下行同步，各项目自行维护）。

**单条记录字段（最小，建议非必填）**：

```markdown
- 日期：
- 项目 / 场景：
- 现象：（发生了什么问题 / bug / 低效行为导致返工或缺陷）
- 根因分类：AI 引入 / 流程坑 / 环境 / 模板缺口
- 规避或修复：（怎么绕开或修掉的）
- 是否可通用：是 / 否（换一个项目是否还会踩）
- 已转提案：`_proposals/...` 或 issue 链接；未转为「待审视」
```

**触发与写入**：

- 任务收尾自检（§4 触发点）顺带判断本次是否产生坑观察；有则写单条（1–3 行，不膨胀）。
- **存量代码维护触发**：维护、治理、重构或引入新检查器（类型检查 / lint / 契约对齐 / 测试）时，发现既有 AI 生成代码的缺陷、「看似可行实靠巧合运行」的障眼法实现、或类型 / 接口与实际契约的失配——即使问题非本次会话产生，也应记录单条（根因分类标「AI 引入」，现象注明发现场景），作为生成规范迭代的验证材料。
- **观察日志 ≠ 提案**：日志是原始材料，triage 后才转 `_proposals/TEMPLATE-UPGRADE-*.md`，避免提案收件箱噪音。
- 定期审视复用既有触发点：`ai/global-rules.md` §9（模板优化反馈）的任务收尾审视；**C1（`ai/prompts/maintainers/11-template-proposal-summary.md`）只负责提案 triage，不承担坑日志计数**（与 token-hotspot 计数同源——计数在收尾自检，不在 C1）。
- 记录不得包含 token、密钥、账号密码、客户敏感数据、完整对话正文或无法提交到仓库的隐私事实；只记录现象、根因分类、规避方式、可通用性与流转去向。

**累计汇总触发（rollup，类比 §4.2）**：

- 当本地 `.ai/pitfalls/` 有 **3 份及以上未被 summary 覆盖**的记录时，AI 在相关任务收尾前应提示“已有多份 pitfall 记录，建议生成 / 更新阶段性 summary”，并询问是否把提炼结论写入入库路径 `ai-records/pitfalls/SUMMARY.md`（单条仍留本地）。
- summary（入库）的写入边界严于单条：默认识别并询问，不得静默创建 / 修改；首次创建或更新 `SUMMARY.md` 前需说明目标路径、内容类别和隐私过滤口径，并按 `ai/project-rules.md` §6 取得确认。
- 可通用的归纳去向 `_proposals/TEMPLATE-UPGRADE-*.md` 回流模板；项目专属的留项目 `docs/decisions/` 或项目本地日志。已转提案的记录不重复作为同一问题的 summary 输入。

**生命周期与清理（类比 §4.1 / §4.2 + §6.1）**：

- 单条经 rollup 纳入 `SUMMARY.md` 或已转提案后，标注「已纳入 / 已转提案」；已覆盖的旧单条可归档到 `.ai/pitfalls-archive/`（gitignored）或清理，避免无限累积。**用归档而非删除**，保留可追溯。
- 单条记录建议填写汇总状态字段（新记录建议填，非强制）：

```text
- 汇总状态：未汇总 / 已纳入 SUMMARY.md（<日期或范围>） / 已转提案 <path-or-url> / 本地保留不提交 / 已归档 <path>
```

> 上述字段为写入时的完整性建议（AI 自觉），**不引入 `scripts/check-template.*` 自检断言或 CI 门禁**，与 `template-docs/rd-data-chain.md` §4「无自检门禁、避免过度治理」一致；模板自检不守 `.ai/pitfalls/` 内容，路径忽略由 `.gitignore` + 规则自觉保证。

## 5. 写入确认边界

- 若用户已明确要求执行多步骤任务、实现计划或继续维护任务，AI 可把续接文件更新视为该任务的本地状态记录，但仍应在首次写入前说明会维护本地续接文件。
- 若 `ai/project-rules.md` 要求任何文件写入前都必须确认，且用户没有授权执行任务，则首次创建 / 修改续接文件前也应先确认。
- 续接文件更新不得夹带正式模板规则、项目需求或设计结论；长期有效内容必须转写到 `docs/`、`tasks/`、`_proposals/`、README、SOP 或维护文档。Sprint 完成、验证通过、Phase 验收、缺陷回归或状态变化等长期事实必须回写 `docs/08-dev-plan.md` / `docs/09-verification.md`，或明确记录暂不落盘原因、风险和补做时点。

## 6. 推荐结构

续接文件建议采用以下结构，便于不同 AI 工具稳定读写：

```markdown
# AI Session Handoff

> 本文件为本地会话续接记录，不进入正式提交。

## 元数据

- Updated at:
- Status: active / closed / stale-risk
- Branch:
- HEAD:
- VERSION:
- Remote snapshot:

## 活跃 worktree

> 记录除主工作区外的活跃 worktree。创建 worktree 后立即登记；合并进 main 或明确废弃后移除 worktree 并从本段清除登记。无则写「无」。

- 路径 / 分支 / 主题：
- 未提交改动摘要：
- 处置：待救回 / 待丢弃 / 已合并待清理

## 当前任务

## 当前进度

- 已完成：
- 进行中：
- 未完成：

## 执行计划

## 最近改动

## 下次优先做

## 阻塞 / 待确认

| ID | 待确认项 | AI 建议 | 建议依据 | 备选方案 | 取舍影响 / 阻塞关系 |
|---|---|---|---|---|---|

## 恢复命令
```

样例见 `template-docs/session-handoff.example.md`。

### 6.1 Latest checkpoint rollup

handoff 的「Latest checkpoint」累加结构（配合 `global-rules §8` 只增不删、原位追加）保证续接记录可追溯，但**只规定了「如何追加」，未规定「何时压缩 / 归档旧 checkpoint」**——只增不减会让续接文件随历史累积线性膨胀，挤占快速续接（§3.1）的上下文读取上限。本小节补 rollup 机制（类比 §4.2 token-hotspot rollup），**用归档而非删除**，不违背「只增不删」，也不引入 CI 门禁（handoff 是 gitignored 本地文件，CI 无法检查）。

- **触发**：当续接文件 Latest checkpoint 累计 **≥ N 个**（建议 8-10）或文件 **≥ M 行**（建议 800-1000；具体阈值由维护者按项目定）时，AI 在任务收尾（§4 触发点）提示 rollup。
- **压缩**：保留**近 3-5 个** Latest checkpoint 原文；更早的 checkpoint 压缩为一段「**历史阶段摘要**」（每个 Phase / Sprint 收口或固定时间窗口一段，提炼：任务结论 / 已完成关键项 / 未完成与待确认 / Git 锚点 commit）。
- **归档**：被压缩的原文 checkpoint 移入 `.ai/session-handoff-archive/YYYY-MM-DD-<range>.md`（**本地 gitignored，保留可追溯，不删除**；该目录由派生项目按需创建并自行 `.gitignore`，类比 `.ai/token-hotspots/`）。
- **原位指针**：续接文件顶部「历史阶段摘要」段附归档文件路径指针，确保被动中断重建（§1）仍可回溯。
- **不替代 docs/ 回写**：有长期价值的结论（Phase 收口、验收通过、缺陷回归）仍必须回写 `docs/08` / `docs/09`（§5 既有规则）；handoff 摘要只保留「续接线索」，不是项目事实。

## 7. 与快捷命令联动

若用户通过 `ai/commands/` 快捷命令启动任务，续接文件应记录命令名、任务目标、执行计划和下一步。新会话恢复时，若续接文件记录了正在执行的命令，AI 应先读取对应 `ai/commands/*.md` 再继续。

## 8. 多会话并发操作

多个 AI 会话（或终端）同时操作同一仓库时，共用一个工作目录 = 共用一个 HEAD，`先确认分支再 commit` 是非原子操作，**必然偶发 commit 落错分支**。

**并发前先确认是否需要开独立 worktree**：`git worktree add <目录> <分支>` 让每会话有独立工作区 + HEAD（共享同一 `.git`），互不踩踏。这是 git 没有自动机制、必须靠约定的并发解法。完整操作步骤见 `git-guide.md` §4「多会话并发操作」。

**worktree 建 / 删登记责任**：

- 创建 worktree 的会话，应立即在续接文件「活跃 worktree」段登记（路径 / 分支 / 主题 / 未提交改动摘要 / 处置状态）。不登记等同不可见——其他会话 / CLI 无法知道该 worktree 存在及其改动。
- worktree 工作完成（合并进 main / 明确废弃）后，移除 worktree（`git worktree remove`）并从续接文件清除登记。
- worktree 内被动中断（改动未提交）时，续接文件的登记让接手会话能按 §1 裁决以该 worktree 的 Git 事实重建上下文；不要假设「创建者会记得提交」，模板应假设 worktree 可能被任意会话创建并中途搁置。
