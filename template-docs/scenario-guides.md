# 场景引导（Scenario Guides）

> Sync notice: 本文件由 `ai-project-template` 维护，派生项目同步模板方法论时可能被覆盖。不要在派生项目直接改；通用改进请经 `_proposals/` 回流模板。

本文件是 `ai-project-template` 的**场景引导编排层**。它把分散的 `ai/commands/`（单点操作）、`ai/prompts/`（详细 Prompt）和 `scripts/` 串成端到端**场景剧本**，让用户在 AI CLI 里说一个具体场景意图，AI 即按契约产出分步引导计划并逐步执行。

- **给人**：找到你的角色（§1）→ 看场景目录（§5，顶部有速查索引）→ 对 AI 说触发说法。你不需要知道具体步骤，AI 会先用人话告诉你它打算做什么、为什么，你确认后它再执行。
- **给 AI**：收到场景意图 → 先按 §2 判断 cwd 状态 → 识别角色+场景 → 按 §4 契约**先把「做什么 + 为什么」展示给用户确认** → 确认后按「机器执行」逐步执行（写入步骤逐次确认）→ 给下一步。
- 触发：`/run scenario` 或自然语言「我想 <场景>」（见 `ai/commands/scenario.md`）。

> 每个场景的步骤都是**三层一一对应**：做什么（人话）／ 为什么这么做 ／ 机器执行（command/prompt/script）。
> 本文件只编排引用现有能力，不复制其正文（反双写）。
> ◐ = 能力部分待补（剧本写完整，标注 manual 路径）。

## 前提条件

本文件（与整套场景引导）可用前提：**本地已有项目目录**——即 `ai-project-template` 模板仓库，或一个由它派生的项目（派生项目同步模板后会带本文件）。AI 只有读得到本文件，才能按场景剧本产出引导计划。

| 你的状态 | 场景引导可用性 | 怎么进入 |
|---|---|---|
| 本地有模板仓库或派生项目 | ✅ 完整可用——AI 能读本文件，按场景剧本引导 | 直接说场景意图或 `/run scenario` |
| 只有仓库链接、本地零资产 | ⚠️ AI 读不到本文件——A0 冷启动需先手动获取资产 | 手动 `git clone https://github.com/emily8421/ai-project-template.git`（拿模板与脚本），再 `bash scripts/new-project.sh <项目名>` 派生；或加入已有派生 `git clone <派生仓库>`；**拿到本地项目后才进入 AI 场景引导** |

> 也就是说：**A0 冷启动是唯一「AI 无法读本文件就要起步」的场景**，靠手动或 AI 通用引导完成资产获取；一旦本地有了项目（含本文件），M0/M1、A1–A20、C1–C8 才进入 AI 场景引导。

## 1. 角色

- **A 使用者**：基于模板做派生项目开发的人（多数，含团队成员）。主工具 AI CLI。
- **C 维护者**：维护 `ai-project-template` 仓库的人，含方法论设计、提案处理、版本与同步机制、新增模板能力。

**账户约定（多用户）**：
- 模板内**不硬编码**任何具体 GitHub 账户/邮箱（去项目化）。
- 远端建仓默认用「当前 `gh` 登录账户」（`scripts/new-project.sh` 已如此）。
- 账户 / 可见性 / 是否建远端是**必填决策项**：识别为**维护者**（C 角色或确认是模板所有者）→ 可沿用当前 `gh` 登录账户；识别为**其他使用者**（A 角色，多人放开使用）→ 必须显式确认，不假设默认。

## 2. 场景路由入口（cwd 状态识别）

AI 收到场景意图后，**第一步判断 cwd 状态再路由**——「已在模板文件夹里」是路由状态，不是场景。

| cwd 状态 | 判据 | 路由 |
|---|---|---|
| 零本地资产 | 无 `.git` / 空目录 / 用户明确「只有仓库链接」 | **无论目标是什么，先走 A0**，再衔接 |
| 在模板仓库 | 有 `template-sync.json` + `_proposals/` + 模板标识 `README` | → **A2 新建派生** 或 **C 维护场景** |
| 在派生项目 | 有 `VERSION` + `ai/` + `docs/`，但非模板本体 | → **A3–A16** |

零资产时不得跳过 A0。

## 3. 工具形态

- **AI CLI / IDE 插件**（主路径）：对话式分步。AI 先用人话展示引导计划（做什么 + 为什么），写入前确认。**AI CLI** 指 `Claude CLI`（即 Claude Code）、`Codex CLI` 等 AI 编程命令行工具；**IDE 插件** 指 VS Code / JetBrains 里的 Claude、Cursor 等 AI 扩展——二者交互形态一致，本文件统称 AI CLI。
- **cmd 终端**（兜底，无 AI）：每个场景给一行指针，指向已有命令权威源（`README` / `git-guide` / `SOP` / script 头部），不重写命令。

## 4. 引导计划输出契约

AI 识别场景后，**先输出引导计划给用户看（用人话 + 为什么），不直接动手**；用户确认后，再按场景步骤的「机器执行」逐步执行。

```
场景：<名> ｜ 角色：<A/C> ｜ 工具：<AI CLI/cmd>
状态识别：<§2 三分支结果；零资产先转 A0>
引导计划（先给你看，确认后再做）：
  ① [只读]       <做什么> — <为什么>          → 影响：<…>
  ② [写入·确认]  <做什么> — <为什么>          → 影响：<…>
  …
完成判据：<…>
下一步场景：<衔接场景>
```

- 每步的「做什么/为什么」= §5 对应场景步骤表的列；「机器执行」= 用户确认后 AI 才执行。
- 每步标 **只读 / 写入·确认**（对应 `ai/project-rules.md §6`）。

示例（新建派生项目，去账户化）：

```
场景：新建派生项目 ｜ 角色：A ｜ 工具：AI CLI
状态识别：在模板仓库 · 工作区干净 · gh 已登录某账户
引导计划（先给你看，确认后再做）：
  ① [只读]      跟你确认项目名/目录/可见性/账户 — 仓名改不动、账户不能假设默认    → 影响：无写入
  ② [写入·确认] 从模板派生新项目并建远端 — 拿最新模板、脚本自动 git init/建仓     → 影响：工作区外建目录 + 远端仓库
  ③ [只读]      检查新项目结构和远端是否正确 — 确认产物无误                       → 影响：无
  ④ [引导]      告诉你进入新项目后下一步做什么                                    → 影响：无
完成判据：新项目 git 干净 · 远端可见性正确 · VERSION 一致
下一步场景：A3 新项目第一次运行
```

## 5. 场景目录

每个场景条目：**说明**（一句话）/ **触发** / **cwd·前置** / **步骤**（三层表格：做什么 ／ 为什么 ／ 机器执行）/ **完成判据** / **下一步** / **cmd 指针**。

### 5.1 场景编号规则

- 顶层场景编号采用「角色前缀 + 整数」：A 使用者场景用 `A0`、`A1`、`A22`；C 维护者场景用 `C1`；M 元场景用 `M0`。
- 顶层场景编号是稳定标识，不承担严格排序含义；先后关系由条目的「触发」「cwd·前置」「下一步」和转入说明表达。
- 不再新增 `A5.5`、`A7.5`、`A8.5` 这类小数编号；新增顶层场景时追加下一个整数，避免插入式编号长期失序。
- 场景内部子流程采用语义化局部 ID，例如 `A7-REQ`、`A7-ARCH`、`A7-PLAN`，不得与顶层场景编号混用。
- 历史 alias 仅用于迁移阅读：`A5.5` → `A22`，顶层 `A7.5 UI 原型策略` → `A23`，`A8.5` → `A24`，A7 PLM 子场景 `A7.1`–`A7.7` → `A7-REQ` / `A7-ARCH` / `A7-TC` / `A7-DETAIL` / `A7-PLAN` / `A7-VERIFY` / `A7-BACKFILL`。

---

**场景速查索引**（按角色；完整剧本见下方各场景条目）

**A 使用者**（A0–A27）

| 场景 | 触发说法 | 一句话 |
|---|---|---|
| A0 冷启动 | 「只有仓库链接」「想用这个模板」「加入已有项目」 | 零本地资产，先 clone / new-project 拿到项目 |
| A1 环境准备 | 「检查环境」「装工具」「第一次用」 | check-prereqs + bootstrap + 装 AI CLI |
| A2 新建派生项目 | 「新建项目」「从模板创建项目」 | new-project.sh 派生 + 建远端 |
| A3 新项目第一次运行 | 「第一次运行」「采集环境」 | collect-env + 初填 project-rules |
| A4 准备输入材料 | 「准备输入」「写愿景」「整理需求」 | 原始材料统一放入 `docs/inputs/` |
| A5 评审输入材料 | 「评审输入」「材料够吗」「判断入口模式」 | Product Vision 就绪评估 + 缺口补齐 |
| A6 生成文档骨架 | 「生成文档」「铺 00-09」「生成整个文档体系」 | 先说明阶段路线和模式，再生成 product-vision 与 docs 骨架 |
| A7 PLM 文档精修 | 「打磨文档」「精修 02-srs」「补 ER 图」 | 按 PLM 阶段精修（见 §6） |
| A8 文档评估 / 审计 / 检查 | 「评估文档」「审计文档」「PLM 链路检查」「开发前检查」 | docs-evaluation 判阶段，docs-system-audit 找问题，docs-checklist 拦编码 |
| A9 阶段规划与路线图 | 「规划阶段」「Demo 做什么」「排路线图」 | 分阶段 + 路线图 |
| A10 执行 Sprint / 任务 | 「执行 Sprint」「做这个任务」「开始编码」 | 编码 + 合规审查 + 提交 |
| A11 修 Bug | 「修 Bug」「修复缺陷」「这个报错」 | 定位根因 + 小范围修复 |
| A12 验证与验收 | 「验证」「跑测试」「Sprint 验收」 | REQ→用例 + Sprint 验收留痕 |
| A13 同步模板到派生项目 | 「同步模板」「更新方法论」 | sync-template 下行同步 |
| A14 Phase 升级 | 「升级 Phase」「进入下一阶段」「Phase2」 | 指针后移 + 原位补设计 |
| A15 回流提案 / 反馈到模板 | 「提交提案给维护者」「回流模板」「反馈使用问题」 | 派生→模板开 issue（submit-proposal / submit-feedback，免 fork） |
| A16 会话续接 / 中断恢复 | 「读取续接点」「继续上次」「换了 CLI 接着做」 | 跨 CLI 统一恢复入口：Git 客观事实优先，handoff 补充，被动中断以 Git 为锚 |
| A17 待确认事项总览 | 「汇总待确认事项」「生成 open items」「编码前自检未决项」 | 汇总 open items，检查阶段 / 编码 / 升级门禁 |
| A18 专题方案讨论 | 「讨论人机交互」「讨论技术选型」「讨论交互设计方案」 | 先多方案讨论与人工确认，再回填正式文档 |
| A19 文档定稿门禁 | 「文档可以定稿吗」「生成后评估」「定稿前检查」 | 完整生成后做评估 / 审计和 open items 收口 |
| A20 领域模板派生 | 「创建 agent 系统模板」「从母模板派生领域模板」「做一个专用模板」 | 先判定是否应独立仓库，再生成领域模板初始化方案 |
| A21 查看演示效果 | 「查看演示效果」「启动 Demo」「给我二维码」「检查 Demo」 | 路由到项目演示 SOP（`/run show-demo`），不替代 09 验收 |
| A22 需求探索原型 | 「先看原型」「先做页面原型确认需求」「Demo 前先确认交互」 | 正式需求 / 架构前，用探索原型澄清需求 |
| A23 UI 原型策略 / 实现前原型 | 「选择原型策略」「实现前先看 UI」「补 UI 原型策略」 | 已有需求链后、前端实现前确认可视化原型门禁 |
| A24 技术路线与环境支撑评估 | 「评估依赖能不能装」「本机能不能跑」「技术环境评估」 | 真实运行依赖进入 Sprint 前评估本机环境支撑 |
| A25 UI Brief Intake / 前端交互输入补齐 | 「界面应该长什么样」「前端交互怎么定」「用户没给 UI 参考」「补 UI 输入材料」 | 输入评审、原型或实现前主动补齐 UI 交互输入 |
| A26 UI Interaction Discovery / UI 探索到交付 | 「先确认交互原型」「分析参考产品」「视觉效果探索」「前端和后端先做哪个」 | 把 UI brief、参考分析、探索原型、experience brief、正式交互设计、实现前原型和 `08/09` 串成可审计路径 |
| A27 Web App Structure Profile / Walking Skeleton Gate | 「Web 全栈骨架怎么定」「先搭应用骨架」「避免 App.tsx 越写越大」「前后端目录结构怎么定」 | 在首个业务 Sprint 前确认 App Shell、目录边界、vertical slice、文件阈值和 smoke 验证 |

**C 维护者**（C1–C8）

| 场景 | 触发说法 | 一句话 |
|---|---|---|
| C1 处理提案收件箱 | 「处理提案」「汇总模板优化」「处理 issue 提案」 | 先镜像 issue，再读 `_proposals` + 本地镜像，去重 / 冲突分析 + 分批落地 |
| C2 版本 bump 与发布 | 「发版本」「bump 版本」「打 tag」 | VERSION / CHANGELOG + check + tag / Release |
| C3 模板自检 | 「自检模板」「跑 check-template」 | check-template 全过 |
| C4 维护分支→PR→合并→归档 | 「提 PR」「合并分支」「走 PR 流程」 | 切分支 + 实现 + PR + 合并 + 归档 |
| C5 维护下行同步机制 | 「改同步清单」「加同步文件」「改 sync 脚本」 | 改 template-sync.json / 脚本 + 加断言 |
| C6 派生同步验收（跨仓） | 「验收派生同步」「同步报告」 | 在派生项目 check-derived-sync + 运行记录 + 回流 |
| C7 模板能力设计流程 | 「加新规则」「加 command/prompt」「加脚本」 | 提案 → 影响面 → 同步清单 → 自检断言 → PR → 发布 |
| C8 批量同步所有派生项目 | 「批量同步」「一次更新所有派生」「sync all derived」 | 发版后一条指令更新父目录下所有派生（`sync-all-derived.sh`） |

**元场景**：M0 帮助 / 能力索引 / 角色选择；M1 用场景引导做事——任何「我想 <做某事>」、`/run scenario`、新手首次打开 AI CLI 的统一入口。

---

### A 使用者（A0–A27）

#### A0 冷启动（只有仓库链接）
- **说明**：你只有模板或项目的仓库链接、本地还没任何文件夹时，从这里起步。⚠️ 此时本地还没有本文件，AI 无法按场景剧本引导——需先手动 `git clone` / `bash new-project.sh`（或让 AI 凭通用知识指导），拿到本地项目后才进入 AI 场景引导。
- **触发**：「我只有仓库链接」「想用这个模板」「加入已有项目」
- **cwd·前置**：零本地资产 · 无

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 弄清你想「用模板新建项目」还是「加入已有项目」 | 两条路完全不同，先分清才不白做 | 识别意图 |
| 2 | 把项目拿到本地 | 零资产必须先有本地副本才能开始 | 新建派生：`git clone https://github.com/emily8421/ai-project-template.git` → `cd ai-project-template` → `bash scripts/new-project.sh <项目名>`（脚本从 GitHub main 派生你的新项目）/ 加入已有派生：`git clone <派生项目仓库>` |

- **完成判据**：本地有项目目录且 git 已初始化
- **下一步**：A1（环境）/ A3（首跑）
- **cmd 指针**：`README` §5 分钟最小路径

#### A1 环境准备（onboarding + 排障）
- **说明**：第一次在这台机器上用模板，确认基础工具和 AI CLI 装好、能跑。
- **触发**：「检查环境」「装工具」「环境报错」「第一次用」
- **cwd·前置**：任意 · 本地有项目目录

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 检查基础开发工具齐不齐 | 模板脚本依赖 Git/PowerShell，先确认能用，避免后面踩坑 | `scripts/check-prereqs.ps1` |
| 2 | 缺工具就一键补齐 | 比手动逐个装快，且按模板验证过的版本 | `scripts/bootstrap-dev-env.ps1` + `template-docs/env-setup.md` |
| 3 | 装好并验证至少一种 AI CLI | 后续步骤全靠 AI 引导，没 CLI 走不下去 | `template-docs/ai-cli-setup.md` |
| 4 | 报错就帮你排查 | Windows 下 Git Bash/代理常出问题，有 fallback 不用慌 | PowerShell fallback / Git Bash / 公司中转站代理 |

- **完成判据**：check-prereqs 的 Required 项全过 + 至少一种 AI CLI 可启动
- **下一步**：A2（在模板仓库）/ A3（在派生项目）
- **cmd 指针**：`README` §5 分钟最小路径 + `template-docs/env-setup.md`

#### A2 新建派生项目
- **说明**：从模板创建一个属于你的新项目，含本地目录和 GitHub 远端仓库。
- **触发**：「新建项目」「从模板创建项目」「初始化新项目」
- **cwd·前置**：在模板仓库 · 工作区干净 · gh 可用

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 确认项目名/目录/可见性/GitHub 账号 | 远端仓名=项目名改不动；多用户账户不能假设默认 | 确认决策项（`/run new-project` 前置，按 §1 账户约定） |
| 2 | 从模板派生新项目并建远端 | 从 GitHub main 派生拿最新模板；脚本自动 git init/首提交/建仓 | `scripts/new-project.sh` + `new-project`(14) |
| 3 | 给采集环境的入口 | 新项目第一件事是记录本机能跑什么 | `collect-env`(13) |

- **完成判据**：新项目 git 干净 · 远端可见性正确 · `VERSION` 作为项目自身版本从 `v0.1.0` 起步且 `CHANGELOG.md` 顶部项目版本与 `VERSION` 一致 · `TEMPLATE-BASE.md` 记录继承模板版本
- **下一步**：A3
- **cmd 指针**：`README` §5 分钟最小路径 + `git-guide.md` §2

#### A3 新项目第一次运行
- **说明**：刚创建的新项目，第一次进入要做的环境采集和项目专属规则初填。
- **触发**：「第一次运行」「初始化项目」「采集环境」
- **cwd·前置**：在派生项目 · 刚创建

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 采集本机运行环境，生成环境文档 | 架构/技术方案要据本机资源定降级策略 | `scripts/collect-env.ps1` → `docs/env/local-env.md` |
| 2 | 你确认本机必须跑什么/可 Mock/要不要服务器 | Demo 优先本机，资源不足要早定降级 | 补 `docs/env/local-env.md` 人工确认项 |
| 3 | 初填项目专属规则 | 生成设计文档前必须先定阶段边界/技术栈/形态 | 填 `ai/project-rules.md`（§1/§2/§2.5/§3 + 图表偏好） |

- **完成判据**：`docs/env/local-env.md` 生成且关键项已填 · `project-rules.md` 占位已清除
- **下一步**：A4
- **cmd 指针**：`README` 快速开始 + `git-guide.md` §2.3

#### A4 准备输入材料 ◐
- **说明**：把你想做的项目整理成可审计的原始输入；不要求先写完美愿景，统一先放 `docs/inputs/`。
- **触发**：「准备输入」「我该提供什么」「写愿景」「整理需求」
- **cwd·前置**：在派生项目 · project-rules 已初填

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 看你手上已有什么材料 | 分层引导，避免对老用户重复要求、对新用户门槛太高 | 判断已有材料 |
| 2 | 有完整文档→先作为输入包归位 | 普通用户只记一个投递入口，后续由 AI 评审分类 | 放 `docs/inputs/`；决策/调研/会议材料可在评审后转 `docs/decisions/`·`docs/research/`·`docs/meetings/` |
| 3 | 已有成熟愿景→兼容读取 | 老项目不强制迁移，但要保留来源锚点 | 可保留 `docs/vision/product-vision.md`，并在 A5 复评 |
| 4 | 只有零散想法或空输入→给你最小清单 | 最小字段就能起步，不必一次写完美 | 填 `docs/inputs/initial-brief.md`（目标用户/问题价值/核心场景/能力/输入输出/验收/非目标） |
| 5 | 准备好转评审 | 材料要经愿景就绪评估判定缺口 | 转 A5 |

- **完成判据**：`docs/inputs/` 有原始输入；或已有 `docs/vision/product-vision.md` 并准备在 A5 复评
- **下一步**：A5
- **cmd 指针**：`ai/document-lifecycle-rules.md` §3 多入口策略
- ◐ 待补：`docs/inputs/initial-brief.md` 最小模板（放 `_examples/` 供引用）

#### A5 评审输入材料
- **说明**：让 AI 评审输入是否足以生成 product-vision；不足时给出评估报告和最小补充清单，补齐后复评。
- **触发**：「评审输入」「这些材料够吗」「判断入口模式」「能生成愿景吗」「inputs 为空怎么办」
- **cwd·前置**：在派生项目 · 已有输入材料，或明确需要从空输入开始补齐

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 盘点 `docs/inputs/` 和已有愿景 | 原始材料可能混杂，先确认来源和冲突 | `review-inputs`(01) |
| 2 | 做 Product Vision 就绪评估 | 先判断能否形成完整愿景，再谈 00-09 | Ready / Conditionally Ready / Not Ready |
| 3 | 告诉你还缺什么 | 让你明确补哪些，而不是凭感觉 | 输出缺口矩阵 + AI 建议与依据 + 最小补充清单 |
| 4 | 不够回 A4 补并复评，够了进 A6 | 保证文档体系建立在充分输入上 | 不足写 `docs/inputs/input-review-report.md` 建议 / 足进 A6 |

- **完成判据**：Product Vision 就绪度已判定 · 入口模式与文档剖面已判定 · 追溯来源已锚定
- **下一步**：A25（UI 输入不足时）/ A22（需要先看原型时）/ A6
- **cmd 指针**：`ai/prompts/docs/01-review-inputs.md`

#### A22 需求探索原型（Demo 前原型确认）
- **说明**：在正式 `00-03` 定稿、架构和技术路线选择前，用低保真 UI 原型、页面流、截图标注、Figma / Penpot、视觉效果探索或静态 Mock 帮用户确认需求、主流程、页面结构、状态、信息密度和视觉方向。
- **触发**：「先看原型」「先做页面原型确认需求」「Demo 前先确认交互」「先别定技术栈，先画界面流程」「做一个低保真原型给用户确认」「做视觉效果探索」
- **cwd·前置**：在派生项目 · 已有最小想法、输入材料或当前会话描述；若输入完全不足，先回 A4 / A5

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 声明探索边界 | 原型不是正式需求、架构、技术栈、接口、数据库或验收事实 | `ui-prototype-exploration`(22) |
| 2 | 收敛最小输入 | 原型需要目标用户、核心场景、主任务、非目标和成功标准 | 生成缺口清单 + 待确认项 |
| 3 | 判断原型主类型 | 防止把需求探索原型、视觉探索和实现前原型混在一起 | 需求探索 / 视觉效果探索 / 实现前 UI 原型三选一；实现前转 A23 |
| 4 | 选择原型形式和默认 UI 基线 | 不强制 Figma；用户没给专业 UI 规范时，AI 给成熟产品 / 设计系统基线 | 输出方案对比 + AI 推荐 + 信息密度建议 |
| 5 | 生成页面 / 流程 / 状态 / 视觉候选 | 让用户能看见和评论，而不是只读抽象需求 | 页面清单、主流程、关键状态、文案 / 信息密度、视觉候选 |
| 6 | 记录反馈、晋级 Gate 和回填建议 | 用户确认后才能进入正式文档 | 建议落盘 `docs/research/YYYY-MM-DD-ui-prototype-exploration.md` / `*ui-visual-exploration.md`，再回填 00-03 / experience brief / frontend-interaction |

- **完成判据**：原型定位清楚 · 页面 / 流程 / 状态 / 视觉候选可评审 · 待确认假设列明 · UI-G-002 / UI-G-003 / UI-G-004 判断清楚 · 已确认内容有回填建议
- **下一步**：用户评审 / A26 串联回填 / A6 生成文档骨架 / A17 汇总 open items
- **cmd 指针**：`ai/commands/ui-prototype-exploration.md` + `ai/prompts/docs/22-ui-prototype-exploration.md`

#### A6 生成文档骨架
- **说明**：根据评审结果，先说明阶段路线和生成模式，再生成 / 更新 product-vision，并铺出 00-09 工程文档骨架（细节留给 A7 打磨）。
- **触发**：「生成文档」「铺文档骨架」「生成 00-09」「生成 product-vision」「生成整个文档体系」
- **cwd·前置**：在派生项目 · 输入已评审通过，Product Vision 就绪度为 Ready 或 Conditionally Ready

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 说明阶段路线和生成模式 | “生成整个文档体系”不能直接写文件，先让用户理解阶段与风险 | 输出路线 + 分阶段确认 / 批量生成两种模式 |
| 2 | 生成 / 更新 product-vision | 让 00-09 有完整愿景锚点和来源链 | `generate-docs`(00) 写 `docs/vision/product-vision.md` |
| 3 | 铺出工程文档骨架 | 先铺完整框架，细节后续打磨，符合积累式演进 | `generate-docs`(00) 铺 `docs/00-09`（按剖面裁剪 06/07）+ `docs/design/` + README + Sprint1 雏形 |
| 4 | 更新待确认事项总览 | 把输入缺口、方案待定和阻塞项集中管理 | `docs-open-items`(21) 输出或建议落盘 |
| 5 | 提醒骨架要靠 A7/A19 收口 | 一键生成会有缺口/漂移，必须逐文档精修并做定稿门禁 | 转 A7 / A19 |

- **完成判据**：阶段路线和模式已确认 · product-vision 已有来源锚点 · 00-09 骨架齐全 · REQ 全覆盖 · 阶段标签到位 · 待确认事项总览已输出或说明不落盘
- **下一步**：A7
- **cmd 指针**：`ai/prompts/docs/00-generate-or-complete-docs.md`

#### A7 PLM 文档精修（转换子场景集，见 §6）
- **说明**：按 PLM 阶段把骨架打磨成详细设计，防止一键生成有缺口或漂移；UI 型项目可在此补前端交互设计和 UI 原型策略。
- **触发**：「打磨文档」「精修 02-srs」「需求转设计」「补 ER 图」「补前端交互设计」「补 UI 设计」「整理页面设计」；若重点是实现前 UI 原型策略，转 A23
- **cwd·前置**：在派生项目 · 已有 00-09 骨架

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 选打磨粒度（整链/单转换/单文档） | 按你当前关注点选最高效的范围 | 选粒度 |
| 2 | 按 PLM 阶段把骨架打磨成详细设计 | 逐阶段保证追溯链和约束，防漂移 | `edit-single-doc`(04) + `generate-docs`(00) 分阶段 + `review-inputs`(01)，子场景见 §6 |

- **完成判据**：当前阶段涉及文档达 `P{N}-已设计` · 追溯链完整 · 横切事实有权威源
- **下一步**：A8
- **cmd 指针**：`ai/prompts/docs/04-edit-single-doc.md`

#### A23 UI 原型策略 / 实现前原型
- **说明**：在 `00-03` 需求链和基本设计已有后、进入前端实现前，决定是否需要可视化原型、采用什么形式、覆盖哪些页面 / 状态 / 角色，以及如何映射到 `frontend-interaction`、`08` 和 `09`。
- **触发**：「选择原型策略」「实现前先看 UI」「补 UI 原型策略」「补可视化原型」「开发前先确认界面」「做代码原型 / Storybook / Figma 给用户评审」
- **cwd·前置**：在派生项目 · 已有 `docs/00-03` 和基本 `04/05`；若需求尚未确认、只是想探索页面方向，转 A22

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 区分需求探索原型与实现前原型 | 防止用原型绕过正式需求链 | 对照 `ai/doc-standards/ui-prototype-strategy.md` |
| 2 | 判断是否触发 UI 原型策略 | 多页面、多状态、多角色、Demo 验收或 Mock / 降级口径都可能触发 | 读取 `project-rules` §2.7、`03/05`、`frontend-interaction` |
| 3 | 选择原型形式、默认 UI 基线和权威位置 | Figma / Penpot / Storybook / 代码原型 / 截图标注适用场景不同；用户没给专业规范时 AI 先给行业基线 | 可参考 `template-docs/ui-prototype-strategy-template.md` |
| 4 | 判断 UI 优先 / 后端优先 / 双轨并行 | UI 体验、真实依赖或二者都高风险时，实施顺序不同 | 记录顺序判断、风险、汇合点和豁免理由 |
| 5 | 映射覆盖范围和未覆盖项 | 明确页面、主流程、状态、角色、设备、风险和豁免 | 输出策略记录 + 待确认项 |
| 6 | 回填正式文档 | 原型策略必须进入 `project-rules`、`05` 或 `frontend-interaction`，不能只停留在对话 | 转 `edit-single-doc`，必要时更新 `08/09` |

- **完成判据**：原型策略状态明确 · 原型形式、默认 UI 基线和权威位置明确 · UI / 后端 / 双轨顺序判断明确 · 覆盖范围 / 未覆盖项 / Mock 降级口径明确 · 与 `frontend-interaction` / `08` / `09` 有追溯
- **下一步**：A8 / A10
- **cmd 指针**：`ai/doc-standards/ui-prototype-strategy.md` + `template-docs/ui-prototype-strategy-template.md` + `ai/prompts/docs/04-edit-single-doc.md`

#### A25 UI Brief Intake / 前端交互输入补齐
- **说明**：在输入评审、需求探索原型、正式前端交互设计或前端实现前，主动补齐 UI / UX 输入，避免用户没有提供参考产品、信息架构、演示路径、页面密度或视觉禁区时直接进入原型或编码。
- **触发**：「界面应该长什么样」「前端交互怎么定」「用户没给 UI 参考」「Demo 前先确认界面方向」「补 UI 输入材料」「现在界面不舒服」
- **cwd·前置**：在派生项目 · 已有或准备整理 `docs/inputs/`、`docs/vision/product-vision.md`、`docs/00-03`；若已有正式前端设计但需要实现前可视化确认，转 A23。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 盘点 UI 相关输入 | 用户往往不会主动给专业 UI brief，AI 需先抽取线索 | 读取 `docs/inputs/*`、`docs/vision/product-vision.md`、`docs/00-03`（如存在） |
| 2 | 输出 UI 输入缺口 | 先判断缺参考产品、演示主线、页面结构、信息密度、设备范围还是视觉禁区 | 对照 `template-docs/ui-brief-intake-template.md` |
| 3 | 用低门槛问题引导确认 | 不把“你想要什么 UI 风格”这种专业问题从零抛给用户 | 给出 AI 默认建议、建议依据、备选方案和取舍影响 |
| 4 | 形成 UI brief / extraction 记录 | 让交互输入可审计、可回填 | 用户确认后写入 `docs/inputs/ui-brief.md` 或 `docs/research/YYYY-MM-DD-ui-brief-intake.md` |
| 5 | 回填后续链路 | UI brief 不是正式交互设计，需进入权威文档 | 建议回填 `docs/design/frontend-interaction.md`、UI 原型策略、`08`、`09` |

- **完成判据**：UI 类型、参考与偏好、演示 / 首屏目标、信息架构、状态边界和待确认项清晰；已区分“已明确 / AI 推断 / 待确认 / 冲突 / 超范围”。
- **下一步**：A26（需要串联 UI 探索到交付时）/ A22（需求仍需探索原型时）/ A23（已有需求链，需实现前原型策略时）/ A7（回填正式设计）/ A10（编码前门禁已满足时）
- **cmd 指针**：`ai/prompts/docs/01-review-inputs.md` + `template-docs/ui-brief-intake-template.md`

#### A26 UI Interaction Discovery / UI 探索到交付
- **说明**：当用户给出参考产品、截图、视觉想法或希望“先确认交互 / 视觉效果再写正式设计”时，AI 主动引导输入、给出推荐方案、组织原型确认，并把确认结果回填到 experience brief、正式前端交互设计、UI 原型策略、`08` 和 `09`。
- **触发**：「先确认交互原型」「分析参考产品 / 截图怎么用于本项目」「视觉效果探索」「前端交互需求怎么梳理」「前端和后端先做哪个」「确认原型后再写正式设计」
- **cwd·前置**：在派生项目 · 已有 UI 输入、UI brief、参考材料、当前会话描述或初步 `00-03`；若输入完全不足，先回 A25 / A5。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 盘点 UI 链路当前位置 | 区分 UI brief、参考分析、需求探索原型、视觉探索、experience brief、正式交互设计和实现前原型 | 对照 `ai/document-lifecycle-rules.md` §5.2.1 |
| 2 | 引导用户确认交互需求 | 用户通常不会直接给专业 UI 需求，AI 需给推荐和备选 | 输出 1–3 个方案、依据、风险、取舍和待确认项 |
| 3 | 路由到探索或实现前原型 | 需求没定走 A22；已有需求链、编码前确认走 A23 | `ui-prototype-exploration` / `edit-single-doc` |
| 4 | 记录晋级 Gate | 防止 research / prototype 未确认内容进入正式设计或 Sprint | UI-G-001 到 UI-G-007 状态表 |
| 5 | 回填正式链路 | 可视化确认后先更新文档体系，不直接编码 | `docs/design/frontend-experience-brief.md`、`frontend-interaction`、UI 原型策略、`08`、`09` |

- **完成判据**：UI 链路当前位置明确 · AI 推荐和备选方案清晰 · 用户确认依据可追溯 · 未确认项进入 open items · 回填目标和下一步命令明确。
- **下一步**：A22 / A23 / A7 / A8 / A27 / A10。
- **cmd 指针**：`ai/document-lifecycle-rules.md` §5.2.1 + `ai/prompts/docs/22-ui-prototype-exploration.md` + `ai/prompts/docs/04-edit-single-doc.md`

#### A27 Web App Structure Profile / Walking Skeleton Gate
- **说明**：当项目是复杂 Web / 全栈交互系统，或用户担心前端主应用文件、全局样式、后端 controller / service 越写越大时，先确认轻量可运行骨架、目录边界和首个 vertical slice，再进入业务功能 Sprint。
- **触发**：「Web 全栈骨架怎么定」「先搭应用骨架」「前后端目录结构怎么定」「避免 App.tsx 越写越大」「先做 Walking Skeleton」「Web 项目 Sprint 0」
- **cwd·前置**：在派生项目 · 已有或准备生成 `04/05/08/09`；若 UI 输入 / 体验原则不足，先回 A25 / A26。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 判断是否触发 Web App Structure Profile | 区分简单 UI 和复杂 Web / 全栈交互项目 | 参考 `template-docs/web-fullstack-profile.md` §1 |
| 2 | 定义 App Shell 与目录边界 | 防止业务能力堆入单个主应用文件或全局样式 | 回填 `04/05` |
| 3 | 规划 Sprint 0 / Walking Skeleton | 先跑通最小 vertical slice，再小步实现业务 | 回填 `08` |
| 4 | 定义 API / browser smoke | 验证前端视图、API client、后端接口和权限 / 降级可见口径 | 回填 `09` |

- **完成判据**：WSG-001 到 WSG-006 状态明确；已在 `04/05/08/09` 记录 App Shell、目录边界、vertical slice、文件膨胀阈值和 smoke 验证，或写明豁免理由。
- **下一步**：A10 执行 Sprint 0 / 首个业务 Sprint；A8 文档评估；A17 open items。
- **cmd 指针**：`template-docs/web-fullstack-profile.md` + `ai/prompts/dev/02-run-task.md`

#### A8 文档评估 / 审计 / 检查
- **说明**：编码前或阶段转换前判断文档是否能继续往下走；评估给 Go / Conditional Go / No Go，审计找断点，checklist 做最后拦截。
- **触发**：「评估文档」「评估能不能进入下一阶段」「审计文档」「PLM 链路检查」「开发前检查」
- **cwd·前置**：在派生项目 · 文档基本成型

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 做阶段或单文档评估 | 判断能否进入下一阶段，并留下 Go / Conditional Go / No Go 依据 | `docs-evaluation`(19)，可评整体 / E1-E6 / 单文档 |
| 2 | 回溯审计整条文档链 | 检查有没有断点/越界，对照规范基线 | `docs-system-audit`(16)（对照 `ai/doc-standards`，先出报告不改文件） |
| 3 | 开发前过一遍 checklist | 编码前最后一道边界复查 | `docs-checklist`(10) |
| 4 | 把结论和问题清单给你 | 先看清问题再决定改，避免边审边改乱套 | 输出评估 / 审计报告（Go 结论、悬空 ID / 越界 / 漂移） |

- **完成判据**：评估结论为 Go 或 Conditional Go 且条件已处理 / 接受 · 审计报告无阻断项 · 人工确认 03 §3 路线图 + 05 本机可行性
- **下一步**：A9
- **cmd 指针**：`ai/prompts/review/19-docs-evaluation.md` + `ai/prompts/review/16-docs-system-audit.md` + `ai/prompts/review/10-docs-checklist.md`

#### A24 技术路线与环境支撑评估
- **说明**：真实运行依赖项目在生成 / 修订 05 或进入首个相关 Sprint 前，评估本机 / 团队环境是否支撑技术路线。
- **触发**：「技术环境评估」「技术路线评估」「评估依赖能不能装」「评估本机能不能跑」「依赖安装验证」「最小运行验证」
- **cwd·前置**：在派生项目 · 已有或准备生成 `docs/env/local-env.md`、`docs/05-tech-spec.md`

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 区分采集和评估 | `collect-env` 只记录事实，不证明依赖能跑 | 读取 `docs/env/local-env.md` |
| 2 | 盘点真实运行依赖 | 找出 Python / Node / Docker / DB / 模型 / 外部 API 风险 | `tech-env-evaluation`(20) |
| 3 | 输出验证计划和 Go 结论 | 安装 / 导入 / 最小运行需确认后执行 | `docs/research/YYYY-MM-DD-tech-env-evaluation-<scope>.md`（确认后落盘） |
| 4 | 回写 05 / 09 建议 | 评估结论要驱动技术方案和验证计划 | `edit-single-doc`(04) |

- **完成判据**：结论为 Go / Conditional Go 且条件明确 · 05/09 修改建议清晰 · 跳过验证时有风险和补做时点
- **下一步**：A9 / A10
- **cmd 指针**：`ai/prompts/review/20-tech-env-evaluation.md`

#### A9 阶段规划与路线图
- **说明**：基于完整设计，规划怎么分阶段实现（先 Demo 可演示 → MVP 可用 → 完整产品）。
- **触发**：「规划阶段」「Demo 做什么」「划分 MVP」「排路线图」
- **cwd·前置**：在派生项目 · 文档体系已审计

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 核对当前 Phase 边界 | 防止把愿景或后续阶段当成本阶段任务 | 读 `implementation-lifecycle-rules` + `03/04/05/08/09` |
| 2 | 规划 Sprint / Task / 验证闭环 | 计划必须可实现、可验证、可验收 | `ai/prompts/planning/19-plan-phases-and-sprints.md` |
| 3 | 把划分写进路线图和计划 | 阶段划分要落到权威文档才有效 | 输出 `03-prd.md` §3、`08-dev-plan.md`、`09-verification.md`、`project-rules §1` 修订草稿 |

- **完成判据**：03 §3 标注功能范围+交付物形态+进入/退出标准 · 08 拆出 P1 Sprint · 09 有测试等级 / 验证包
- **下一步**：A10
- **cmd 指针**：`ai/implementation-lifecycle-rules.md` + `ai/prompts/planning/19-plan-phases-and-sprints.md`

#### A10 执行 Sprint / 任务（编码 + 合规审查 + 提交）
- **说明**：实现一个任务，做实现合规审查并提交（可选 PR）。
- **触发**：「执行 Sprint」「做这个任务」「开始编码」
- **cwd·前置**：在派生项目 · 08 已确认 · project-rules §1 当前阶段明确

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 动手前再复查文档、Phase、验证包和技术环境门禁 | 确保编码依据充分、不越界，真实运行依赖已评估 | `docs-checklist`(10) + `implementation-lifecycle-rules` + 必要时 `tech-env-evaluation`(20) |
| 2 | 实现这个任务（小范围） | 一功能一任务一提交，便于验收 | `run-dev-task`(02)（关联 REQ / Sprint / Task / Test Case，限 1–3 文件） |
| 3 | 审查实现是否符合设计、有没有越界 | 防止实现偏离设计或越出本阶段 | `project-review`(03)（六维度 + Phase 边界 + 验证闭环） |
| 4 | 生成提交信息并提交（可选 PR） | 完成式提交信息 + PR 便于审查合并 | `commit-message`(06) + 可选 PR（`git-guide §3.1`） |

- **完成判据**：任务验收标准达成 · 关联 Test Case 已验证 · 合规审查无越界 · 提交完成
- **下一步**：A11（修 Bug）/ A12（验证）
- **cmd 指针**：`ai/prompts/dev/02-run-task.md` + `git-guide.md` §3

#### A11 修 Bug
- **说明**：定位并修复一个缺陷，确认不引入新问题。
- **触发**：「修 Bug」「修复缺陷」「这个报错」
- **cwd·前置**：在派生项目 · 已有代码

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 定位 Bug 根因 | 治根不治标，避免反复 | `fix-bug`(05) |
| 2 | 在小范围内修复 | 限定范围减少回归风险 | 修复（限 1–3 文件） |
| 3 | 提交并验证 | 确认 Bug 消除且无新问题 | `commit-message`(06) + `docs/09-verification.md` 缺陷与回归记录 |

- **完成判据**：Bug 复现路径消除 · 无回归
- **下一步**：A12（验证）/ A10（继续 Sprint）
- **cmd 指针**：`ai/prompts/dev/05-fix-bug.md`

#### A12 验证与验收
- **说明**：按验证计划跑用例和测试，做本 Sprint 的验收并留痕。
- **触发**：「验证」「跑测试」「Sprint 验收」
- **cwd·前置**：在派生项目 · 当前阶段功能已实现

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 核对每个需求有没有对应用例、能不能跑通 | 保证每个需求都有验证且能过 | 按 `docs/09-verification.md` 跑 REQ→用例追溯 + 测试等级矩阵 + 资源验证 |
| 2 | 实际运行测试并收集证据 | 文档验证不等于实际能跑 | 执行项目测试命令 / 人工步骤，记录命令、日志、截图或结论 |
| 3 | 出 Sprint 验收总结并留痕 | 留痕才能追溯阶段完成度 | `sprint-summary`(09) → 写入 09 的 Sprint 验收包 / 验收记录 |

- **完成判据**：当前阶段 REQ 全部可验证通过 · Sprint 验收包完整 · 风险 / 未验证项留痕
- **下一步**：A13（同步）/ A14（Phase 升级）/ A21（查看演示效果，有可运行交付物时）
- **cmd 指针**：`ai/prompts/dev/09-sprint-summary.md`

#### A13 同步模板到派生项目
- **说明**：把模板方法论的更新拉到你的派生项目（不回传），并完成同步后的边界验证、整理、文档审计、项目验证建议和同步报告留痕；若已完成同步提交但旧流程未跑后续，则进入“同步后续接模式”，跳过 dry-run / commit，从边界验证开始补完闭环。
- **触发**：「同步模板」「更新方法论」「sync template」「已同步但没做后续」「补完同步后流程」「同步后续接」
- **完整闭环说法**：「模板新版已发布，请按 A13 执行完整闭环：sync-methodology → post-sync-cleanup → docs-system-audit → 提案回流收口 → 同步报告留痕。」
- **cwd·前置**：在派生项目；若缺少 `scripts/sync-template.ps1`、`template-sync.json`，或（无 `TEMPLATE-BASE.md` 且 `VERSION` 低于 `v1.6.8` / 无法判断脚本是否为新版），仍属于本场景，先按 `git-guide.md` §5.2 走旧派生项目首次同步 bootstrap，再继续完整 A13 闭环。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 先输出标准闭环计划 | 用户知道同步不只是拉文件，还要整理、审计、验证、留痕；旧派生项目 bootstrap 拿到新版流程后，也不能停在同步提交 | `sync-methodology`(12)；旧项目先按 `git-guide.md` §5.2 bootstrap，再读取新版 `ai/prompts/maintainers/12-sync-template.md` 继续 |
| 2 | 预览模板有哪些更新、会不会动项目文件 | 先确认安全再改，避免误覆盖 | `--dry-run` |
| 3 | 确认安全后应用更新并做边界验证 | 拿到模板方法论更新，确认没误覆盖项目件；普通派生项目用 `--preserve-project-version` 保留自身版本，领域模板用 `--domain-template` 保留领域版本 | `--commit --preserve-project-version`（普通派生）/ `--domain-template`（领域模板）+ `scripts/check-derived-sync.ps1` |
| 4 | 同步后整理项目 | README、`project-rules`、docs 分区等项目事实不会被同步脚本自动迁移 | `post-sync-cleanup`(15)，先出迁移计划 |
| 5 | 文档体系同步后审计 | 检查旧方法生成的 `docs/00-09` 是否需按新规范回梳 | `docs-system-audit`(16)，同步后审计模式 |
| 6 | 做提案回流收口检查 | 派生提案可能已通过模板 issue / PR 被采纳，同步后应判断本地草稿和 issue 记录是否可归档 | 扫描 `_proposals/`、`.ai/session-handoff.md`、`sync-records/template-sync/`、issue 链接；必要时 `gh issue view` |
| 7 | 给项目验证建议并形成同步报告 | 留下命令、结果、风险、未验证项、提案收口结论和后续任务 | `template-docs/derived-sync-report-template.md` → `sync-records/template-sync/` |

> **同步后续接模式**：若 Git 显示已存在最近的 `sync template vX.Y.Z from ai-project-template` 同步提交，或 `TEMPLATE-BASE.md` 已记录目标模板版本且用户明确说“已同步，只补后续”（旧项目可兼容 `VERSION` 已是目标版本），不要重新执行 dry-run / commit；先核对最新同步提交和工作区，再从第 3 步的边界验证开始补跑 workflow 检查、`post-sync-cleanup`、`docs-system-audit`、项目验证建议和同步运行记录。

- **完成判据**：同步清单文件更新 · 项目专属文件未被覆盖 · `check-derived-sync` 通过 · 已输出整理 / 审计摘要 · 已完成提案回流收口判断 · 已给项目验证建议 · 已形成或更新同步报告
- **下一步**：A14 / 回 A10 继续
- **cmd 指针**：`git-guide.md` §5 + `ai/prompts/maintainers/12-sync-template.md`

#### A14 Phase 升级
- **说明**：当前阶段验收后，进入下一阶段（指针后移，原位补新阶段设计）。
- **触发**：「升级 Phase」「进入下一阶段」「Phase2」
- **cwd·前置**：在派生项目 · 当前阶段已验收

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 评估能否进入下一阶段 | 确认当前阶段达标才能升 | `phase-upgrade`(08) |
| 2 | 后移阶段指针，补新阶段设计（不删旧） | 积累式演进，旧阶段内容保留 | 更新 `project-rules §1` + 原位补设计（`global-rules §8.2`） |
| 3 | 更新路线图和开发计划 | 阶段变了计划要同步 | 更新 `03-prd.md` §3 + `08-dev-plan.md` |

- **完成判据**：阶段指针后移 · 新阶段要素达 `P{N}-已设计` · 旧阶段内容原封不动
- **下一步**：A10（新阶段 Sprint）
- **cmd 指针**：`ai/prompts/planning/08-phase-upgrade.md`

#### A15 回流提案 / 反馈到模板（派生 → 模板上报）
- **说明**：把派生项目的成熟优化提案或使用问题，提交给 `ai-project-template` 模板维护者（跨仓库开 issue，免 fork）。
- **触发**：「提交提案给维护者」「回流模板」「反馈使用问题」「submit proposal / feedback」
- **cwd·前置**：在派生项目 · `gh` 可用 · 模板仓可访问

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 区分成熟提案 vs 散落问题 | 走不同命令 | 判断 |
| 2a | 成熟提案 → 校验去项目化 + 来源 + 字段 | 挡低质量 / 敏感 | `/run submit-proposal`（17） |
| 2b | 散落问题 → 扫描候选 + 人工勾选 | 半自动汇集，避免噪声 | `/run submit-feedback`（18） |
| 3 | `gh` 跨仓库开 issue（label `proposal`/`feedback` + `from:<派生>`） | 免 fork，成员开 issue 即可 | `gh issue create` |
| 4 | 返回 issue 链接，记续接 | 留痕可追溯 | 记 `.ai/session-handoff.md` |

- **完成判据**：issue 已开（模板仓可见）+ 续接记录
- **下一步**：等模板维护者处理（C1）；模板新版下行同步后（A13）拿到结果
- **cmd 指针**：`ai/commands/submit-proposal.md` / `submit-feedback.md`

#### A16 会话续接 / 中断恢复（跨 CLI 接手）
- **说明**：窗口中断、重新打开、或某个 AI CLI 撞 token / 时间上限被迫换另一个 CLI 接手时，恢复上次工作上下文。这是跨 Claude / Codex / Cursor 等多 CLI 的统一恢复入口——续接文件 + Git 是公共状态，换 CLI 不丢上下文。
- **触发**：「读取续接点」「继续上次」「接着干」「我上次做到哪了」「换了 CLI 接着做」「恢复上下文」
- **cwd·前置**：在已有项目（模板或派生）· 可能有 `.ai/session-handoff.md` / `NEXT-STEPS.md`

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 先取 Git 客观事实 | 客观事实永远最新，先看它不被过时记录误导 | `git status --short --branch` + `git log --oneline -8` + `git stash list` |
| 2 | 再读续接文件 | handoff 给意图 / 计划 / 待确认项 | 读 `.ai/session-handoff.md`（无则 `NEXT-STEPS.md`） |
| 3 | 交叉核对，判主动 / 被动中断 | 被动中断（含跨 CLI）handoff 可能过时，必须以 Git 为锚 | 按 `session-rules §1` 裁决优先级链 |
| 4 | 向用户简述恢复状态 | 让用户确认上下文重建对不对 | 输出「当前任务 / 已完成 / 下一步 / 待确认」，冲突先报告后动 |

- **完成判据**：已向用户简述恢复状态 · 冲突已报告 · 用户已确认下一步
- **下一步**：回到被中断的场景（A10 编码 / A7 文档 / C4 PR 等），或开始新任务
- **cmd 指针**：`ai/session-rules.md` §1 裁决优先级 + §2 恢复流程

#### A17 待确认事项总览
- **说明**：汇总文档生成、审计、评估、任务执行和验证中的 open items，检查阶段 / 编码 / Phase 升级门禁。
- **触发**：「汇总待确认事项」「生成 open items」「还有哪些没确认」「编码前自检未决项」「阶段任务前检查待确认项」
- **cwd·前置**：在派生项目 · 已有 docs、审计报告、评估报告、任务单或续接记录中的待确认项

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 扫描待确认来源 | open items 不应散落在多份文档中无人收口 | 读 `docs/00-09`、`docs/design/*`、`docs/research/*`、`tasks/*`、`.ai/session-handoff.md` |
| 2 | 输出总览字段 | 记录提出时间、来源、需确认节点、阻塞关系和回填位置 | `docs-open-items`(21) |
| 3 | 做门禁判断 | 阻塞项未关闭不得进入对应 Sprint / Phase | Go / Conditional Go / No Go 或阻塞说明 |
| 4 | 确认落盘方式 | 总览不是事实源，确认后应回填权威文档 | 默认建议 `docs/research/YYYY-MM-DD-docs-open-items.md` |

- **完成判据**：open items 总览完整 · 阻塞 / 条件阻塞 / 不阻塞已标明 · 回填位置明确 · AI 建议未写成已确认事实
- **下一步**：A8 / A10 / A14 / A19
- **cmd 指针**：`ai/commands/docs-open-items.md` + `ai/prompts/docs/21-docs-open-items.md`

#### A18 专题方案讨论
- **说明**：在写入正式文档前讨论需求层人机交互、总体设计 / 技术选型、交互设计方案，输出多方案、依据、取舍和待确认项；若用户明确想“先看原型 / Demo 前原型确认”，优先转 A22。
- **触发**：「讨论系统的人机交互」「从需求层面给交互建议」「讨论技术选型」「讨论总体设计」「讨论交互设计方案」「先别写正式文档」
- **cwd·前置**：在派生项目 · 已有上游输入、需求草稿或设计草稿；若输入不足，先转 A5

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 明确专题类型与输入依据 | 避免把无依据建议写入正式文档 | 需求交互 / 技术选型 / 交互设计三选一 |
| 2 | 给出多方案对比 | 让用户看到适用条件、风险和取舍 | 输出方案、依据、成本、验证和风险 |
| 3 | 给 AI 推荐但标待确认 | AI 可建议，不能替用户确认事实 | 推荐方案 + 待确认项 + 回填位置 |
| 4 | 人工确认后再回填文档 | 防止专题讨论越过 PRD / 架构 / API / 验收边界 | 转 `edit-single-doc` 或 `generate-docs` |

- **完成判据**：至少 2 个方案 · AI 推荐与依据清晰 · 待确认项与回填位置明确 · 未直接改写正式事实
- **下一步**：A7 / A17 / A19
- **cmd 指针**：`ai/prompts/docs/21-docs-open-items.md`（待确认收口）+ `ai/prompts/docs/04-edit-single-doc.md`（确认后回填）

#### A19 文档定稿门禁
- **说明**：完整文档体系生成后，先做评估 / 审计和 open items 收口，再判断是否可进入编码或 Phase 升级。
- **触发**：「文档可以定稿吗」「生成后评估」「定稿前检查」「编码前门禁」「完整文档体系评估」
- **cwd·前置**：在派生项目 · 已生成或大幅更新 `docs/00-09`、`docs/design/*`、任务计划或验证计划

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 运行文档评估 | 判断 Go / Conditional Go / No Go | `docs-evaluation`(19) |
| 2 | 运行体系审计 | 找追溯断点、状态冲突、规范缺口和传播残留 | `docs-system-audit`(16) |
| 3 | 检查 open items 门禁 | 阻塞项未关闭或未接受风险，不得进入编码 | `docs-open-items`(21) |
| 4 | 输出定稿建议 | 明确修复顺序、落盘报告和下一步命令 | Go / Conditional Go / No Go + 报告路径 |

- **完成判据**：评估 / 审计结论明确 · open items 阻塞项已关闭或被风险接受 · 下一步命令明确
- **下一步**：A10 / A14 / A7
- **cmd 指针**：`ai/prompts/review/19-docs-evaluation.md` + `ai/prompts/review/16-docs-system-audit.md` + `ai/prompts/docs/21-docs-open-items.md`

#### A20 领域模板派生（母模板 → 领域模板）
- **说明**：当用户想从 `ai-project-template` 派生一个面向某类系统的“领域模板”（如 `agent-system-template`、`data-pipeline-template`、`web-app-template`），先做继承边界与创建方案，不把领域 scaffold 直接塞进母模板。
- **触发**：「创建 agent 系统模板」「从母模板派生领域模板」「做一个专用模板」「agent-system-template」「领域模板继承」
- **cwd·前置**：优先在 `ai-project-template` 母模板仓库或其父目录；若在普通派生项目中提出，先说明这是模板治理 / 新仓库创建任务，不是当前业务项目开发任务。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 判定是否为领域模板 | 区分普通业务项目与可复用领域模板，避免把领域规则误写进母模板或业务项目 | 检查目标是否服务多个同类项目、是否需要自己的版本 / scaffold / 自检 |
| 2 | 选择内置还是独立仓库 | 领域模板若需要独立生命周期，应优先独立仓库 | 对比母模板内置 scaffold vs 独立 `*-template` 仓库，列边界和维护成本 |
| 3 | 做 Phase 0 预检 | 避免创建到错误目录、远端重名或工具不可用 | 只读检查 `new-project.*`、目标目录、远端仓库名、`git` / `gh` / Bash / 权限 |
| 4 | 输出创建方案 | 创建新仓库前先明确命名、可见性、base version 和初始化范围 | 给出命令、预计修改文件、验证方式和是否需要人工确认 |
| 5 | 执行创建（需确认） | 新目录 / 新仓库是状态变更，必须确认后再执行 | 从母模板父目录运行 `new-project.sh --local` 或受控复制；创建后写领域版 `TEMPLATE-BASE.md`（`Lineage type: domain template` + `Domain standards scope`），后续从母模板 sync 用 `--domain-template` |

- **完成判据**：已明确三层关系（母模板 → 领域模板 → 具体项目）· 已决定独立仓库或不执行 · 已给出可审计创建命令和初始化待办 · 未向母模板新增领域 scaffold
- **下一步**：执行领域模板创建 / 回 C1 记录模板提案 / 暂停等待人工确认
- **cmd 指针**：无专用命令；方法论定位见 `template-docs/domain-templates.md`；参考 `scripts/new-project.sh`、`_proposals/TEMPLATE-UPGRADE-domain-template-inheritance.md` 和 `CONTRIBUTING.md` §4 版本影响判断

#### A21 查看演示效果（查看 / 启动 Demo）
- **说明**：项目有可运行交付物（Demo / MVP / 产品）时，把交付物跑起来并查看效果。执行边界与禁止项见 `ai/commands/show-demo.md`，演示 SOP 模板见 `template-docs/demo-runbook-template.md`，**不替代 `docs/09-verification.md` 验收**。
- **触发**：「查看演示效果」「启动 Demo」「给我二维码」「检查 Demo 是否起来」「怎么看当前项目效果」
- **cwd·前置**：在派生项目 · 已有可运行交付物
- **机器执行**：`/run show-demo`（路由到项目演示 SOP `docs/env/local-demo-runbook.md`；无则按模板生成草案待确认）
- **完成判据**：演示入口与访问方式已输出 · 启动 / 生成产物等写入动作已确认 · 未把演示检查误称 09 验收通过
- **下一步**：A12（验证与验收）/ A10（继续 Sprint）
- **cmd 指针**：`ai/commands/show-demo.md`、`template-docs/demo-runbook-template.md`

### C 维护者（C1–C8）

> cwd：均在 `ai-project-template` 模板仓库。

#### C1 处理提案收件箱
- **说明**：汇总和处理模板优化提案，来源包括 `_proposals/TEMPLATE-UPGRADE-*.md`、`_proposals/_remote-issues/*.md`、带 `proposal` / `feedback` 标签的 GitHub issue，以及标题为 `TEMPLATE-UPGRADE:` 的 open issue；远端 issue 必须先刷新成本地镜像，镜像路径确认后再分析、分批落地、关闭 issue 或决议归档。
- **触发**：「处理提案」「汇总模板优化」「评审 TEMPLATE-UPGRADE」「处理 issue 提案」

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 读本地提案和既有 issue 镜像 | 镜像是跨会话稳定输入，不能每次只依赖远端读取 | `_proposals/TEMPLATE-UPGRADE-*.md` + `_proposals/_remote-issues/*.md` |
| 2 | 查询并刷新远端 issue 镜像 | issue 是派生免 fork 回流入口，远端正文只允许用于生成 / 刷新本地镜像 | `template-proposal-summary`(11) + `gh issue list` / `gh issue view` |
| 3 | 确认本轮镜像路径清单 | 没有 `_proposals/_remote-issues/issue-<number>.md` 的 issue 不得进入正文分析 | 镜像路径 + `Updated` / `Mirrored at` |
| 4 | 做 triage：补标签、去项目化、去重/冲突/依赖分析 | 避免漏掉未打标签的 `TEMPLATE-UPGRADE:` issue，也避免重复落地 | 标签 `proposal` / `feedback` + Batch 计划 |
| 5 | 切维护分支，按 Batch 计划辅助修改 | 模板改动必须走分支 PR，一批一范围便于评审和续接 | 切分支 + 落地（规则/脚本/文档） |
| 6 | 开 PR、评审、合并后归档 / 关闭 issue | main 受保护禁直推；已处理提案要有收口记录 | `gh pr create` → 评审合并 → 移到 `_archive/proposals/` / `gh issue close` |

- **完成判据**：提案落地或决议留存 · 已处理本地提案归档 · 已处理 issue 关闭或标记后续状态
- **下一步**：C2 / C3
- **cmd 指针**：`CONTRIBUTING.md` + `git-guide.md` §3-4

#### C2 版本 bump 与发布 ◐
- **说明**：发布模板新版本——改版本号、跑自检、打 tag、发 Release。
- **触发**：「发版本」「bump 版本」「打 tag」
- **适用 / 不适用**：适用于模板改动 PR 合并后的模板版本发布；不适用于派生项目业务发版。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 判断版本影响 | PATCH / MINOR / MAJOR 决定同步和回归要求 | 读 `MAINTAINERS.md` + `CONTRIBUTING.md` |
| 2 | 按 checklist 改版本号和 CHANGELOG | 版本是同步的事实源，必须记录 | 改 `VERSION` + `CHANGELOG.md`（按 `MAINTAINERS` checklist） |
| 3 | 跑自检 / 回归 | 确保文档没滞后于脚本 | `scripts/check-template.ps1`；MINOR / MAJOR 跑 e2e checklist |
| 4 | 打 tag 并发 GitHub Release | tag 是版本锚点，Release 给使用者看 | `git tag vX.Y.Z` + 发 Release |

- **完成判据**：VERSION/CHANGELOG/tag/Release 一致 · check-template 通过
- **下一步**：C3
- **cmd 指针**：`MAINTAINERS.md` 发布 checklist
- ◐ 待补：专门版本发布 command

#### C3 模板自检
- **说明**：跑模板完整性自检，发现并修复规则/脚本/文档的不一致。
- **触发**：「自检模板」「跑 check-template」

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 跑模板完整性自检 | 发现规则/脚本/文档的不一致 | `scripts/check-template.ps1`（或 `.sh`） |
| 2 | 有断言失败就修复 | 保持模板可发布状态 | 修复至全过 |

- **完成判据**：check-template 全过
- **下一步**：C4
- **cmd 指针**：`scripts/check-template.ps1` 头部

#### C4 维护分支→PR→合并→归档
- **说明**：模板改动的标准 PR 流程：切分支、实现、提 PR、合并、清理。
- **触发**：「提 PR」「合并分支」「走 PR 流程」

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 切维护分支 | 隔离改动，便于审查 | `git switch -c change/<主题>` |
| 2 | 实现 + 提交 | 完成式提交信息 | 实现 + `commit-message`(06) |
| 3 | 推送、开 PR、评审、合并 | 模板强制走 PR | `git push -u` + `gh pr create --fill` + 评审合并 |
| 4 | 同步 main、删分支、归档 | 保持 main 干净、分支不堆积 | `git switch main` + `git pull` + 删分支 + 归档 |

- **完成判据**：PR 合并 · main 同步 · 分支清理
- **下一步**：视任务
- **cmd 指针**：`git-guide.md` §3-4 + `CONTRIBUTING.md`

#### C5 维护下行同步机制 ◐
- **说明**：维护同步机制本身——改同步清单、同步脚本、边界检查。
- **触发**：「改同步清单」「加同步文件」「改 sync 脚本」
- **适用 / 不适用**：适用于模板仓维护 `template-sync.json`、`sync-template.*`、`check-derived-sync.*`、doc-standards 镜像和同步运行记录规则；派生项目执行同步走 A13，单个派生同步验收走 C6。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 改同步清单或脚本（含 fallback） | 同步机制本身要演进 | 改 `template-sync.json` / `scripts/sync-template.*` / `check-derived-sync.*` |
| 2 | 同步更新相关文档 | 文档要跟上机制变化 | 更新 `git-guide §5` + `MAINTAINERS` 同步清单规则 |
| 3 | 加自检断言 | 防止机制改了文档没跟（防滞后） | `scripts/check-template.*` 加断言 |

- **完成判据**：清单与脚本一致 · check-template 通过
- **下一步**：C3
- **cmd 指针**：`git-guide.md` §5 + `template-sync.json` + `scripts/check-derived-sync.*`

#### C6 派生同步验收（跨仓）
- **说明**：验收派生项目的同步结果，确认没误覆盖项目专属文件，并留痕报告。
- **触发**：「验收派生同步」「同步报告」
- **cwd·前置**：跨仓场景；先在模板仓确认目标模板版本，再切到目标派生项目运行检查。

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 明确目标派生仓库和模板版本 | 避免在错误仓库验收 | 列出派生仓 cwd、`VERSION`、同步提交 |
| 2 | 在派生项目跑边界检查 | 确认没误覆盖项目专属文件 | `scripts/check-derived-sync.ps1` / `.sh` |
| 3 | 记录这次同步的命令/结果/问题 | 留痕才能追溯 | `template-docs/derived-sync-report-template.md` → `sync-records/template-sync/` |
| 4 | 把可通用优化点转提案回流 | 通用问题回流模板，惠及所有项目 | 转写 `_proposals/TEMPLATE-UPGRADE-*.md`（回 C1） |

- **完成判据**：边界检查通过 · 同步报告留痕
- **下一步**：C1
- **cmd 指针**：`git-guide.md` §5.4 + `template-docs/derived-sync-report-template.md`

#### C7 模板能力设计流程
- **说明**：给模板新增规则、文档骨架、command、prompt、脚本等能力（本提案即此场景产物）。
- **触发**：「加新规则」「加文档骨架」「加 command/prompt」「加脚本」

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 先写去项目化提案 | 提案才能通用化、可审计 | `_proposals/TEMPLATE-UPGRADE-*.md`（`global-rules §9`） |
| 2 | 做影响面分析 | 避免只改一个入口导致体系断裂 | 规则 / prompt / command / scenario / scripts / sync 清单 / check-template / docs 骨架 |
| 3 | 设计分步落地计划 | 大能力拆 PR，降低审查风险 | 明确本 PR 做什么、后续 PR 做什么 |
| 4 | 实现并自检 | 模板能力要能同步到派生 | 改文件 + `template-sync.json` + `scripts/check-template.*` |
| 5 | 走 PR 与发布 | 模板演进必须可追溯 | C4 PR → C2 版本发布 |

- **完成判据**：新增能力有入口、有同步、有自检、有文档 · CHANGELOG 记录
- **下一步**：C2（发版本）
- **cmd 指针**：`ai/global-rules.md` §9 + `CONTRIBUTING.md` + `template-sync.json` + `scripts/check-template.sh`

#### C8 批量同步所有派生项目
- **说明**：维护者发新模板版本后，一条指令批量更新父目录下的所有派生项目，不用逐个进派生项目终端。
- **触发**：「批量同步」「一次更新所有派生项目」「sync all derived」
- **cwd·前置**：在含多个派生项目的父目录 · gh 可用 · 模板远端可达

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 确认父目录、目标版本、账户 | 批量影响多个项目，先确认范围 | 列出父目录下的派生项目 + 读模板 `VERSION` |
| 2 | 先 `--dry-run` 全预览 | 一次看清所有项目会同步什么 | `bash scripts/sync-all-derived.sh <父目录> --dry-run` |
| 3 | 确认后 `--commit` 批量同步 | 实际更新；每项目独立提交 | `bash scripts/sync-all-derived.sh <父目录> --commit` |
| 4 | 看汇总：成功 / 跳过 / 失败 | 不干净或非派生会跳过，失败需人工 | 读汇总输出 |

- **完成判据**：无失败项目；跳过项已确认（非派生 / 工作区不干净 / 模板本体）
- **下一步**：失败或跳过项目逐个走 A13；每项目用 `template-docs/derived-sync-report-template.md` 留运行记录
- **cmd 指针**：`scripts/sync-all-derived.sh`
- **注意**：`--commit` 在每个派生当前分支提交；要 PR-per-project 可审计流程改用 A13。

### 元场景

#### M0 帮助 / 能力索引 / 角色选择
- **说明**：用户不知道该怎么问、想看能力列表或说“你能做什么”时，从这里开始。
- **触发**：「help」「帮助」「你能做什么」「怎么用这个模板」「列出场景」

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 判断 cwd 状态 | 零资产 / 模板仓 / 派生项目可用场景不同 | §2 cwd 三分支 |
| 2 | 识别用户角色 | 使用者、维护者、两者都是、不确定会看到不同索引 | §1 角色 |
| 3 | 输出对应场景索引 | 先让用户选方向，不急着执行 | A 场景、C 场景或两者，推荐 2–3 个下一步 |
| 4 | 用户选定后转 M1 | M1 负责输出可执行引导计划 | 交给 M1 |

- **完成判据**：用户明确角色和下一步场景。
- **下一步**：M1。

#### M1 用场景引导做事
- **说明**：任何场景意图的统一入口——AI 先判断位置、给引导计划，确认后再执行。
- **触发**：任何「我想 <做某事>」、`/run scenario`、新手首次打开 AI CLI

| # | 做什么 | 为什么 | 机器执行 |
|---|---|---|---|
| 1 | 判断你现在的位置 | 零资产必须先 A0，不同位置走不同场景 | §2 cwd 三分支 |
| 2 | 识别你是使用者还是维护者、想做哪个场景 | 角色决定场景集，场景决定步骤 | 识别角色 + 场景 |
| 3 | 用人话告诉你打算做哪几步（不直接动手） | 让你掌控写入，不意外 | 按 §4 契约产出引导计划 |
| 4 | 你确认后逐步执行 | 写入步骤逐次确认，安全 | 按场景步骤的「机器执行」列 |
| 5 | 做完告诉你下一步做哪个场景 | 场景间有衔接，引导连贯 | 给「下一步」 |

- **约束**：每步标只读/写入·确认；零资产不得跳 A0；账户/可见性按 §1 引导；会话续接按 `ai/session-rules.md`（跨 Claude/Codex 一致）；多步任务维护续接文件。

## 6. A7 的 PLM 转换子场景

A7 按 `ai/document-lifecycle-rules.md` §2/§5 的 PLM 链路组织为**有方向的转换子场景**（上游 → 下游）。三种粒度：
- **全链路**：A7-REQ → A7-ARCH → A7-DETAIL → A7-PLAN → A7-VERIFY 主链，需求就绪后并行 A7-TC，实现后用 A7-BACKFILL 回流。
- **单转换**：只做某个 A7 语义化子流程。
- **单文档**：只精修 00-09 某个文档。

| 子场景 | 这一步帮你做什么（人话） | 上游 → 下游 | 依据（doc-lifecycle §5） |
|---|---|---|---|
| A7-REQ | 把愿景和输入材料落成需求文档 | inputs 评审结果 + product-vision → 需求阶段（00-03） | 00/01/02/03 行 |
| A7-ARCH | 由需求推导总体架构和技术方案 | 需求（00-03）→ 总体设计（04-05） | 04/05 行 |
| A7-TC | 由需求反推验收用例（早定验收口径） | 需求（00-03）→ 测试用例（09） | 09 行 |
| A7-DETAIL | 由总体设计细化数据库、接口、子系统、前端交互和 UI 原型策略 | 总体设计（04-05）→ 详细设计（06-07 + docs/design + 原型证据） | 06/07/design 行 |
| A7-PLAN | 由详细设计拆 Sprint 和任务 | 详细设计 → 实现计划（08 + tasks） | 08/tasks 行 |
| A7-VERIFY | 由实现计划细化验证策略 | 实现计划 → 验证（09） | 09 行 |
| A7-BACKFILL | 代码改了，把事实反向同步回文档 | 代码 → 文档反向同步 | §9 变更传播；`sync-docs-from-code`(07) |

> 每个转换引用 `document-lifecycle-rules §5` 对应行为权威，不重述。
> 与 A12 区分：A7.x **生成/精修 09 验证文档**；A12 **运行验证、做验收**。

## 7. 图表规范（横切）

设计类文档应包含规定图表，格式**默认 mermaid**（可选 plantuml）；`ai/project-rules.md`「图表格式偏好」填项可覆盖。

| 文档 | 应含图表 |
|---|---|
| `04-architecture.md` | 系统架构图、运行拓扑/部署图 |
| `05-tech-spec.md` | 技术栈分层、部署拓扑 |
| `06-db-design.md` | ER 图 |
| `07-api-spec.md` | 接口交互/时序图 |
| `docs/design/*` | 流程图、状态机、交互图；前端交互设计应含页面流 / 状态流图；UI 型项目按策略链接 Figma / Penpot / Storybook / 代码原型 / 截图标注等可视化证据 |

> 规范是「建议 + 默认」而非「强制」；A3 填 project-rules、A7 精修设计文档时引导用户确认图表偏好。权威定义在 `ai/document-lifecycle-rules.md` / `ai/doc-standards/`，本节为引用。

## 8. 维护

- 新增/调整场景：先 `_proposals/TEMPLATE-UPGRADE-*.md` 提案（`global-rules §9`），合并后回写本文件。
- 场景编排的 command/prompt/script 变更时，同步本文件的「机器执行」列。
- 派生项目同步模板后获得本文件；项目专属场景不写 here，写项目自己的 `docs/` 或 `ai/project-rules.md`。
