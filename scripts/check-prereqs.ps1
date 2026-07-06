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
Add-Result $results "bash command in PATH" "Conditional" $bashCommandInstalled $(if ($bashCommandInstalled) { (Get-Command bash).Source } else { "Git Bash is installed, but 'bash' is not directly callable from PowerShell PATH" })
Add-Result $results "PowerShell" "Required" $true $powerShellDetails
Add-Result $results "GitHub CLI (gh)" "Conditional" $ghInstalled $(if ($ghInstalled) { Get-CommandVersion "gh" } else { "Required for remote repo creation and some sync flows; not required for local smoke tests" })
Add-Result $results "Node.js" "Recommended" $nodeInstalled (Get-CommandVersion "node")
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
if ($wingetInstalled) {
  Write-Host "- Run: powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1"
} else {
  Write-Host "- One-click install is unavailable until winget is installed and usable"
}
Write-Host "- If you need remote repo creation or template sync, install gh and then run: gh auth login"
Write-Host "- If you only need a local smoke test, you can continue without gh"
if (-not $bashCommandInstalled -and $gitBashPath) {
  Write-Host ("- If PowerShell cannot find 'bash', run Bash scripts with the full path: & `"" + $gitBashPath + "`" <script>")
}
Write-Host "- In a project repo, then run: powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1"
