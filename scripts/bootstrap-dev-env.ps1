<#
bootstrap-dev-env.ps1 - Install baseline Windows tools for ai-project-template.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1
  powershell -ExecutionPolicy Bypass -File scripts/bootstrap-dev-env.ps1 -WithDocker -WithJava

Notes:
  This script uses winget where possible. It does not handle sign-in, proxy
  setup, Docker initialization, or project-specific dependencies.
#>
[CmdletBinding()]
param(
  [switch]$WithDocker,
  [switch]$WithJava
)

$ErrorActionPreference = "Stop"
$script:InstallFailures = New-Object 'System.Collections.Generic.List[string]'

function Test-CommandExists {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Winget {
  if (-not (Test-CommandExists "winget")) {
    throw "winget is not available. Install Microsoft App Installer first, or install the required tools manually."
  }
}

function Install-IfMissing {
  param(
    [string]$Label,
    [string]$WingetId,
    [scriptblock]$IsInstalled
  )

  if (& $IsInstalled) {
    Write-Host "==> Already installed, skipping: $Label"
    return
  }

  Write-Host "==> Installing: $Label ($WingetId)"
  try {
    winget install --id $WingetId --exact --accept-package-agreements --accept-source-agreements
  }
  catch {
    $message = "Install failed for ${Label}: $($_.Exception.Message)"
    $script:InstallFailures.Add($message) | Out-Null
    Write-Warning $message
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

Ensure-Winget

Install-IfMissing "Git for Windows" "Git.Git" { (Test-CommandExists "git") -and ($null -ne (Find-GitBash)) }
Install-IfMissing "GitHub CLI" "GitHub.cli" { Test-CommandExists "gh" }
Install-IfMissing "Node.js LTS" "OpenJS.NodeJS.LTS" { Test-CommandExists "node" }
Install-IfMissing "Python 3.11" "Python.Python.3.11" { Test-CommandExists "python" }
Install-IfMissing "Visual Studio Code" "Microsoft.VisualStudioCode" { Test-CommandExists "code" }

if ($WithDocker) {
  Install-IfMissing "Docker Desktop" "Docker.DockerDesktop" { Test-CommandExists "docker" }
}

if ($WithJava) {
  Install-IfMissing "Microsoft OpenJDK 21" "Microsoft.OpenJDK.21" { Test-CommandExists "java" }
}

Write-Host ""
Write-Host "==> Installation flow finished"
if ($script:InstallFailures.Count -gt 0) {
  Write-Warning ("Some installs failed: " + ($script:InstallFailures -join " | "))
  Write-Host "- If GitHub CLI failed but you only need a local smoke test, you can continue without gh."
  Write-Host "- If you need remote repo creation or sync, fix network/proxy access and retry the failed install."
}
Write-Host "- Some tools may require a new terminal session before PATH is refreshed."
Write-Host "- Complete sign-in manually: gh auth login"
Write-Host "- Install and sign in to your AI tool separately using its official guide."
Write-Host "- Suggested next step: powershell -ExecutionPolicy Bypass -File scripts/check-prereqs.ps1"
