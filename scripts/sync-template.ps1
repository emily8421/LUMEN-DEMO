<#
sync-template.ps1 - Windows PowerShell entrypoint for the Bash template sync.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit

It prefers Git Bash so Windows does not accidentally invoke WSL bash.
#>
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$SyncArgs
)

$ErrorActionPreference = "Stop"

function Find-TemplateBash {
  $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  $candidates = @($env:GIT_BASH)

  if ($env:ProgramFiles) {
    $candidates += Join-Path $env:ProgramFiles "Git\bin\bash.exe"
  }

  if ($programFilesX86) {
    $candidates += Join-Path $programFilesX86 "Git\bin\bash.exe"
  }

  $candidates = @($candidates | Where-Object { $_ -and (Test-Path $_) })
  if ($candidates.Count -gt 0) {
    return $candidates[0]
  }

  $bash = Get-Command bash -ErrorAction SilentlyContinue
  if ($bash) {
    return $bash.Source
  }

  throw "bash was not found. Install Git for Windows or set GIT_BASH to bash.exe."
}

if (-not $SyncArgs -or $SyncArgs.Count -eq 0) {
  $SyncArgs = @("--dry-run")
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bash = Find-TemplateBash

Push-Location $root
try {
  & $bash "scripts/sync-template.sh" @SyncArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
