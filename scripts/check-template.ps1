<#
check-template.ps1 - Windows PowerShell entrypoint for the Bash template check.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1

It prefers Git Bash so Windows does not accidentally invoke WSL bash.
#>
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

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bash = Find-TemplateBash

Push-Location $root
try {
  & $bash "scripts/check-template.sh"
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
