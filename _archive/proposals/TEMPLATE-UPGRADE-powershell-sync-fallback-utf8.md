# TEMPLATE-UPGRADE: PowerShell 同步脚本 fallback 的 UTF-8 与 Git Bash 兼容增强

> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

## 1. 背景与问题

派生项目在 Windows 环境执行模板同步时，`sync-template.ps1` 和 `check-derived-sync.ps1` 的设计目标是优先调用 Git Bash，若 Git Bash 无法启动则进入 PowerShell fallback。该思路正确，但在实际同步过程中暴露出几个可通用的问题：

1. Git Bash 可能因本机权限、MSYS 或终端环境问题无法从 PowerShell 启动。
2. 进入 PowerShell fallback 后，脚本仍可能因为 UTF-8 文本解析不稳定而失败。
3. `git show FETCH_HEAD:template-sync.json` 的输出经 Windows PowerShell 5.1 管道进入 `ConvertFrom-Json` 时，可能出现中文注释 / 描述被错误解码，导致 JSON 解析失败。
4. `.ps1` 文件本身若以 UTF-8 无 BOM 保存，在 Windows PowerShell 5.1 中作为文件执行时可能被按系统 ANSI 代码页解析，中文正则或字符串出现乱码后触发语法错误。
5. fallback 失败后，AI 或用户只能手动复刻同步逻辑，增加误操作风险。

这些问题并非某个业务项目专属；凡是在 Windows + PowerShell 5.1 + Git for Windows 环境下同步派生项目，都可能遇到类似失败链路。

## 2. 目标

增强模板同步脚本在 Windows 环境下的稳定性，使其满足：

1. Git Bash 无法启动时，PowerShell fallback 能独立完成 dry-run、commit 和 derived boundary check。
2. fallback 读取 Git blob、JSON、Markdown 和脚本文本时显式使用 UTF-8，不依赖当前控制台代码页或 PowerShell 版本默认编码。
3. `sync-template.ps1`、`check-derived-sync.ps1` 在 Windows PowerShell 5.1 和 PowerShell 7+ 下均可执行。
4. 失败时输出明确的诊断建议和可复制命令，而不是停在乱码或空值异常。
5. 派生同步仍保持边界安全：只同步 `template-sync.json` 清单和 `ai/doc-standards/` 镜像，不触碰项目事实文档和业务代码。

## 3. 复现场景（去项目化）

典型失败链路如下：

1. 在派生项目根目录运行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
   ```

2. Git Bash 从 PowerShell 启动失败，脚本进入 PowerShell fallback。
3. fallback 执行 `git fetch` 成功。
4. fallback 读取 `FETCH_HEAD:template-sync.json` 并执行 `ConvertFrom-Json`，但 Windows PowerShell 5.1 下 Git 输出被错误解码，JSON 中的中文描述变成乱码，解析失败。
5. 若尝试执行派生检查：

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 HEAD
   ```

   `.ps1` 文件中的中文字符串 / 正则可能被错误解析，出现字符串未终止或语法错误。
6. 同一脚本若改为先 `Get-Content -Raw -Encoding UTF8` 再内存加载，或用 Python 读取 Git blob bytes 后解码 UTF-8，逻辑可继续执行。

## 4. 拟修改范围

建议优先修改以下模板文件：

| 文件 | 建议 |
|---|---|
| `scripts/sync-template.ps1` | 所有从 Git blob 读取 JSON / 文本的逻辑改为按 bytes 读取并显式 UTF-8 解码；避免依赖 PowerShell 管道字符串默认编码 |
| `scripts/check-derived-sync.ps1` | 同步调整 Git 文本读取逻辑；避免中文正则成为 Windows PowerShell 5.1 的解析风险 |
| `scripts/check-prereqs.ps1` | 如已有 PowerShell 版本检测，可补充 Windows PowerShell 5.1 UTF-8 风险提示 |
| `template-docs/env-setup.md` | 增加 Git Bash 无法启动、PowerShell 5.1 UTF-8 解析异常时的处理建议 |
| `git-guide.md` §5 | 在 Windows 说明中区分 Git Bash 启动失败、PowerShell fallback 失败和编码问题 |

## 5. 实现建议

### 5.1 Git blob 读取使用 bytes + UTF-8

PowerShell 5.1 中应避免用如下方式直接把 `git show` 输出作为 JSON 字符串：

```powershell
$jsonText = (git show FETCH_HEAD:template-sync.json) -join "`n"
$json = $jsonText | ConvertFrom-Json
```

建议封装一个 UTF-8 读取函数：

```powershell
function Get-GitBlobUtf8 {
  param(
    [string]$Ref,
    [string]$Path
  )

  $tmpFile = [System.IO.Path]::GetTempFileName()
  try {
    & git show ("{0}:{1}" -f $Ref, $Path) *> $tmpFile
    if ($LASTEXITCODE -ne 0) {
      throw "git show $Ref:$Path failed with exit code $LASTEXITCODE"
    }
    $bytes = [System.IO.File]::ReadAllBytes($tmpFile)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
  }
  finally {
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
  }
}
```

也可以用 `git cat-file blob` 写入临时文件，再用 `[System.Text.Encoding]::UTF8` 解码。关键点是不要让 Windows PowerShell 先按 ANSI 代码页把输出转成字符串。

### 5.2 `.ps1` 文件编码策略

可选方案：

1. 将模板内需要兼容 Windows PowerShell 5.1 的 `.ps1` 入口保存为 UTF-8 with BOM。
2. 或将 `.ps1` 中用于逻辑判断的中文正则 / 中文字符串改为 ASCII-only，不让脚本解析依赖中文源码。
3. 或在 `env-setup` / `git-guide` 中明确建议 Windows 用户优先使用 PowerShell 7+ 运行同步脚本。

推荐组合：脚本逻辑尽量 ASCII-only + 显式 UTF-8 读取数据文件；说明文档再提示 PowerShell 7+ 是更稳路径。

### 5.3 fallback 失败诊断

当 fallback 捕获到 `ConvertFrom-Json`、PowerShell parser error、null-valued expression 时，建议输出：

- 当前 PowerShell 版本：`$PSVersionTable.PSVersion`
- 当前控制台输出编码：`[Console]::OutputEncoding.WebName`
- 当前系统 ANSI 代码页（可选）
- Git Bash 探测结果
- 建议重试命令：PowerShell 7+、或显式设置 `GIT_BASH`、或运行 native fallback self-test

## 6. 命令 / Prompt 影响

建议补充以下文档说明：

| 文件 | 建议补充 |
|---|---|
| `ai/commands/sync-methodology.md` | 若 Git Bash 和 fallback 均失败，先收集 PowerShell 版本、编码、Git Bash 错误，再停止，不建议手动逐文件复制 |
| `ai/prompts/maintainers/12-sync-template.md` | 增加 fallback 失败时的安全恢复流程：bootstrap 脚本、dry-run 清单对比、边界检查、运行记录 |
| `template-docs/derived-sync-report-template.md` | “遇到的问题”中增加 PowerShell 版本 / 编码 / Git Bash 探测字段 |

## 7. 验证方式

建议在模板仓库增加或手动执行以下验证：

1. **Windows PowerShell 5.1**：在含中文 `template-sync.json` 描述的模板仓库中运行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
   powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 HEAD
   ```

2. **PowerShell 7+**：运行相同命令，确认无行为差异。
3. **Git Bash 不可用模拟**：设置无效 `GIT_BASH` 或临时让 Git Bash 探测失败，确认 fallback 可完成 dry-run 和 check。
4. **中文 JSON / Markdown**：确认含中文字段的 `template-sync.json`、README、规则文件不会被乱码破坏。
5. **边界检查**：同步 commit 中只允许 `template-sync.json` 清单文件和 `ai/doc-standards/*` 规范镜像。

## 8. 版本影响与兼容性

- 版本影响：建议作为模板 patch / minor 增强，不改变同步清单语义。
- 兼容性：对 macOS / Linux Bash 路径无影响；只增强 Windows PowerShell fallback。
- 风险：如果选择 UTF-8 with BOM，会改变 `.ps1` 文件字节内容；应确认 Git、PowerShell 7+、Windows PowerShell 5.1 都能执行。
- 迁移：派生项目下行同步后即可获得增强脚本；无需业务项目手动迁移。

## 9. 验收标准

模板落地后应满足：

1. Git Bash 无法从 PowerShell 启动时，`sync-template.ps1 --dry-run` 能稳定进入 fallback 并解析 `template-sync.json`。
2. Windows PowerShell 5.1 下含中文的模板文件不会导致 JSON 解析错误或 `.ps1` 语法错误。
3. `check-derived-sync.ps1 HEAD` 能在 Windows PowerShell 5.1 下直接执行，不需要 AI 手动内存加载脚本。
4. fallback 失败时输出可诊断信息，而不是乱码、空值调用或字符串未终止错误。
5. 同步边界检查仍能阻止项目专属文件、业务代码或 `docs/00-09` 项目事实被误纳入模板同步提交。

