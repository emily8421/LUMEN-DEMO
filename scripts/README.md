# scripts/ 脚本

> Sync notice: 本文件由 ai-project-template 模板同步维护，派生项目同步时会被覆盖；不应直接修改，通用改进请经 _proposals/ 回流模板仓库。

本目录放 `ai-project-template` 的自动化脚本：下行同步、同步验收、环境采集与检查、一键安装、提交卫生检查；模板仓侧另有自检、批量同步、发布回归与建项目入口（不下行）。

## 1. 登记口径与同步边界

工具按真实消费者分为两组（v1.65.0 起，提案 `_archive/proposals/TEMPLATE-UPGRADE-scripts-sync-boundary.md`）：

- **随模板下行（8 类能力 / 10 个文件）**：进 `template-sync.json` `files_all`，派生项目同步时获得并被覆盖更新。本 README 随组下行。
- **模板仓专用（4 类能力 / 5 个文件）**：`check-template.sh` / `check-template.ps1`、`sync-all-derived.sh`、`e2e-sync-check.sh`、`new-project.sh`。仅存在于模板仓（本目录可见），不下行、不进同步清单；派生项目不应使用，也不应长期保留历史版本残留（见 §5 孤儿清理）。

本注册表描述工具当前行为，不授予执行权限，也不改变退出码、默认参数、同步范围或自动化门禁。执行前仍须遵守 `ai/rules-core.md`、`ai/session-rules.md`、`SOP.md` 和 `git-guide.md` 的确认要求。

## 2. 工具注册表

### 2.1 能力总览——随模板下行（派生项目获得）

| ID | 能力 | 文件 | 运行位置 | 逻辑 Owner | 主要消费者 / 入口 | 状态 |
|---|---|---|---|---|---|---|
| `TOOL-SYNC-001` | 单个派生项目下行同步 | `sync-template.sh`、`sync-template.ps1` | 派生项目 | Governance | 使用者；`ai/commands/sync-methodology.md`、`git-guide.md` | Active |
| `TOOL-SYNC-002` | 派生项目同步边界检查 | `check-derived-sync.sh`、`check-derived-sync.ps1` | 派生项目 | Governance / Verification | 使用者、派生项目 CI（`project-check.yml`） | Active |
| `TOOL-REMOTE-001` | GitHub 远端上下文预检 | `check-github-context.ps1` | Git 仓库 | Governance / Remote | 使用者；`ai/commands/commit-message.md`、`git-guide.md` | Active |
| `TOOL-ENV-001` | 采集本机环境事实 | `collect-env.ps1` | 派生项目 | Docs / Environment | 使用者；`ai/commands/collect-env.md`、`SOP.md` | Active |
| `TOOL-SETUP-001` | 检查基础工具前置条件 | `check-prereqs.ps1` | 任意本机目录 | Implementation / Setup | 使用者；`SOP.md` A1、`template-docs/env-setup.md` | Active |
| `TOOL-ENV-002` | 深度诊断 Node 运行时 | `check-runtime.ps1` | 任意项目 | Implementation / Environment | 使用者；`template-docs/env-setup.md` | Active |
| `TOOL-SETUP-002` | 安装基础开发工具 | `bootstrap-dev-env.ps1` | Windows 本机 | Implementation / Setup | 使用者；`SOP.md` A1、`template-docs/env-setup.md` | Active |
| `TOOL-CHECK-002` | Markdown 清洁度检查 | `check-markdown-clean.ps1` | 模板仓或指定路径 | Governance / Verification | 维护者、CI、`check-template.ps1`；`MAINTAINERS.md` C2 | Active |

### 2.2 能力总览——模板仓专用（不下行，仅模板仓存在）

| ID | 能力 | 文件 | 运行位置 | 逻辑 Owner | 主要消费者 / 入口 | 状态 |
|---|---|---|---|---|---|---|
| `TOOL-CHECK-001` | 模板仓完整性自检 | `check-template.sh`、`check-template.ps1` | 仅模板仓 | Governance / Verification | 维护者、模板仓 CI（`template-check.yml`）；`MAINTAINERS.md`、`CONTRIBUTING.md` | Active |
| `TOOL-SYNC-003` | 批量同步父目录下的派生项目 | `sync-all-derived.sh` | 模板仓（指向派生父目录） | Governance | 维护者；`MAINTAINERS.md` C8、`git-guide.md` | Active |
| `TOOL-RELEASE-001` | 同步链路端到端回归 | `e2e-sync-check.sh` | 仅模板仓 | Governance / Verification | 维护者、发布流程；`MAINTAINERS.md` C3 | Active |
| `TOOL-PROJECT-001` | 从模板创建项目 | `new-project.sh` | 模板仓或任意可访问模板的位置 | Governance / Setup | 使用者（在模板仓侧运行）；`ai/commands/new-project.md`（命令文档随行下行）、`git-guide.md` | Active |

### 2.3 运行契约

| ID | 关键输入 / 默认模式 | 输出与副作用 | 风险和确认边界 | 权威实现与失败语义 |
|---|---|---|---|---|
| `TOOL-SYNC-001` | 默认 `--dry-run`；可选 `--commit`、`--summary`、模板远端 / 分支 | dry-run 报告差异；commit 模式覆盖同步文件、暂存并提交；可能访问网络 | `--commit` 为高风险，必须单步确认；不得在脏工作区或错误仓库执行 | `.sh` 为权威实现；`.ps1` 优先委托 Bash，失败后走 native fallback；非零表示失败 |
| `TOOL-SYNC-002` | 派生项目；可选待检查 commit，默认 `HEAD` | 检查同步文件、版本与提交边界，不写工作区 | 低风险只读；只适用于派生项目 | `.sh` 为权威实现；`.ps1` 优先 Bash 后 fallback；`0` 通过，`1` 失败 |
| `TOOL-REMOTE-001` | 可选 `-ExpectedOwner`、`-ExpectedRepo` | 读取 Git remote / identity、`gh` 登录与仓库权限；可能访问网络，不改远端 | 只读但涉及账号和网络；输出警告时必须先收口上下文，不能继续高风险远端动作 | 单一 PowerShell 实现；`0` 无警告，`2` 存在警告 |
| `TOOL-ENV-001` | 可选 `-OutputPath`，默认 `docs/env/local-env.md` | 创建父目录并写环境 Markdown；不安装软件、不改系统配置 | 写项目文件前需确认路径；输出可能含本机环境信息，提交前应人工复核 | 单一 PowerShell 实现；命令错误按脚本输出诊断 |
| `TOOL-SETUP-001` | 无必填参数 | 输出 Required / Recommended 工具状态，不写文件 | 低风险只读；结果用于诊断，不等同于项目可运行 | 单一 PowerShell 实现；当前无强制非零退出契约 |
| `TOOL-ENV-002` | 当前项目与 PATH / Node manager 状态 | 输出 Node 路径、版本和声明漂移诊断，不写文件 | 低风险只读；属于深诊断，不替代基础前置检查 | 单一 PowerShell 实现；设计为诊断工具，当前始终以 `0` 退出 |
| `TOOL-SETUP-002` | 可选 `-WithDocker`、`-WithJava` | 通过 `winget` 安装 Git、gh、Node、Python、VS Code 及可选工具，改变本机软件状态 | 高风险系统写入；必须明确确认，且不负责登录、代理、Docker 初始化或项目依赖 | 单一 PowerShell 实现；缺少 `winget` 会失败，单项安装失败会告警并继续 |
| `TOOL-CHECK-002` | 路径参数，默认 `_proposals` | 递归检查 Markdown 的 BOM、尾空格、文件末尾换行和多余空行，不写文件 | 低风险只读；路径不存在时跳过 | 单一 PowerShell 实现；`0` 通过或无目标文件，`1` 检查失败 |
| `TOOL-CHECK-001` | 模板仓；可选 `--summary`、`--quiet` | 检查结构、同步契约和临时派生场景；只在临时目录写入 / 清理，不改真实工作区 | 低风险只读检查；发布仍以 Bash + CI 为准 | `.sh` 为完整权威检查，退出 `0/1/2` 分别表示通过、内容失败、环境或参数失败；`.ps1` fallback 仅结构性兜底 |
| `TOOL-SYNC-003` | 父目录；默认 `--dry-run`，可选 `--commit` | 扫描派生仓；dry-run 汇总，commit 模式调用各项目同步并提交；访问模板远端 | `--commit` 会跨多个仓库写入和提交，必须单步确认并先检查脏状态 | 单一 Bash 实现；子任务或环境失败即非零退出 |
| `TOOL-RELEASE-001` | 模板仓 | 在临时目录构造派生场景，组合模板自检与批量同步 dry-run；不改真实派生项目 | 低风险本地回归，但依赖 Bash、Git 和临时目录能力 | 单一 Bash 实现；`0` 通过，非零失败 |
| `TOOL-PROJECT-001` | 项目名；可选 `--account`、`--visibility`、`--no-examples`、`--local`、`--no-remote`、`--shape` | 创建目录、复制 / 克隆模板、裁剪（含删除模板仓专用脚本）、初始化 Git 并提交；未加 `--no-remote` 时还可建远端并 push | 高风险写入；创建目标、切换账号、建远端和 push 均须核对目标并确认 | 单一 Bash 实现；任一步失败即非零退出 |

> 注意：`check-template.*` 是**模板仓**自检（不下行），`check-derived-sync.*` 才是**派生项目**同步验收。派生项目若发现 `scripts/` 中存在 `check-template.*` 等模板仓专用脚本，属历史版本下行残留，可安全删除（见 §5）。

## 3. 权威实现与配对关系

### 3.1 Windows 脚本入口选择

`.sh` 文件是**主实现 / 权威逻辑**，适用于 CI、Git Bash 和类 Unix 环境。

`.ps1` 文件是 **Windows 友好包装入口**，遵循以下原则：

- **优先委托 Git Bash**：先尝试启动 Git Bash 并运行对应的 `.sh` 脚本
- **PowerShell fallback**：Git Bash 无法启动时，走原生 PowerShell 结构性检查（非完整等价）
- **幂等性保证**：Bash 和 fallback 路径产生相同的检查结果类别（通过/失败）

### 3.2 权威性说明

- **完整权威检查**：Bash `check-template.sh` + CI（模板仓）
- **结构性兜底检查**：PowerShell native fallback（Git Bash 无法启动时最低保障）
- **等价性**：fallback 通过 ≠ 完整自检通过；发布前仍应以 CI 或 Bash 自检为准

### 3.3 故障排查

| 入口 | 运行位置 | Git Bash 依赖 | 失败时优先排查 |
|---|---|---|---|
| `scripts/sync-template.ps1` | 派生项目 | 优先 Git Bash；失败时可 PowerShell fallback | 输出中的 fallback 标识；若 fallback 也失败再修 Git for Windows / MSYS |
| `scripts/check-derived-sync.ps1` | 派生项目 | 优先 Git Bash；失败时可 PowerShell fallback | 输出中的 fallback 标识；若 fallback 也失败再修 Git for Windows / MSYS |

## 4. 新增与维护规则

- 新增脚本前，先判断归属组（下行 / 模板仓专用）并在本表登记用途、Owner、消费者、输入输出、写入边界、权威实现和失败语义，再判断是否真的需要新工具。
- 下行组脚本的增删必须同步更新 `template-sync.json` 与 `scripts/sync-template.sh` 兜底清单，并通过 `check-template.*` 断言。
- 能通过现有脚本参数或组合调用完成的能力，优先扩展现有工具；不得仅因调用入口不同就复制实现。
- Bash / PowerShell 双入口必须明确谁是权威实现、fallback 是否完整等价；当前配对均以 Bash 为权威。
- 改变默认写入行为、退出码、同步范围、依赖或 CI 门禁时，必须按模板治理流程提案、升版并更新本表。
- 标为废弃的工具应先记录替代入口和迁移期，再删除实现；删除下行组文件还必须更新 `template-sync.json`、兜底清单和自检断言。

## 5. 重复与缺口审计

### 5.1 历史审计（2026-08-13，v1.61.6 建立）

- 3 组 `.sh` / `.ps1` 是跨平台包装关系，不计为重复建设；PowerShell fallback 不保证与 Bash 完整等价。
- `check-template.*` 聚合模板结构和同步契约检查，`check-markdown-clean.ps1` 只检查 Markdown 文件卫生；前者调用后者属于组合，不是重复。
- `check-prereqs.ps1` 做基础工具面检查，`check-runtime.ps1` 做 Node 深诊断；两者目的不同。
- `sync-all-derived.sh` 是维护者本地批量入口，`sync-template.*` 是单仓执行器；前者调用后者，职责不重复。
- 当时未发现完全无用途的可执行脚本；工具是否仍被真实项目采用，需结合派生项目抽查确认。

### 5.2 同步边界落地（2026-08-18，v1.65.0）

- **C-016 缺口已关闭**：本文件自 v1.65.0 起进入 `template-sync.json` `files_all`，随下行组脚本一并下行到派生项目。
- **模板仓专用脚本移出清单**：`check-template.sh/.ps1`、`sync-all-derived.sh`、`e2e-sync-check.sh`、`new-project.sh` 自 v1.65.0 起不再下行；`new-project.sh` 创建新项目时会显式删除这批脚本（含自身）。
- **孤儿脚本清理指引**：v1.65.0 之前创建的派生项目，`scripts/` 中可能残留上述 5 个文件（同步是覆盖式、不删除）。它们停更后无害但无用途，各项目可在下次模板同步后的 `post-sync-cleanup`（`ai/prompts/maintainers/15-post-sync-cleanup.md` 孤儿脚本审计项）中一次性删除；删除无需回填任何字段（它们不是项目资产）。如误删需恢复，从模板仓复制回即可。

完整命令矩阵见 `SOP.md` 常用命令；操作 SOP（新建 / 提交 / 同步）见 `git-guide.md`。
