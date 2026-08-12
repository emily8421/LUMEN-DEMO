# TEMPLATE-UPGRADE: PowerShell Start-Process Path Normalization and Smoke Preflight

> 来源：LUMEN（emily8421/LUMEN-DEMO）派生项目回流

## 1. 背景

Windows PowerShell 进程环境中可能同时存在 `Path` 与 `PATH` 两个变量名。部分 .NET / PowerShell 进程启动路径在构造环境字典时按大小写不敏感处理变量名，导致 `Start-Process` 抛出类似错误：

```text
Item has already been added. Key in dictionary: 'Path' Key being added: 'PATH'
```

这类问题不是某个业务项目独有；模板同步清单中已有多个 PowerShell 脚本使用 `Start-Process` 启动 Git Bash、git 或本地辅助进程，例如 `scripts/check-template.ps1`、`scripts/sync-template.ps1`、`scripts/check-derived-sync.ps1` 等。派生项目自定义 demo 启动脚本也容易沿用同类写法。

同一轮 smoke 复盘还暴露了几类可去项目化的脚手架问题：后台 dev server 的 stdout / stderr 需要写入不同日志文件；旧版 Windows PowerShell 不支持 `Start-Process -Environment`；部分 AI 执行器 / 提权通道可能丢失 stdout，因此 smoke 结果不应只依赖控制台输出；浏览器 smoke 前应先确认后端 `/openapi.json` 已暴露本次目标 API，避免端口上残留旧后端时继续进入点击流。

2026-08-03 在 LUMEN 派生项目中进一步收敛的根因：普通 `Start-Process` 启动的 `-Detached` 后端仍可能被 AI 执行器生命周期回收；前端若通过 `npm run dev -- --port <port>` 调用，而 `package.json` 的 `dev` 已硬编码默认端口，会形成双端口参数，增加排障噪声。项目侧已改为 WMI/CIM launcher + 运行态 state 文件 + 直接 `npm exec vite -- --port <port>`。

## 2. 建议修改

1. 在模板 PowerShell 脚本中沉淀一个通用 helper，例如 `Normalize-ProcessPathEnvironment`：
   - 读取当前 process 环境变量；
   - 若发现 `Path` / `PATH` 等大小写重复项，保留一个规范化 `Path`；
   - 在调用 `Start-Process` 前执行一次。
2. 在使用 `Start-Process` 启动后台 helper / dev server / 检查进程时，默认补充 `-WindowStyle Hidden`，除非脚本明确需要打开可交互窗口。
3. 模板的后台进程 helper 应默认把 stdout / stderr 分开写入两个日志文件，避免 `Start-Process` 因两个重定向指向同一路径而失败。
4. 若模板脚本需要给子进程注入环境变量，兼容 Windows PowerShell 5.1：优先采用当前 process 临时 set / restore，或在使用 `Start-Process -Environment` 前做版本判断。
5. demo runbook 模板应区分两类后台启动：
   - 交互终端：普通 `Start-Process` 可接受；
   - AI / 非交互执行器：必须使用真正脱离父进程生命周期的方式（例如 WMI/CIM、独立终端或项目明确支持的 launcher），并写 runtime state 文件记录端口、PID / port owner、URL 与日志。
6. demo / browser smoke 模板增加运行态 preflight：
   - 后端：读取 `/openapi.json`，校验本次 smoke 依赖的 `METHOD path` 已存在；
   - 前端：检查页面 identity marker，避免端口被其他本地应用占用；
   - 失败时停止 browser smoke，并提示清理旧进程 / 重新启动服务。
7. smoke harness 输出应支持结果文件（例如 JSON），提权或后台执行时以结果文件作为可审计证据，不只依赖 stdout。
8. 在 `template-docs/demo-runbook-template.md` 或 `ai/commands/show-demo.md` 中补 Windows / browser smoke 注意事项：
   - 项目自定义 demo 脚本若要后台启动本地服务，应处理 `Path` / `PATH` 重复；
   - AI 执行器可能在命令结束后回收子进程，必要时应提示用户用独立终端运行，或由项目脚本提供明确的 runtime 状态文件与 stop 命令。
   - 浏览器自动化优先级建议写清：项目已有 Playwright 时用 Playwright；未安装或不允许新增依赖时可用 Edge / Chrome CDP；自动化通道不可用时转人工 smoke，并在 `docs/09-verification.md` 记录未自动化的残留风险。

## 3. 版本影响

- Release impact: patch
- 影响范围：模板 PowerShell 脚本兼容性、demo runbook 指南、browser smoke preflight 模板。
- 不改变模板方法论语义，不影响非 Windows 环境。

## 4. 验证建议

- 在含重复 `Path` / `PATH` 的 PowerShell process 中运行模板脚本，确认 `Start-Process` 不再因环境变量重复失败。
- 回归 `scripts/check-template.ps1`、`scripts/sync-template.ps1`、`scripts/check-derived-sync.ps1` 的现有成功路径。
- 用一个最小 demo 服务验证 stdout / stderr 分离日志、环境变量注入兼容 Windows PowerShell 5.1、结果 JSON 文件可写。
- 派生项目 demo SOP 可用本地 HTTP 200 / identity marker / OpenAPI route preflight 检查作为验证证据。

## 5. 风险与边界

- helper 只应规范化当前 process 环境，不修改用户级或系统级环境变量。
- 不应静默删除真实路径内容；保留值建议优先取 PowerShell 可见的 `Path`，为空时回退 `PATH`。
- 后台进程保活问题与 `Path` / `PATH` 重复是两个相关但独立的问题；模板可给建议，具体保活方式仍由项目脚本按运行环境决定。
- OpenAPI route preflight 只能证明“运行态包含目标 API”，不替代 API 功能 smoke 或浏览器交互 smoke。
