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

- `.ai/session-handoff.md` / `NEXT-STEPS.md` 只用于本地会话断点恢复，不是项目事实文档，不进入正式提交（均已 gitignore），不得替代 `docs/08-dev-plan.md` 的进度摘要或 `docs/09-verification.md` 的验证证据 / 验收记录。
- 续接文件不得记录 token、密钥、账号密码、客户敏感数据或无法提交到仓库的隐私事实；只记录任务状态、文件路径、命令和待确认项。待确认项应尽量包含 AI 建议、建议依据、备选方案、取舍影响和阻塞关系，避免只留下无法续接的问题清单。

**裁决优先级**（恢复上下文时按此链判定，高优先级覆盖低优先级）：

1. **Git 客观事实**（`git status --short --branch` / `git log` / `git stash list` / 当前分支 / 未提交 diff）——永远最新、永远可信。
2. **`.ai/session-handoff.md`**——主观记录，提供任务意图 / 计划 / 待确认项，但可能过时。
3. **`NEXT-STEPS.md`**——仅当 handoff 不存在时的兼容兜底。
4. **冲突仲裁**：任何续接文件与 Git 事实冲突时，**以 Git 为准 + 停下问用户**，不得直接覆盖项目文件。

**主动中断 vs 被动中断**（决定 handoff 可不可信，进而决定恢复依据）：

| 中断类型 | 触发 | handoff 状态 | 恢复依据 |
|---|---|---|---|
| 主动中断 | 用户主动停下 / AI 按 §4 正常收尾 | 新鲜（含本次任务计划与进度） | handoff 给意图 + Git 给事实，交叉核对 |
| 被动中断 | AI CLI 撞 token / 时间上限被强制断、来不及写 handoff；或切换到另一个 AI CLI 接手 | 缺失或停留在上一个任务 | **Git 为唯一可信锚点**，handoff 仅作参考，重建后向用户确认 |

> 关键：被动中断（含跨 CLI 接手）是高频场景，此时不能信任 handoff 的新鲜度，必须以 Git 客观事实重建上下文。跨 Claude / Codex / Cursor 等 CLI 时，续接文件 + Git 是公共状态，换 CLI 不丢上下文。

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
3. 运行只读状态检查：`git status --short --branch`、`git log --oneline -8`、`git stash list`，确认当前分支、工作区是否干净、最近提交。
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

快速续接模式默认只做本地只读检查：

1. `git status --short --branch`
2. `git log --oneline -3`
3. `git stash list`
4. 读取 `VERSION`（若存在）
5. 读取 `.ai/session-handoff.md` 的元数据、当前状态、下次优先做和阻塞 / 待确认；若不存在，再读 `NEXT-STEPS.md`

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

## 4. 自动更新触发点

当本轮工作形成可续接任务时，AI 应主动维护续接文件，不等用户额外提醒。典型触发点：

- 输出多步骤执行计划后：记录当前任务、执行计划和下一步。
- 开始多步骤任务前：记录任务目标、影响范围、预计修改文件和验证方式。
- 完成计划中的一个步骤后：更新已完成 / 进行中 / 未完成状态。
- 准备修改文件前：记录预期变更文件、修改原因和风险点。
- 完成文件修改后：记录实际新增 / 修改 / 删除文件、验证结果和下一步。
- 遇到阻塞或待确认项时：记录阻塞原因、待确认问题、AI 建议、建议依据、备选方案、取舍影响和是否阻塞当前 Sprint / Phase。
- 结束回复前：若仍有未完成任务，刷新“下次优先做”。

纯只读问答、一次性解释或没有形成后续任务的对话，可以不更新续接文件。

### 4.1 Token 热点观察触发

`ai-records/token-hotspots/` 是可选的 AI 协作观察记录，用于记录上下文读取成本、重复读取、可优化点和质量影响；它不是项目事实文档，不替代 `.ai/session-handoff.md`、`docs/08-dev-plan.md` 或 `docs/09-verification.md`。

当一次连续任务命中以下任一情况时，AI 应在收尾前主动提示“本轮可能触发 token hotspot 记录”，并询问用户是否写入 `ai-records/token-hotspots/YYYY-MM-DD-<task-slug>.md`：

- 从快速续接进入分析 / 设计 / 写入任务后，又完整读取 `ai/index.md` 及其规则清单。
- 执行模板维护、提案评估、文档审计、同步整理、编码实现、PR / CI 闭环等较长任务，并多次读取大文件、长日志或重复运行大输出命令。
- `scripts/check-template.*`、CI 日志、GitHub PR / Actions 状态、`_proposals/` / `_archive/` / `ai/prompts/` 等成为主要上下文成本。
- 用户询问 token 消耗、上下文热点、是否触发 hotspot，或显式要求记录本轮热点。

写入边界：

- 默认只自动**识别并询问**，不得静默创建或修改文件；写入仍需遵守 `ai/project-rules.md` §6 的确认规则。
- 若用户在当前任务中明确授权“本轮结束自动记录 token hotspot”，AI 可在本轮收尾时写入；写入前仍应说明目标路径、内容类别和隐私过滤口径。
- 记录不得包含 token、密钥、账号密码、客户敏感数据、完整对话正文或无法提交到仓库的隐私事实；只记录任务类型、文件路径、命令类别、热点判断、质量影响和优化建议。
- 若 `ai-records/token-hotspots/` 不存在，首次创建目录前必须说明这是可选观察材料，并等待用户确认。

验证证据摘要约定：

- 对成功的长输出检查（如 `scripts/check-template.*`、CI / Actions 状态、批量文档扫描），默认只在回复、handoff 或 hotspot 记录中保留命令名、退出码 / check 结论、关键摘要和失败链接（如有），避免把完整成功日志重复带入工作上下文。
- 若检查失败、结果不稳定、用户要求审计原始证据，或成功日志中包含必须人工复核的警告 / 风险路径，应保留失败片段、警告片段、日志链接或最小可定位上下文；不得用摘要掩盖失败细节。

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

## 7. 与快捷命令联动

若用户通过 `ai/commands/` 快捷命令启动任务，续接文件应记录命令名、任务目标、执行计划和下一步。新会话恢复时，若续接文件记录了正在执行的命令，AI 应先读取对应 `ai/commands/*.md` 再继续。

## 8. 多会话并发操作

多个 AI 会话（或终端）同时操作同一仓库时，共用一个工作目录 = 共用一个 HEAD，`先确认分支再 commit` 是非原子操作，**必然偶发 commit 落错分支**。

**并发前先确认是否需要开独立 worktree**：`git worktree add <目录> <分支>` 让每会话有独立工作区 + HEAD（共享同一 `.git`），互不踩踏。这是 git 没有自动机制、必须靠约定的并发解法。完整操作步骤见 `git-guide.md` §4「多会话并发操作」。
