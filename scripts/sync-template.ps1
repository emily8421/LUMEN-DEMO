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

function Test-TemplateBash {
  param([string]$BashPath)

  $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("template-bash-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
  $stdoutFile = Join-Path $tmpDir "stdout.txt"
  $stderrFile = Join-Path $tmpDir "stderr.txt"

  try {
    $proc = Start-Process -FilePath $BashPath `
      -ArgumentList "--version" `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $stdoutFile `
      -RedirectStandardError $stderrFile

    $stderr = if (Test-Path $stderrFile) { (Get-Content $stderrFile -Raw).Trim() } else { "" }
    return [pscustomobject]@{
      Ready    = ($proc.ExitCode -eq 0)
      ExitCode = $proc.ExitCode
      StdErr   = $stderr
    }
  }
  finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if (-not $SyncArgs -or $SyncArgs.Count -eq 0) {
  $SyncArgs = @("--dry-run")
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bash = Find-TemplateBash
$probe = Test-TemplateBash -BashPath $bash

Push-Location $root
try {
  if (-not $probe.Ready) {
    $details = if ($probe.StdErr) { $probe.StdErr } else { "ExitCode=$($probe.ExitCode)" }
    throw "Git Bash was found but could not be started from PowerShell. $details`nRun the Bash entry directly in Git Bash after fixing the local Git Bash/MSYS environment."
  }

  & $bash "scripts/sync-template.sh" @SyncArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
