# ENV-SETUP

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

本手册说明第一次使用 `ai-project-template` 前，如何准备 AI 编程环境、必备软件和一键安装入口。目标是把 Windows 上的准备过程尽量压缩成“先检查 -> 缺什么补什么 -> 重查 -> 新建项目 -> 采集环境”。

如果你是第一次使用模板，不要先猜自己缺什么；先运行检测脚本，让它告诉你下一步：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

## 1. 这页帮你做什么 + 先检测

### 适用范围

- 默认面向 Windows 10 / 11。
- 目标是让你能顺利运行本模板的核心脚本、同步方法论、采集环境并开始文档驱动开发。
- Linux / macOS 用户可参考同样的软件清单，但本仓库当前提供的是 PowerShell 安装与检测脚本。

### 新手先判断要走哪条路

| 你看到的情况 | 说明 | 该做什么 |
|---|---|---|
| `check-prereqs.ps1` 提示 `OK: all required items are present` | 模板脚本必备项已具备 | 可以运行 `bash scripts/new-project.sh ...` 新建项目 |
| 缺 `winget` | 一键安装脚本暂不可用 | 先安装 Microsoft App Installer，或手工安装缺失工具 |
| 缺 Git / Git Bash | `new-project.sh`、同步脚本和 Bash 自检无法运行 | 运行 `scripts/bootstrap-dev-env.ps1`，或手工安装 Git for Windows |
| Git Bash 已安装，但 PowerShell 找不到 `bash` | PATH 没暴露 `bash` 命令 | 用完整路径运行 Bash 脚本，或修复 PATH 后重开终端 |
| 缺 Node.js / Python | 多数派生项目可能会用到，但不一定阻塞模板烟测 | 建议补装；若当前项目明确不用，可先记录为待确认 |
| 缺 `gh` | 只影响远端建仓、GitHub 登录和 PR 流程 | 本地烟测可先跳过；远端流程前再安装并执行 `gh auth login` |
| 缺 Claude CLI / Codex CLI | 不影响纯本地烟测和文档阅读 | 真正让 AI CLI 执行任务前，至少安装并登录一种 |
| `collect-env.ps1` 已生成 `docs/env/local-env.md` | 自动采集完成，但项目边界还没确认 | 补齐“人工确认项”，再生成技术方案 |

## 2. 最小安装目标

### 必备

- Git for Windows
- Git Bash
- PowerShell 5.1+ 或 PowerShell 7

### 推荐

- Node.js LTS
- Python 3.11+
- Visual Studio Code

### AI CLI 工具（至少一种）

- Claude CLI
- Codex CLI

详细安装与公司中转配置衔接，见：

- `template-docs/ai-cli-setup.md`

### 条件必需

- GitHub CLI（`gh`）
  仅当你需要远端 GitHub 建仓、`gh pr create` 或某些模板同步场景时必需；本地烟测不要求。

### 可选

- Docker Desktop
- Java
- 其他项目专属运行时、数据库或 SDK

## 3. 每个工具是什么，为什么要装

速览（详见下方分述）：

| 工具 | 类别 | 一句话 |
|---|---|---|
| Git for Windows | 必备 | Windows 上的 Git，新建 / 同步 / 提交都依赖它 |
| Git Bash | 必备 | 跑 `.sh` 脚本（new-project / sync-template / check-template） |
| PowerShell | 必备 | 跑 `.ps1` 脚本（检测 / 采集 / 一键安装） |
| Claude CLI / Codex CLI | AI CLI（至少一种） | 把文档 / Prompt / 任务交给 AI 执行 |
| GitHub CLI（`gh`） | 条件必需 | 远端建仓 / 推送 / PR |
| Node.js + npm | 推荐 | 前端 / JS 工具链常用运行时 |
| Python | 推荐 | AI / 脚本 / 后端小工具常用 |
| Visual Studio Code | 推荐 | 编辑器 |
| Docker Desktop | 可选 | 容器 / 外部服务 |
| Java | 可选 | 仅当依赖工具 / 中间件需要 |

这些是核心依赖的原因：`new-project.sh`、`sync-template.sh`、`check-template.sh` 依赖 Bash（Windows 上用 Git Bash）；Git 用于派生 / 同步 / 提交，`gh` 用于远端建仓 / 推送 / PR；PowerShell 跑 `collect-env.ps1`、检测和一键安装；Node.js、Python 是多数 AI 编程项目常见运行时，`collect-env.ps1` 也检测它们；Docker、Java 非模板必需，但很多派生项目会用到。

### Git for Windows

- 它是什么：Windows 上的 Git 命令行工具，负责版本控制。
- 为什么要装：模板的新建项目、同步模板、提交代码都依赖 Git。
- 不装会怎样：无法运行 `new-project.sh`、无法做版本提交，也无法正常同步模板方法论。

### Git Bash

- 它是什么：Git for Windows 自带的 Bash 终端和常见 Unix 命令环境。
- 为什么要装：模板里有一批 `.sh` 脚本，例如 `scripts/new-project.sh`、`scripts/sync-template.sh`、`scripts/check-template.sh`。
- 不装会怎样：这些 Bash 脚本无法运行。
- 新手容易混淆的点：“Git Bash 已安装”不等于“PowerShell 里能直接敲 `bash`”。有些机器需要用完整路径调用。

### PowerShell

- 它是什么：Windows 自带的命令行和脚本环境。
- 为什么要装 / 为什么需要它：模板里的环境检测、环境采集和部分 Windows 入口脚本都用 PowerShell。
- 不装会怎样：`collect-env.ps1`、`check-prereqs.ps1`、`bootstrap-dev-env.ps1` 这些脚本无法运行。

### Claude CLI

- 它是什么：面向终端工作的 Claude 命令行工具。
- 为什么建议至少准备一种 AI CLI：这套模板的日常使用方式，本来就包含“把文档、Prompt、任务边界交给 AI CLI 工具执行”。
- 为什么可能选它：如果你的个人习惯或团队工作流偏向 Claude CLI，就应该在开工前先装好并登录。
- 安装来源应看哪里：优先看 Claude CLI / Claude Code 的官方安装与登录文档。
- 什么时候可以先不装：只做模板环境烟测、还没开始真正用 AI 编码时，可以先不装；但正式进入 AI 协作开发前，最好至少准备一种 AI CLI。
- 更完整的安装与配置顺序：见 `template-docs/ai-cli-setup.md`

### Codex CLI

- 它是什么：面向终端工作的 Codex 命令行工具。
- 为什么建议至少准备一种 AI CLI：它和 Claude CLI 一样，属于这套模板的实际执行终端之一。
- 为什么可能选它：如果你准备直接在终端里用 Codex 跑任务、读规则、执行 Sprint，就应该提前完成安装和登录。
- 安装来源应看哪里：优先看 Codex / OpenAI 官方安装与登录文档。
- 什么时候可以先不装：和 Claude CLI 一样，纯本地烟测阶段可以暂时不装；但真正开始 AI 协作开发前，建议至少准备一种。
- 更完整的安装与配置顺序：见 `template-docs/ai-cli-setup.md`

### GitHub CLI (`gh`)

- 它是什么：GitHub 官方命令行工具。
- 为什么要装：当你要创建远端 GitHub 仓库、推送、创建 PR，或者走某些模板同步场景时会用到。
- 什么时候可以不装：只做本地烟测、本地起步、暂时不建远端仓库时，可以先不装。

### Node.js

- 它是什么：JavaScript 的常见运行时。
- 为什么推荐装：很多前端、脚本工具、AI 编程项目会依赖它；模板也会在环境采集里检查它。
- 什么时候可能用不到：纯 Python、小型 CLI、或暂时不涉及前端的项目，短期内可能用不到。

### npm

- 它是什么：Node.js 常见的包管理器，通常随 Node.js 一起安装。
- 为什么推荐装：很多 JavaScript / TypeScript 项目安装依赖时会用到。
- 不装会怎样：即使装了 Node.js，也可能没法安装对应的 JS 依赖包。

### Python

- 它是什么：很常见的通用开发语言和运行时。
- 为什么推荐装：很多 AI、脚本、自动化、后端小工具都会依赖 Python。
- 什么时候可能用不到：如果你的项目明确只用 Node.js 或其他技术栈，短期内可以不依赖它。

### Visual Studio Code

- 它是什么：常见的代码编辑器。
- 为什么推荐装：新手最容易快速打开、浏览和修改模板文件；很多 AI 工具也会和它配合使用。
- 不装会怎样：模板本身仍可运行，但新手的阅读和修改体验会差很多。

### Docker Desktop

- 它是什么：Windows 上常见的容器运行环境。
- 为什么列为可选：有些项目需要容器、数据库、外部服务模拟，才会用到它。
- 什么时候可以不装：只做模板烟测、本地文档驱动起步、纯脚本或纯前端项目时，通常可以先不装。

### Java

- 它是什么：Java 运行时 / 开发环境。
- 为什么列为可选：只有当你的派生项目、依赖工具或中间件明确需要 Java 时才需要。
- 什么时候可以不装：模板本身不依赖 Java，本地烟测也不依赖。

## 4. 怎么装：三种路径

### 最简单的建议顺序

1. 先运行 `scripts/check-prereqs.ps1`，确认缺什么。
2. 如果缺必备项，再运行 `scripts/bootstrap-dev-env.ps1` 或按本文手工安装。
3. 安装完成后重开终端，再运行一次 `scripts/check-prereqs.ps1`。
4. 如果要远端建仓或 PR，手工完成 `gh auth login`；只做本地烟测可先跳过。
5. 真正开始 AI 协作开发前，按 `template-docs/ai-cli-setup.md` 至少安装并登录一种 AI CLI。
6. 在派生项目里运行 `scripts/collect-env.ps1` 生成 `docs/env/local-env.md`，并补齐人工确认项。

若当前只是跑本地烟测，`gh auth login` 可以暂时跳过。

### 一键安装入口

先安装核心工具：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1
```

默认会尽量安装：Git for Windows、GitHub CLI、Node.js LTS、Python 3.11、Visual Studio Code。

连可选工具一起装：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1 -WithDocker -WithJava
```

只检测，不安装：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

安装完成后采集本机环境：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

### 新手最常见的三种路径

**路径 A：完全不确定机器状态**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

如果要创建远端仓库，再执行 `gh auth login`。如果只做本地烟测，可直接进入项目流程。

**路径 B：机器上已有大部分开发工具**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

看报告里哪些是缺失项，再决定是否运行安装脚本补齐。

**路径 C：只想做本地烟测**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

必备项通过后即可运行：

```bash
bash scripts/new-project.sh smoke-demo --local --no-remote
```

这条路径可以暂时跳过 `gh auth login`、Docker、Java、Claude CLI / Codex CLI。

## 5. 脚本会做什么

### `check-prereqs.ps1` 会检查什么

检查：`winget` 是否可用、Git / Git Bash、PowerShell、`gh`、Node.js / npm、Python、VS Code、Docker、Java。

它把结果分成：必备缺失、推荐缺失、可选缺失、已安装项、下一步建议。

新手重点看两处：

- `Summary`：判断是否还有必备项缺失。
- `Suggested next steps`：决定是运行安装脚本、跳过 `gh` 继续本地烟测，还是进入项目后运行 `collect-env.ps1`。

### `bootstrap-dev-env.ps1` 会做什么

- 检测 `winget` 是否存在
- 跳过已安装的软件，不重复安装
- 调用 `winget install` 安装缺失软件
- 安装完成后提醒你再跑一次前置检查
- 提醒你手工完成 `gh auth login`、Docker 初始化和 AI 工具登录
- 某个软件安装失败时，明确告诉你失败项和下一步处理建议

它不会做的事：

- 不自动登录 GitHub
- 不自动登录 AI 工具
- 不修改公司代理配置
- 不替你启用 Docker 所需的系统组件
- 不替派生项目安装业务专属依赖

若 `gh` 下载失败且你当前只做本地烟测，可以先跳过；若你要远端建仓或依赖 `gh` 的流程，再回头解决网络 / 代理 / 防火墙问题。

## 6. AI CLI 与公司中转站

本模板本身支持多入口：Codex / AGENTS、Claude Code、Cursor。但它们的安装和登录方式差异较大，也可能经常变化，所以这里建议只在文档中说明“至少准备一种”，不在一键脚本里强装。

建议做法：

1. 先把系统级依赖装好。
2. 再按你实际要用的 AI 工具官方文档完成安装和登录。
3. 最后确认该工具能读取仓库根入口文件。
4. 如果要接公司代理，再看 `template-docs/ai-cli-setup.md` 和内网手册的衔接说明。

更具体一点：

- 如果你主要在终端里工作，建议至少安装 `Claude CLI` 或 `Codex CLI` 其中一种。
- 如果你需要多工具对照、切换工作流，才考虑两者都装。
- 当前模板不自动安装这些 AI CLI，因为它们的登录、组织权限、代理和版本变化比基础开发工具更频繁。

### 非最小工具的处理建议

对于当前模板脚本没有自动安装的工具，建议优先级是：

1. 先给文档说明“这是什么、为什么要装、什么时候要用”。
2. 再给手工安装步骤，或给可复制到 AI CLI 里的安装提示词。
3. 只有当安装步骤长期稳定、通用性高、不会引入额外认证复杂度时，再考虑独立安装脚本。

这也是为什么当前模板先脚本化 `Git / Git Bash / PowerShell / Node.js / Python / gh / VS Code`，但不先脚本化 `Claude CLI`、`Codex CLI`。

### 公司中转站 / 模型代理入口

如果公司要求通过内部中转站访问模型，先看这份内部手册：

- `http://192.168.30.51:50088/994_wiki/?term=lemesh_ai_model`

基于现有说明，这份内网手册的定位应理解为：

- 用于指导乐式中转站（LeMesh）与相关大模型的使用。
- 覆盖 LeMesh 注册、API 密钥创建、分组选择、CC-Switch 导入 / 手动配置，以及公司中转站 / 模型代理接入。
- 不应被理解为 `Claude CLI` 或 `Codex CLI` 本身的官方安装指南。

因此推荐顺序是：

1. 先按各自官方文档安装并登录 `Claude CLI` 或 `Codex CLI`。
2. 再按这份内网手册完成 LeMesh / CC-Switch / 中转站代理配置。
3. 如果内网手册与工具官方安装文档有冲突：
   CLI 安装与登录以官方文档为准；
   公司中转站、代理地址、密钥与模型接入以内网手册为准。

模板这里只做入口提醒，不复制其中可能频繁变化的地址、鉴权或代理细节。

## 7. 常见限制与排障

- `winget` 不可用时，一键安装脚本会失败；这时需要先安装 App Installer 或改为手工安装。
- Docker Desktop 往往需要管理员权限，部分机器还需要开启虚拟化或额外系统组件。
- 公司网络、代理、应用白名单可能会拦截 `winget`、`gh auth login` 或 AI 工具登录。
- 某些安装完成后需要重新打开终端，PATH 才会更新。
- 某些 Git 操作需要本机已有 `git config user.name` / `git config user.email`；当前模板的本地烟测初始化脚本会在缺失时使用临时本地身份完成首提交，但正式开发前仍建议你配置自己的 Git 身份。

### 关于 Git Bash / PowerShell 入口

- 当前模板在 Windows 上同时使用 PowerShell 和 Git Bash。
- “Git Bash 已安装”不等于“`bash` 命令已加入 PowerShell PATH”。
- 若 PowerShell 里直接执行 `bash ...` 提示找不到命令，但 `check-prereqs.ps1` 已显示 Git Bash 已安装，可直接用完整路径运行，例如：

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/new-project.sh smoke-demo --local --no-remote
```

- `scripts/check-template.ps1` 如果无法从 PowerShell 拉起 Git Bash，会退回到原生 PowerShell 结构检查。
- `scripts/sync-template.ps1` 与 `scripts/check-derived-sync.ps1` 优先调用 Git Bash；如果它们报 `Win32 error 5`、`E_ACCESSDENIED` 或类似 MSYS 启动错误，会明确标注并进入 PowerShell fallback。fallback 也失败时，才优先判断为本机 Git Bash / MSYS、权限策略或网络环境问题。
- 这类问题通常不意味着“新手少做了模板规定的某个初始化步骤”；fallback 已覆盖同步 / 边界检查的最小能力，若仍失败，先检查本机 Git for Windows、终端宿主、权限策略或安全软件限制。

## 8. 跨平台边界

- 当前正式提供并验证的是 Windows 路径：`check-prereqs.ps1`、`bootstrap-dev-env.ps1`、`collect-env.ps1`。
- Linux / macOS 目前只有文档层面的软件清单参考，尚未提供仓库内的正式安装脚本。
- 这不是遗漏，而是刻意保持“声称据实”：在未验证前，不把 Linux / macOS 安装脚本写成模板已支持能力。
- 后续若要补跨平台安装脚本，建议单独新增并单独验证，例如 `scripts/bootstrap-dev-env.sh`，再补入同步清单、自检脚本和环境手册。
- 在那之前，Linux / macOS 用户可以参考本手册的软件清单手工安装，但不应把这视为模板已经正式支持的一键能力。

## 9. 安装后验收

至少确认以下命令能运行：

```powershell
git --version
gh --version
node --version
npm --version
python --version
powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1
```

如果要使用模板完整流程，再确认：

```powershell
bash --version
powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
```

## 10. 去哪看什么（导航）

| 想做的事 | 看哪 |
|---|---|
| 第一次整体上手 | `template-docs/beginner-guide.md` + `README.md` |
| 知道为什么模板这样分层 | `template-docs/template-methodology.md` |
| 装 AI CLI | `template-docs/ai-cli-setup.md` |
| 具体场景怎么操作 | `template-docs/scenario-guides.md`（23 场景） |
| 找命令速查 | `SOP.md`、`ai/commands/README.md` |
| 采集本机资源 | `docs/env/README.md`、`scripts/collect-env.ps1` |
