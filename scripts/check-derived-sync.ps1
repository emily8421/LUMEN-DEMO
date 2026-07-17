<#
check-derived-sync.ps1 - Windows PowerShell entrypoint for derived project sync boundary check.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1
  powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 HEAD
  powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 <sync-commit>

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

    $stderr = if (Test-Path $stderrFile) {
      $stderrText = Get-Content $stderrFile -Raw
      if ($null -eq $stderrText) { "" } else { $stderrText.Trim() }
    } else { "" }
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

  $text = Get-GitUtf8Text @GitArgs
  if ($text.Length -eq 0) {
    return @()
  }

  $normalized = $text -replace "`r`n", "`n" -replace "`r", "`n"
  $lines = @([regex]::Split($normalized, "`n"))
  if ($normalized.EndsWith("`n") -and $lines.Count -gt 0) {
    $lines = @($lines | Select-Object -First ($lines.Count - 1))
  }
  return $lines
}

function Get-GitUtf8Text {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)

  $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("template-git-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
  $stdoutFile = Join-Path $tmpDir "stdout.bin"
  $stderrFile = Join-Path $tmpDir "stderr.bin"

  try {
    $proc = Start-Process -FilePath "git" `
      -ArgumentList $GitArgs `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $stdoutFile `
      -RedirectStandardError $stderrFile

    if ($null -eq $proc) {
      throw "git $($GitArgs -join ' ') failed to start"
    }

    $stdout = if (Test-Path $stdoutFile) { [System.IO.File]::ReadAllText($stdoutFile, [System.Text.Encoding]::UTF8) } else { "" }
    $stderr = if (Test-Path $stderrFile) { [System.IO.File]::ReadAllText($stderrFile, [System.Text.Encoding]::UTF8).Trim() } else { "" }

    if ($proc.ExitCode -ne 0) {
      $message = "git $($GitArgs -join ' ') failed with exit code $($proc.ExitCode)"
      if ($stderr) { $message = "$message`: $stderr" }
      throw $message
    }

    return $stdout
  }
  finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Test-SyncFile {
  param(
    [string]$ChangedFile,
    [string[]]$SyncFiles
  )

  if ($ChangedFile -like "ai/doc-standards/*") { return $true }
  if ($ChangedFile -like "docs/_scaffold/*") { return $true }
  if ($ChangedFile -eq "TEMPLATE-BASE.md") { return $true }
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
  param([string[]]$CheckArgs)

  $script:Failures = 0
  $commit = if ($CheckArgs -and $CheckArgs.Count -gt 0) { $CheckArgs[0] } else { "HEAD" }

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
  Write-Host "==> Sync commit under validation"
  & git show --name-only --stat --oneline --no-renames $commit | ForEach-Object { Write-Host $_ }
  Write-Host ""

  $changedFiles = @(Get-GitText diff-tree --no-commit-id --name-only -r $commit | Where-Object { $_ })
  if ($changedFiles.Count -eq 0) {
    Fail "commit $commit contains no file changes"
  }

  $parentCount = 0
  try {
    $parentLine = (Get-GitText rev-list --parents -n 1 $commit | Select-Object -First 1).Trim()
    if ($parentLine) {
      $parentCount = @($parentLine -split '\s+' | Select-Object -Skip 1).Count
    }
  } catch {
    $parentCount = 0
  }

  if ($commit -eq "HEAD" -and $parentCount -gt 1) {
    Write-Host "INFO  HEAD is a merge commit. If this is a PR merge after template sync, pass the actual sync commit explicitly:"
    Write-Host "      powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 <sync-commit>"
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
  Write-Host "==> Root README template version consistency (non-blocking)"
  if (Test-Path -LiteralPath "TEMPLATE-BASE.md") {
    $lineageRole = ""
    foreach ($line in (Get-Content -Encoding UTF8 TEMPLATE-BASE.md)) {
      if ($line -match '^\-\s*Lineage type:\s*(.+)$') {
        $v = $Matches[1].Trim()
        if ($v -eq "ordinary derived project") { $lineageRole = "ordinary"; break }
        if ($v -eq "domain template") { $lineageRole = "domain"; break }
      }
    }
    if (-not $lineageRole) {
      $tbSniff = Get-Content -Raw -Encoding UTF8 TEMPLATE-BASE.md
      if ($tbSniff -match 'ordinary derived project') { $lineageRole = "ordinary" }
      elseif ($tbSniff -match 'domain template') { $lineageRole = "domain" }
    }
    if ($lineageRole -eq "domain") {
      Write-Host "INFO  Domain TEMPLATE-BASE.md detected (Lineage type: domain template): VERSION/CHANGELOG are domain-template-owned; inherited base template version is in TEMPLATE-BASE.md. Skip README/VERSION template-version consistency check."
    } else {
      Write-Host "INFO  TEMPLATE-BASE.md detected: ordinary derived project dual-version mode uses VERSION for project version; inherited template version is read from TEMPLATE-BASE.md. Skip README/VERSION template-version consistency check."
    }
    $templateBaseText = Get-Content -Raw -Encoding UTF8 TEMPLATE-BASE.md
    if ($templateBaseText -match '(?m)^- Current synced template version:\s*v[0-9]+\.[0-9]+\.[0-9]+') {
      Pass "TEMPLATE-BASE.md records current synced template version"
    } else {
      Fail "TEMPLATE-BASE.md is missing Current synced template version"
    }
    if ($lineageRole -eq "domain") {
      if ($templateBaseText -match '(?m)^- Domain standards scope:') {
        Pass "TEMPLATE-BASE.md records domain standards scope (domain lineage)"
      } else {
        Fail "Domain TEMPLATE-BASE.md is missing Domain standards scope"
      }
    }
  } elseif ((Test-Path -LiteralPath "VERSION") -and (Test-Path -LiteralPath "README.md")) {
    $curVer = (Get-Content -Raw -Encoding UTF8 VERSION).Trim()
    $readmeVer = ""
    foreach ($line in (Get-Content -Encoding UTF8 README.md)) {
      if (($line -match '\u5f53\u524d|\u5df2\u540c\u6b65') -and ($line -match 'v[0-9]+\.[0-9]+\.[0-9]+')) {
        $readmeVer = $matches[0]
      }
    }
    if (-not $readmeVer) {
      Write-Host "INFO  README does not declare current template version; skipped (README version declaration is optional)"
    } elseif ($readmeVer -ne $curVer) {
      Write-Host "WARN  README template version $readmeVer differs from VERSION $curVer; please review manually (non-blocking)"
    } else {
      Write-Host "OK    README template version $readmeVer matches VERSION"
    }
  } else {
    Write-Host "INFO  VERSION or README.md is missing; skipped version consistency check"
  }

  Write-Host ""
  Write-Host "==> Derived project version mechanism enablement (non-blocking)"
  # 复用前段 $lineageRole 判定；前段无 TEMPLATE-BASE.md 时为 $null，按普通派生项目处理。
  if ($lineageRole -eq "domain") {
    Write-Host "INFO  Domain lineage: VERSION/CHANGELOG are domain-template-owned. Skip version mechanism enablement check."
  } else {
    $mainSignal = $false
    $auxSignal = $false
    if ((Test-Path -LiteralPath ".github/workflows/project-check.yml") -and
        ((Get-Content -Raw -Encoding UTF8 ".github/workflows/project-check.yml") -match 'Check project version consistency')) {
      $mainSignal = $true
    }
    if ((Test-Path -LiteralPath "ai/project-rules.md") -and
        ((Get-Content -Raw -Encoding UTF8 "ai/project-rules.md") -match '项目版本管理')) {
      $auxSignal = $true
    }
    if ($mainSignal -and $auxSignal) {
      Pass "derived project version mechanism enabled (project-check.yml version consistency + project-rules version-management rule)"
    } elseif ($mainSignal) {
      Write-Host "WARN  Version mechanism main signal present (project-check.yml validates VERSION<->CHANGELOG) but aux signal missing: ai/project-rules.md lacks version-management rule. Suggest adding it to define PATCH/MINOR/MAJOR semantics (non-blocking)."
    } elseif ($auxSignal) {
      Write-Host "WARN  Version mechanism aux signal present (project-rules.md has version-management rule) but main signal missing: .github/workflows/project-check.yml lacks 'Check project version consistency'. Suggest adding CI check to prevent VERSION/CHANGELOG drift (non-blocking)."
    } else {
      Write-Host "WARN  Derived project version mechanism not enabled: project-check.yml lacks 'Check project version consistency' and ai/project-rules.md lacks version-management rule. Suggest running ai/prompts/maintainers/15-post-sync-cleanup.md to audit version mechanism enablement (non-blocking)."
    }
  }

  Write-Host ""
  if ($script:Failures -eq 0) {
    Write-Host "OK derived sync boundary check passed."
    Write-Host "   Next: if project cleanup is needed, use ai/prompts/maintainers/15-post-sync-cleanup.md on a separate branch."
    return 0
  }

  Write-Error "FAIL derived sync boundary check failed: $script:Failures issue(s)." -ErrorAction Continue
  Write-Error "   See FAIL items above; derived sync validation uses check-derived-sync, not check-template (template self-check)." -ErrorAction Continue
  Write-Error "   If HEAD is a PR merge commit, rerun with the actual sync commit: scripts/check-derived-sync.ps1 <sync-commit>." -ErrorAction Continue
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

    $fallbackExit = Invoke-NativeDerivedSyncCheck -CheckArgs $CheckArgs
    exit $fallbackExit
  }

  $bashArgs = @("scripts/check-derived-sync.sh") + $CheckArgs
  & $bash $bashArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
