<#
check-runtime.ps1 - Node 运行时健康诊断（v1.56.0 检测 / 门禁层）。

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-runtime.ps1

Notes:
  Manager 中立、只读。不修改 PATH、不安装 / 切换版本、不写持久配置。
  退出码恒为 0（纯诊断）；是否把"漂移 / 异常解析"当作失败，由调用方按输出
  语义 opt-in 决定（见 template-docs/env-setup.md §6「运行时健康检测」）。

  定位：v1.55.0 声明层 + v1.55.1 check-prereqs 软检测之上的深度诊断层。
  check-prereqs 只比对"声明 vs 实际"版本号；本脚本进一步定位 node 的解析来源
  （Volta shim / Volta image 直连 / nvm symlink / fnm / 系统安装 / 未知）、
  manager 是否在管、声明 vs 实际主版本是否漂移、混合 manager 团队双声明文件
  （package.json#volta 与 .node-version）是否一致，以及路径污染来自持久 PATH
  还是仅当前会话注入——后者区分"重启终端就好"与"需改系统环境变量"。
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-VoltaNodeVersion {
  # 读 package.json volta.node（Volta 权威声明）。Volta 不读 .nvmrc / .node-version。
  if (Test-Path "package.json") {
    try {
      $json = Get-Content "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($json.volta -and $json.volta.node) {
        return ([string]$json.volta.node)
      }
    } catch { }
  }
  return $null
}

function Get-NodeVersionFile {
  # 读 .node-version（fnm/nvm/asdf 识别；Volta 不认）。
  if (Test-Path ".node-version") {
    $line = (Get-Content ".node-version" -TotalCount 1 -Encoding UTF8).Trim()
    if ($line) { return $line }
  }
  return $null
}

function Get-Major {
  param([string]$Version)
  if (-not $Version) { return $null }
  $m = [regex]::Match($Version, '\d+')
  if ($m.Success) { return [int]$m.Value }
  return $null
}

function Resolve-NodeSource {
  # 判定 node 解析到的 .exe 来源类型。
  param([string]$Path)
  if (-not $Path) { return "not installed" }
  $p = $Path -replace '/', '\'
  if ($p -match '\\Volta\\bin\\') { return "Volta shim" }
  if ($p -match '\\Volta\\tools\\image\\node\\') { return "Volta image (bypasses shim)" }
  $nvmSymlink = [Environment]::GetEnvironmentVariable("NVM_SYMLINK")
  if ($nvmSymlink) {
    $link = ($nvmSymlink -replace '/', '\').TrimEnd('\')
    if ($p -like "$link\*") { return "nvm symlink (NVM_SYMLINK)" }
  }
  if ($p -match '\\nvm\\v[0-9]') { return "nvm version dir" }
  if ($p -match '\\fnm_multishells\\') { return "fnm shim" }
  if ($p -match '\\Program Files\\nodejs\\') { return "system install" }
  return "unknown"
}

function Detect-Managers {
  $found = New-Object 'System.Collections.Generic.List[string]'
  if (Test-CommandExists "volta") { $found.Add("Volta") }
  $nvmHome = [Environment]::GetEnvironmentVariable("NVM_HOME")
  if ((Test-CommandExists "nvm") -or $nvmHome) { $found.Add("nvm-windows") }
  if (Test-CommandExists "fnm") { $found.Add("fnm") }
  if ($found.Count -eq 0) { $found.Add("none") }
  return ,$found
}

function Resolve-PathScope {
  # 判定 node 所在目录来自持久 PATH（User / Machine）还是仅当前会话注入。
  param([string]$NodeDir)
  if (-not $NodeDir) { return "n/a" }
  $dir = ($NodeDir -replace '/', '\').TrimEnd('\')
  if (-not $dir) { return "n/a" }

  $inPersistent = $false
  foreach ($scope in @("User", "Machine")) {
    $scopePath = [Environment]::GetEnvironmentVariable("PATH", $scope)
    if (-not $scopePath) { continue }
    foreach ($entry in ($scopePath -split ';')) {
      $e = ($entry -replace '/', '\').TrimEnd('\')
      if ($e -and $e -ieq $dir) { $inPersistent = $true; break }
    }
    if ($inPersistent) { break }
  }
  if ($inPersistent) { return "persistent (User/Machine PATH)" }

  $inSession = $false
  foreach ($entry in ($env:PATH -split ';')) {
    $e = ($entry -replace '/', '\').TrimEnd('\')
    if ($e -and $e -ieq $dir) { $inSession = $true; break }
  }
  if ($inSession) { return "session-only (not in persistent PATH)" }
  return "resolved but dir not listed in current PATH"
}

# --- 采集事实 ---

$nodeInstalled = Test-CommandExists "node"
$nodeCmd = if ($nodeInstalled) { Get-Command "node" } else { $null }
$nodeSource = if ($nodeCmd) { $nodeCmd.Source } else { $null }
$nodeDir = if ($nodeSource) { Split-Path $nodeSource -Parent } else { $null }

$actualVersion = $null
if ($nodeInstalled) {
  try {
    $actualVersion = ((& node --version 2>$null) | Select-Object -First 1).ToString().Trim()
  } catch { $actualVersion = $null }
}

# 声明：volta 与 .node-version 分别读，断言混合 manager 团队双文件一致性。
$voltaDeclared = Get-VoltaNodeVersion
$fileDeclared = Get-NodeVersionFile
$declaredVersion = if ($voltaDeclared) { $voltaDeclared } elseif ($fileDeclared) { $fileDeclared } else { $null }
if ($voltaDeclared -and $fileDeclared) {
  if ($voltaDeclared -eq $fileDeclared) {
    $declConsistency = "consistent (volta == .node-version)"
  } else {
    $declConsistency = "DRIFT (volta=$voltaDeclared, .node-version=$fileDeclared)"
  }
} elseif ($voltaDeclared -or $fileDeclared) {
  $declConsistency = "single source"
} else {
  $declConsistency = "no declaration"
}

$managers = Detect-Managers
$source = Resolve-NodeSource -Path $nodeSource
$scope = Resolve-PathScope -NodeDir $nodeDir

$actualMajor = Get-Major $actualVersion
$declaredMajor = Get-Major $declaredVersion
$majorDrift = if ($declaredVersion -and $actualVersion -and $actualMajor -and $declaredMajor -and ($actualMajor -ne $declaredMajor)) { "yes" } elseif ($declaredVersion -and $actualVersion) { "no" } else { "n/a (no declaration or no node)" }

# --- 可操作提示 ---

$hints = New-Object 'System.Collections.Generic.List[string]'

if (-not $nodeInstalled) {
  $hints.Add("node 未在 PATH；锁版本项目应先装版本管理器（推荐 Volta）再 pin 版本。")
}
if ($declConsistency -like "DRIFT*") {
  $hints.Add("声明文件不一致：package.json#volta=$voltaDeclared 与 .node-version=$fileDeclared 不同；混合 manager 团队必须保持两者同版本，否则不同 manager 会切到不同 node。")
}
if ($source -eq "Volta image (bypasses shim)") {
  $hints.Add("node 解析到 Volta image 目录而非 shim：PATH 中可能有 node 路径排在 Volta\bin 之前，绕过了 Volta 调度。检查会话 / 用户 PATH 顺序，移除或后置直连 image 的条目。")
}
if ($source -eq "nvm version dir" -or $source -eq "nvm symlink (NVM_SYMLINK)") {
  $hints.Add("node 走 nvm；若项目用 Volta 声明（package.json volta），nvm 与 Volta 混用会产生 PATH 残留，建议统一一种 manager。")
}
if ($source -eq "system install") {
  $hints.Add("node 走系统安装、未检测到版本管理器；锁版本项目建议改用 Volta 等管理器以便按声明切换。")
}
if ($source -eq "unknown") {
  $hints.Add("node 解析路径未能归类（$nodeSource）；请人工核对 PATH 与安装方式。")
}
if ($majorDrift -eq "yes") {
  $hints.Add("主版本漂移：声明 Node $declaredVersion，实际 $actualVersion。按声明对齐——Volta 项目确认 package.json volta.node、其他确认 .node-version，并让 manager 接管切换。")
}
if ($scope -eq "session-only (not in persistent PATH)") {
  $hints.Add("node 解析目录仅在当前会话 PATH，未写入持久 PATH：重启终端可能消失。确认是临时注入（有意）还是需要持久化。")
}
if (($managers -join ',') -eq "none" -and $nodeInstalled) {
  $hints.Add("未检测到任何版本管理器，但 node 可用；版本切换只能靠手动重装，建议引入 Volta。")
}
if ($hints.Count -eq 0) {
  if ($nodeInstalled) {
    $hints.Add("未发现明显异常：node 走 $source，manager 在管" + $(if ($declaredVersion) { "，声明与实际主版本一致。" } else { "；无声明文件（未启用版本锁定），保持中立。" }))
  }
}

# --- 输出（退出码恒 0） ---

Write-Host "==> Node 运行时健康诊断"
Write-Host ""
$rows = @(
  [pscustomobject]@{ Field = "manager";                  Value = ($managers -join ' + ') }
  [pscustomobject]@{ Field = "node resolution";          Value = $source }
  [pscustomobject]@{ Field = "declared version";         Value = ($(if ($declaredVersion) { $declaredVersion } else { "(none — version locking not enabled)" })) }
  [pscustomobject]@{ Field = "declaration consistency";  Value = $declConsistency }
  [pscustomobject]@{ Field = "actual version";           Value = ($(if ($actualVersion) { $actualVersion } else { "(node not available)" })) }
  [pscustomobject]@{ Field = "major drift";              Value = $majorDrift }
  [pscustomobject]@{ Field = "PATH scope";               Value = $scope }
  [pscustomobject]@{ Field = "node path";                Value = ($(if ($nodeSource) { $nodeSource } else { "(n/a)" })) }
)
$rows | Format-Table Field, Value -AutoSize | Out-Host

Write-Host "==> Hints"
foreach ($h in $hints) { Write-Host "- $h" }
Write-Host ""
Write-Host "==> Exit code: 0 (diagnostic only; gating is opt-in by caller, see env-setup §6)"

exit 0
