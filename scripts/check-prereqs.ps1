<#
check-prereqs.ps1 - Check baseline tools for ai-project-template on Windows.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1

Notes:
  This script only inspects local tools. It does not install software or
  modify system settings.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-CommandVersion {
  param(
    [string]$Command,
    [string[]]$Arguments = @("--version")
  )

  if (-not (Test-CommandExists $Command)) {
    return "Not installed"
  }

  try {
    $output = & $Command @Arguments 2>&1 | Select-Object -First 1
    if ($output) {
      return ($output.ToString()).Trim()
    }
    return "Installed (version not detected)"
  } catch {
    return "Installed (failed to read version)"
  }
}

function Get-DeclaredNodeVersion {
  # Read the project's declared Node version from the v1.55.0 declaration files.
  # Priority: package.json "volta".node (Volta authoritative) -> .node-version.
  # .nvmrc is intentionally NOT read: Volta ignores it; this template standardizes
  # on .node-version + package.json#volta (see template-docs/env-setup.md §6).
  # Returns the version string (e.g. "16.13.0"), or $null when no declaration exists.
  if (Test-Path "package.json") {
    try {
      $json = Get-Content "package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($json.volta -and $json.volta.node) {
        return ([string]$json.volta.node)
      }
    } catch { }
  }
  if (Test-Path ".node-version") {
    $line = (Get-Content ".node-version" -TotalCount 1 -Encoding UTF8).Trim()
    if ($line) { return $line }
  }
  return $null
}

function Get-NodeResolutionHint {
  # v1.56.0 阶段 2：node 解析路径健康提示（与 check-runtime.ps1 深度诊断同源，
  # 此处只做轻量判定并在 prereqs Details 追加 warning；深度诊断用 check-runtime.ps1）。
  # 返回提示字符串（已含 "warning:" 前缀），健康时返回空串。
  param([string]$Path)
  if (-not $Path) { return "" }
  $p = $Path -replace '/', '\'
  if ($p -match '\\Volta\\bin\\') { return "" }  # Volta shim，健康
  if ($p -match '\\Volta\\tools\\image\\node\\') {
    return "warning: node resolves to Volta image dir, bypassing shim; a PATH entry may sit before Volta\bin — run scripts/check-runtime.ps1"
  }
  $hasManager = (Test-CommandExists "volta") `
    -or ($null -ne [Environment]::GetEnvironmentVariable("NVM_HOME")) `
    -or (Test-CommandExists "fnm")
  if (-not $hasManager) {
    return "warning: node resolves to `"$Path`" with no version manager detected; pinning recommended — run scripts/check-runtime.ps1"
  }
  return ""
}

function Find-GitBash {
  $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  $candidates = @($env:GIT_BASH)

  if ($env:ProgramFiles) {
    $candidates += Join-Path $env:ProgramFiles "Git\bin\bash.exe"
  }

  if ($programFilesX86) {
    $candidates += Join-Path $programFilesX86 "Git\bin\bash.exe"
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  $bash = Get-Command bash -ErrorAction SilentlyContinue
  if ($bash) {
    return $bash.Source
  }

  return $null
}

function Test-BashCallable {
  if (-not (Test-CommandExists "bash")) {
    return $false
  }

  try {
    $null = & bash -lc "exit 0" 2>$null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$List,
    [string]$Name,
    [string]$Level,
    [bool]$Installed,
    [string]$Details
  )

  $List.Add([pscustomobject]@{
      Name      = $Name
      Level     = $Level
      Installed = $Installed
      Details   = $Details
    }) | Out-Null
}

$results = New-Object 'System.Collections.Generic.List[object]'

$wingetInstalled = Test-CommandExists "winget"
$gitInstalled = Test-CommandExists "git"
$gitBashPath = Find-GitBash
$bashCommandInstalled = Test-CommandExists "bash"
$bashCommandCallable = Test-BashCallable
$ghInstalled = Test-CommandExists "gh"
$nodeInstalled = Test-CommandExists "node"
$npmInstalled = Test-CommandExists "npm"
$pythonInstalled = Test-CommandExists "python"
$codeInstalled = Test-CommandExists "code"
$dockerInstalled = Test-CommandExists "docker"
$javaInstalled = Test-CommandExists "java"
$powerShellEdition = if ($PSVersionTable.PSEdition) { $PSVersionTable.PSEdition } else { "Desktop" }
$powerShellDetails = $PSVersionTable.PSVersion.ToString()
if ($powerShellEdition -eq "Desktop" -and $PSVersionTable.PSVersion.Major -le 5) {
  $powerShellDetails += "; Windows PowerShell 5.1 may use the system code page for native command text, but sync fallback scripts decode Git output as UTF-8"
}

Add-Result $results "winget" "Required" $wingetInstalled $(if ($wingetInstalled) { Get-CommandVersion "winget" } else { "Not installed or unavailable; the bootstrap script depends on it" })
Add-Result $results "Git" "Required" $gitInstalled (Get-CommandVersion "git")
Add-Result $results "Git Bash" "Required" ($null -ne $gitBashPath) $(if ($gitBashPath) { $gitBashPath } else { "bash.exe not found; template Bash scripts will not run" })
Add-Result $results "bash command in PATH" "Conditional" ($bashCommandInstalled -and $bashCommandCallable) $(if ($bashCommandInstalled -and $bashCommandCallable) { (Get-Command bash).Source } elseif ($bashCommandInstalled) { "bash exists but cannot be started from PowerShell; use Git Bash full path" } else { "Git Bash is installed, but 'bash' is not directly callable from PowerShell PATH" })
Add-Result $results "PowerShell" "Required" $true $powerShellDetails
Add-Result $results "GitHub CLI (gh)" "Conditional" $ghInstalled $(if ($ghInstalled) { Get-CommandVersion "gh" } else { "Required for remote repo creation and some sync flows; not required for local smoke tests" })
$nodeVersionRaw = Get-CommandVersion "node"
$nodeDetails = $nodeVersionRaw
if ($nodeInstalled -and ($nodeVersionRaw -match '^v?\d+\.\d+')) {
  $declaredNode = Get-DeclaredNodeVersion
  if ($declaredNode) {
    $actualMajor = ([regex]::Match($nodeVersionRaw, '\d+')).Value
    $declaredMajor = ([regex]::Match($declaredNode, '\d+')).Value
    if ($actualMajor -ne $declaredMajor) {
      $nodeDetails = "$nodeVersionRaw  (warning: declared Node $declaredNode; actual major $actualMajor != declared $declaredMajor; align to avoid dependency/toolchain drift)"
      Write-Warning "Node major version drift: declared $declaredNode, actual $nodeVersionRaw"
    } else {
      $nodeDetails = "$nodeVersionRaw  (declared ${declaredNode}: major aligned)"
    }
  }
}
# v1.56.0 阶段 2：node 解析路径健康（与阶段 1 版本 warning 合并到同一 Details；
# 深度诊断用 scripts/check-runtime.ps1）。
if ($nodeInstalled) {
  $resHint = Get-NodeResolutionHint -Path (Get-Command "node").Source
  if ($resHint) {
    $nodeDetails = "$nodeDetails  ($resHint)"
    Write-Warning $resHint
  }
}
Add-Result $results "Node.js" "Recommended" $nodeInstalled $nodeDetails
Add-Result $results "npm" "Recommended" $npmInstalled (Get-CommandVersion "npm")
Add-Result $results "Python" "Recommended" $pythonInstalled (Get-CommandVersion "python")
Add-Result $results "VS Code" "Recommended" $codeInstalled $(if ($codeInstalled) { "Installed (CLI entry available)" } else { "Not installed or code is not in PATH" })
Add-Result $results "Docker" "Optional" $dockerInstalled (Get-CommandVersion "docker")
Add-Result $results "Java" "Optional" $javaInstalled (Get-CommandVersion "java" @("-version"))

$requiredMissing = $results | Where-Object { $_.Level -eq "Required" -and -not $_.Installed }
$recommendedMissing = $results | Where-Object { $_.Level -eq "Recommended" -and -not $_.Installed }
$optionalMissing = $results | Where-Object { $_.Level -eq "Optional" -and -not $_.Installed }
$conditionalMissing = $results | Where-Object { $_.Level -eq "Conditional" -and -not $_.Installed }

Write-Host "==> Prerequisite check"
Write-Host ""
$results | Format-Table Level, Name, Installed, Details -AutoSize

Write-Host ""
Write-Host "==> Summary"
if ($requiredMissing.Count -eq 0) {
  Write-Host "OK: all required items are present"
} else {
  Write-Warning ("Missing required items: " + (($requiredMissing | Select-Object -ExpandProperty Name) -join ", "))
}

if ($recommendedMissing.Count -gt 0) {
  Write-Host ("- Recommended to install: " + (($recommendedMissing | Select-Object -ExpandProperty Name) -join ", "))
}

if ($conditionalMissing.Count -gt 0) {
  Write-Host ("- Required only for remote repo creation or sync flows: " + (($conditionalMissing | Select-Object -ExpandProperty Name) -join ", "))
}

if ($optionalMissing.Count -gt 0) {
  Write-Host ("- Optional items missing: " + (($optionalMissing | Select-Object -ExpandProperty Name) -join ", "))
}

Write-Host ""
Write-Host "==> Suggested next steps"
if ($requiredMissing.Count -gt 0 -and $wingetInstalled) {
  Write-Host "- Install missing required tools: powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1"
} elseif ($requiredMissing.Count -gt 0) {
  Write-Host "- Install missing required tools manually; one-click install is unavailable until winget is installed and usable"
} else {
  Write-Host "- Required tools are present; continue with local project setup or smoke-test steps"
  if ($recommendedMissing.Count -gt 0 -and $wingetInstalled) {
    Write-Host "- Optional convenience: run scripts/bootstrap-dev-env.ps1 only if you want to install missing recommended tools"
  }
}
Write-Host "- If you need remote repo creation or template sync, install gh and then run: gh auth login"
Write-Host "- If you only need a local smoke test, you can continue without gh"
if ((-not $bashCommandCallable) -and $gitBashPath) {
  Write-Host ("- If 'bash' is missing or starts the Windows/WSL stub, run Bash scripts with the full path: & `"" + $gitBashPath + "`" <script>")
}
Write-Host "- In a project repo, then run: powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1"
