<#
check-derived-sync.ps1 - Windows PowerShell entrypoint for derived project sync boundary check.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
  powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 HEAD

It prefers Git Bash so Windows behavior stays aligned with check-derived-sync.sh.
If Git Bash cannot be started from PowerShell, it falls back to a native
PowerShell boundary check.
#>
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CheckArgs
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

    if ($null -eq $proc) {
      return [pscustomobject]@{
        Ready    = $false
        ExitCode = -1
        StdErr   = 'Start-Process returned null (bash failed to start from PowerShell)'
      }
    }

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

function Pass {
  param([string]$Message)
  Write-Host "OK  $Message"
}

function Fail {
  param([string]$Message)
  Write-Error "FAIL $Message" -ErrorAction Continue
  $script:Failures++
}

function Require-File {
  param([string]$Path)

  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    Pass "file exists: $Path"
  } else {
    Fail "missing file: $Path"
  }
}

function Get-GitText {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)

  $output = & git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
  return @($output)
}

function Test-SyncFile {
  param(
    [string]$ChangedFile,
    [string[]]$SyncFiles
  )

  if ($ChangedFile -like "ai/doc-standards/*") { return $true }
  if ($ChangedFile -like "docs/_scaffold/*") { return $true }
  return ($SyncFiles -contains $ChangedFile)
}

function Test-ProtectedProjectFile {
  param([string]$ChangedFile)

  return (
    $ChangedFile -eq "README.md" -or
    $ChangedFile -eq "ai/project-rules.md" -or
    $ChangedFile -like "docs/0[0-9]-*" -or
    $ChangedFile -like "frontend/*" -or
    $ChangedFile -like "backend/*" -or
    $ChangedFile -like "tests/*" -or
    $ChangedFile -like "docker/*"
  )
}

function Get-SyncFiles {
  if (-not (Test-Path -LiteralPath "template-sync.json" -PathType Leaf)) {
    return @()
  }

  $json = Get-Content -Raw -Encoding UTF8 template-sync.json | ConvertFrom-Json
  return @($json.files | Where-Object { $_ })
}

function Invoke-NativeDerivedSyncCheck {
  param([string[]]$Args)

  $script:Failures = 0
  $commit = if ($Args -and $Args.Count -gt 0) { $Args[0] } else { "HEAD" }

  Write-Host "==> PowerShell fallback derived sync boundary check"
  Write-Host "Git Bash could not be started from PowerShell on this machine."
  Write-Host "Using native PowerShell fallback. Fix Git Bash/MSYS separately if you need Bash entrypoints."
  Write-Host ""

  $root = (Get-GitText rev-parse --show-toplevel | Select-Object -First 1).Trim()
  Set-Location $root

  Write-Host "==> Derived sync boundary check"
  Write-Host "==> Current status"
  & git status --short --branch | ForEach-Object { Write-Host $_ }
  Write-Host ""

  $trackedChanges = @(& git status --porcelain | Where-Object { $_ -notlike '?? *' })
  if ($trackedChanges.Count -gt 0) {
    Fail "tracked changes uncommitted; review before checking sync boundary (untracked project content does not block)"
  } else {
    Pass "working tree clean (untracked project content does not block)"
  }

  Require-File "template-sync.json"

  & git rev-parse --verify "$commit^{commit}" *> $null
  if ($LASTEXITCODE -ne 0) {
    Fail "cannot resolve commit: $commit"
  }

  $syncFiles = @(Get-SyncFiles)
  if ($syncFiles.Count -eq 0) {
    Fail "cannot parse sync file list from template-sync.json"
  } else {
    Pass "loaded sync file list: $($syncFiles.Count) files"
  }

  Write-Host ""
  Write-Host "==> Latest sync commit"
  & git show --name-only --stat --oneline --no-renames $commit | ForEach-Object { Write-Host $_ }
  Write-Host ""

  $changedFiles = @(Get-GitText diff-tree --no-commit-id --name-only -r $commit | Where-Object { $_ })
  if ($changedFiles.Count -eq 0) {
    Fail "commit $commit contains no file changes"
  }

  $subject = ""
  try {
    $subject = (Get-GitText log -1 --format=%s $commit | Select-Object -First 1).Trim()
  } catch {
    $subject = ""
  }

  if ($subject -match '^sync\s+template\s+v[0-9]+\.[0-9]+\.[0-9]+\s+from\s+ai-project-template$') {
    Pass "commit message is a template sync commit"
  } else {
    Fail "commit message does not look like a template sync commit: $subject"
  }

  foreach ($changedFile in $changedFiles) {
    if (Test-SyncFile -ChangedFile $changedFile -SyncFiles $syncFiles) {
      Pass "sync-list change: $changedFile"
    } else {
      Fail "outside sync-list change: $changedFile"
    }

    if (Test-ProtectedProjectFile -ChangedFile $changedFile) {
      Fail "project-specific file appears in sync commit: $changedFile"
    }
  }

  Write-Host ""
  Write-Host "==> 根 README 模板版本号一致性（非阻断）"
  if ((Test-Path -LiteralPath "VERSION") -and (Test-Path -LiteralPath "README.md")) {
    $curVer = (Get-Content -Raw -Encoding UTF8 VERSION).Trim()
    $readmeVer = ""
    foreach ($line in (Get-Content -Encoding UTF8 README.md)) {
      if (($line -match '当前|已同步') -and ($line -match 'v[0-9]+\.[0-9]+\.[0-9]+')) {
        $readmeVer = $matches[0]
      }
    }
    if (-not $readmeVer) {
      Write-Host "INFO  README 未声明当前模板版本号，跳过（README 不强制写版本号）"
    } elseif ($readmeVer -ne $curVer) {
      Write-Host "WARN  README 模板版本声明 $readmeVer 与 VERSION $curVer 不一致，请人工核对（非阻断）"
    } else {
      Write-Host "OK    README 模板版本声明 $readmeVer 与 VERSION 一致"
    }
  } else {
    Write-Host "INFO  缺少 VERSION 或 README.md，跳过版本号一致性检查"
  }

  Write-Host ""
  if ($script:Failures -eq 0) {
    Write-Host "OK derived sync boundary check passed."
    Write-Host "   Next: if project cleanup is needed, use ai/prompts/maintainers/15-post-sync-cleanup.md on a separate branch."
    return 0
  }

  Write-Error "FAIL derived sync boundary check failed: $script:Failures issue(s)." -ErrorAction Continue
  Write-Error "   See FAIL items above; derived sync validation uses check-derived-sync, not check-template (template self-check)." -ErrorAction Continue
  return 1
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bash = Find-TemplateBash
$probe = Test-TemplateBash -BashPath $bash

Push-Location $root
try {
  if (-not $probe.Ready) {
    Write-Warning "Git Bash could not be started from PowerShell."
    if ($probe.StdErr) {
      Write-Warning ("Bash stderr: " + $probe.StdErr)
    } elseif ($probe.ExitCode -ne 0) {
      Write-Warning ("Bash probe exit code: " + $probe.ExitCode)
    }

    $fallbackExit = Invoke-NativeDerivedSyncCheck -Args $CheckArgs
    exit $fallbackExit
  }

  $bashArgs = @("scripts/check-derived-sync.sh") + $CheckArgs
  & $bash $bashArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
