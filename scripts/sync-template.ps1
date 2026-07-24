<#
sync-template.ps1 - Windows PowerShell entrypoint for template sync.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --dry-run [--no-stat]
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --summary
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit --preserve-project-version
  powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 --commit --domain-template

If TEMPLATE-BASE.md already exists, --preserve-project-version (ordinary derived project) or
--domain-template (domain template) is enabled automatically based on lineage type.
--preserve-project-version and --domain-template are mutually exclusive.

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

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)

  & git @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Write-FallbackCommitRecoveryHint {
  param([string]$Version)

  Write-Warning "PowerShell fallback commit failed after staging sync files."
  Write-Warning "Recovery:"
  Write-Warning "  1. Run: git status --short --branch"
  Write-Warning "  2. Confirm only template sync files are staged."
  Write-Warning ("  3. Run: git commit -m `"sync template {0} from ai-project-template`"" -f $Version)
  Write-Warning "  4. Run: powershell -ExecutionPolicy Bypass -File scripts/check-derived-sync.ps1 <sync-commit>"
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

function Remove-ProjectVersionFiles {
  param([string[]]$SyncFiles)

  return @($SyncFiles | Where-Object { $_ -ne "VERSION" -and $_ -ne "CHANGELOG.md" })
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

function Get-TemplateSourceLabel {
  param([string]$TemplateRemote)

  if ($TemplateRemote -eq "https://github.com/emily8421/ai-project-template.git" -or $TemplateRemote -eq "git@github.com:emily8421/ai-project-template.git") {
    return "github.com/emily8421/ai-project-template"
  }

  return $TemplateRemote
}

function Get-TemplateBaseVersionFromFile {
  if (-not (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf)) { return "" }

  foreach ($line in (Get-Content -Encoding UTF8 TEMPLATE-BASE.md)) {
    if ($line -match '^\s*-\s*(\*\*)?(Base template version|base version)') {
      $match = [regex]::Match($line, 'v[0-9]+\.[0-9]+\.[0-9]+')
      if ($match.Success) { return $match.Value }
    }
  }
  return ""
}

function Get-LegacyDomainStandardsScope {
  if (-not (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf)) { return "" }

  $items = New-Object System.Collections.Generic.List[string]
  $inScope = $false
  foreach ($line in (Get-Content -Encoding UTF8 TEMPLATE-BASE.md)) {
    if ($line -match '^##\s+(叠加的标准件范围|Domain Standards Scope)\s*$') {
      $inScope = $true
      continue
    }
    if ($inScope -and $line -match '^##\s+') { break }
    if ($inScope -and $line -match '^\s*-\s+(.+)$') {
      $item = ($Matches[1] -replace '\s+', ' ').Trim()
      if ($item) { [void]$items.Add($item) }
    }
  }
  return ($items -join "；")
}

function Write-TemplateBase {
  param(
    [string]$TemplateVersion,
    [string]$TemplateRemote
  )

  $syncedAt = Get-Date -Format "yyyy-MM-dd"
  $projectVersion = if (Test-Path -LiteralPath "VERSION" -PathType Leaf) { (Get-Content -Raw -Encoding UTF8 VERSION).Trim([char]0xFEFF, [char]0x20, [char]0x09, [char]0x0A, [char]0x0D) } else { "unknown" }
  $baseVersion = $TemplateVersion
  if (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf) {
    $existingBaseVersion = Get-TemplateBaseVersionFromFile
    if ($existingBaseVersion) { $baseVersion = $existingBaseVersion }
  }

  $sourceLabel = Get-TemplateSourceLabel -TemplateRemote $TemplateRemote
  $content = @"
# Template Base

> Records the upstream template lineage for this ordinary derived project. Do not use this file for domain-template inheritance metadata.

- Lineage type: ordinary derived project
- Template repository: $sourceLabel
- Base template version: $baseVersion
- Current synced template version: $TemplateVersion
- Synced at: $syncedAt
- Project version file: VERSION
- Project version at sync time: $projectVersion

## Version Semantics

- ``VERSION`` is owned by this derived project and records the project version.
- ``TEMPLATE-BASE.md`` records the inherited ai-project-template version used for methodology sync audit.
- Template sync commits keep the message format ``sync template $TemplateVersion from ai-project-template``.
"@
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) "TEMPLATE-BASE.md"), $content, $utf8NoBom)
}

function Write-DomainTemplateBase {
  param(
    [string]$TemplateVersion,
    [string]$TemplateRemote
  )

  $syncedAt = Get-Date -Format "yyyy-MM-dd"
  $domainVersion = if (Test-Path -LiteralPath "VERSION" -PathType Leaf) { (Get-Content -Raw -Encoding UTF8 VERSION).Trim([char]0xFEFF, [char]0x20, [char]0x09, [char]0x0A, [char]0x0D) } else { "unknown" }
  $baseVersion = $TemplateVersion
  $standardsScope = "(TODO: 领域模板维护者填写叠加的领域标准件范围，例如 agent-system 的 planner/executor、tool permission、memory/state、eval、trace/replay、HITL)"
  if (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf) {
    $existingBaseVersion = Get-TemplateBaseVersionFromFile
    if ($existingBaseVersion) { $baseVersion = $existingBaseVersion }
    foreach ($line in (Get-Content -Encoding UTF8 TEMPLATE-BASE.md)) {
      if ($line -match '^\-\s*Domain standards scope:\s*(.*)$') {
        $existingScope = $Matches[1].Trim()
        if ($existingScope -and ($existingScope -notmatch 'TODO')) { $standardsScope = $existingScope }
        break
      }
    }
    $legacyScope = Get-LegacyDomainStandardsScope
    if (($standardsScope -match 'TODO') -and $legacyScope) { $standardsScope = $legacyScope }
  }

  $sourceLabel = Get-TemplateSourceLabel -TemplateRemote $TemplateRemote
  $content = @"
# Template Base

> Records the upstream template lineage for this domain template (inherits ai-project-template methodology, adds domain-specific standards). Do not use this file for ordinary derived project metadata.

- Lineage type: domain template
- Template repository: $sourceLabel
- Base template version: $baseVersion
- Current synced template version: $TemplateVersion
- Synced at: $syncedAt
- Domain template version file: VERSION
- Domain template version at sync time: $domainVersion
- Domain standards scope: $standardsScope

## Version Semantics

- ``VERSION`` is owned by this domain template and records the domain template version.
- ``CHANGELOG.md`` is owned by this domain template and records domain template evolution; template sync does not overwrite it.
- ``TEMPLATE-BASE.md`` records the inherited ai-project-template version used for methodology sync audit.
- Template sync commits keep the message format ``sync template $TemplateVersion from ai-project-template``.
"@
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) "TEMPLATE-BASE.md"), $content, $utf8NoBom)
}

function Get-LineageRole {
  if (-not (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf)) {
    return ""
  }

  $headerText = ""
  foreach ($line in (Get-Content -Encoding UTF8 TEMPLATE-BASE.md)) {
    $headerText += $line + "`n"
    if ($line -match '^\-\s*Lineage type:\s*(.+)$') {
      $val = $Matches[1].Trim()
      if ($val -eq "ordinary derived project") { return "ordinary" }
      if ($val -eq "domain template") { return "domain" }
    }
  }

  # v1.46.0 旧普通版无 Lineage type 字段，fallback 嗅探 header
  if ($headerText -match 'ordinary derived project') { return "ordinary" }
  if ($headerText -match 'domain template') { return "domain" }
  return ""
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
    # 仅 dry-run diff：临时关 autocrlf/safecrlf 消 Windows 临时文件 CRLF 噪音；git -c 内联不影响 --commit（v1.56.12）。
    & git -c core.autocrlf=false -c core.safecrlf=false diff --no-index --stat -- $localFile $remoteFile | ForEach-Object { Write-Host ($_ -replace [regex]::Escape($tmpDir + [System.IO.Path]::DirectorySeparatorChar), "") }
    $global:LASTEXITCODE = 0
  }
  finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Get-SummaryBucket {
  param([string]$Path)

  if ($Path -match '/') {
    return (($Path -split '/', 2)[0] + '/')
  }

  return './'
}

function Test-RiskPath {
  param([string]$Path)

  return ($Path -eq 'README.md' `
    -or $Path -eq 'ai/project-rules.md' `
    -or $Path -match '^docs/0[0-9]-[^/]+\.md$' `
    -or $Path -match '^(frontend|backend|tests|docker)/')
}

function Add-SummaryEntry {
  param(
    [hashtable]$Summary,
    [System.Collections.Generic.List[string]]$RiskHits,
    [string]$Path,
    [string]$Status
  )

  $bucket = Get-SummaryBucket -Path $Path
  if (-not $Summary.Buckets.ContainsKey($bucket)) {
    $Summary.Buckets[$bucket] = @{ added = 0; modified = 0; deleted = 0; skipped = 0 }
  }

  if ($Summary.Buckets[$bucket].ContainsKey($Status)) {
    $Summary.Buckets[$bucket][$Status]++
  }

  if ($Summary.Total.ContainsKey($Status)) {
    $Summary.Total[$Status]++
  }

  if ((Test-RiskPath -Path $Path) -and $Status -ne 'unchanged') {
    $RiskHits.Add(("{0} {1}" -f $Status, $Path)) | Out-Null
  }
}

function Write-Summary {
  param(
    [hashtable]$Summary,
    [System.Collections.Generic.List[string]]$RiskHits
  )

  Write-Host "==> dry-run summary (per-file diff stat omitted)"
  Write-Host ("   Change counts: added={0}, modified={1}, deleted={2}, skipped={3}" -f $Summary.Total.added, $Summary.Total.modified, $Summary.Total.deleted, $Summary.Total.skipped)
  Write-Host "   By top-level directory:"
  if ($Summary.Buckets.Count -eq 0) {
    Write-Host "    = no changes"
  } else {
    foreach ($bucket in @($Summary.Buckets.Keys | Sort-Object)) {
      $entry = $Summary.Buckets[$bucket]
      Write-Host ("    - {0} added={1}, modified={2}, deleted={3}, skipped={4}" -f $bucket, $entry.added, $entry.modified, $entry.deleted, $entry.skipped)
    }
  }

  Write-Host "   Risk path hits:"
  if ($RiskHits.Count -eq 0) {
    Write-Host "    = none"
  } else {
    foreach ($hit in $RiskHits) {
      Write-Host ("    ! " + $hit)
    }
  }
}

function Invoke-NativeTemplateSync {
  param([string[]]$NativeSyncArgs)

  $mode = "--dry-run"
  $modeExplicit = $false
  $skipStat = $false
  $summaryExplicit = $false
  $preserveProjectVersion = $false
  $domainTemplateMode = $false
  if ($NativeSyncArgs -and $NativeSyncArgs.Count -gt 0) {
    foreach ($arg in $NativeSyncArgs) {
      switch ($arg) {
        "--dry-run" {
          if ($modeExplicit -and $mode -ne "--dry-run") {
            Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run [--no-stat]|--summary|--commit]"
            return 1
          }
          $mode = "--dry-run"
          $modeExplicit = $true
        }
        "--commit" {
          if ($modeExplicit -and $mode -ne "--commit") {
            Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run [--no-stat]|--summary|--commit]"
            return 1
          }
          $mode = "--commit"
          $modeExplicit = $true
        }
        "--summary" {
          if ($modeExplicit -and $mode -eq "--commit") {
            Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run [--no-stat]|--summary|--commit]"
            return 1
          }
          $mode = "--dry-run"
          $modeExplicit = $true
          $skipStat = $true
          $summaryExplicit = $true
        }
        "--no-stat" {
          $skipStat = $true
        }
        "--preserve-project-version" {
          $preserveProjectVersion = $true
        }
        "--domain-template" {
          $domainTemplateMode = $true
        }
        default {
          Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run [--no-stat]|--summary|--commit] [--preserve-project-version|--domain-template]"
          return 1
        }
      }
    }

    if ($mode -eq "--commit" -and $skipStat) {
      Write-Error "Usage: powershell -ExecutionPolicy Bypass -File scripts/sync-template.ps1 [--dry-run [--no-stat]|--summary|--commit]"
      return 1
    }

    if ($preserveProjectVersion -and $domainTemplateMode) {
      Write-Error "Usage: --preserve-project-version and --domain-template are mutually exclusive; pick one."
      return 1
    }
  }

  $displayMode = $mode
  if ($mode -eq "--dry-run" -and $skipStat) {
    if ($summaryExplicit) {
      $displayMode = "--summary"
    } else {
      $displayMode = "--dry-run --no-stat"
    }
  }

  $templateRemote = if ($env:TEMPLATE_REMOTE) { $env:TEMPLATE_REMOTE } else { "https://github.com/emily8421/ai-project-template.git" }
  $docStandardDocs = @(
  )

  Write-Host "==> PowerShell fallback template sync"
  Write-Host "Git Bash could not be started from PowerShell on this machine."
  Write-Host "Using native PowerShell fallback for $displayMode. Fix Git Bash/MSYS separately if you need Bash entrypoints."
  Write-Host ""

  Invoke-Git rev-parse --is-inside-work-tree | Out-Null

  Write-Host "==> Fetch template: $templateRemote (main)"
  & git fetch --no-tags --depth=1 $templateRemote main
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Fetch failed. Two common causes:"
    Write-Warning "  1) Template repo is private — check gh auth status or switch to an account with access."
    Write-Warning "  2) Network — restricted networks (e.g. direct GitHub from some regions) need a proxy. git fetch/push use the git proxy; gh needs separate env vars:"
    Write-Warning "       git config --local http.proxy http://127.0.0.1:<proxy-port>"
    Write-Warning "       git config --local https.proxy http://127.0.0.1:<proxy-port>"
    Write-Warning "       # gh does not read git http.proxy; pass env vars explicitly:"
    Write-Warning "       HTTPS_PROXY=http://127.0.0.1:<proxy-port> HTTP_PROXY=http://127.0.0.1:<proxy-port> gh ..."
    Write-Warning "  Direct-connect symptom: HTTPS reset (curl 16 framing / curl 52 empty reply). See git-guide.md section 5.7."
    return 1
  }

  $ref = "FETCH_HEAD"

  $lineageRole = Get-LineageRole
  if (-not $preserveProjectVersion -and -not $domainTemplateMode) {
    if ($lineageRole -eq "ordinary") {
      $preserveProjectVersion = $true
    } elseif ($lineageRole -eq "domain") {
      $domainTemplateMode = $true
    }
  } else {
    if ($lineageRole -eq "domain" -and $preserveProjectVersion) {
      Write-Error "Explicit --preserve-project-version conflicts with existing domain TEMPLATE-BASE.md (Lineage type: domain template). Use --domain-template instead."
      return 1
    }
    if ($lineageRole -eq "ordinary" -and $domainTemplateMode) {
      Write-Error "Explicit --domain-template conflicts with existing ordinary derived TEMPLATE-BASE.md (Lineage type: ordinary derived project). Use --preserve-project-version instead."
      return 1
    }
  }

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
  if ($preserveProjectVersion -or $domainTemplateMode) {
    $syncFiles = @(Remove-ProjectVersionFiles -SyncFiles $syncFiles)
  }
  if ($syncFiles.Count -eq 0) {
    Write-Error "Could not parse template-sync.json sync file list."
    return 1
  }

  $version = Get-TemplateVersion -Ref $ref
  Write-Host "==> Template version: $version"
  if ($preserveProjectVersion) {
    Write-Host "==> Ordinary derived project version mode: preserve local VERSION/CHANGELOG and update TEMPLATE-BASE.md"
  } elseif ($domainTemplateMode) {
    Write-Host "==> Domain template version mode: preserve domain VERSION/CHANGELOG and update TEMPLATE-BASE.md (domain lineage)"
  }
  if (Test-Path -LiteralPath ".github/workflows/template-check.yml" -PathType Leaf) {
    Write-Warning "Detected .github/workflows/template-check.yml. This workflow is for template repository self-checks; derived project PRs should not run scripts/check-template.sh. Migrate to .github/workflows/project-check.yml with git diff --check for normal PRs and scripts/check-derived-sync.sh HEAD only for template sync commits."
    Write-Host ""
  }
  Write-Host "==> Sync files:"

  if ($mode -eq "--dry-run") {
    $summary = @{
      Buckets = @{}
      Total   = @{ added = 0; modified = 0; deleted = 0; skipped = 0 }
    }
    $riskHits = New-Object System.Collections.Generic.List[string]

    foreach ($file in $syncFiles) {
      if (Test-GitObject -Ref $ref -Path $file) {
        if (Test-RemoteMatchesLocal -Ref $ref -RemotePath $file) {
          Write-Host "    = $file (no diff)"
        } else {
          Write-Host "    delta $file"
          if (Test-Path -LiteralPath $file -PathType Leaf) {
            Add-SummaryEntry -Summary $summary -RiskHits $riskHits -Path $file -Status "modified"
          } else {
            Add-SummaryEntry -Summary $summary -RiskHits $riskHits -Path $file -Status "added"
          }
        }
      } else {
        Write-Host "    skip $file (not in template)"
        Add-SummaryEntry -Summary $summary -RiskHits $riskHits -Path $file -Status "skipped"
      }
    }

    Write-Host ""
    Write-Host "INFO dry-run: preview only; workspace and index unchanged."
    Write-Host "   Direction: local current files -> template $version (changes that --commit would apply)"
    if ($preserveProjectVersion -or $domainTemplateMode) {
      $lineageModeLabel = "ordinary derived project"
      if ($domainTemplateMode) { $lineageModeLabel = "domain template" }
      if (Test-Path -LiteralPath "TEMPLATE-BASE.md" -PathType Leaf) {
        Write-Host "    delta TEMPLATE-BASE.md (template lineage, $lineageModeLabel)"
        Add-SummaryEntry -Summary $summary -RiskHits $riskHits -Path "TEMPLATE-BASE.md" -Status "modified"
      } else {
        Write-Host "    delta TEMPLATE-BASE.md (new template lineage, $lineageModeLabel)"
        Add-SummaryEntry -Summary $summary -RiskHits $riskHits -Path "TEMPLATE-BASE.md" -Status "added"
      }
    }
    if ($skipStat) {
      Write-Summary -Summary $summary -RiskHits $riskHits
    } else {
      Write-Host "   Diff stats:"
      foreach ($file in $syncFiles) {
        if ((Test-GitObject -Ref $ref -Path $file) -and -not (Test-RemoteMatchesLocal -Ref $ref -RemotePath $file)) {
          Show-TemplateDiffStat -Ref $ref -RemotePath $file -LocalPath $file
        }
      }
    }

    Write-Host ""
    Write-Host "==> doc-standards compatibility mirror (no docs/* mirror currently; 00-09 use standalone standards):"
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
  if ($domainTemplateMode) {
    Write-DomainTemplateBase -TemplateVersion $version -TemplateRemote $templateRemote
    Invoke-Git add TEMPLATE-BASE.md
    $updatedFiles.Add("TEMPLATE-BASE.md")
    Write-Host "    ok TEMPLATE-BASE.md (domain template lineage)"
  } elseif ($preserveProjectVersion) {
    Write-TemplateBase -TemplateVersion $version -TemplateRemote $templateRemote
    Invoke-Git add TEMPLATE-BASE.md
    $updatedFiles.Add("TEMPLATE-BASE.md")
    Write-Host "    ok TEMPLATE-BASE.md (template lineage)"
  }
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

  Write-Host "==> doc-standards compatibility mirror (no docs/* mirror currently; 00-09 use standalone standards):"
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
  & git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host "INFO no commit needed: sync files already match template."
    return 0
  }
  if ($LASTEXITCODE -ne 1) {
    throw "git diff --cached --quiet failed with exit code $LASTEXITCODE"
  }

  try {
    Invoke-Git commit -q -m "sync template $version from ai-project-template"
  } catch {
    Write-FallbackCommitRecoveryHint -Version $version
    throw
  }
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
  if ($preserveProjectVersion) {
    Write-Host "  6. Confirm project VERSION is still project-owned; inherited template version is in TEMPLATE-BASE.md"
  } elseif ($domainTemplateMode) {
    Write-Host "  6. Confirm domain template VERSION and CHANGELOG are still domain-owned; inherited base template version is in TEMPLATE-BASE.md (domain lineage)"
  }
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

    $fallbackExit = Invoke-NativeTemplateSync -NativeSyncArgs $SyncArgs
    exit $fallbackExit
  }

  $bashArgs = @("scripts/sync-template.sh") + $SyncArgs
  & $bash $bashArgs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
