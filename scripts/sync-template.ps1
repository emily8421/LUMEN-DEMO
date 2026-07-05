<#
sync-template.ps1 - Windows PowerShell entrypoint for template sync.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit

It prefers Git Bash so Windows behavior stays aligned with sync-template.sh.
If Git Bash cannot be started from PowerShell, it falls back to a native
PowerShell implementation for dry-run / commit.
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

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)

  & git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
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

function Test-GitObject {
  param(
    [string]$Ref,
    [string]$Path
  )

  & git cat-file -e ("{0}:{1}" -f $Ref, $Path) 2>$null
  return ($LASTEXITCODE -eq 0)
}

function Get-RemoteHash {
  param(
    [string]$Ref,
    [string]$Path
  )

  $result = Get-GitText rev-parse ("{0}:{1}" -f $Ref, $Path)
  return ($result -join "").Trim()
}

function Get-LocalHash {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return ""
  }

  $output = & git hash-object --path=$Path $Path 2>$null
  if ($LASTEXITCODE -ne 0) {
    return ""
  }
  return (@($output) -join "").Trim()
}

function Get-SyncFilesFromRef {
  param([string]$Ref)

  if (Test-GitObject -Ref $Ref -Path "template-sync.json") {
    $jsonText = Get-GitUtf8Text show ("{0}:template-sync.json" -f $Ref)
    $json = $jsonText | ConvertFrom-Json
    return @($json.files | Where-Object { $_ })
  }

  if (Test-Path -LiteralPath "template-sync.json" -PathType Leaf) {
    $json = Get-Content -Raw -Encoding UTF8 template-sync.json | ConvertFrom-Json
    return @($json.files | Where-Object { $_ })
  }

  return @()
}

function Get-TemplateVersion {
  param([string]$Ref)

  if (Test-GitObject -Ref $Ref -Path "VERSION") {
    $version = (Get-GitUtf8Text show ("{0}:VERSION" -f $Ref)).Trim()
    if ($version) { return $version }
  }

  if (Test-GitObject -Ref $Ref -Path "ai/global-rules.md") {
    $line = Get-GitText show ("{0}:ai/global-rules.md" -f $Ref) | Select-String -Pattern 'template version|global rules version|v[0-9]' | Select-Object -First 1
    if ($line -and $line.Line -match 'v\d+\.\d+(\.\d+)?') {
      return $Matches[0]
    }
  }

  return "unknown"
}

function Test-RemoteMatchesLocal {
  param(
    [string]$Ref,
    [string]$RemotePath,
    [string]$LocalPath = $RemotePath
  )

  $remoteHash = Get-RemoteHash -Ref $Ref -Path $RemotePath
  $localHash = Get-LocalHash -Path $LocalPath
  return ($localHash -and ($remoteHash -eq $localHash))
}

function Write-RemoteFileToLocal {
  param(
    [string]$Ref,
    [string]$RemotePath,
    [string]$LocalPath
  )

  $parent = Split-Path -Parent $LocalPath
  if ($parent) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  $content = Get-GitUtf8Text show ("{0}:{1}" -f $Ref, $RemotePath)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) $LocalPath), $content, $utf8NoBom)
}

function Show-TemplateDiffStat {
  param(
    [string]$Ref,
    [string]$RemotePath,
    [string]$LocalPath = $RemotePath
  )

  $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("template-sync-diff-" + [guid]::NewGuid().ToString("N"))
  $localFile = Join-Path (Join-Path $tmpDir "local") $LocalPath
  $remoteFile = Join-Path (Join-Path $tmpDir "template") $RemotePath

  try {
    New-Item -ItemType Directory -Path (Split-Path -Parent $localFile) -Force | Out-Null
    New-Item -ItemType Directory -Path (Split-Path -Parent $remoteFile) -Force | Out-Null

    if (Test-Path -LiteralPath $LocalPath -PathType Leaf) {
      Copy-Item -LiteralPath $LocalPath -Destination $localFile -Force
    } else {
      New-Item -ItemType File -Path $localFile -Force | Out-Null
    }

    $remoteContent = Get-GitUtf8Text show ("{0}:{1}" -f $Ref, $RemotePath)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($remoteFile, $remoteContent, $utf8NoBom)
    & git diff --no-index --stat -- $localFile $remoteFile | ForEach-Object { Write-Host ($_ -replace [regex]::Escape($tmpDir + [System.IO.Path]::DirectorySeparatorChar), "") }
    $global:LASTEXITCODE = 0
  }
  finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-NativeTemplateSync {
  param([string[]]$Args)

  $mode = "--dry-run"
  if ($Args -and $Args.Count -gt 0) {
    if ($Args.Count -ne 1 -or ($Args[0] -notin @("--dry-run", "--commit"))) {
      Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run|--commit]"
      return 1
    }
    $mode = $Args[0]
  }

  $templateRemote = if ($env:TEMPLATE_REMOTE) { $env:TEMPLATE_REMOTE } else { "https://github.com/emily8421/ai-project-template.git" }
  $docStandardDocs = @(
    "docs/00-scenario.md",
    "docs/01-user-requirements.md",
    "docs/02-srs.md",
    "docs/03-prd.md",
    "docs/04-architecture.md",
    "docs/05-tech-spec.md",
    "docs/06-db-design.md",
    "docs/07-api-spec.md",
    "docs/08-dev-plan.md",
    "docs/09-verification.md"
  )

  Write-Host "==> PowerShell fallback template sync"
  Write-Host "Git Bash could not be started from PowerShell on this machine."
  Write-Host "Using native PowerShell fallback for $mode. Fix Git Bash/MSYS separately if you need Bash entrypoints."
  Write-Host ""

  Invoke-Git rev-parse --is-inside-work-tree | Out-Null

  Write-Host "==> Fetch template: $templateRemote (main)"
  & git fetch --no-tags --depth=1 $templateRemote main
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Fetch failed. If the template repo is private, check gh auth status or switch to an account with access."
    return 1
  }

  $ref = "FETCH_HEAD"

  if (Test-GitObject -Ref $ref -Path "scripts/sync-template.sh") {
    $remoteScriptHash = Get-RemoteHash -Ref $ref -Path "scripts/sync-template.sh"
    $localScriptHash = Get-LocalHash -Path "scripts/sync-template.sh"
    if (-not $localScriptHash -or $remoteScriptHash -ne $localScriptHash) {
      Write-Error "Local scripts/sync-template.sh is not the latest template version. Stop sync; bootstrap latest scripts first and commit them separately."
      Write-Host "  git checkout FETCH_HEAD -- scripts/sync-template.sh scripts/sync-template.ps1"
      Write-Host "  git add scripts/sync-template.sh scripts/sync-template.ps1"
      Write-Host "  git commit -m `"chore: bootstrap latest sync script`""
      return 1
    }
  }

  $syncFiles = @(Get-SyncFilesFromRef -Ref $ref)
  if ($syncFiles.Count -eq 0) {
    Write-Error "Could not parse template-sync.json sync file list."
    return 1
  }

  $version = Get-TemplateVersion -Ref $ref
  Write-Host "==> Template version: $version"
  if (Test-Path -LiteralPath ".github/workflows/template-check.yml" -PathType Leaf) {
    Write-Warning "Detected .github/workflows/template-check.yml. This workflow is for template repository self-checks; derived project PRs should not run scripts/check-template.sh. Migrate to .github/workflows/project-check.yml with git diff --check for normal PRs and scripts/check-derived-sync.sh HEAD only for template sync commits."
    Write-Host ""
  }
  Write-Host "==> Sync files:"

  if ($mode -eq "--dry-run") {
    foreach ($file in $syncFiles) {
      if (Test-GitObject -Ref $ref -Path $file) {
        if (Test-RemoteMatchesLocal -Ref $ref -RemotePath $file) {
          Write-Host "    = $file (no diff)"
        } else {
          Write-Host "    delta $file"
        }
      } else {
        Write-Host "    skip $file (not in template)"
      }
    }

    Write-Host ""
    Write-Host "INFO dry-run: preview only; workspace and index unchanged. Diff stats:"
    Write-Host "   Direction: local current files -> template $version (changes that --commit would apply)"
    foreach ($file in $syncFiles) {
      if ((Test-GitObject -Ref $ref -Path $file) -and -not (Test-RemoteMatchesLocal -Ref $ref -RemotePath $file)) {
        Show-TemplateDiffStat -Ref $ref -RemotePath $file -LocalPath $file
      }
    }

    Write-Host ""
    Write-Host "==> doc-standards mirror (docs/00-09 -> ai/doc-standards; read-only standards, no project facts overwritten):"
    foreach ($src in $docStandardDocs) {
      $dest = "ai/doc-standards/" + [System.IO.Path]::GetFileName($src)
      if (Test-GitObject -Ref $ref -Path $src) {
        if (Test-Path -LiteralPath $dest -PathType Leaf) {
          if (Test-RemoteMatchesLocal -Ref $ref -RemotePath $src -LocalPath $dest) {
            Write-Host "    = $dest (no diff)"
          } else {
            Write-Host "    delta $dest (standards mirror)"
          }
        } else {
          Write-Host "    delta $dest (new standards mirror)"
        }
      } else {
        Write-Host "    skip $dest (template has no $src)"
      }
    }
    Write-Host "   After confirmation, run: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit"
    return 0
  }

  if ((git status --porcelain) -ne $null) {
    Write-Error "Working tree is not clean; PowerShell fallback --commit will not overwrite files in a dirty workspace. Commit or stash other changes first."
    return 1
  }

  $updatedFiles = New-Object System.Collections.Generic.List[string]
  foreach ($file in $syncFiles) {
    if (Test-GitObject -Ref $ref -Path $file) {
      Invoke-Git checkout $ref -- $file
      Invoke-Git add $file
      $updatedFiles.Add($file)
      Write-Host "    ok $file"
    } else {
      Write-Host "    skip $file (not in template)"
    }
  }

  Write-Host "==> doc-standards mirror (docs/00-09 -> ai/doc-standards; read-only standards, no project facts overwritten):"
  foreach ($src in $docStandardDocs) {
    $dest = "ai/doc-standards/" + [System.IO.Path]::GetFileName($src)
    if (Test-GitObject -Ref $ref -Path $src) {
      Write-RemoteFileToLocal -Ref $ref -RemotePath $src -LocalPath $dest
      Invoke-Git add $dest
      $updatedFiles.Add($dest)
      Write-Host "    ok $dest (standards mirror)"
    } else {
      Write-Host "    skip $dest (template has no $src)"
    }
  }

  Write-Host ""
  & git diff --quiet HEAD -- @($updatedFiles.ToArray())
  if ($LASTEXITCODE -eq 0) {
    Write-Host "INFO no commit needed: sync files already match template."
    return 0
  }

  Invoke-Git commit -q -m "sync template $version from ai-project-template" -- @($updatedFiles.ToArray())
  Write-Host "OK committed: sync template $version"
  Write-Host "   Push: git push"
  Write-Host ""
  Write-Host "Next steps (do not stop at the sync commit):"
  Write-Host "  1. Run derived boundary check: powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1"
  Write-Host "  2. In AI, run: /run post-sync-cleanup"
  Write-Host "  3. In AI, run: /run docs-system-audit (post-sync audit mode)"
  Write-Host "  4. Run project tests / lint / build as applicable; record unavailable checks as unverified"
  Write-Host "  5. Create or update: sync-records/template-sync/YYYY-MM-DD-sync-template-$version.md"
  Write-Host "     Use: template-docs/derived-sync-report-template.md"
  return 0
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
    Write-Warning "Git Bash could not be started from PowerShell."
    if ($probe.StdErr) {
      Write-Warning ("Bash stderr: " + $probe.StdErr)
    } elseif ($probe.ExitCode -ne 0) {
      Write-Warning ("Bash probe exit code: " + $probe.ExitCode)
    }

    $fallbackExit = Invoke-NativeTemplateSync -Args $SyncArgs
    exit $fallbackExit
  }

  $bashArgs = @("scripts/sync-template.sh") + $SyncArgs
  & $bash $bashArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
