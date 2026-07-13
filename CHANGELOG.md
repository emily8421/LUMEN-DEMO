# CHANGELOG

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.


模板版本采用三段式 `vMAJOR.MINOR.PATCH`，以根目录 `VERSION` 为单一审计入口。版本是发布边界，不是提案数量边界；提案收件箱增长不触发版本递增，只有合并到同步范围内并改变模板行为或下游同步判断的 PR 才判断 `PATCH / MINOR / MAJOR`。`ai/global-rules.md` 顶部仅记录全局规则自身版本。

## v1.47.1（2026-07-12）

领域模板 `TEMPLATE-BASE.md` 迁移兼容小修：基于 `agent-system-template` 真实 sync 验证，补齐旧领域溯源格式到新 `Domain standards scope` 字段的迁移，避免旧文件的“叠加的标准件范围”在首次 `--domain-template` 同步后退化为 TODO。

- `scripts/sync-template.sh` 与 PowerShell fallback 现在会识别旧版 `TEMPLATE-BASE.md` 的 `## 叠加的标准件范围` / `## Domain Standards Scope` 小节，把其中 bullet 合并迁移到新字段；若新字段已有非 TODO 内容，则优先保留新字段。
- 旧版 `base version` 也会迁移为 `Base template version`，继续保持初始母模板溯源锚点。
- `scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加旧领域范围迁移关键词断言，防止兼容逻辑回退。

## v1.47.0（2026-07-12）

领域模板版本治理（inheritance Batch 3 / C-004）：把普通派生项目的双版本保留机制扩展到领域模板线，让领域模板（如 `agent-system-template`）从母模板 sync 时保留自身 `VERSION` / `CHANGELOG.md`，并用领域版 `TEMPLATE-BASE.md` 记录继承的母模板版本与领域标准件范围，解决 2026-07-11 试跑中"每次 sync 覆盖领域版本需手动恢复"的问题。与普通派生项目版本治理（v1.46.0）是两条独立线，互不混用。

- **同步脚本**：`scripts/sync-template.sh` 与 PowerShell fallback 新增 `--domain-template`（与 `--preserve-project-version` 互斥）；启用后跳过 `VERSION` / `CHANGELOG.md`，并新增 / 更新领域版 `TEMPLATE-BASE.md`（`Lineage type: domain template` + `Domain standards scope`，首次生成留 TODO 占位，后续 sync 保留）；仓库存在领域版 `TEMPLATE-BASE.md` 时自动启用，与显式标志冲突时停止并提示。
- **角色判定**：新增 `detect_lineage_role` / `Get-LineageRole`，按 `TEMPLATE-BASE.md` 的 `Lineage type` 字段判定普通版 / 领域版（兼容 v1.46.0 旧普通版 header 嗅探）；普通派生 `--preserve-project-version` 行为不变。
- **边界验证**：`scripts/check-derived-sync.*` 按 `Lineage type` 识别角色，领域版额外校验 `Domain standards scope` 字段，仍跳过 README ↔ `VERSION` 一致性检查。
- **自检防漂移**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 把旧的 `TEMPLATE-BASE.md` 自动检测断言更新为 `detect_lineage_role` / `Get-LineageRole`，并新增 `--domain-template`、`write_domain_template_base` / `Write-DomainTemplateBase` 与领域版字段断言。
- **文档与提案**：`template-docs/domain-templates.md` §0 / §4 / §5 / §7 更新 C-004 落地状态；`_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` C-004 标 ✅、Batch 3 标部分落地；`ai/prompts/maintainers/12-sync-template.md`、`ai/commands/sync-methodology.md`、`git-guide.md` §5.5、`template-docs/scenario-guides.md` A13 / A20 与 `template-docs/derived-sync-report-template.md` 均补充领域模板角色口径。
- 回流自 `_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` Batch 3 / C-004；多级同步自动化（领域模板作为领域派生项目上游）仍待后续。

## v1.46.0（2026-07-11）

普通派生项目双版本治理：新增可选的路线 A 同步模式，让普通派生项目用 `VERSION` 记录项目自身版本，用 `TEMPLATE-BASE.md` 记录继承的母模板版本，避免每次模板同步覆盖项目版本。

- **同步脚本**：`scripts/sync-template.sh` 与 PowerShell fallback 增加 `--preserve-project-version`；启用后跳过 `VERSION` / `CHANGELOG.md`，并新增 / 更新 `TEMPLATE-BASE.md` 作为继承版本记录，提交信息仍为 `sync template vX.Y.Z from ai-project-template`。
- **新项目默认**：`scripts/new-project.sh` 为普通派生项目生成精简版 `TEMPLATE-BASE.md`，README 模板关系改为“`VERSION` = 项目自身版本，`TEMPLATE-BASE.md` = 继承模板版本”。
- **边界验证**：`scripts/check-derived-sync.*` 允许同步提交修改 `TEMPLATE-BASE.md`，并在双版本模式下跳过 README ↔ `VERSION` 的模板版本一致性检查，改查 `TEMPLATE-BASE.md` 的当前同步模板版本。
- **A13 同步流程**：`ai/prompts/maintainers/12-sync-template.md`、`ai/commands/sync-methodology.md`、`git-guide.md`、`template-docs/scenario-guides.md` 与同步报告模板均补充 `--preserve-project-version`、`VERSION` / `TEMPLATE-BASE.md` 双字段和同步后续接判定。
- **边界说明**：`template-docs/domain-templates.md` 明确普通派生项目的精简 `TEMPLATE-BASE.md` 不等同于领域模板线的 `TEMPLATE-BASE.md`；领域模板版本治理仍走 inheritance / domain-template-lab 独立线。
- 回流自 `_proposals/TEMPLATE-UPGRADE-derived-project-version-governance.md`（DV-001 / DV-003 / DV-004 部分落地，试点反馈后再决定归档）。

## v1.45.7（2026-07-11）

Token 热点候选规则小落地：把首批 token hotspot 记录反复出现的 H-001 / H-003 升级为受限会话规则，减少同一任务链内重复规则读取和成功长日志回灌，同时保留首次完整规则门禁、规则变更重读和失败日志证据。

- **同会话规则复用**：`ai/session-rules.md` 新增 §3.2，明确完整规则读取仍是任务执行前门禁；仅当同一未中断会话、规则文件未变、任务链未切换且上下文可追溯时，后续 edit / amend / push / PR checks / merge closure / handoff 可复用已加载规则。
- **重读边界**：规则 / 入口文件变更、切换命令或仓库角色、长时间中断、上下文压缩、handoff 与 Git 冲突或动作不在已加载规则覆盖范围内时，必须重读相关规则；无法判断时回到完整规则读取。
- **验证摘要**：`ai/session-rules.md` §4.1 增加成功长检查的证据摘要约定，默认记录命令名、退出码 / check 结论和关键摘要，不把完整成功日志重复带入 handoff / hotspot / 回复上下文；失败、警告或人工审计场景仍保留可定位日志。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-token-hotspot-records.md` 标记 H-001 / H-003 已作为小规则落地，记录模板、正式目录规范、H-002 与后续 sync 体验优化仍保留候选。
- **自检防回归**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加同会话复用边界和验证摘要关键词断言。

## v1.45.6（2026-07-11）

领域模板独立实验入口：新增 `domain-template-lab` 命令与维护者 Prompt，让 AI 能自动识别并规划 `母模板 → 派生领域模板 → 领域派生项目` 的独立试验线，同时保持普通 `母模板 → 直接派生项目` 主同步路径不变。

- **新增命令**：`ai/commands/domain-template-lab.md`，用于“初始化领域模板实验线 / 创建派生领域模板 / 创建 agent-system-template / 试跑领域模板同步”等场景。
- **新增 Prompt**：`ai/prompts/maintainers/23-domain-template-lab.md`，定义仓库角色判定、只相邻同步、不跨层操作、两级回流和实验资产计划。
- **独立边界**：`template-docs/domain-templates.md` 明确该入口不接入 `git-guide.md` §5 主同步路径，不修改母模板 `sync-template` 语义，不让领域派生项目直接同步母模板。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` 标记 Batch 3 的母模板侧 AI 实验入口部分落地；领域 scaffold、领域同步清单和领域自检仍待独立仓库试验。
- **同步与自检**：`template-sync.json` 纳入新命令 / Prompt；`scripts/check-template.sh` 与 `scripts/check-template.ps1` 加入口断言。

## v1.45.5（2026-07-10）

Token 热点记录最小自动提醒：把候选机制中的 B+「最小同步可发现入口」落到 `ai/session-rules.md`，让 AI 在长任务收尾时自动识别并询问是否记录 token hotspot，同时保留写入确认和隐私边界。

- **自动提醒触发**：新增 `ai/session-rules.md` §4.1，覆盖完整规则读取后的长任务、模板维护 / 提案 / 文档审计 / PR / CI 闭环、大文件或长日志重复读取、用户询问 token 热点等场景。
- **写入边界**：默认只自动识别并询问，不静默创建文件；首次创建 `ai-records/token-hotspots/` 或写入记录仍需遵守 `ai/project-rules.md` §6 的确认规则。
- **隐私边界**：记录只写任务类型、文件路径、命令类别、热点判断、质量影响和优化建议；不得写入密钥、账号密码、客户敏感数据或完整对话正文。
- **提案状态**：`_proposals/TEMPLATE-UPGRADE-token-hotspot-records.md` 标记 B+ 部分落地，记录模板 / summary / 正式目录规范仍待 3–5 份记录后评估。
- **自检防回归**：`scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加 token hotspot 触发规则和记录路径断言。

## v1.45.4（2026-07-10）

Windows 新手 smoke-test 真实体验小修：基于 2026-07-10 本地烟测结果，修正 Git Bash / WSL stub 提示、前置检查 next steps 与新建项目完成提示，避免新手在本地最小链路中误判下一步。

- **Git Bash fallback**：`template-docs/smoke-test.md` 补充 `bash` 指向 Windows / WSL stub 并报 `E_ACCESSDENIED`、`/bin/bash` 不存在时改用 `C:\Program Files\Git\bin\bash.exe` 全路径。
- **前置检查提示**：`scripts/check-prereqs.ps1` 检测 `bash` 是否真的可从 PowerShell 启动；Required 全通过时不再默认建议运行 `bootstrap-dev-env.ps1`，而是提示可继续本地项目 / smoke-test。
- **新建项目完成提示**：`scripts/new-project.sh` 完成后指向 `collect-env`、`docs/inputs/`、`ai/project-rules.md`、`/run review-inputs` 与 `/run generate-docs` 链路，与派生项目 README 保持一致。
- **提案留痕**：新增 `_proposals/TEMPLATE-UPGRADE-smoke-test-followups.md` 记录本次 smoke-test 发现、非目标、验证方式和待确认项。

## v1.45.3（2026-07-10）

SOP 去三写（减负）：使用原则 / 文档入口表 / 常见选择三段重复同一组路由（新手 / 环境 / CLI / 烟测 / 方法论）×3，措辞略不同，用户扫三遍、维护改三处。合并去重。

- **使用原则**（12→5 条）：只留原则（scenario 兜底 / Git Bash 排障 / git-guide 与 Prompt 权威 / 治理），路由指向文档入口表 + 场景索引。
- **文档入口表**：补 env-setup（成为唯一权威路由表）。
- **常见选择**（15→8 条）：只留带分支判断的决策（同步后续接 / push 预检 / 改模板 / 续接等），删纯文档路由。
- `SOP.md` 净减 11 行；`check-template.sh` 断言仍过（关键词在文档入口表 + 场景表）。

## v1.45.2（2026-07-10）

模板易填性增强与防漂移断言（UX 审核 C+D）：可填模板补范例行降低填写门槛；check-template 加回写一致性断言防未来漂移。

- **批次 C（模板范例）**：`ui-prototype-strategy-template` 各表补 `<示例>` 行 + doc-standards 权威指针；`derived-sync-report-template` 命令真实性表 + A13 判据矩阵补填写范例 + `_proposals/`↔`_archive/proposals/` 归档关系说明。
- **批次 D（防漂移断言）**：`check-template.sh` 加 7 条断言——验证 show-demo 回写到 scenario A21 / beginner §7、domain-templates 进 beginner §7、implementation-lifecycle / session-rules 进 methodology §2、glossary 含演示 SOP、scenario 索引含 A8.5（防漏场景）。

## v1.45.1（2026-07-10）

文档体验对齐与正确性修复（UX 审核 A+B）：把 v1.44.3 / v1.45.0 新能力回写到所有核心文档，修正场景码漂移与锚点 / 命令 bug，不新增能力。

- **新能力回写**：`show-demo` 回写到 scenario-guides（新增 A21 场景，引用命令不双写）、beginner-guide（§3 / §7 入口）、glossary（演示 SOP 条目，演示≠09 验收）；`domain-templates` 进 template-methodology §2 权威源表 + beginner §7 导航。
- **场景码一致性**：全仓统一「A0–A21（含 .5）/ C1–C8 / M0–M1」，删 "23 场景" 硬编码；scenario 速查索引补 A8.5；SOP 场景表对齐（补 16 漏码 + 修 A5/A6、A8/A10 共享码歧义 + 去三写冗余留待后续）。
- **正确性 bug**：git-guide 3 处锚点（§7→§8、§1.2 / §1.3→§1 第 2/3 条）+ 场景码桥接列；e2e-regression-checklist 建仓命令重复触发修复 + "bootstrap sync 脚本"改真实命令；ai-cli-setup §8 重号→§9；smoke-test / report 旧根名→template-docs/ + 步骤对齐；INIT-PROMPT 删 v1.22.2 + 补 ai/index.md 自动读取说明。
- **权威源**：template-methodology §2 补 `implementation-lifecycle-rules` / `session-rules` / `domain-templates`。
- **README**：术语表入口 + A0–A21 范围。

## v1.45.0（2026-07-10）

项目演示 SOP 与 AI 触发规则：新增 `show-demo` 命令和 `demo-runbook-template`，约定项目级演示 SOP 默认路径 `docs/env/local-demo-runbook.md`，让「查看演示效果 / 启动 Demo / 二维码 / 检查 Demo」成为一等入口。

- **新增命令**：`ai/commands/show-demo.md`——路由到项目演示 SOP，含 AI 执行边界表（只读说明 vs 启动脚本 vs 健康检查 vs 二维码 vs 安装依赖 / 外部服务）和禁止项。
- **新增模板**：`template-docs/demo-runbook-template.md`——八节演示 SOP 结构（适用范围 / AI 场景 / 启动前提 / 启动方式 / 访问入口 / 检查验证 / 推荐演示路径 / 安全与边界），明确不替代 `docs/09-verification.md`。
- **入口与定位**：`ai/commands/README.md` 命令表 + 触发词；`docs/README.md` §5 `docs/env/` 加 `local-demo-runbook.md` 命名。
- **同步与自检**：`template-sync.json` 纳入两新文件；`scripts/check-template.sh` 加 8 条断言。
- 回流自 GitHub issue #160（zhiyan-digital-cs-platform）。

## v1.44.3（2026-07-10）

领域模板可选中间层方法论独立文档：新增 `template-docs/domain-templates.md` 作为「领域模板（domain template）可选中间层」的单一权威源，主线文件零内容改动、仅加引用指针，明确「两层为默认主路径、三层为可选增强」，消除现有使用者的理解歧义。

- **新增方法论文件**：`template-docs/domain-templates.md` 固化三层模型、何时该用领域模板、三层职责边界（引用 inheritance 提案结论）、同步 / 继承关系、`TEMPLATE-BASE.md` 约定（标注未落地）和演进状态；纳入下行同步清单。
- **主线仅加引用指针**：`template-methodology.md` §5、`glossary.md` §7（新增「领域模板」术语条目）、`scenario-guides.md` A20（反向引用）、`README.md` 目录速览各加一处指针，不重写两层叙述。
- **演进中定位**：文档顶部明确领域模板层尚候选 / 演进中（inheritance 提案 Batch 2-4 未落地）、主线治理仍两层、现有派生项目无需迁移、非强制。
- **自检防回归**：`scripts/check-template.sh` 增加 `domain-templates.md` 存在、可选中间层定位、三层继承模型、主线仍两层与术语表条目断言。

## v1.44.2（2026-07-09）

领域模板派生场景引导：在 `template-docs/scenario-guides.md` 中新增 A20，用于从母模板派生独立领域模板（如 `agent-system-template`）时的路由、预检和边界判断。

- **新增 A20 场景**：明确“母模板 → 领域模板 → 具体项目”的三层关系，区分领域模板派生与普通业务项目创建。
- **创建前预检**：要求先检查 `new-project.*`、目标目录、远端仓库名、工具链和权限，再输出创建方案。
- **母模板边界**：强调不把领域 scaffold 直接塞进母模板；agent scaffold 后续应在独立 `agent-system-template` 仓库内维护。
- **自检防回归**：`scripts/check-template.sh` 增加 A20 场景和关键边界断言。

## v1.44.1（2026-07-09）

版本影响门槛收敛：将兼容、可选、默认行为不变的模板增强明确归入默认 `PATCH` 判断，避免 `MINOR` 变成功能次数计数器。

- **PATCH 默认口径**：`CONTRIBUTING.md` 明确可选脚本参数、默认关闭能力、额外自检和治理说明补强，在不改变默认行为、不要求迁移、不新增强制采用面时优先判为 patch。
- **MINOR 门槛收紧**：`MINOR` 仅用于新增能力层级或新的下游采用面，例如新增同步范围结构、必填入口、用户场景或推荐工作流变化。
- **维护 checklist**：`MAINTAINERS.md` 同步发布判断口径，PATCH 可包含兼容性脚本参数 / 默认关闭能力 / 文档与治理小修。
- **提案口径同步**：`_proposals/README.md` 和 A13 提案补充说明，`v1.44.0` 保留为旧口径历史发布；后续同类可选参数增强默认按 patch 论证。
- **自检防回归**：`scripts/check-template.sh` 增加版本影响门槛关键断言。

## v1.44.0（2026-07-09）

同步 dry-run 轻量预览增强：为 `scripts/sync-template.sh` 与 PowerShell fallback 增加 `--summary` / `--no-stat`，让大版本模板同步可跳过逐文件 diff stat，同时保留可审计边界。

- **轻量摘要参数**：`--summary` 等价于 dry-run 轻量预览；`--dry-run --no-stat` 保持兼容修饰符语义，均不修改工作区、不 stage、不提交。
- **可审计输出**：轻量摘要保留同步文件状态、目标版本、变更计数、按顶层目录聚合的新增 / 修改 / 删除 / 跳过数量，以及风险路径命中。
- **完整 dry-run 保留**：默认 `--dry-run` 仍输出逐文件 `git diff --no-index --stat`，满足需要完整 diff stat 的人工复核场景。
- **双入口一致**：Bash 入口与 PowerShell native fallback 均支持 `--summary` 和 `--no-stat`；PowerShell 正常路径继续转发到 Bash。
- **自检防回归**：`scripts/check-template.sh` 增加 summary/no-stat 烟测和关键断言，确保轻量模式不输出逐文件 diff stat。
- 回流自 GitHub issue #148 Batch 3；`--list-only` 与 `--max-stat-files N` 继续延后。

## v1.43.3（2026-07-09）

PowerShell fallback 同步参数修复：修正 `scripts/sync-template.ps1 --commit` 在 Git Bash 不可用 fallback 路径中可能误回默认 dry-run 的问题。

- **参数绑定修复**：`Invoke-NativeTemplateSync` 不再使用易与 PowerShell 自动变量 / 调用语义混淆的 `$Args` 参数名，改为 `$NativeSyncArgs`。
- **commit 路径保护**：fallback 调用显式传递 `-NativeSyncArgs $SyncArgs`，确保 `--commit` 进入 commit 分支而不是静默回到 `--dry-run`。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 sync-template fallback 参数名与传参断言。
- 回流自 GitHub issue #148；dry-run 轻量预览模式仍保留为后续候选。

## v1.43.2（2026-07-09）

A13 同步闭环门禁增强：补齐派生项目模板同步的完成判据矩阵、同步报告真实性记录和提案回流收口矩阵，避免把轻量抽查误写成完整闭环。

- **A13 收尾门禁**：`ai/commands/sync-methodology.md` 与 `ai/prompts/maintainers/12-sync-template.md` 要求最终输出 A13 完成判据矩阵；若存在轻量执行 / 未执行 / 失败项，不得称“A13 完整闭环完成”。
- **同步报告真实性**：`template-docs/derived-sync-report-template.md` 增加命令真实性记录、A13 完成判据矩阵和提案回流收口矩阵。
- **提案收口规则**：同步报告模板明确仅有 issue `closed` 不得自动归档，必须结合 VERSION / CHANGELOG / PR / issue 说明判断“归档 / 保留 / follow-up / 等待”。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A13 收尾门禁和报告真实性关键断言。
- 回流自 GitHub issue #148；本批不包含 `sync-template.ps1 --commit` fallback 修复和 dry-run 轻量预览模式。

## v1.43.1（2026-07-08）

Docs scaffold P2 Task 模板落位评估：明确 Task 文件模板若后续落地，应作为独立 `template-docs/task-template.md` 入口，而不是放入 `template-docs/docs-scaffold/`。

- **信息架构边界**：`template-docs/docs-scaffold/README.md` 明确 `tasks/` 是执行任务单目录，不属于 `docs/` 项目事实链；禁止新增 `template-docs/docs-scaffold/tasks/`。
- **提案更新**：`_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` 记录 Task 模板推荐落位、同步策略和后续落地前置条件。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 docs scaffold README 的 Task 模板边界断言。
- **版本影响**：本轮仅做同步范围内的边界说明和自检增强，不新增同步文件，按 PATCH 发布。

## v1.43.0（2026-07-08）

Docs scaffold P1 后续模板补强：补齐输入评审、产品愿景、待确认事项总览和 ADR 结构模板，让 `template-docs/docs-scaffold/` 覆盖主文档链路的上游输入、愿景、决策与 open items 常用入口。

- **输入与愿景模板**：新增 `template-docs/docs-scaffold/inputs/input-review-report.md` 与 `vision/product-vision.md`，对应 `docs/inputs/input-review-report.md` 和 `docs/vision/product-vision.md` 的长期结构副本。
- **决策与 open items 模板**：新增 `decisions/ADR-template.md` 与 `research/docs-open-items.md`，分别承接横切事实权威源和待确认事项总览。
- **导航与同步**：更新 `README.md`、`docs/README.md`、`template-docs/README.md`、`template-docs/beginner-guide.md`、`template-docs/template-methodology.md` 和 `template-docs/docs-scaffold/README.md`，统一说明 inputs / vision / decisions / research scaffold 边界。
- **同步与自检**：更新 `template-sync.json`、`scripts/sync-template.sh`、`scripts/check-template.sh` / `.ps1`，确保新增 P1 scaffold 下行同步并防止入口漂移。
- **分批治理**：P2 的 env、meetings、archive、task template 继续保留在 `_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` 候选池，不并入本版本。
- 回流自 `_proposals/TEMPLATE-UPGRADE-docs-scaffold-followups.md` P1 批次。

## v1.42.1（2026-07-08）

模板版本治理优化：将提案收件箱增长与模板发布边界解耦，明确 release impact / release strategy 判断，避免高频回流提案导致 `MINOR` 过快增长。

- **版本边界**：`CONTRIBUTING.md` 明确版本是发布边界，不是提案数量或编辑次数边界；新增 / 更新 `_proposals/` 默认 `Release impact = none`。
- **影响分级**：补充 `none / patch / minor / major` 决策表，区分治理文档 / 自检增强、模板能力新增和不兼容变更。
- **聚合发布**：同一提案、同一 PR、同一维护主题下的多个 Batch 默认聚合为一个版本；后续候选留在提案池，不阻塞当前发布。
- **维护 checklist**：`MAINTAINERS.md` 增加 release impact、release strategy、即时发布与同主题维护窗口判断。
- **提案头部**：`_proposals/README.md` 建议新提案声明 `Release impact` 与 `Release strategy`，让版本判断在处理前置化。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加版本治理关键文字断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-version-governance.md`。

## v1.42.0（2026-07-08）

模板易用性文档补强：将前端交互设计、UI 原型策略 / 实现前原型从分散规则提升为独立细粒度标准，补充实现前原型场景，并新增长期结构模板库与人读术语表。

- **细粒度标准**：新增 `ai/doc-standards/frontend-interaction.md` 与 `ai/doc-standards/ui-prototype-strategy.md`，分别规范前端交互设计和 UI 原型策略 / 实现前原型。
- **记录模板**：新增 `template-docs/ui-prototype-strategy-template.md`，用于记录原型形式、权威位置、覆盖范围、未覆盖项、Mock / 降级口径和验收映射。
- **场景路由**：`template-docs/scenario-guides.md` 新增 A7.5 UI 原型策略 / 实现前原型场景，区分 `00-03` 前的需求探索原型与前端实现前的可视化门禁。
- **规则联动**：更新 `ai/doc-standards/README.md`、`ai/document-lifecycle-rules.md`、`docs/README.md`、`ai/prompts/docs/00-generate-or-complete-docs.md`、`ai/prompts/docs/04-edit-single-doc.md` 和命令索引，统一引用新标准。
- **结构模板**：新增并扩展 `template-docs/docs-scaffold/`，长期保留 `docs/00-09`、`docs/design/*` 与 `docs/research/*` 的结构模板副本，区分项目事实、结构模板和 `ai/doc-standards/` 规则 / 审计基线。
- **详细设计 / 门禁模板**：新增子系统详细设计、前端交互设计、UI 原型策略、需求探索原型和技术环境评估 scaffold，覆盖实现前设计与 readiness gate 的常用结构。
- **术语入口**：新增 `template-docs/glossary.md`，按文档链路、ID / 追溯、阶段 / 交付物、状态词典、原型 / 前端交互、会话续接和模板治理 / 同步分类索引核心术语。
- **人读导航**：更新 `README.md`、`template-docs/README.md`、`template-docs/beginner-guide.md`、`template-docs/template-methodology.md` 和 `docs/README.md`，增加 scaffold 与 glossary 入口并说明三层边界。
- **同步与自检**：更新 `template-sync.json`、`scripts/sync-template.sh`、`scripts/check-template.sh` / `.ps1`，确保派生项目可同步新标准并防止入口漂移。
- 回流自 `_proposals/TEMPLATE-UPGRADE-template-usability-docs.md` Batch 1 / Batch 2 / Batch 3 / Batch 4。

## v1.41.1（2026-07-08）

快速续接优先路由：明确“读取续接点 / 继续上次 / resume”是纯恢复摘要场景时，可先按最小只读路径输出结论，避免被入口规则误扩展为完整规则审计。

- **入口裁剪**：`ai/index.md`、`AGENTS.md`、`CLAUDE.md` 与 `.cursor/rules/project-rules.mdc` 明确快速续接例外；分析、设计、编码或状态变更仍必须完整读取规则。
- **续接规则**：`ai/session-rules.md` 增加流程分流，说明快速续接只服务恢复摘要；一旦继续执行任务，立即回到完整规则读取和对应 command。
- **命令路由**：`ai/commands/README.md` 与 `ai/commands/resume.md` 明确 `resume` 不展开完整规则审计，后续执行再升级。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加快速续接例外与入口裁剪断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-fast-resume-routing.md`。

## v1.41.0（2026-07-07）

快速续接模式与 handoff stale 裁决：将“读取续接点 / 继续上次”默认限定为本地只读恢复，避免误扩展成完整规则审计、远端 issue / PR 复核或任务继续执行。

- **快速恢复**：`ai/session-rules.md` 新增快速续接模式，默认只读 `git status`、最近提交、stash、`VERSION` 和 `.ai/session-handoff.md` 摘要；不联网、不查 GitHub issue / PR、不继续执行任务。
- **过期裁决**：当 handoff 的分支、HEAD、版本或进度与 Git 客观事实不一致时，立即标记 `handoff stale`，以 Git 与当前用户输入为准，停止深挖旧记录。
- **命令路由**：新增 `ai/commands/resume.md`，并在 `ai/commands/README.md` 注册 `resume`，统一承接“读取续接点 / 继续上次”。
- **样例增强**：`template-docs/session-handoff.example.md` 增加 `Updated at`、`Status`、`Branch`、`HEAD`、`VERSION` 和 `Remote snapshot` 元数据头。
- **同步与自检**：`template-sync.json`、`scripts/check-template.sh` / `.ps1` 增加 `resume` 命令和快速续接关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-fast-session-resume.md`。

## v1.40.0（2026-07-07）

需求探索原型场景与模板：在正式 `00-03` 定稿、架构和技术路线选择前，用低保真 UI 原型、页面流、截图标注或静态 Mock 帮用户确认需求。

- **早期场景**：`template-docs/scenario-guides.md` 新增 A5.5 需求探索原型 / Demo 前原型确认场景，触发说法包括“先看原型”“先做页面原型确认需求”“先别定技术栈，先画界面流程”。
- **边界规则**：`ai/document-lifecycle-rules.md` 新增 §10.2，明确需求探索原型不是正式需求、架构、技术栈、接口、数据库、任务或验收事实；确认后必须回填 `00-03`。
- **模板与路由**：新增 `template-docs/ui-prototype-exploration-template.md`、`ai/prompts/docs/22-ui-prototype-exploration.md` 和 `ai/commands/ui-prototype-exploration.md`，默认建议落盘到 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md`。
- **索引与同步**：更新 `ai/commands/README.md`、`ai/prompts/README.md`、`docs/README.md` 和 `template-sync.json`，让派生项目同步获得该场景能力。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A5.5、探索模板、命令、Prompt、同步清单和 docs 分区关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-ui-prototype-exploration.md`。

## v1.39.0（2026-07-07）

UI 原型策略与可视化验收门禁：UI 型项目在进入前端实现前需选择可视化原型策略或写明豁免，减少实现后才暴露页面结构、状态反馈、信息密度和 Demo / Mock / 降级口径问题。

- **生命周期规则**：`ai/document-lifecycle-rules.md` 新增 UI 原型策略触发与边界规则；满足前端交互触发条件且存在实现前预览、点击验收、多状态、多角色、权限可见性或 Demo / Mock / 降级误读风险时，必须选择原型策略或写明豁免。
- **项目级字段**：`ai/project-rules.md` 新增 §2.7 UI 原型策略，记录是否需要开发前可视化原型、原型形式、权威位置、覆盖范围、与 `frontend-interaction` / `08` / `09` 的关系和豁免理由。
- **标准与设计链路**：`ai/doc-standards/05-tech-spec.md` 和 `ai/doc-standards/README.md` 增加 UI 原型策略记录位，明确原型不替代 `00-09`、前端交互设计或 `09` 验收，不作为需求权威源。
- **Prompt / 场景门禁**：文档生成、单文档修订、编码前 checklist、系统审计、文档评估和 A7 场景均检查原型形式、位置、覆盖主流程 / 关键状态 / 权限与降级、设备范围、未覆盖项和豁免理由。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 UI 原型策略、原型证据、项目规则 §2.7、生成 Prompt、checklist、audit 和 evaluation 关键断言。
- 回流自 GitHub issue #131，镜像归档为 `_archive/proposals/_remote-issues/issue-131.md`，提案归档为 `_archive/proposals/TEMPLATE-UPGRADE-ui-prototype-strategy.md`。

## v1.38.2（2026-07-07）

C1 提案收件箱远端 issue 本地镜像硬门禁：防止维护者或 AI 直接基于未落盘远端 issue 正文做提案分析，确保先镜像、后分析。

- **镜像硬门禁**：`_proposals/README.md` 明确远端 issue 正文只允许用于生成 / 刷新 `_proposals/_remote-issues/issue-<number>.md`，不得直接作为去重、冲突、依赖、分批计划、拟修改文件或续接记录依据。
- **命令 / Prompt 阻断**：`template-proposal-summary` 命令和维护 Prompt 要求输出本轮本地镜像路径、`Updated` 与 `Mirrored at`；没有本地镜像路径的 issue 不得进入正文分析。
- **误读纠偏**：若 AI 已误读远端正文但尚未落镜像，必须丢弃该轮分析结论，先刷新镜像，再重新读取本地镜像继续。
- **场景与自检**：C1 场景增加“镜像路径确认后再分析”；`scripts/check-template.sh` / `.ps1` 增加镜像硬门禁、本地镜像路径和未落盘正文不得分析的关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-issue-mirror-hard-gate.md`。

## v1.38.1（2026-07-07）

GitHub issue / PR 查询鲁棒性补强：降低模板维护者处理提案收件箱时误判远端 open issue、PR 或关闭状态的风险。

- **远端状态核对**：`_proposals/README.md` 明确 GitHub `/issues` API 同时返回 issue 与 PR，PowerShell 需用 `PSObject.Properties['pull_request']` 判断普通 issue，并在关闭 / 改标签 / 评论前执行“列表 + 单项状态复核”。
- **维护 Prompt**：`template-proposal-summary` 要求 open 列表与单项状态交叉验证；若列表与单项状态冲突，以单项状态和 GitHub 页面为准并先报告。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 GitHub issue 稳定过滤与单项状态复核关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-github-issue-query-robustness.md`。

## v1.38.0（2026-07-07）

Batch 6 `docs/design/*` 通用详细设计标准落地：补齐非平凡子系统、复杂 UI、权限 / 安全、AI / 外部服务、导入 / 异步任务和高风险愿景能力的详细设计基线。

- **design 独立标准**：新增 `ai/doc-standards/design-doc.md`，覆盖触发 / 豁免、元信息、职责边界、上游追溯、流程 / 状态机、数据 / 接口 / 权限契约、失败 / 降级、readiness gate、验收追溯、实现偏差 / 设计回写和待确认项。
- **分类 checklist**：内置服务型、页面 / 交互型、权限 / 安全型、AI / RAG / 外部模型型、导入 / 异步任务 / 外部集成型、策略 / 规则型、配置型和高风险愿景型裁剪要求。
- **生命周期门禁**：`document-lifecycle-rules`、`global-rules`、`project-rules` 明确 `docs/design/*` 触发、豁免、不得新增需求 / 接口 / 表 / 验收目标，以及实现偏差正式回写边界。
- **Prompt / command 路由**：生成、单文档修订、代码反向同步、编码前 checklist、文档体系审计和文档评估均读取 design 标准并检查元信息、追溯、readiness gate、验收路径和实现偏差区。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 纳入 `ai/doc-standards/design-doc.md`，并增加 design 标准、Prompt 引用和派生同步烟测断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-6-design-doc-standard.md`，对应 GitHub issue #110、#116。
## v1.37.0（2026-07-07）

Batch 5 开发计划、验证证据与正式回写闭环落地：补齐 `08-09` 独立细粒度标准，强化 Sprint 验证包、完成包、TC 详情、验收证据、缺陷 / 回归和 handoff 边界。

- **08-09 独立标准**：新增 `ai/doc-standards/08-dev-plan.md`、`09-verification.md`，覆盖 Phase 目标、Sprint 总览、验证包、完成包、任务拆分规则、REQ → TC 追溯、TC 状态、用例详情、验收记录、Sprint 验收包、缺陷 / 回归和风险项。
- **模板骨架增强**：`docs/08-dev-plan.md` 与 `docs/09-verification.md` 增加更精确的 Sprint / Task / TC / 完成包字段，并明确 `08` 管计划 / 进度摘要、`09` 管验证证据 / 验收记录。
- **回写与续接边界**：`implementation-lifecycle-rules`、`session-rules`、`sprint-summary`、`run-dev-task`、`phase-upgrade` 和 `sync-docs-from-code` 强调 handoff 不替代正式 `08/09` 记录，长期事实需回写或说明暂不落盘原因。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-09` 独立标准直接同步，移除 docs→doc-standards 兼容镜像的实际条目。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-5-dev-plan-verification-evidence-handoff.md`，对应 GitHub issue #108、#109、#115。

## v1.36.0（2026-07-07）

Batch 4 DB / API 契约状态与升阶段门槛落地：补齐 `06-07` 独立细粒度标准，强化字段级、endpoint 级和 DB / API / TC 交叉追溯。

- **06-07 独立标准**：新增 `ai/doc-standards/06-db-design.md`、`07-api-spec.md`，覆盖数据对象、概念模型、字段级契约、目标 / 当前实现对照、迁移 / seed / 回滚、API-ID、endpoint contract matrix、请求 / 响应 / 错误 / 权限 / 兼容契约和异步状态机。
- **模板骨架增强**：`docs/06-db-design.md` 与 `docs/07-api-spec.md` 增加目标结构与当前实现对照、契约状态、DB / API 交叉追溯、API ↔ DB / Service / Test 映射和 Phase 升级所需验证入口。
- **生命周期与 Prompt 门禁**：生成、修订单文档、体系审计、文档评估、Phase 升级和单任务执行均检查 DB / API 契约状态，防止草案、候选、Mock、默认关闭或目标设计被当成当前实现或稳定契约。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-07` 独立标准直接同步，`08-09` 暂保留兼容镜像，待 Batch 5 替换。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-4-db-api-contract-status-gates.md`，对应 GitHub issue #107、#114。

## v1.35.0（2026-07-07）

Batch 3.1 文档标准分层落地：明确 `ai/doc-standards/` 是细粒度标准源，补齐 `00-03` 独立标准，并让 `docs/00-09` 回归项目事实大纲模板。

- **00-03 独立标准**：新增 `ai/doc-standards/00-scenario.md`、`01-user-requirements.md`、`02-srs.md`、`03-prd.md`，吸收 Batch 2 的需求链细则和 Batch 1 / 7 的状态、待确认与生成门禁规则。
- **标准分层**：`ai/doc-standards/README.md` 与 `ai/document-lifecycle-rules.md` 明确 lifecycle / doc-standards / docs 大纲三层职责，以及按生成、精修、审计、评估 scope 读取对应标准。
- **docs 大纲轻量化**：`docs/00-09` 每个 H2 章节统一使用 `【撰写提要：……】`，保留填写提示和占位表格，复杂规则进入 doc-standards。
- **Prompt / command 路由**：生成、单文档修订、系统审计、文档评估、编码前 checklist 和 docs-evaluation 命令改为按范围读取对应 `ai/doc-standards/<doc>.md`。
- **同步与自检**：`template-sync.json`、`sync-template` 和 `check-template` 更新为 `00-05` 独立标准直接同步，`06-09` 暂保留兼容镜像，待 Batch 4 / 5 替换。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-3-1-doc-standards-layering.md`。
## v1.34.0（2026-07-07）

Batch 3 架构与技术方案 readiness 规范落地：强化 `04-05` 总体设计、技术风险验证、依赖矩阵和 Phase / Sprint 前门禁。

- **04-05 标准镜像**：新增 `ai/doc-standards/04-architecture.md`、`ai/doc-standards/05-tech-spec.md`，明确架构视图、COMP / MOD / Flow ID、ADR、技术状态、依赖配置、Risk-ID、readiness gate 和 `05 ↔ 09` 映射。
- **模板骨架增强**：`docs/04-architecture.md` 补上下文边界、异常 / 降级 / 权限拒绝路径、部署端口 / 外部依赖和架构视图检查表；`docs/05-tech-spec.md` 补依赖敏感性、验证证据、技术风险矩阵和 readiness gate。
- **生命周期与执行门禁**：`ai/document-lifecycle-rules.md` 和 `ai/implementation-lifecycle-rules.md` 要求真实依赖进入 Sprint / Phase 前具备 Risk-ID、readiness gate、验证证据和解锁条件。
- **生成 / 审计 / 评估门禁**：`generate-docs`、`edit-single-doc`、`docs-system-audit`、`docs-evaluation`、`tech-env-evaluation`、`phase-upgrade` 强化 `04/05` 架构视图、依赖配置、技术风险验证和 readiness gate 检查。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 04-05 标准文件、风险矩阵、readiness gate 和 `05 ↔ 09` 映射断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-3-architecture-tech-risk-readiness.md`，对应 GitHub issue #106、#113。

## v1.33.0（2026-07-07）

Batch 2 需求链规范落地：强化 `00-03` 需求入口、健康度矩阵、Phase 状态传播和兼容补齐规则。

- **00-03 骨架增强**：`docs/00-scenario.md`、`docs/01-user-requirements.md`、`docs/02-srs.md`、`docs/03-prd.md` 补充来源锚点、边界 / 非目标、用户 AC、验证入口、Phase 状态和证据 / 验收引用等字段。
- **规范镜像说明**：`ai/doc-standards/README.md` 明确 `00-03` 需求链基线和 `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 健康度链路；派生项目仍通过 doc-standards 镜像获得标准文件。
- **生命周期规则**：`ai/document-lifecycle-rules.md` 增加 00-03 需求链健康度矩阵、P0 / P1 断点输出和旧项目兼容映射策略。
- **生成 / 审计 / 评估门禁**：`generate-docs`、`edit-single-doc`、`docs-system-audit`、`docs-evaluation`、`phase-upgrade` 强化 `SC-ID → U-ID → REQ-ID → Phase → AC / TC` 检查和 Phase 状态传播。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 00-03 需求链、健康度矩阵、Phase 证据引用和 doc-standards 关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-2-requirements-chain-00-03.md`，对应 GitHub issue #105、#112。

## v1.32.0（2026-07-07）

Batch 7 文档体系生成引导落地：补全文档体系生成场景、open items 总览命令、专题方案讨论和定稿门禁。

- **场景引导**：`template-docs/scenario-guides.md` 扩展 A17-A19，覆盖待确认事项总览、专题方案讨论和文档定稿门禁；A6 生成文档骨架增加 open items 更新和生成后收口路径。
- **open items 入口**：新增 `ai/commands/docs-open-items.md`、`ai/prompts/docs/21-docs-open-items.md` 和 `template-docs/docs-open-items.example.md`，并加入 `template-sync.json`，统一待确认项字段、门禁结论和默认落盘路径。
- **生成 / 评估 / 审计门禁**：`generate-docs`、`00-generate-or-complete-docs`、`docs-evaluation`、`docs-system-audit`、`phase-upgrade` 和 `docs-checklist` 均增加 open items 检查；阻塞项未关闭或未风险接受时不得无条件进入编码或 Phase 升级。
- **专题讨论边界**：需求层人机交互、总体设计 / 技术选型、交互设计方案先输出多方案、依据、AI 推荐、待确认项和回填位置；人工确认前不得写成正式项目事实。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 Batch 7 关键断言，防止新增命令、Prompt、同步清单、场景和门禁规则被误删。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-7-docs-generation-guidance-open-items.md`。

## v1.31.0（2026-07-07）

Batch 1 文档治理底座落地：建立提案收件箱远端 issue 本地镜像机制、分批治理原则、横切状态词典、待确认事项总览和文档体系生成总控最低规则。

- **提案收件箱镜像**：`_proposals/README.md`、`template-proposal-summary` 命令与维护者 Prompt 要求先刷新 `_proposals/_remote-issues/issue-<number>.md`，再基于本地镜像做去重、冲突和分批计划；关闭 issue 前仍以 GitHub 远端状态为准。
- **分批治理**：C1 场景和提案汇总 Prompt 明确“一批一范围、报告先行、事实与模板分离、去重可审计、可续接”，降低大范围文档体系提案的评审和续接风险。
- **状态与待确认门禁**：`ai/document-lifecycle-rules.md` 新增横切状态词典、状态传播规则和待确认事项总览；文档审计 / 评估 Prompt 将状态冲突、Mock / 降级 / 默认关闭 / 已验证 / 已启用等状态纳入 Go / Conditional Go / No Go 判断。
- **文档体系生成总控**：A6 场景与 `00-generate-or-complete-docs` Prompt 要求用户说“生成整个文档体系”时，先说明阶段路线，并在“分阶段确认模式”和“输入充分后批量生成模式”之间确认。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 Batch 1 关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-1-proposal-inbox-governance-status-dictionary.md`，对应 GitHub issue #111、#117。

## v1.30.7（2026-07-07）

模板自检 CI 编码修复：移除关键文件 UTF-8 BOM，避免 GitHub Actions 中 Bash shebang 与版本号解析失败。

- **脚本入口**：移除 `scripts/check-template.sh` 文件开头 BOM，确保 Linux runner 可正确识别 `#!/usr/bin/env bash`。
- **版本解析**：移除 `VERSION` 与 `CHANGELOG.md` 文件开头 BOM，并将模板版本递增到 `v1.30.7`。
- **影响范围**：仅修复编码 / CI 自检问题，不改变模板方法论或文档规范内容。

## v1.30.6（2026-07-06）

A13 同步闭环说法补充：在同步模板场景中增加可直接复述的完整闭环话术，并让命令索引显式提示 A13 完整闭环。

- **场景引导**：`template-docs/scenario-guides.md` 的 A13 场景新增“完整闭环说法”，明确 `sync-methodology → post-sync-cleanup → docs-system-audit → 提案回流收口 → 同步报告留痕`。
- **命令索引**：`ai/commands/README.md` 的 `sync-methodology` 入口补充 `A13 完整闭环` 触发提示。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 A13 完整闭环关键断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-batch-0-a13-sync-closure.md`，对应 GitHub issue #118。

## v1.30.5（2026-07-06）

派生同步边界检查 merge commit 指引加固：补齐 `check-derived-sync` 在 PR merge 后应校验实际同步提交的提示，并避免 PowerShell fallback 使用易与自动变量混淆的参数名。

- **同步提交定位**：`scripts/check-derived-sync.sh` 与 `.ps1` 在 `HEAD` 为 merge commit 时提示显式传入实际 `sync template vX.Y.Z from ai-project-template` 提交，失败输出同步给出 `<sync-commit>` 用法。
- **PowerShell fallback**：`scripts/check-derived-sync.ps1` 将原生 fallback 参数从 `$Args` 改为 `$CheckArgs`，降低 Windows PowerShell 5.1 参数转发歧义风险。
- **同步闭环文档**：`sync-methodology` Prompt 与派生同步运行记录模板要求记录实际同步提交，避免把 PR merge commit 当作同步边界检查目标。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加显式同步提交、merge commit 指引和 fallback 参数名断言。
- 回流自 GitHub issue #102。

## v1.30.4（2026-07-06）

会话续接运行时元数据边界加固：明确 `读取续接点` 必须按项目 Session Handoff 机制恢复，禁止把 CLI 私有 session、memory、subagent 或 cache 等运行时元数据直接作为项目续接事实。

- **恢复依据**：`ai/session-rules.md` 明确恢复结论只能来自 Git 客观事实、项目续接文件、项目正式文档和当前用户输入。
- **运行时边界**：Claude / Codex / Cursor 等 CLI 自身产生的 sessions、projects、memory、subagents、cache、trace、history、conversation dump、agent meta 文件仅可作为调试信息或用户明确要求时的辅助参考。
- **交叉验证**：未经 Git、handoff 或项目文档验证，不得据此推断当前任务、阶段、待办事项、Agent / SubAgent 运行状态或项目事实；无法验证时必须标记为“推测信息”。
- 回流自 `_proposals/TEMPLATE-UPGRADE-session-resume-runtime-metadata-boundary.md`。

## v1.30.3（2026-07-05）

PowerShell 派生边界检查 fallback 空 stderr 热修：修复 `check-derived-sync.ps1` 在 Git Bash 探测阶段 stderr 文件为空时，Windows PowerShell 5.1 对 `$null.Trim()` 报错导致边界检查无法进入 fallback 的问题。

- **脚本修复**：`scripts/check-derived-sync.ps1` 在读取 Bash probe stderr 时显式处理空文件 / `$null`，与 `sync-template.ps1` 的 v1.30.2 热修保持一致。
- **发布目的**：确保旧派生项目同步到新版脚本后，可在 Git Bash / MSYS 启动失败的 Windows 环境继续运行派生同步边界检查。

## v1.30.2（2026-07-05）

PowerShell 同步 fallback 空 stderr 热修：修复 Git Bash 探测阶段 stderr 文件为空时，Windows PowerShell 5.1 对 `$null.Trim()` 报错导致 fallback 尚未进入就中断的问题。

- **脚本修复**：`scripts/sync-template.ps1` 在读取 Bash probe stderr 时显式处理空文件 / `$null`，避免 `You cannot call a method on a null-valued expression`。
- **发布目的**：补齐 v1.30.1 UTF-8 fallback 修复的 Windows PowerShell 5.1 实机兼容性缺口，确保旧派生项目 bootstrap 最新同步脚本后可继续进入 fallback dry-run / commit。

## v1.30.1（2026-07-05）

PowerShell 同步 fallback UTF-8 兼容性修复：加固 Windows Git Bash / MSYS 启动失败后的原生 PowerShell 同步与边界检查路径，避免 Windows PowerShell 5.1 代码页误解码 UTF-8 模板文件。

- **fallback Git 读取**：`scripts/sync-template.ps1` 与 `scripts/check-derived-sync.ps1` 新增 UTF-8 bytes 解码 helper，避免 `git show` / `git log` / `git diff-tree` 输出经系统代码页转换后乱码。
- **同步写回**：`sync-template.ps1` 读取 `template-sync.json`、`VERSION` 和模板 Markdown / 文本文件时按 UTF-8 解码，并以 UTF-8 no BOM 写回，减少中文 Markdown、JSON 和文件名兼容风险。
- **环境提示**：`scripts/check-prereqs.ps1`、`template-docs/env-setup.md` 与 `git-guide.md` 补充 Windows PowerShell 5.1 native command 代码页风险及 fallback 处理口径。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 PowerShell fallback UTF-8 helper 断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-powershell-sync-utf8-fallback.md`，对应 GitHub issue #92。

## v1.30.0（2026-07-05）

技术路线与环境支撑评估机制：新增 `tech-env-evaluation` 命令与 20 号 Prompt，把运行时版本、依赖安装 / 导入 / 最小运行、Docker / 数据库 / 模型、网络权限和资源约束纳入编码前门禁。

- **新增命令 / Prompt**：新增 `ai/commands/tech-env-evaluation.md` 与 `ai/prompts/review/20-tech-env-evaluation.md`，输出 `Go / Conditional Go / No-Go` 结论和可落盘报告建议。
- **报告定位**：技术环境评估报告推荐写入 `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`，不替代 `docs/env/local-env.md` 或 `docs/05-tech-spec.md`。
- **规则门禁**：`ai/document-lifecycle-rules.md`、`ai/implementation-lifecycle-rules.md`、`ai/project-rules.md` 区分环境事实采集与支撑评估；真实运行依赖项目进入首个相关 Sprint 前需评估或记录跳过风险。
- **Prompt / 文档模板**：`collect-env`、`generate-docs`、`edit-single-doc`、`docs-checklist`、`run-dev-task`、`docs/05`、`docs/09` 增加技术环境评估落点。
- **场景与自检**：`template-docs/scenario-guides.md` 增加 A8.5 技术路线与环境支撑评估；`template-sync.json` 与 `scripts/check-template.*` 纳入新增命令 / Prompt 和关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-tech-env-evaluation.md`，对应 GitHub issue #87。

## v1.29.0（2026-07-05）

前端交互设计文档规则：新增 UI 型项目的条件性详细设计触发规则、推荐路径和审查口径，避免前端编码阶段临场补交互或把前端可见性误当权限边界。

- **文档定位**：`docs/design/frontend-interaction.md` 或 `docs/design/*interaction*.md` 作为条件性详细设计，不新增 `docs/00-09` 固定编号，也不进入 `docs/` 根目录。
- **触发规则**：独立 Web、移动端、小程序、桌面端、多页面、多角色、复杂表单、状态流、管理页、搜索问答 UI 或点击路径验收，应在开发前补交互设计或记录豁免理由。
- **内容边界**：交互设计只承接 `03/04/05/07/08/09` 已授权内容，记录页面流、状态、文案、接口依赖和验收路径；不得新增需求、接口或验收目标。
- **权限边界**：前端隐藏入口、按钮禁用或路由守卫只属于可见性控制，不能替代后端接口和服务层权限执行。
- **Prompt / 审查**：`generate-docs`、`edit-single-doc`、`docs-checklist`、`docs-system-audit`、`docs-evaluation` 和 `project-review` 增加前端交互设计判断与越界检查。
- **场景与自检**：`template-docs/scenario-guides.md` 增加“补前端交互设计”触发语；`scripts/check-template.sh` / `.ps1` 增加关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-frontend-interaction-design.md`，对应 GitHub issue #81 与 #86。

## v1.28.0（2026-07-05）

文档评估机制：新增整体 / 阶段 / 单文档评估入口，用于在关键阶段转换前后输出 `Go / Conditional Go / No Go` 结论，并支持确认后落盘评估报告。

- **新增命令 / Prompt**：新增 `ai/commands/docs-evaluation.md` 与 `ai/prompts/review/19-docs-evaluation.md`，支持整体评估、E1-E6 阶段评估和单文档评估。
- **评估报告机制**：默认只读输出评估报告草稿；用户确认后写入 `docs/research/YYYY-MM-DD-docs-evaluation-<scope>.md`，不进入 `docs/` 根目录，不覆盖 `00-09`。
- **场景路由**：`ai/commands/README.md` 和 `template-docs/scenario-guides.md` 增加 `docs-evaluation`，明确它与 `docs-system-audit`、`docs-checklist` 的分工。
- **生命周期规则**：`ai/document-lifecycle-rules.md` 增加 E1-E6 评估码和结论含义；`ai/implementation-lifecycle-rules.md` 要求 `No Go` 不得进入 Sprint 规划，`Conditional Go` 需列条件和风险接受口径。
- **审查分工**：`10-docs-checklist` 与 `16-docs-system-audit` 补充与 `docs-evaluation` 的区别，避免评估、审计和编码前 checklist 混用。
- **同步与自检**：`template-sync.json` 纳入新增 command / prompt；`scripts/check-template.sh` / `.ps1` 增加路由、同步清单和评估关键字断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-docs-evaluation-mechanism.md`，对应 GitHub issue #85。

## v1.27.9（2026-07-05）

待人工确认项增强：将正式文档、任务与续接文件中的待确认项从纯问题清单升级为“AI 建议 + 依据 + 备选 + 影响 / 阻塞”的结构化协作格式。

- **规则边界**：`ai/global-rules.md`、`ai/document-lifecycle-rules.md`、`ai/session-rules.md` 明确 AI 可以给推荐口径，但不得把建议写成用户已确认事实；用户确认后才回填权威文档或续接文件。
- **文档骨架**：`docs/00-scenario.md` 至 `docs/09-verification.md` 的“待人工确认项”统一为表格，字段包含 `ID`、`待确认项`、`AI 建议`、`建议依据`、`备选方案`、`取舍影响 / 阻塞关系`。
- **Prompt / Command**：`generate-docs`、`edit-single-doc`、`sync-docs-from-code` 和 `docs-checklist` 要求新增或审查待确认项时补齐建议、依据、备选方案和影响；`ai/commands/README.md` 增加命令输出通用要求。
- **规范镜像**：`ai/doc-standards/README.md` 增加待人工确认项基线，供文档生成和审计引用。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加待确认项字段、规则和 Prompt 关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-confirmation-items-with-ai-recommendations.md`，对应 GitHub issue #83。

## v1.27.8（2026-07-04）

用户输入入口与 Product Vision 就绪评审闭环：将普通用户原始材料统一引导到 `docs/inputs/`，并在生成 `product-vision` / `00-09` 前增加可复评的输入补齐机制。

- **统一输入入口**：`docs/README.md`、`docs/inputs/README.md`、`docs/vision/README.md` 和 `docs/vision/product-vision.md` 明确 `docs/inputs/` 是原始材料默认入口，`docs/vision/` 是整理后愿景叙事 / 兼容已有愿景。
- **愿景就绪评审**：`ai/document-lifecycle-rules.md` 增加 Inputs-first 默认入口与 `docs/inputs/` → 愿景就绪评估 → `product-vision` → `00-09` 闭环；输入不足时必须输出评估报告和最小补充清单，补齐后复评。
- **Prompt / Command**：`review-inputs` 输出 Product Vision 就绪度、缺口矩阵、AI 建议与依据、评估报告路径；`generate-docs` 增加前置门槛，Not Ready 时不得直接生成 product-vision 或 `00-09`。
- **新手与新项目引导**：`template-docs/beginner-guide.md`、`template-docs/scenario-guides.md`、`scripts/new-project.sh`、`new-project` Prompt / Command 统一引导原始材料先入 `docs/inputs/`，评审通过后再生成 / 更新 `docs/vision/product-vision.md`。
- **自检防回归**：`scripts/check-template.sh` / `.ps1` 增加 inputs 统一入口、愿景就绪评估、`input-review-report.md`、最小补充清单和生成前置门槛断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-inputs-single-user-entry.md`。

## v1.27.7（2026-07-04）

派生项目 CI 检查入口分离：区分模板仓自检 workflow 与派生项目普通 PR 检查，避免派生项目误跑模板仓 `check-template`。

- **派生项目 workflow**：`scripts/new-project.sh` 生成 `.github/workflows/project-check.yml`，普通 PR / push 运行 `git diff --check`，仅模板同步提交运行 `scripts/check-derived-sync.sh HEAD`。
- **模板 workflow**：`.github/workflows/template-check.yml` 明确仅供模板仓使用，继续运行 `scripts/check-template.sh`。
- **同步提示**：`scripts/sync-template.sh` / `.ps1` 检测旧派生 `.github/workflows/template-check.yml` 并提示迁移。
- **文档与 Prompt**：`sync-methodology`、`post-sync-cleanup`、`git-guide.md`、`SOP.md`、`MAINTAINERS.md` 补充派生 CI 边界与迁移口径。
- **自检**：`scripts/check-template.sh` 增加派生 workflow、同步脚本迁移提示和模板 workflow 边界断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-derived-ci-check-entry.md`，对应 GitHub issue #82。

## v1.27.6（2026-07-04）

方法论同步标准闭环：将派生项目“更新方法论”从单次同步升级为同步、边界验证、同步后整理、文档体系审计、项目验证建议和同步报告留痕的标准流程。

- **`sync-methodology`**：明确同步后默认串联 `check-derived-sync`、`post-sync-cleanup`、`docs-system-audit`、项目验证建议与 `sync-records/template-sync/` 同步报告。
- **同步后整理 / 审计**：`post-sync-cleanup` 优先读取 `sync-records/template-sync/`，兼容旧路径；`docs-system-audit` 增加同步后审计模式，区分规范基线缺口、兼容差异和项目事实问题。
- **同步报告模板**：`template-docs/derived-sync-report-template.md` 增加同步后整理摘要、文档体系审计摘要和项目验证建议。
- **场景与 SOP**：A13 场景和 `git-guide.md` 明确“同步 → 验证 → 整理 → 审计 → 报告”的标准闭环与报告路径。
- **自检**：`scripts/check-template.sh` 增加同步闭环、同步报告和同步后审计关键断言。
- 回流自 `_archive/proposals/TEMPLATE-UPGRADE-sync-methodology-standard-workflow.md`。

## v1.27.5（2026-07-04）

Issue 提案收件箱与维护者 triage 场景：补齐派生项目通过 GitHub issue 回流提案后的模板侧处理机制。

- **`template-docs/scenario-guides.md` C1**：从“处理 `_proposals` 提案”扩展为“处理提案收件箱”，明确同时读取 `_proposals/`、带 `proposal` / `feedback` 标签的 issue，以及标题为 `TEMPLATE-UPGRADE:` 的 open issue。
- **`ai/commands/template-proposal-summary.md`**：适用场景、必读文件和执行流程补充 issue 查询、标签 triage、去项目化审查与 issue 关闭计划。
- **治理文档**：`CONTRIBUTING.md` 与 `_proposals/README.md` 明确 GitHub issue 收件箱和 `_proposals/` 文件收件箱的关系。
- **自检**：`scripts/check-template.sh` 增加关键断言，防止 C1 / command / governance 回退成只读 `_proposals/`。
- 回流自 `_proposals/TEMPLATE-UPGRADE-issue-proposal-triage-flow.md`。

## v1.27.4（2026-07-04）

模板自检脚本可维护性整理：在不拆分脚本、不改变检查语义的前提下，先完成 `check-template.sh` 小步分组与重复断言收敛。

- **`scripts/check-template.sh`**：补充脚本结构说明，明确基础 helper、专项检查函数与主流程分组。
- **脚本文件检查**：新增 `require_files` helper，将连续脚本存在性断言收敛为列表式调用。
- **专项检查函数**：新增 `check_script_entrypoints` 集中维护 `.ps1` 入口、fallback 与权威边界断言；新增 `check_project_bootstrap_scripts` 集中维护 `new-project`、环境采集、前置检查与 bootstrap 断言。
- **提案状态**：继续保留 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`，后续再评估是否拆分 `scripts/checks/*.sh`。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`。

## v1.27.3（2026-07-04）

跨 AI CLI 修改前确认机制：强化项目级写入确认协议，并补充 Claude / Codex / IDE 工具配置建议与 Git 审计兜底。

- **`ai/project-rules.md` §6**：写入前确认要求细化为目的、影响范围、预计文件、变更摘要、风险与验证方式；批量 patch 必须列出全部文件；单次“直接修改”授权仅对当前任务和已说明范围生效。
- **`ai/implementation-lifecycle-rules.md`**：单任务执行规则补充多文件 patch 逐项摘要、修改前后 `git status` 和必要时审阅 `git diff`。
- **`template-docs/ai-cli-setup.md`**：新增“写入前确认与权限模式”，明确三层防线：项目规则、工具配置、Git 审计；Claude / Codex / Cursor 等具体配置以官方文档为准，不承诺模板可硬性拦截所有写入。
- **写入类 Prompt**：`run-dev-task`、`fix-bug`、`edit-single-doc` 均要求写入前列出预计文件 / 变更摘要 / 风险 / 验证方式并等待确认，修改后输出 `git status` 摘要和文件清单。
- **自检**：`scripts/check-template.sh` / `.ps1` 增加关键确认协议和三层防线断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-cross-cli-edit-confirmation.md`。

## v1.27.2（2026-07-04）

Scenario Guide 场景体系整理：让场景层承接 implementation lifecycle，并补齐 HELP / 能力索引与维护者场景说明。

- **`template-docs/scenario-guides.md`**：新增 M0 HELP / 能力索引 / 角色选择；A9 改为正式指向 `implementation-lifecycle-rules` 与 `19-plan-phases-and-sprints`；A10/A12 强化 Test Case、验证包和 Sprint 验收包；C5/C6/C7 明确适用范围、跨仓同步验收与模板能力设计流程。
- **`ai/prompts/dev/02-run-task.md`**：执行任务前要求读取实现生命周期规则，关联 REQ / Sprint / Task / Test Case、验证包和 Phase 边界。
- **`ai/prompts/dev/09-sprint-summary.md`**：Sprint 总结增加验证证据、09 验收记录 / Sprint 验收包、风险与未验证项输出。
- **`template-docs/beginner-guide.md`**：补实现阶段入口说明，指向 A9 规划 prompt、A10 执行和 A12 验收。
- **自检**：`scripts/check-template.sh` / `.ps1` 增加 M0、A9 prompt、C6 跨仓、C7 模板能力流程、dev prompt 和 beginner guide 断言。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scenario-guide-clarity.md`，并吸收 v1.27.0 / v1.27.1 的 implementation lifecycle 新入口。

## v1.27.1（2026-07-04）

实现生命周期规则第二步：让开发计划、验证计划和 A9 规划 Prompt 承接 v1.27.0 的核心实现生命周期规则。

- **`docs/08-dev-plan.md`**：补充 Phase / Sprint / Task 定义、测试等级 / 验证包、Sprint 完成包、任务拆分决策树和提交 / PR 粒度说明。
- **`docs/09-verification.md`**：补充测试等级矩阵、Phase 测试大纲、Sprint 验收包、缺陷与回归记录、验证证据字段。
- **新增 `ai/prompts/planning/19-plan-phases-and-sprints.md`**：作为 A9 阶段 / Sprint / 验证闭环规划 Prompt，先输出草稿等待确认，不直接修改文件。
- **同步与自检**：`template-sync.json` 加入新 Prompt；`scripts/check-template.sh` / `.ps1` 增加 08、09、A9 Prompt 关键断言。
- 后续仍待处理：Scenario Guide A9-A12、`run-dev-task` / `sprint-summary` prompt、`beginner-guide` 引导文案增强。
- 回流自 `_proposals/TEMPLATE-UPGRADE-implementation-lifecycle.md`。

## v1.27.0（2026-07-04）

实现生命周期规则（implementation-lifecycle）第一步：新增实现侧权威规则入口，补齐文档体系之后的阶段规划、Sprint / Task、编码执行、分层验证和验收留痕闭环。

- **新增 `ai/implementation-lifecycle-rules.md`**：定义 `Phase → Sprint → Task → Test Case → Commit / PR → 验收记录` 追溯链，明确阶段规划、Sprint / Task 拆分、单任务执行、测试与验证分层、验收留痕和代码事实反向同步规则。
- **`ai/index.md`**：将实现生命周期规则加入 AI 必读清单，位于 `document-lifecycle-rules` 之后。
- **`ai/global-rules.md`**：文档驱动开发原则补充实现生命周期规则指针，避免规则链只停留在“开发计划 → 代码”。
- **同步与自检**：`template-sync.json` 与 `scripts/sync-template.sh` 兜底清单加入新规则；`scripts/check-template.sh` / `.ps1` 增加必读入口、同步清单和关键内容断言。
- 本版本先建立核心规则与同步入口；`docs/08-dev-plan.md`、`docs/09-verification.md`、A9 专门 prompt、Scenario Guide A9-A12 增强留待后续 PR 分步落地。
- 回流自 `_proposals/TEMPLATE-UPGRADE-implementation-lifecycle.md`。

## v1.26.2（2026-07-03）

scripts 说明与模板自检可维护性：补齐 scripts README 说明，明确 `.sh` / `.ps1` 主从关系与 fallback 权威边界。

- **`scripts/README.md`**：补齐 `e2e-sync-check.sh`、`sync-all-derived.sh` 说明；新增运行位置 / 读写 / 谁用列；明确 `.sh` / `.ps1` 主从关系（`.sh` 为主实现，`.ps1` 优先委托 Git Bash）；新增 Windows 脚本入口选择章节与权威性说明。
- **`SOP.md`**：Windows 脚本入口选择补充权威性说明（完整权威检查：Bash `check-template.sh` + CI；结构性兜底检查：PowerShell native fallback；fallback 通过 ≠ 完整自检通过）。
- **`MAINTAINERS.md`**：自检与 CI 章节补充权威性说明，明确 Bash check-template.sh + CI 为完整权威检查，PowerShell fallback 为结构性兜底检查。
- **`scripts/check-template.ps1`**：fallback 输出明确"非完整权威检查"，避免用户误把 fallback 通过当作完整自检通过；提示发布 / CI 仍应以 Bash 自检为准。
- check-template 全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-scripts-self-check-maintainability.md`。

## v1.26.1（2026-07-03）

派生同步运行记录路径分离（sync-records-location）：将模板同步运行记录与项目开发文档分离，降低理解成本。

- **路径变更**：同步运行记录推荐路径从 `docs/archive/template-sync/` 改为 `sync-records/template-sync/`，与 `docs/` 项目事实层分离。
- **`template-docs/derived-sync-report-template.md`**：推荐路径更新 + 补充临时续接说明（`.ai/session-handoff.md` 不替代长期同步运行记录）。
- **`ai/prompts/maintainers/12-sync-template.md`**：同步 Prompt 路径更新，区分长期记录（`sync-records/`）与临时续接（`.ai/session-handoff.md`）。
- **`ai/commands/sync-methodology.md`**：命令文档路径更新 + 说明长期记录与临时续接区别。
- **`ai/prompts/maintainers/15-post-sync-cleanup.md`**：同步后整理 Prompt 兼容新旧两个路径扫描。
- **`ai/prompts/maintainers/18-submit-feedback.md`**：反馈汇集 Prompt 扫描源兼容新旧路径。
- **`ai/commands/submit-feedback.md`**：反馈命令候选来源兼容新旧路径。
- **`SOP.md`**：派生同步运行记录场景补充路径说明（长期记录路径 + 与项目文档分离）。
- **`README.md`**：目录速览新增 `sync-records/` 说明（同步运行记录专用）。
- 迁移策略：新记录默认写入 `sync-records/template-sync/`，旧项目 `docs/archive/template-sync/` 不强制迁移，扫描工具兼容新旧路径一段时间。
- check-template 全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-sync-records-location.md`。

## v1.26.0（2026-07-03）

会话续接场景化 + 被动中断裁决优先级（session-resume）：让「读取续接点 / 继续上次 / 换 CLI 接手」在多 CLI + 被动中断下更稳。

- **`ai/session-rules.md` §1 加固**：新增「裁决优先级」链（Git 客观事实 > `.ai/session-handoff.md` > `NEXT-STEPS.md` > 冲突停下问用户）+「主动 vs 被动中断」表（被动中断含跨 CLI 接手，handoff 缺失/过时时以 Git 为唯一锚点）；「兼容旧文件」收紧为「仅读旧项目时兜底，新项目不再创建 `NEXT-STEPS.md`」。
- **`ai/session-rules.md` §2 调整**：恢复流程改为「先取 Git 客观事实，再读续接文件」（原顺序反，易被过时 handoff 先入为主）；第 4 步显式「交叉核对判主动 / 被动中断」，被动中断以 Git 为唯一锚点重建并标注不确定项。
- **新场景 A16**（scenario-guides + 速查索引）：「会话续接 / 中断恢复（跨 CLI 接手）」——跨 Claude / Codex / Cursor 的统一恢复入口，换 CLI 不丢上下文；顺带修正已有索引 bug（标题 A0–A14 / A0–A15 → A0–A16）。
- **`ai/commands/README.md`**：自然语言示例加「读取续接点 / 继续上次」，让 AI 识别该短语时路由到 scenario → A16。
- 动机：多 CLI 实际使用中，撞 token / 时间上限被迫换 CLI、窗口中断重开是高频场景；原规范裁决优先级散落、被动中断未显式命名、场景层无入口。
- housekeeping：删除本仓库根目录过时的 `NEXT-STEPS.md`（v1.21.3 旧记录，已 gitignore，不进版本库）。
- check-template 全过。
- 起草自 `_proposals/TEMPLATE-UPGRADE-session-resume.md`。

## v1.25.0（2026-07-03）

派生 → 模板反馈与提案回流渠道（标准化 + 半自动）。回流自派生提案 `derived-feedback-channel`。

- **来源标识规则**（`ai/global-rules.md` §9 增补）：回流提案 / 反馈头部标 `> 来源：<派生>(owner/repo)`，解决来源不可识别（曾导致回流 PR 被误判为「另一会话并发」）。
- **2 新命令**（跨仓库开 issue，免 fork）：
  - `submit-proposal`（`/run submit-proposal` + `ai/prompts/maintainers/17-submit-proposal.md`）：成熟提案校验（去项目化 + 来源 + 字段）后 `gh issue create`（label `proposal`）。
  - `submit-feedback`（`/run submit-feedback` + `ai/prompts/maintainers/18-submit-feedback.md`）：半自动汇集候选问题（sync 运行记录 / audit / check 告警 / 草稿）+ 人工勾选 + 开 issue（label `feedback`）。
- **Issue 模板** `.github/ISSUE_TEMPLATE/derived-feedback.md`（template-local）：预填来源 / 类型 / 去项目化确认。
- **`template-proposal-summary`（11）扩展**：除 `_proposals/`，也读模板仓带 `proposal`/`feedback` 标签的 issue。
- **新场景 A15**（scenario-guides + 速查索引 + SOP 场景索引）：「回流提案 / 反馈到模板」——派生使用者上报侧（C1 是维护者收侧）。
- 动机：团队场景（多成员 / 多机器 / 多派生）回流摩擦 + 来源混淆；半自动（非全自动）保留人工判断。
- check-template 加断言（§9 来源标识 + commands/README `submit-proposal` + 命令循环含 2 新命令 + 4 新文件入 sync 清单）；全过。
- 回流自 `_proposals/TEMPLATE-UPGRADE-derived-feedback-channel.md`。

## v1.24.5（2026-07-03）

多会话并发操作规范：git-guide + MAINTAINERS + session-rules 记录「独立 worktree」约定，防并发 commit 落错分支。

- `git-guide.md` §4（场景 B）：加「多会话并发操作」小节——`git worktree add` 命令 + why（共用工作区 = 共用 HEAD，`先确认分支再 commit` 非原子，必然偶发落错）+ 完成清理。
- `MAINTAINERS.md` §2：加「多会话并发」指针 bullet（→ git-guide §4）。
- `ai/session-rules.md`：加 §7「多会话并发操作」AI 行为约定（并发前先确认是否开独立 worktree）。
- 动机：多次 AI 会话并发操作模板仓导致 commit 落错分支（3 起）；git 无自动机制，须靠每会话独立目录这一约定。
- check-template 全过。

## v1.24.4（2026-07-03）

INIT-PROMPT reframe：标题 + 定位行对齐「启动入口」定位（#17 子问）。

- `INIT-PROMPT.md`：标题「常用 Prompt 模板索引」→「**AI 任务启动入口**」（原标题 v1.22.2 后 stale——索引已迁到 `ai/prompts/README` + `commands-README`）；正文首行改为定位声明「首次在本模板项目里启动 AI 工作时，从这里入手」。
- 解决名 / 题 / 内容不一致：文件名 `INIT-PROMPT` + 新标题「启动入口」+ 内容（4 入口指针 + 原则）现在三者一致。
- 不改规则、不挪位、不断引用 / 断言（`ai/commands/README.md` 指针保留）；check-template 全过。
- 回应 #17 子问（INIT-PROMPT 定位评估）。

## v1.24.3（2026-07-03）

`check-derived-sync` 加非阻断「README 模板版本号 vs VERSION」一致性告警（回流自派生项目提案 readme-version-check）。

- `scripts/check-derived-sync.sh` + `.ps1`：同步边界检查后加一项**非阻断**告警——读 `VERSION` + 扫 README 里「当前 / 已同步」语义的模板版本声明，与 `VERSION` 不一致就告警（不计入失败、不改退出码）；README 无版本声明则跳过。
- 动机：根 README 是项目专属（sync 不碰），其「同步至 vX.Y.Z」声明全靠人工维护，sync 后易滞后且无提示（实测某派生项目跨多版同步 README 仍标旧版本）。
- 非阻断设计：README 可能有历史 / 叙事性版本引用，硬阻断会误伤；告警 + 人工核对是正确粒度。
- check-template 加防滞后断言（`check-derived-sync` 含「README 模板版本」）。
- 回流自派生项目提案 `TEMPLATE-UPGRADE-readme-version-check`；非破坏；check-template 全过。

## v1.24.2（2026-07-03）

global-rules §8.1 加「双维度总览表」撰写推荐（回流自派生项目提案 phase-overview-table，另一 AI 起草）。

- `ai/global-rules.md` §8.1：加推荐——`docs/03-prd.md` §3 路线图顶部用「双维度总览表」集中呈现阶段 × 交付物形态（Demo/MVP/产品），避免交付物形态被要素级 `[P1]`/`[P2]`/`[愿景]` 标签淹没。Lean 剖面可裁剪列集；非强制。
- `docs/03-prd.md` §3：加「双维度总览表」标注，显式说明下方表是双维度总览、与要素级标签形成「全景 ↔ 要素」对照（呼应 §8.1）。
- 动机：交付物形态是阶段级属性（少数点声明），功能范围是要素级标签（遍布 04-09，上百次），前者易被后者淹没；总览表让 Demo→MVP→产品 演进线一目了然。
- cherry-pick 自 `change/phase-overview-table`（去项目化提案）；非破坏、不改双维度定义；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-phase-overview-table.md`。

## v1.24.1（2026-07-02）

v1.24 infrastructure release 收官。**PR-7 测试基础设施（#9）**。

- **L3 端到端回归机制**：
  - `template-docs/e2e-regression-checklist.md`（随模板同步）：6 项回归（R1 同步链路 / R2 check-derived-sync / R3 sync-all-derived 批量 / R4 场景引导路由 / R5 文档生成 / R6 PowerShell fallback），可自动化 + 人工 + 通过标准。
  - `scripts/e2e-sync-check.sh`（随模板同步）：L3 发布门，聚合 `check-template`（含 doc-standards 镜像 + 新项目烟测）+ `sync-all-derived` 批量烟测，人工项指向 checklist。运行通过。
  - `template-docs/e2e-report-template.md`（随模板同步）：回归报告模板。
  - `MAINTAINERS` 发布 Checklist 补：MINOR / MAJOR 发布前跑 L3 + 报告确认（PATCH 可豁免）。
- 专用测试派生项目 `ai-project-template-e2e` 是**外部 repo**（维护者 `gh repo create` + `new-project` 派生），模板仓内只给文档 + 命令。
- check-template 加 5 断言（3 `require_file` + MAINTAINERS L3 + 回归清单 R6）。
- **同步归属修订（含 PR-6）**：`scripts/sync-all-derived.sh` + `scripts/e2e-sync-check.sh` + `template-docs/e2e-regression-checklist.md` + `template-docs/e2e-report-template.md` 改为**随模板下行同步**（加入 `template-sync.json` + `sync-template.sh` 兜底清单 + Sync notice），消除 synced 文档（MAINTAINERS / scenario-guides / SOP / git-guide）对 template-local 文件的悬空引用；去掉 template-local 表述。
- 覆盖用户诉求 **#9**（最小测试清单 + 回归机制 + 专用测试派生项目 + 报告）。
- 提案：`_proposals/TEMPLATE-UPGRADE-test-infra-pr7-v1.24.1.md`。
- **#1–#16 + #9 全部完成；v1.23 文档重构 + v1.24 infrastructure release 收官。**

## v1.24.0（2026-07-02）

v1.24 infrastructure release 启动。**PR-6 批量同步派生项目（#15）**。

- **新增 `scripts/sync-all-derived.sh`**（template-local 维护者脚本，不进 sync 清单）：一条指令批量同步父目录下所有派生项目——遍历子目录、判定派生项目（`VERSION`+`scripts/sync-template.sh`+`docs/`，排除模板本体 `_examples/`）、逐个跑该项目的 `sync-template` + `check-derived-sync`、汇总成功 / 跳过 / 失败。默认 `--dry-run`，`--commit` 才写；工作区有未提交跟踪改动 / 非派生 / 同步失败 自动跳过，绝不强行写入。最小自测通过（2 假派生 + 非派生 + 模板本体）。
- **新场景 C8 批量同步所有派生项目**（`scenario-guides.md`，C 维护者）：触发「批量同步 / sync all derived」；步骤 确认目录版本账户 → dry-run 全预览 → commit 批量 → 看汇总。`--commit` 在每个派生当前分支提交；要 PR-per-project 可审计流程改用 A13。
- **交叉引用**：scenario-guides（C8 + 速查索引 C1–C8 + §5 C 头 C1–C8）、SOP（场景索引 C8 行）、MAINTAINERS（下行同步节批量 bullet）、git-guide §5（批量同步 note）。
- **check-template 新断言**：`require_file scripts/sync-all-derived.sh` + scenario-guides C8 + SOP / MAINTAINERS `sync-all-derived` 引用。
- 覆盖用户诉求 **#15**（23 场景未覆盖的「一条指令批量更新派生项目」缺口）。
- 提案：`_proposals/TEMPLATE-UPGRADE-batch-sync-pr6-v1.24.0.md`。

## v1.23.7（2026-07-02）

文档体系重构 PR-5（ai/ 规则件）：document-lifecycle-rules 读者导向 + global-rules 去重，覆盖用户诉求 #12 + #14。

- `ai/document-lifecycle-rules.md`（#12）：顶部加**阅读地图**（是什么 / 为什么 / 怎么做 / 规范 / 图表 → §1–§13 映射）；§1 加「文档体系是什么 + 为什么需要这套规则」framing。**不重组、不重编号**（§2 / §3 / §5 / §6 / §13 被 7 处跨引用）；6 锚点全保留。
- `ai/global-rules.md`（#14）：§6「最佳实践流程总览」改为 stub 指针（指向 §1.1，删重复的 Scenario→Code 链，保留「避免想法→AI→代码」）；**保留 §6 号**（§7 / §8 / §9 被 6 处跨引用，不能重编号）。§8 阶段双维度不动（与 doc-lifecycle §4 文档剖面是不同概念，非重复——纠正 #13 评估误判）。
- 11 个 global-rules 锚点 + 全部跨引用保留；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-ai-rules-pr5-v1.23.7.md`。

## v1.23.6（2026-07-02）

文档体系重构 PR-5b（导航衔接）：SOP 场景索引 ↔ scenario-guides 场景码对齐，覆盖用户诉求 #16。

- `SOP.md`：顶部加**分工声明**（SOP = 命令速查 vs scenario-guides = 场景剧本，场景码对齐、互补不重复）；场景索引加**场景码列**（A0–A14 / C1–C7 / M1 对齐 scenario-guides）；拆「操作场景（带码 + 命令）」与「文档入口（看哪）」两区。
- 解决 SOP 与 scenario-guides「各说各的」：两边现在用同一套场景码，可双向跳（找命令看 SOP，看剧本看 scenario-guides 对应码）。
- ~24 个 SOP 断言锚点全保留（场景名 + 命令 + PowerShell fallback 等）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-sop-scenario-coordination-v1.23.6.md`。

## v1.23.5（2026-07-02）

文档体系重构 PR-4b（scenario-guides 导航）：加场景速查索引，覆盖用户诉求 #11（scenario-guides 部分）。

- `template-docs/scenario-guides.md`：§5 顶部加**场景速查索引**（A0–A14 / C1–C7 / M1 共 23 场景的「触发说法 + 一句话」表，按角色分组）；§5 目录正文不动；§1 入口提示加「§5 顶部有速查索引」。
- 5 个断言锚点全保留（场景路由入口 / 引导计划输出契约 / A0 冷启动 / mermaid / 当前 `gh` 登录账户）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr4b-v1.23.5.md`。

## v1.23.4（2026-07-02）

文档体系重构 PR-4a（template-docs 可读性）：3 份手册结构优化，覆盖用户诉求 #11。

- `template-docs/env-setup.md`：15 节 → 10 节——合并 3 个「顺序 / 路径」节（§6 建议顺序 + §7 一键安装 + §8 三种路径）+ 2 个「脚本行为」节（§9 check-prereqs + §10 bootstrap）+ §1/§2 合并 + §5 折入 §4；§4 加速览表；§15 改导航表。
- `template-docs/ai-cli-setup.md`：9 节 → 8 节——§7「推荐操作顺序」并入 §2「推荐顺序」。
- `template-docs/template-methodology.md`：17 节碎片 → 6 主题（①定位 ②权威源 ③问题+目标 ④核心原则 ⑤各子系统设计 why ⑥演进+历史）。
- 全部断言锚点保留（env-setup 8 / ai-cli-setup 5+1 absent / template-methodology 仅 file-existence）；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr4a-v1.23.4.md`。

## v1.23.3（2026-07-02）

文档体系重构 PR-3b（导航）：关键文件夹补 README，覆盖用户诉求 #7。

- 新增 7 个文件夹 README（template-local，不进 sync 清单）：`template-docs/README`（手册导航）、`scripts/README`（脚本说明 + 模板/派生检查区别）、`ai/README`（ai/ 目录概览）、`frontend/` / `backend/` / `tests/` / `docker/` README（用途 + 裁剪提示，指向 `project-rules` §3）。
- 派生项目的目录指引已由同步的 `beginner-guide` §5 三层结构覆盖；本批 README 为模板仓可读性增强。
- check-template 全过；无脚本 / 同步清单 / 断言变更。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr3b-v1.23.3.md`。

## v1.23.2（2026-07-02）

文档体系重构 PR-3（操作）：`git-guide.md` 分场景重构，覆盖用户诉求 #6。

- `git-guide.md`：从「按主题」改为「**按场景**」组织——§1 先准备（gh 账号 + 身份）+ §2 场景速查表 + §3 场景 A 派生日常提交 + §4 场景 B 模板维护 + §5 场景 C 派生同步 + §6 场景 D 新建项目 + §7 踩坑 + §8 命令速查。下行同步保持在 §5（CONTRIBUTING / sync-methodology 的 `§5` 引用不断）；新建项目 §2 → §6。
- 跨引用同步：`ai/commands/new-project.md`、`ai/prompts/setup/14-new-project.md` 的 `git-guide §2` → `§6（场景 D）`。
- SOP 细节与 ~15 个断言锚点全保留；check-template 全过。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr3-v1.23.2.md`。

## v1.23.1（2026-07-02）

文档体系重构 PR-2（治理文档）：覆盖用户诉求 #3（MAINTAINERS）/ #4（CONTRIBUTING）/ #5（README 目录速览）/ #10（同步回流闭环显化）。

- `MAINTAINERS.md`：开头简化（使用者只看 README + beginner-guide）+ 板块重构为「维护者怎么干活」递进（①你是谁 ②改模板全流程 ③发布 checklist ④下行同步清单 ⑤自检与CI ⑥README边界 ⑦文档分区维护）。
- `CONTRIBUTING.md`：修编号（去 0/2.5）+ 重构为「贡献流程」递进 1-9（什么算模板改动→双向闭环→改模板流程→版本号纪律→回流→下行同步→分支命名→禁止→治理变更记录）。
- `README.md`：开头加两类读者划分（使用者/维护者）；目录速览补 `CONTRIBUTING.md` / `MAINTAINERS.md` / `INIT-PROMPT.md` / `template-sync.json` 4 行。
- 同步回流闭环显化（#10）：`CONTRIBUTING.md` §2「观察·回流」+ `MAINTAINERS.md` §1 点名完整链路（`sync-methodology` 生成运行记录 → `post-sync-cleanup` 归纳 → 去项目化提案）。
- 与 PR-1（#54，v1.23.0）文件无重叠；check-template 全过，无脚本/同步清单变更。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr2-v1.23.1.md`。

## v1.23.0（2026-07-02）

文档体系重构 PR-1（核心全貌）：模板文档从「规则堆砌」转向「读者导向 + 通俗 + 条理 + 互相导航」。覆盖用户最初诉求 #1（docs 输入/输出区分）、#2（beginner-guide 全貌）、#8（docs 文档体系介绍 + 规范）。

- `template-docs/beginner-guide.md` 全貌重构（5 章 → 7 节）：①是什么/能干啥 ②准备啥（工具/输入/决策三类合一）③怎么用（指 scenario-guides）④输入材料→文档体系→实现代码关系（新增核心心智图）⑤目录结构三层（模板方法/文档事实/代码骨架）⑥常见错误/问题 ⑦导航。
- `docs/README.md` 重构（「文档分区规则」→「项目文档体系与分区规则」）：新增 §1 输入/输出二分（人工输入 vision/inputs vs AI 输出 00-09+design）、§2 00-09 各自干什么、§3 规范约束（编号/追溯/阶段标签/只增不删/撰写见 doc-standards）；保留分区/裁剪/根目录约束等。
- `docs/vision/README.md`（新增）：标「人工输入区」定位，呼应 docs/README §1（#1 机制主力为已同步的 docs/README §1；本文件为模板仓本地增强）。
- `docs/inputs/README.md`：顶部补「人工输入区」显式标注 + 指向 docs/README §1。
- 后续 PR-2（MAINTAINERS/CONTRIBUTING/README 目录速览）、PR-3（git-guide/文件夹 README）另轮落地。
- 提案：`_proposals/TEMPLATE-UPGRADE-docs-restructure-pr1-v1.23.0.md`。

## v1.22.5（2026-07-02）

端到端验证（`zhiyan-digital-cs-platform` 同步 v1.22.4）发现并修复的灰色地带：

- **#1 修复 PowerShell fallback Null bug**（`sync-template.ps1` / `check-template.ps1` / `check-derived-sync.ps1`）：`Test-TemplateBash` 在 `Start-Process` 返回 Null（Git Bash 启动失败）时对 `$proc.ExitCode` 调用报 InvokeMethodOnNull，脚本在 probe 阶段终止未进 fallback；加 `$proc` Null 防御 → `Ready=$false` → 正常进 fallback。
- **#2 修复 check-derived-sync 工作区干净过严 + 误导提示**（`.sh` / `.ps1`）：工作区检查改为只看已跟踪改动（未跟踪项目内容如 `docs/inputs` 不阻塞）；失败提示精准化（见上方失败项，不再固定"scripts/check-template"）。
- **派生 README 规范**：`MAINTAINERS.md` 明确派生 README section 结构（简介 / 它能做什么 / 快速开始 / 当前阶段 / 目录速览 / 文档入口 / 模板关系）+ 约束（不照搬模板通用能力、保留模板关系 + VERSION、new-project 生成 + sync 不覆盖）；`new-project.sh` README 模板对齐（「当前能力」→「它能做什么」+ AI CLI 引导段收敛指 scenario-guides）。
- 提案：`_proposals/TEMPLATE-UPGRADE-fix-sync-derived-readme-v1.22.5.md`。

## v1.22.4（2026-07-02）

- `README.md` 开头通俗化：重写首段（「用 AI 按软件工程规范开发软件」+ 解决"AI 代码难维护"的目的），新增「它能做什么」能力段（6 条：生成工程文档体系 / 文档约束代码 + 六维度合规审查 / 分阶段交付 Demo→MVP→产品 / 场景引导 / 跨项目复用 + 经验回流 / 多 AI 工具 + 会话续接），基于模板实际能力梳理。
- `template-docs/beginner-guide.md`：15 章 → 5 章精简（适合谁 + 预期 / 起步 / 准备 / 文档与目录理解 / 常见错误与问题）；删 v1.22.3 精简后变空的操作/路由章节（§3/§6/§10/§11/§12/§15）；§4 路径 A 简化为直接引导 scenario-guides；保留环境 keyword。
- 提案：`_proposals/TEMPLATE-UPGRADE-refine-readme-beginner-v1.22.4.md`。

## v1.22.3（2026-07-02）

文档整理（v1.22.0–2 入口简化后的连带）：

- `README.md` 目录速览补缺失：`_archive/`、`tasks/`、骨架目录（`frontend/ backend/ tests/ docker/`）、`ai/prompts/`、`ai/doc-standards/`、`.github/`。
- `git-guide.md` §7 命令速查加交叉引用（脚本命令见 SOP 常用命令）。
- `CONTRIBUTING.md` / `MAINTAINERS.md`：修陈旧引用（5 分钟路径→快速开始、README 方法论同步 section→`template-sync.json`）；提案组织建议去重（归 `CONTRIBUTING.md` §3.1，MAINTAINERS 改引用）。
- `template-docs/beginner-guide.md`：操作/路由章节（§3/§10/§11/§12/§15）精简为指向 scenario-guides/SOP/README，强化「理解手册」定位（预期/准备/目录心智/常见错误）。
- `SOP.md` 场景索引标注为速查（完整剧本见 scenario-guides）。
- 提案：`_proposals/TEMPLATE-UPGRADE-cleanup-docs-v1.22.3.md`。

## v1.22.2（2026-07-01）

- `INIT-PROMPT.md` 简化为指针：删「场景→命令→Prompt」明细表（与 SOP 场景索引重复），改为指向 scenario-guides / SOP 场景索引 / commands-README / prompts-README 的入口指针；~13 处引用不动（文件保留，向下兼容派生项目）。
- `scripts/check-template.sh` 删 INIT-PROMPT 的 3 个 Prompt 明细断言（内容由 SOP 场景索引 + prompts/README 承担），保留 `require_file` 与「指向 commands-README」断言。
- 提案：`_proposals/TEMPLATE-UPGRADE-simplify-init-prompt.md`。

## v1.22.1（2026-07-01）

- 入口文档简化：README 瘦身到 1 屏（开头简介 + 快速开始三入口「说场景 / 找命令 / 理解设计」+ 当前版本 + 目录速览），删除「5 分钟最小路径」「我该看哪个文件」大表、常用命令、轻量项目路径等冗余 section。
- `SOP.md` 接收 README 的「常用命令」（派生使用者 / 模板维护者 / Windows 脚本入口矩阵），定位为速查表。
- `docs/README.md` 接收「轻量项目路径」。
- `template-docs/beginner-guide.md` 删冗余「路径 B」手动命令，路径 A 收拢环境入口 keyword，定位为「理解手册」；起步动作统一指向 scenario-guides。
- `scripts/check-template.sh` 配套调整断言：README 改为入口指引断言，详细命令断言移到 SOP，环境/烟测入口由 beginner-guide 断言覆盖。
- 提案：`_proposals/TEMPLATE-UPGRADE-simplify-entry-docs.md`。

## v1.22.0（2026-07-01）

- 新增场景引导编排层 `template-docs/scenario-guides.md` 与元命令 `ai/commands/scenario.md`（`/run scenario`）：按角色（A 使用者 / C 维护者）组织 23 个端到端场景剧本，用户说一个具体场景意图，AI 即按契约产出「做什么 + 为什么」引导计划，确认后逐步执行；含 cwd 路由入口（零资产 / 模板仓库 / 派生项目三分支）、A7 PLM 文档精修转换子场景、A9 阶段规划与 M1 元场景；每个场景步骤三层一一对应（做什么 / 为什么 / 机器执行）。
- `scenario-guides.md` 含前提条件声明：零资产（只有仓库链接）时 AI 读不到本文件，A0 冷启动需先手动获取资产（给出模板仓库 clone 地址与 `new-project.sh` 派生路径），拿到本地项目后才进入 AI 场景引导。
- 收敛 `README.md`、`template-docs/beginner-guide.md`、`template-docs/ai-cli-setup.md` 三处重复的新手 7 步话术，统一指向 `scenario-guides.md` 为唯一源；`ai/commands/README.md` 加「场景优先」约定与 `scenario` 命令行。
- 新增设计文档图表规范（`ai/document-lifecycle-rules.md §13`，默认 mermaid、可选 plantuml）与 `ai/project-rules.md §2.6` 图表格式偏好填项。
- 把 `project-review`(03) 实现合规审查补进 A10 场景；17 个 command 全部被场景编排覆盖。
- `template-sync.json` 纳入 `scenario-guides.md` 与 `scenario.md`；`SOP.md`、`README.md` 补场景引导入口；`scripts/check-template.sh` / `.ps1` 加场景引导、去账户化、防漂移断言（含新增 `require_absent_contains` 函数）。
- 提案：`_proposals/TEMPLATE-UPGRADE-scenario-guides.md`。

## v1.21.3（2026-07-01）

- `scripts/sync-template.ps1` 增加原生 PowerShell fallback：Git Bash / MSYS 无法从 PowerShell 启动时，仍可执行模板抓取、dry-run 差异预览、`--commit` 同步清单文件与 `ai/doc-standards/00-09` 规范镜像，并保留脏工作区保护。
- `scripts/check-derived-sync.ps1` 增加原生 PowerShell fallback：Git Bash 启动失败时仍可读取 `template-sync.json`、检查最近同步提交、放行 `ai/doc-standards/*` / 旧 `docs/_scaffold/*`，并拦截项目专属文件越界。
- 更新 Windows 入口说明与派生同步运行记录模板，要求记录是否触发 PowerShell fallback；`README.md`、`git-guide.md`、`MAINTAINERS.md` 与 `template-docs/env-setup.md` 同步澄清 fallback 边界。
- 归档已落地提案：`TEMPLATE-UPGRADE-sync-powershell-fallback.md`。
## v1.21.2（2026-06-30）

- 增强 `ai/prompts/review/16-docs-system-audit.md`：审计报告必须区分事实 / 追溯断点、横切传播残留、规范基线缺口、可行性 / 部署缺口和本地续接状态，避免把新版文档标准差异误判为业务事实错误。
- 补充旧派生文档兼容审计规则：对照 `ai/doc-standards/00-09` 时按语义等价和最小补齐处理，不要求逐字重写成示例骨架；历史 `F-*` 等编号优先用兼容矩阵闭合追溯。
- 为审计回梳增加修复后聚焦自检清单，覆盖 `git diff --check`、旧措辞残留、必需章节 / 追溯矩阵、悬空 ID 和本地续接状态。
- 归档 / 更新已吸收提案：`TEMPLATE-UPGRADE-docs-spec-sync.md`、`TEMPLATE-UPGRADE-docs-system-audit-prompt.md`；保留 `TEMPLATE-UPGRADE-sync-powershell-fallback.md` 作为后续较大功能待办。

## v1.21.1（2026-06-30）

- 优化新手入口顺序：`README.md` 与 `template-docs/beginner-guide.md` 前置 `scripts/check-prereqs.ps1` 环境自检，再进入 `new-project.sh`、`collect-env.ps1`、输入评审和文档生成。
- `README.md` 的 5 分钟路径在环境缺失时直接给出 `scripts/bootstrap-dev-env.ps1` 命令，并把“本地烟测项目”命令从派生项目使用者区移到模板维护者区，避免把烟测路径误当正式项目起步路径。
- 新增新手 AI CLI 推荐路径：`README.md`、`template-docs/beginner-guide.md` 与 `template-docs/ai-cli-setup.md` 提供首次打开 AI CLI 后可复制的引导提示词，让 AI 读取 `ai/index.md`、路由命令并辅助执行后续步骤。
- `template-docs/env-setup.md` 新增新手决策表，明确缺 Git Bash / `winget` / Node.js / Python / `gh` / AI CLI 时的下一步，以及本地烟测可跳过项。
- `template-docs/smoke-test.md` 与新手指南对齐，要求烟测验证“先检查环境、缺失项有下一步、再建项目”的最小链路。
- `scripts/new-project.sh` 生成的派生项目 README 改为指向 `template-docs/env-setup.md`，并优先使用 AI CLI 引导模式、`/run review-inputs`、`/run generate-docs`、`/run run-dev-task` 入口。
- `scripts/check-template.sh` 与 `scripts/check-template.ps1` 增加防入口滞后断言，避免新手文档再次回到默认已安装环境的假设。

## v1.21.0（2026-06-29）

- 新增 `template-docs/derived-sync-report-template.md`，用于派生项目真实同步模板方法论后记录同步前后版本、执行命令、边界检查结果、问题和可回流优化点。
- `/run sync-methodology` 与 `ai/prompts/maintainers/12-sync-template.md` 在 `check-derived-sync` 后增加同步运行记录步骤，并提示将可通用问题转写为去项目化 `_proposals/TEMPLATE-UPGRADE-*.md`。
- `/run post-sync-cleanup` 与 `ai/prompts/maintainers/15-post-sync-cleanup.md` 支持读取最近同步运行记录，提炼待确认项和模板优化回流建议。
- `README.md`、`SOP.md`、`MAINTAINERS.md`、`CONTRIBUTING.md`、`template-sync.json`、`scripts/sync-template.sh` 与 `scripts/check-template.sh` 同步纳入运行记录模板和防入口滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-derived-sync-observation.md`。

## v1.20.0（2026-06-29）

- 将模板 `docs/00-09` 撰写规范镜像主路径从 `docs/_scaffold/00-09` 迁移为 `ai/doc-standards/00-09`，明确其定位为 AI 文档标准 / 审计基线，而非项目事实或初始化脚手架。
- `scripts/sync-template.sh` 下行同步改为生成 / 刷新 `ai/doc-standards/00-09`；`scripts/check-derived-sync.sh` 放行新路径，并迁移期兼容旧 `docs/_scaffold/*`。
- 新增 `ai/doc-standards/README.md`，说明只读、非项目事实、由 `sync-template` 刷新、供 AI 审计 / 生成对照使用。
- `16-docs-system-audit` 和 `docs-system-audit` 快捷命令优先读取 `ai/doc-standards/00-09`，旧项目 fallback 到 `docs/_scaffold/00-09`；`15-post-sync-cleanup` 同步说明更新为新路径。
- `README.md`、`SOP.md`、`git-guide.md`、`MAINTAINERS.md`、`docs/README.md` 与 `scripts/check-template.sh` 同步更新路径说明、自检函数和防文档滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-doc-standards-location.md`。

## v1.19.0（2026-06-29）

- 新增 AI CLI 快捷命令路由：`ai/commands/` 提供 `/run ...` 与自然语言意图到权威 Prompt / SOP / 脚本说明的映射，降低用户手工查找、复制、粘贴 prompt 的成本。
- 新增会话续接与断点恢复规则：`ai/session-rules.md` 定义新窗口恢复流程、自动更新触发点和写入确认边界；默认本地续接文件为 `.ai/session-handoff.md`，兼容 `NEXT-STEPS.md`，并通过 `.gitignore` 排除。
- 新增 `template-docs/session-handoff.example.md` 作为续接文件样例；`README.md`、`SOP.md`、`INIT-PROMPT.md`、`ai/prompts/README.md` 和常用 Prompt 改为命令路由优先、详细 Prompt 作为权威执行模板。
- `template-sync.json`、`scripts/sync-template.sh` 兜底清单与 `scripts/check-template.sh` 纳入新规则 / 命令文件 / 样例文件，并增加防入口滞后断言。
- 归档已落地提案：`TEMPLATE-UPGRADE-ai-command-router.md` 与 `TEMPLATE-UPGRADE-session-handoff.md`；`TEMPLATE-UPGRADE-doc-standards-location.md` 暂留 `_proposals/`，待后续阶段迁移 `docs/_scaffold` 路径。

## v1.18.3（2026-06-28）

- `scripts/check-template.sh` 将 CHANGELOG 当前版本检查改为动态读取根目录 `VERSION`，并增加三段式版本标题降序检查，避免版本记录硬编码或插入顺序漂移。
- `git-guide.md` 账号体系去个人化：移除会随模板同步下发的具体维护者账号、个人邮箱与 Token 类型事实，保留通用多账号 / 提交身份 / scope 排查方法。
- `README.md` 将常用命令拆为“派生项目使用者”和“模板维护者”，并补 Windows 脚本入口选择矩阵，明确哪些命令依赖 Git Bash。
- `MAINTAINERS.md` 补充同步清单摘要边界、个人信息禁入同步文档、关键机制防文档滞后断言规则。
- `scripts/new-project.sh` 生成的派生项目 README 增加 `ai/project-rules.md` 首次必填 checklist，降低占位未填就进入设计阶段的风险。

## v1.18.2（2026-06-28）

- `scripts/check-template.sh` 增加「防文档滞后」断言组：要求根目录人读操作文档（`git-guide §5` / `SOP` / `MAINTAINERS`）引用 `_scaffold` / 16 号审计闭环，避免「脚本层已自洽、人读文档滞后」再现（v1.17/v1.18 引入这些机制时 `git-guide §5` 曾漏更，PR #37 事后补齐，本版把防护固化为断言）。

## v1.18.1（2026-06-28）

- 根目录操作文档追赶 v1.17.0 / v1.18.0 建立的 `_scaffold` / 16 号审计闭环（v1.18.0 落地时漏改了操作权威 `git-guide.md`，脚本层与提示词层已自洽、人读文档滞后）：
  - `git-guide.md §5` 新增 §5.6「`_scaffold` 规范镜像」：说明下行同步会新增只读 `docs/_scaffold/00-09`、不覆盖项目自己的 `docs/00-09`、`docs/_scaffold/*` 在 dry-run 中属预期；§5.2 清单补 `_scaffold` 例外，§5.5 补 `15-post-sync-cleanup → 16-docs-system-audit` 闭环。
  - `SOP.md` 场景索引新增「项目文档成型后回溯审计」行，指向 `ai/prompts/review/16-docs-system-audit.md`。
  - `MAINTAINERS.md` 自检 / CI 章节与发布 Checklist 补 `check-template.sh` 的 `_scaffold` 镜像自检（`require_scaffold_mirror`）；文档分区补 `inputs/`、`archive/`、`_scaffold/`。
  - `README.md` 补 v1.16.1 元文档迁移到 `template-docs/` 的说明，消除早期版本记录旧文件名与现名的矛盾。
  - `CONTRIBUTING.md §8` 注明治理类变更自 v1.6.5 起统一记入 `CHANGELOG.md`，本节不再追加。

## v1.18.0（2026-06-28）

- 新增 `_scaffold` 规范镜像：`sync-template.sh` 下行同步时把模板 `docs/00-09` 撰写规范镜像到派生项目 `docs/_scaffold/`（只读、非项目事实、随模板刷新），不覆盖派生项目自己的 `docs/00-09`。
- `scripts/check-derived-sync.sh` 放行 `docs/_scaffold/*`；`docs/README.md` 增加 `_scaffold/` 分区说明；`scripts/check-template.sh` 增加 `_scaffold` 镜像自检（临时派生项目验证镜像生成、项目事实不变、边界检查通过）。

## v1.17.0（2026-06-28）

- 新增 `ai/prompts/review/16-docs-system-audit.md`，用于项目成型后用 `ai/document-lifecycle-rules.md` 回溯审视整条 PLM 链路（追溯链 / 横切一致 / 变更传播 / 外部接入 / 生成矩阵 / 可行性 / 交付物形态），产出健康度报告与回梳计划，先出报告不改文件。
- `INIT-PROMPT.md` 场景索引、`template-sync.json` 与 `scripts/check-template.sh` 纳入新提示词。

## v1.16.2（2026-06-27）

- `CONTRIBUTING.md`、`MAINTAINERS.md` 与 `_proposals/README.md` 补充模板维护纪律：无论是现有提案驱动，还是对话中主动提出的模板修改，都必须先切维护分支、同步维护提案记录、PR 合并后再归档。
- `.gitignore` 与治理文档补充 `NEXT-STEPS.md` 规则：本地临时续接文档不纳入模板版本库，不进入同步清单。
- `_archive/` 中补入两份早期历史底稿，作为模板方法论演化的归档材料保留；它们不纳入同步清单，也不作为当前活规则来源。

## v1.16.1（2026-06-27）

- 将模板元文档集中迁移到 `template-docs/`，避免根目录继续堆积 `BEGINNER-GUIDE`、`ENV-SETUP`、`AI-CLI-SETUP`、`SMOKE-TEST`、`SMOKE-TEST-REPORT-TEMPLATE`、`TEMPLATE-METHODOLOGY` 等说明文件。
- 更新 `README.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh` 的入口和同步路径。

## v1.16.0（2026-06-27）

- 新增 `AI-CLI-SETUP.md`，把 `Claude CLI` / `Codex CLI` 的安装、验证、与公司中转站配置的衔接顺序独立成文档。
- 更新 `ENV-SETUP.md`、`BEGINNER-GUIDE.md`、`README.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充 AI CLI 独立入口。

## v1.15.1（2026-06-27）

- 修正公司中转站说明边界：`ENV-SETUP.md` 与 `BEGINNER-GUIDE.md` 现在明确区分“CLI 官方安装 / 登录”和“LeMesh / CC-Switch / 中转代理配置”，避免把内网手册误写成 `Claude CLI` / `Codex CLI` 安装指南。

## v1.15.0（2026-06-27）

- `ENV-SETUP.md` 补充 AI CLI 工具说明，把 `Claude CLI`、`Codex CLI` 纳入“至少一种”的推荐清单，并解释为什么当前不优先脚本化这类工具。
- `ENV-SETUP.md` 与 `BEGINNER-GUIDE.md` 新增公司中转站入口：`http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model`，提示实际模型代理配置以内网手册为准。
- `SMOKE-TEST.md` 明确当前烟测不覆盖 AI CLI 安装登录和公司中转站具体配置。

## v1.14.0（2026-06-27）

- `ENV-SETUP.md` 补充“每个工具是什么、为什么要装、什么时候可以跳过”的新手解释，避免只给软件清单却不解释用途。

## v1.13.0（2026-06-27）

- 新增 `SMOKE-TEST-REPORT-TEMPLATE.md`，为每次新手烟测提供统一记录格式，便于区分问题更像出在环境、文档入口还是脚本提示。
- 更新 `SMOKE-TEST.md`、`README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充烟测记录入口并纳入下行同步清单。
- `scripts/check-prereqs.ps1` 将 `gh` 从本地烟测的硬必需项降为条件必需；`scripts/bootstrap-dev-env.ps1` 对 `winget` 安装失败改为明确告警；`SMOKE-TEST.md` 与 `ENV-SETUP.md` 明确本地烟测不要求 `gh`。
- `scripts/check-prereqs.ps1` 进一步区分“Git Bash 已安装”和“bash 命令已加入 PATH”；`SMOKE-TEST.md` 与 `ENV-SETUP.md` 增加使用 Git Bash 完整路径执行脚本的示例。
- `scripts/new-project.sh` 在本机未配置 Git 身份时，改为使用临时本地身份完成初始化提交，避免本地烟测卡在 `Author identity unknown`。
- `scripts/new-project.sh` 不再默认绑定固定 GitHub 账号；远端建仓优先读取当前 `gh` 登录账号，只有需要切换账号时才显式传 `--account`。

## v1.12.0（2026-06-27）

- 新增 `SMOKE-TEST.md`，把 Windows 下的新手环境检查、本地建项目、环境采集和文档入口验证串成一份独立烟测操作单。
- 更新 `README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`MAINTAINERS.md`、`template-sync.json` 与 `scripts/sync-template.sh`，补充新手烟测入口并纳入下行同步清单。
- `scripts/check-template.ps1` 在 PowerShell 无法启动 Git Bash 时，改为退回原生 PowerShell 结构检查；`scripts/check-derived-sync.ps1` 与 `scripts/sync-template.ps1` 则改为输出明确的 Bash 启动错误，避免直接暴露难懂的底层崩溃信息。
- `README.md`、`SOP.md`、`ENV-SETUP.md`、`git-guide.md` 与 `MAINTAINERS.md` 补充 Windows 边界说明：Git Bash / MSYS 启动失败优先视为本机环境问题，不继续靠模板 fallback 扩复杂度。

## v1.11.0（2026-06-27）

- 新增 `ENV-SETUP.md`，把新手环境准备、必备 / 推荐软件清单、Windows 一键安装入口和常见限制独立成环境手册。
- 新增 `scripts/check-prereqs.ps1`，用于检测 Git / Git Bash / gh / Node.js / Python / VS Code / Docker / Java 等前置项。
- 新增 `scripts/bootstrap-dev-env.ps1`，基于 `winget` 尽量一键安装基础开发环境。
- 更新 `README.md`、`BEGINNER-GUIDE.md`、`SOP.md`、`docs/env/README.md`、`scripts/new-project.sh` 与新建项目 Prompt，补上“先准备环境，再采集环境”的新手入口。
- `template-sync.json` 与 `scripts/sync-template.sh` 将环境手册和新脚本纳入下行同步清单。
- `ENV-SETUP.md` 补充当前支持边界：正式支持 Windows；Linux / macOS 暂只保留软件清单参考和后续扩展建议，不声称已提供一键安装能力。

## v1.10.0（2026-06-27）

- 新增 `BEGINNER-GUIDE.md`，把“第一次使用模板该先看什么、先做什么、常见错误是什么”独立成新手操作手册。
- 新增 `TEMPLATE-METHODOLOGY.md`，以当前活文件为基准重写模板设计说明，明确它属于模板元文档而不是 `docs/` 中的派生项目过程文档。
- 更新 `README.md`、`SOP.md`、`MAINTAINERS.md`，补充新手入口与方法论入口。
- `template-sync.json` 将上述两份新文档纳入下行同步清单，避免派生项目保留过期副本。

## v1.9.0（2026-06-26）

- 拆分 Prompt Library：`INIT-PROMPT.md` 改为轻量索引，完整可复制 Prompt 迁移到 `ai/prompts/` 并按 docs / dev / review / planning / setup / git / maintainers 分类。
- `template-sync.json` 与 `scripts/sync-template.sh` 兜底清单纳入 `ai/prompts/`、`ai/document-lifecycle-rules.md` 与 `docs/inputs/README.md`，避免下行同步漏文件。
- 更新 `SOP.md`、`README.md`、`scripts/new-project.sh`、`CONTRIBUTING.md` 和自检脚本，统一指向拆分后的 Prompt 文件路径。

## v1.8.0（2026-06-26）

- 新增 `ai/document-lifecycle-rules.md`，定义多入口生成、文档剖面、生成矩阵、全链追溯、变更传播、横切事实权威源和外部文档接入规则。
- `ai/index.md` 追加文档生命周期规则，`template-sync.json` 将其纳入下行同步清单。
- `INIT-PROMPT.md` §0 从 vision-first 扩展为 inputs-first，并在单任务、审查、单文档修订、文档反向同步和 docs 验收 checklist 中引用追溯链与变更传播规则。
- `INIT-PROMPT.md` §1 重构为输入材料评审与入口判定，支持粘贴正文、文件路径和文件夹路径，并引导小工具 / 小系统使用 Lean 剖面。
- `README.md` 与 `scripts/new-project.sh` 轻量改为“多入口生成 / 补齐文档体系”表述，避免普通使用者入口只绑定愿景起步。
- 新增 `docs/inputs/README.md` 原始输入包目录说明；`docs/README.md` 补充外部接入文档锚定与分区要求，避免策略 / 调研 / 决策文档成为无引用孤岛。

## v1.7.1（2026-06-25）

- 跟进 v1.7.0 阶段双维度规则，修正 `scripts/new-project.sh` 生成的派生 README，避免继续把 Phase1 默认写成 MVP。
- 更新 `_examples/` 三个样例的 PRD 与验证计划，补齐交付物形态和退出标准。
- 增强 `scripts/check-template.sh`，将新项目 README 与样例交付物形态纳入自检，防止 Demo/MVP/产品语义回退。
- README 与 `INIT-PROMPT.md` §15 补充同步 v1.7+ 后应审计交付物形态与验证矩阵。

## v1.7.0（2026-06-24）

- `ai/global-rules.md` §8 新增阶段双维度：功能范围（P1/P2/愿景）与交付物形态（Demo/MVP/产品）必须同时声明。
- `INIT-PROMPT.md` §0 / §1 / §10 增加 vision→docs 与 00-02→03-09 的硬约束：REQ 全覆盖、无悬空 REQ、产品红线、不编造事实、声称据实。
- `docs/03-prd.md`、`docs/08-dev-plan.md`、`docs/09-verification.md` 更新模板桩与最小示例，要求 Phase、Sprint 与验证矩阵体现交付物形态。
- 增强 `scripts/check-template.sh` 自检断言，防止 Demo/MVP/产品语义和 REQ 追溯约束回退。

## v1.6.9（2026-06-24）

- 修正派生项目同步模板方法论的标准流程：明确区分 v1.6.8 之前旧派生项目首次同步路径与 v1.6.8+ 后续同步路径。
- 新增 `scripts/check-derived-sync.sh` / `scripts/check-derived-sync.ps1`，用于派生项目同步后的边界校验；该校验只检查同步提交是否限定在 `template-sync.json` 清单内，不检查模板仓库完整结构。
- 明确 `scripts/check-template.sh` / `scripts/check-template.ps1` 是模板仓库完整性自检，不应作为派生项目同步成功判断。
- 更新 `git-guide.md` §5、`INIT-PROMPT.md` §12、`SOP.md` 与 README 常用命令，避免旧派生项目误跑模板自检。

## v1.6.8（2026-06-24）

- `INIT-PROMPT.md` 新增 §15「同步后项目整理」，用于派生项目完成方法论同步后审计并迁移项目专属内容。
- §15 覆盖 docs 分区整理、根 README 标准版块、`ai/project-rules.md` 项目规则补齐，以及运行环境与资源约束补齐。
- 明确同步后需检查 / 生成 `docs/env/local-env.md`，并补齐 `ai/project-rules.md` §2.5、`docs/04` 运行拓扑、`docs/05` 资源评估、`docs/09` 本机资源验证。
- `SOP.md` 增加“同步后项目整理”场景，提示同步方法论后先出迁移计划，人工确认后再执行。

## v1.6.7（2026-06-24）

- 为模板同步 Markdown 文件补充同步覆盖说明，提示派生项目不要直接修改，应通过 `_proposals/` 回流模板。
- 明确根 `README.md` 是项目专属文档，不参与模板下行同步。
- 标准化 `scripts/new-project.sh` 生成的派生项目 README 版块。
- 补齐 `_examples/` 的 docs 分区结构，与 v1.6.6 文档分区规则保持一致。
- 增强 `scripts/check-template.sh` 对同步说明、派生 README 模板和样例分区的检查。

## v1.6.6（2026-06-24）

- README 瘦身：保留 5 分钟最小路径、入口导航、常用命令、目录速览和最近版本摘要。
- 新增 `MAINTAINERS.md`：承载模板维护原则、发布 checklist、同步清单维护规则、自检 / CI 说明。
- 新增 `CHANGELOG.md`：承载完整版本记录，README 只保留最近版本摘要。
- 新增 `docs/README.md`：定义派生项目文档分区，约束 AI 不把新增文档直接堆到 `docs/` 根目录。
- 调整 `docs/design/` 约定：子系统详细设计统一进入 `docs/design/`，替代历史上的 `docs/design-<子系统>.md` 根目录命名。

## v1.6.5（2026-06-23）

- 新增 GitHub Actions PR 自检，自动运行 `git diff --check` 与 `bash scripts/check-template.sh`。
- README 增加“5 分钟最小路径（愿景 → 本机 Demo）”和裁剪决策表，明确先采集 `docs/env/local-env.md`，再由 `docs/vision/product-vision.md` 驱动 AI 生成 `docs/00-09` 与 Sprint1。
- 新增 `template-sync.json` 作为下行同步清单事实来源。
- 补充 `check-template.ps1` / `sync-template.ps1` Windows 入口。
- 自检加入 `new-project --local --no-remote --no-examples` 烟测。

## v1.6.4（2026-06-23）

- 新增 `SOP.md` 标准操作流程索引，按场景汇总新建派生项目、初始化 docs、环境采集、Sprint 执行、审查、模板同步与模板回流等入口。
- 同步更新 README 目录说明、下行同步清单与模板自检规则。

## v1.6.3（2026-06-23）

- 修正 `scripts/sync-template.sh --dry-run` 的差异预览方向。dry-run 现在按“本地当前文件 → 模板 VERSION”显示统计，与 `--commit` 实际覆盖方向一致，避免将模板新增内容误显示为删除。

## v1.6.2（2026-06-23）

- 将派生项目新建 / 同步标准 SOP 固化为可复制 Prompt。
- `git-guide.md` §2 明确新建项目推荐使用 `scripts/new-project.sh` 从 GitHub `main` 派生。
- `INIT-PROMPT.md` 新增 §14 新建项目 Prompt。
- `INIT-PROMPT.md` §12 同步 Prompt 改为运行时读取模板 `VERSION`，避免固定版本号。

## v1.6.1（2026-06-23）

- 增强派生项目下行同步安全性。
- `scripts/sync-template.sh` 在 fetch 模板后会对比远端最新版脚本与本地脚本，不一致时停止并提示先 bootstrap 最新脚本。
- `git-guide.md`、`INIT-PROMPT.md` 和 `scripts/check-template.sh` 同步补充该 SOP，避免旧脚本漏同步新文件或错误解析版本。

## v1.6.0（2026-06-23）

- 新增运行环境与资源约束机制：`scripts/collect-env.ps1` 自动生成 `docs/env/local-env.md`。
- `ai/project-rules.md` 新增 §2.5。
- `docs/04` / `docs/05` / `docs/09` 增加运行拓扑、资源评估与本机资源验证。
- `INIT-PROMPT.md` 新增环境采集 Prompt。
- 同步更新 README、`new-project`、自检脚本、同步清单和 `_examples/`。
- 版本治理改为根目录 `VERSION` 三段式，并规定所有模板修改必须先形成提案、完成后归档到 `_archive/proposals/`。

## v1.5（2026-06-22）

- `ai/global-rules.md` §5 明确 `frontend/` 由 `project-rules.md` §3「演示形态」决定，并注明根 `README.md` 是项目件。
- 新增 §9「模板优化反馈」，规定派生项目起草 `TEMPLATE-UPGRADE-*.md`、模板仓库 `_proposals/` 汇总分析与 PR 落地。
- 同期非 global-rules 改动：`ai/project-rules.md` §3 增加「演示形态」必填项；`INIT-PROMPT.md` 增加演示形态推导、README 项目化与模板优化汇总 Prompt；`scripts/new-project.sh` 创建干净 `_proposals/` 起草区并项目化 README；`CONTRIBUTING.md` 升级上行回流流程；`scripts/check-template.sh` 增加 `_proposals` 检查。

## v1.4（2026-06-19）

- `ai/global-rules.md` 新增 §8 文档演进规则（积累式：完整骨架 + 阶段标签 + 状态，只增不删）。
- §5 目录标准扩为 00-09（新增 09-verification 验证支柱）。
- 新增 `docs/vision/` 源文档与 `design-*` 子系统设计两类语义命名约定（v1.6.6 起新项目改用 `docs/design/` 子目录）。
- 同期非 global-rules 改动：`INIT-PROMPT.md` 新增 §0 愿景→完整文档体系主 prompt、§1/§10 扩至 03-09；`ai/project-rules.md` §5.2 禁区补阶段归属条；`docs/` 00-08 模板补完整需求+阶段标签写法指引、新增 09-verification 模板；`README` 快速开始加愿景起步分支。

## v1.3（2026-06-17）

- `ai/global-rules.md` §1 文档驱动开发顺序链补充说明（数据库 / API 环节仅按项目形态启用）。
- 同期非 global-rules 改动：修正 `text-cleaner-cli` 样例 README 自相矛盾（原误标 `docs/07` 省略）、`INIT-PROMPT.md` §10 checklist C 对 06/07 加“（如有）”标注、`ai/project-rules.md` §3 补前端持久化指引（localStorage / IndexedDB 等不触发 06）、新增 `md-notes-frontend` 纯前端样例。

## v1.2（2026-06-17）

- 将 `ai/project-rules.md` 的“项目形态与文档裁剪”前置为初始化必填。
- 初始化 / 单任务 Prompt 改为按条件处理 docs/06、07。
- `docs/05-tech-spec.md` 不再依赖初始化时尚未填写的编码约定。
- 新增无 DB / 无 API 样例项目。

## v1.1（2026-06-16）

- Cursor 入口加 frontmatter（`alwaysApply`）。
- docs 06/07 按项目形态可省略。
- 新增模板版本戳与 docs/03-08 验收 checklist。
- 同期非 global-rules 改动：docs 03-07 预置内容骨架、project-rules 补 §4 编码约定与禁区、`_archive` 两份合并为纯-why 单文档、init 顺序前置（§1/§2 在生成 03-08 前填、§3/§4 审核后补）。

## v1.0

- 初始体系（设计说明见 `_archive/`）。
