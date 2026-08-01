# TEMPLATE-UPGRADE: PowerShell Start-Process Path Normalization

> 来源：LUMEN（emily8421/LUMEN-DEMO）派生项目回流

## 1. 背景

Windows PowerShell 进程环境中可能同时存在 `Path` 与 `PATH` 两个变量名。部分 .NET / PowerShell 进程启动路径在构造环境字典时按大小写不敏感处理变量名，导致 `Start-Process` 抛出类似错误：

```text
Item has already been added. Key in dictionary: 'Path' Key being added: 'PATH'
```

这类问题不是某个业务项目独有；模板同步清单中已有多个 PowerShell 脚本使用 `Start-Process` 启动 Git Bash、git 或本地辅助进程，例如 `scripts/check-template.ps1`、`scripts/sync-template.ps1`、`scripts/check-derived-sync.ps1` 等。派生项目自定义 demo 启动脚本也容易沿用同类写法。

## 2. 建议修改

1. 在模板 PowerShell 脚本中沉淀一个通用 helper，例如 `Normalize-ProcessPathEnvironment`：
   - 读取当前 process 环境变量；
   - 若发现 `Path` / `PATH` 等大小写重复项，保留一个规范化 `Path`；
   - 在调用 `Start-Process` 前执行一次。
2. 在使用 `Start-Process` 启动后台 helper / dev server / 检查进程时，默认补充 `-WindowStyle Hidden`，除非脚本明确需要打开可交互窗口。
3. 在 `template-docs/demo-runbook-template.md` 或 `ai/commands/show-demo.md` 中补一句 Windows 注意事项：
   - 项目自定义 demo 脚本若要后台启动本地服务，应处理 `Path` / `PATH` 重复；
   - AI 执行器可能在命令结束后回收子进程，必要时应提示用户用独立终端运行，或由项目脚本提供明确的 runtime 状态文件与 stop 命令。

## 3. 版本影响

- Release impact: patch
- 影响范围：模板 PowerShell 脚本兼容性与 demo runbook 指南。
- 不改变模板方法论语义，不影响非 Windows 环境。

## 4. 验证建议

- 在含重复 `Path` / `PATH` 的 PowerShell process 中运行模板脚本，确认 `Start-Process` 不再因环境变量重复失败。
- 回归 `scripts/check-template.ps1`、`scripts/sync-template.ps1`、`scripts/check-derived-sync.ps1` 的现有成功路径。
- 派生项目 demo SOP 可用本地 HTTP 200 / identity marker 检查作为验证证据。

## 5. 风险与边界

- helper 只应规范化当前 process 环境，不修改用户级或系统级环境变量。
- 不应静默删除真实路径内容；保留值建议优先取 PowerShell 可见的 `Path`，为空时回退 `PATH`。
- 后台进程保活问题与 `Path` / `PATH` 重复是两个相关但独立的问题；模板可给建议，具体保活方式仍由项目脚本按运行环境决定。
