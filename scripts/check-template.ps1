<#
Sync notice: 本文件由 ai-project-template 模板同步维护，派生项目同步时会被覆盖；不应直接修改，通用改进请经 _proposals/ 回流模板仓库。
check-template.ps1 - Windows PowerShell entrypoint for template self-check.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1

Notes:
  This script prefers Git Bash so Windows does not accidentally invoke WSL
  bash. If Git Bash cannot be started from PowerShell on this machine, it
  falls back to a MINIMAL native PowerShell structural check (file/dir
  existence, VERSION format, template-sync.json parse). Detailed content
  assertions mostly live in check-template.sh and run when Bash is available;
  the fallback mirrors only Windows-critical ownership guards that affect
  PowerShell sync behavior.
  For release, always rely on CI or the Bash self-check.
#>
$ErrorActionPreference = "Stop"

function Repair-ProcessPathEnvironment {
  $vars = [Environment]::GetEnvironmentVariables("Process")
  $pathKeys = @()
  foreach ($key in $vars.Keys) {
    if ([string]::Equals([string]$key, "Path", [StringComparison]::OrdinalIgnoreCase)) {
      $pathKeys += [string]$key
    }
  }
  if ($pathKeys.Count -le 1) { return }

  $orderedKeys = @()
  foreach ($key in $pathKeys) {
    if ($key -ceq "Path") { $orderedKeys += $key }
  }
  foreach ($key in $pathKeys) {
    if ($key -cne "Path") { $orderedKeys += $key }
  }

  $separator = [string][System.IO.Path]::PathSeparator
  $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
  $parts = New-Object 'System.Collections.Generic.List[string]'
  foreach ($key in $orderedKeys) {
    $value = [Environment]::GetEnvironmentVariable($key, "Process")
    if ([string]::IsNullOrWhiteSpace($value)) { continue }
    foreach ($part in ([string]$value -split [regex]::Escape($separator))) {
      if ([string]::IsNullOrWhiteSpace($part)) { continue }
      if ($seen.Add($part)) {
        $parts.Add($part) | Out-Null
      }
    }
  }

  foreach ($key in $pathKeys) {
    if ($key -cne "Path") {
      [Environment]::SetEnvironmentVariable($key, $null, "Process")
    }
  }
  if ($parts.Count -gt 0) {
    [Environment]::SetEnvironmentVariable("Path", [string]::Join($separator, $parts), "Process")
  }
}

Repair-ProcessPathEnvironment

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
    try {
      $proc = Start-Process -FilePath $BashPath `
        -ArgumentList "--version" `
        -NoNewWindow `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $stdoutFile `
        -RedirectStandardError $stderrFile
    }
    catch {
      return [pscustomobject]@{
        Ready    = $false
        ExitCode = -1
        StdOut   = ''
        StdErr   = "Start-Process failed: $($_.Exception.Message)"
      }
    }

    if ($null -eq $proc) {
      return [pscustomobject]@{ Ready = $false; ExitCode = -1; StdOut = ''; StdErr = 'Start-Process returned null (bash failed to start from PowerShell)' }
    }

    $stdout = ""
    if (Test-Path $stdoutFile) {
      $stdoutRaw = Get-Content $stdoutFile -Raw
      if ($null -ne $stdoutRaw) {
        $stdout = $stdoutRaw.Trim()
      }
    }

    $stderr = ""
    if (Test-Path $stderrFile) {
      $stderrRaw = Get-Content $stderrFile -Raw
      if ($null -ne $stderrRaw) {
        $stderr = $stderrRaw.Trim()
      }
    }

    return [pscustomobject]@{
      Ready    = ($proc.ExitCode -eq 0)
      ExitCode = $proc.ExitCode
      StdOut   = $stdout
      StdErr   = $stderr
    }
  }
  finally {
    Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-NativeTemplateCheck {
  param([string]$Root)

  $script:NativeFailures = 0

  function Pass {
    param([string]$Message)
    Write-Host ("OK  " + $Message)
  }

  function Fail {
    param([string]$Message)
    Write-Error $Message -ErrorAction Continue
    $script:NativeFailures++
  }

  function Require-File {
    param([string]$RelativePath)
    $fullPath = Join-Path $Root $RelativePath
    if (Test-Path $fullPath -PathType Leaf) {
      Pass ("file exists: " + $RelativePath)
    } else {
      Fail ("missing file: " + $RelativePath)
    }
  }

  function Require-Dir {
    param([string]$RelativePath)
    $fullPath = Join-Path $Root $RelativePath
    if (Test-Path $fullPath -PathType Container) {
      Pass ("directory exists: " + $RelativePath)
    } else {
      Fail ("missing directory: " + $RelativePath)
    }
  }

  function Require-Contains {
    param(
      [string]$RelativePath,
      [string]$Pattern,
      [string]$Message
    )

    $fullPath = Join-Path $Root $RelativePath
    if (-not (Test-Path $fullPath -PathType Leaf)) {
      Fail ($Message + " (missing file: " + $RelativePath + ")")
      return
    }

    # Select-String uses .NET regular expressions: use | for alternation and
    # escape regex metacharacters only when matching them literally.
    if (Select-String -Path $fullPath -Pattern $Pattern -Quiet) {
      Pass $Message
    } else {
      Fail ($Message + " (file: " + $RelativePath + "; expected .NET regex pattern: " + $Pattern + ")")
    }
  }

  function Get-SyncFiles {
    $syncPath = Join-Path $Root "template-sync.json"
    $json = Get-Content $syncPath -Raw -Encoding UTF8 | ConvertFrom-Json
    # 三组并集（files_all 为主；files_ordinary / files_domain 补充），向后兼容仅有旧 "files" 键的 json。
    # PS 5.1 ConvertFrom-Json 无 -AsHashtable，用 PSObject.Properties.Name 判键。
    $keys = $json.PSObject.Properties.Name
    $all = @()
    if ($keys -contains "files_all") { $all += @($json.files_all) }
    elseif ($keys -contains "files") { $all += @($json.files) }  # legacy fallback
    if ($keys -contains "files_ordinary") { $all += @($json.files_ordinary) }
    if ($keys -contains "files_domain") { $all += @($json.files_domain) }
    $seen = @{}
    $unique = @()
    foreach ($f in $all) { if (-not $seen.ContainsKey($f)) { $seen[$f] = $true; $unique += $f } }
    return $unique
  }

  Write-Host "==> PowerShell fallback template check"
  Write-Host "Git Bash could not be started from PowerShell on this machine."
  Write-Host "Running a MINIMAL native structural check instead."
  Write-Host ""
  Write-Host "Note: This fallback only checks structural integrity (key files/dirs exist,"
  Write-Host "      VERSION format, template-sync.json parses) plus Windows-critical"
  Write-Host "      ownership guards. For release, always rely on CI or the Bash self-check."

  # --- Structural existence: key files ---
  foreach ($path in @(
      "README.md",
      "template-docs/beginner-guide.md",
      "template-docs/scenario-guides.md",
      "template-docs/env-setup.md",
      "template-docs/ai-cli-setup.md",
      "template-docs/smoke-test.md",
      "template-docs/smoke-test-report-template.md",
      "template-docs/template-methodology.md",
      "template-docs/web-fullstack-profile.md",
      "CHANGELOG.md",
      "CHANGELOG-PLAIN.md",
      "VERSION",
      "template-sync.json",
      "AGENTS.md",
      "CLAUDE.md",
      ".cursor/rules/project-rules.mdc",
      "ai/index.md",
      "ai/rules-core.md",
      "ai/global-rules.md",
      "ai/document-lifecycle-rules.md",
      "ai/implementation-lifecycle-rules.md",
      "ai/project-rules.md",
      "ai/commands/scenario.md",
      "ai/commands/docs-evaluation.md",
      "docs/README.md",
      "docs/env/README.md",
      "docs/inputs/README.md",
      "scripts/check-prereqs.ps1",
      "scripts/bootstrap-dev-env.ps1",
      "scripts/collect-env.ps1",
      "scripts/check-github-context.ps1",
      "scripts/new-project.sh",
      "scripts/sync-template.sh",
      "scripts/check-template.sh",
      "scripts/check-markdown-clean.ps1"
    )) {
    Require-File $path
  }

  # --- Structural existence: key directories ---
  foreach ($dir in @(
      "docs",
      "docs/env",
      "docs/inputs",
      "docs/design",
      "docs/decisions",
      "docs/research",
      "docs/meetings",
      "docs/archive"
    )) {
    Require-Dir $dir
  }

  # --- Structural: VERSION format ---
  $version = (Get-Content (Join-Path $Root "VERSION") -Raw -Encoding UTF8).Trim()
  if ($version -match '^v\d+\.\d+\.\d+$') {
    Pass ("VERSION uses semantic format: " + $version)
  } else {
    Fail "VERSION does not use vMAJOR.MINOR.PATCH"
  }

  # Detailed content assertions mostly live in check-template.sh and run when
  # Bash is available. Keep this fallback minimal; only mirror Windows-critical
  # ownership guards that affect PowerShell sync behavior.

  # --- Structural: template-sync.json parses and lists existing files ---
  $syncFiles = Get-SyncFiles
  if ($syncFiles.Count -gt 0) {
    Pass "template-sync.json parsed successfully"
  } else {
    Fail "template-sync.json did not return any files"
  }

  foreach ($syncFile in $syncFiles) {
    Require-File $syncFile
    # VERSION 是纯版本号，豁免（其“会被覆盖”语义由 template-sync.json description 承载）
    if ($syncFile -eq "VERSION") { continue }
    if ($syncFile -like "*.md" -or $syncFile -like "*.mdc" -or $syncFile -like "*.sh" -or $syncFile -like "*.ps1") {
      Require-Contains $syncFile "Sync notice" ($syncFile + " contains sync notice")
    }
  }

  # --- Structural: files_domain 非重叠（领域文件不得跨组重复，v1.60.0）---
  $syncJson = Get-Content (Join-Path $Root "template-sync.json") -Raw -Encoding UTF8 | ConvertFrom-Json
  $syncKeys = $syncJson.PSObject.Properties.Name
  if ($syncKeys -contains "files_domain" -and @($syncJson.files_domain).Count -gt 0) {
    $otherFiles = @()
    if ($syncKeys -contains "files_all") { $otherFiles += @($syncJson.files_all) }
    elseif ($syncKeys -contains "files") { $otherFiles += @($syncJson.files) }
    if ($syncKeys -contains "files_ordinary") { $otherFiles += @($syncJson.files_ordinary) }
    foreach ($df in @($syncJson.files_domain)) {
      if ($otherFiles -contains $df) {
        Fail ($df + " appears in files_domain and another group (must be exclusive)")
      } else {
        Pass ($df + " only in files_domain (no overlap)")
      }
    }
  }

  Require-Contains "AGENTS.md" "Sync notice" "AGENTS.md contains sync notice"
  Require-Contains "CLAUDE.md" "Sync notice" "CLAUDE.md contains sync notice"
  Require-Contains ".cursor/rules/project-rules.mdc" "Sync notice" "Cursor rules contain sync notice"
  Require-Contains "scripts/sync-template.sh" 'VERSION\|CHANGELOG\.md\|CHANGELOG-PLAIN\.md' "sync-template Bash preserves project-owned CHANGELOG-PLAIN.md"
  Require-Contains "scripts/sync-template.ps1" '\$_ -ne "CHANGELOG-PLAIN\.md"' "sync-template PowerShell fallback preserves project-owned CHANGELOG-PLAIN.md"
  Require-Contains "scripts/sync-template.sh" 'sync_upstream_changelog_references' "sync-template Bash generates upstream changelog references"
  Require-Contains "scripts/sync-template.ps1" 'Write-UpstreamChangelogReference' "sync-template PowerShell fallback generates upstream changelog references"
  Require-Contains "scripts/check-derived-sync.sh" 'upstream/CHANGELOG\.md\|upstream/CHANGELOG-PLAIN\.md' "check-derived-sync Bash allows only upstream changelog references"
  Require-Contains "scripts/check-derived-sync.ps1" 'upstream/CHANGELOG-PLAIN\.md' "check-derived-sync PowerShell fallback allows upstream changelog references"
  Require-Contains "scripts/check-template.ps1" 'Repair-ProcessPathEnvironment' "check-template PowerShell repairs duplicate PATH keys"
  Require-Contains "scripts/sync-template.ps1" 'Repair-ProcessPathEnvironment' "sync-template PowerShell repairs duplicate PATH keys"
  Require-Contains "scripts/check-derived-sync.ps1" 'Repair-ProcessPathEnvironment' "check-derived-sync PowerShell repairs duplicate PATH keys"
  Require-Contains "template-docs/remote-ci-sop-profile.md" 'Invoke-WebRequest' "Remote / CI profile recommends raw REST JSON on Windows"
  Require-Contains "scripts/new-project.sh" 'CHANGELOG-PLAIN\.md' "new-project initializes project-owned CHANGELOG-PLAIN.md"
  Require-Contains ".gitignore" '\.ai/token-hotspots/' ".gitignore excludes local token hotspot records"
  Require-Contains "ai/session-rules.md" '\.ai/token-hotspots/' "session-rules defines local token hotspot path"
  Require-Contains "ai/session-rules.md" 'ai-records/token-hotspots/SUMMARY\.md' "session-rules defines token hotspot summary path"
  Require-Contains "MAINTAINERS.md" '\.ai/token-hotspots/' "MAINTAINERS distinguishes local token hotspot records"
  Require-Contains "template-docs/rd-data-chain.md" '\.ai/token-hotspots/' "rd-data-chain distinguishes local token hotspot records"
  Require-Contains "template-docs/domain-templates.md" 'L2-to-L3 playbook' "domain-templates defines L2-to-L3 playbook"
  Require-Contains "template-docs/domain-templates.md" 'domain-derived-scenarios-template\.md' "domain-templates points to L2-to-L3 playbook template"
  Require-Contains "template-docs/domain-derived-scenarios-template.md" 'L2-to-L3 playbook template' "domain-derived scenarios template defines stable role"
  Require-Contains "template-docs/domain-derived-scenarios-template.md" 'domain-derived-scenarios\.md' "domain-derived scenarios template documents copy target"
  Require-Contains "template-sync.json" 'domain-derived-scenarios-template\.md' "template-sync includes domain-derived scenarios template"
  Require-Contains "scripts/sync-template.sh" 'domain-derived-scenarios-template\.md' "Bash fallback includes domain-derived scenarios template"
  Require-Contains "template-docs/scenario-guides.md" 'L2-to-L3 playbook' "scenario-guides contains L2-to-L3 playbook routing"
  Require-Contains "template-docs/scenario-guides.md" 'domain-derived-scenarios\.md' "scenario-guides points to domain-derived scenarios"
  Require-Contains "template-docs/scenario-guides.md" 'domain-derived-scenarios-template\.md' "scenario-guides points to L2-to-L3 playbook template"
  Require-Contains "ai/commands/domain-template-lab.md" 'L2-to-L3 playbook' "domain-template-lab command requires L2-to-L3 playbook"
  Require-Contains "ai/commands/domain-template-lab.md" 'domain-derived-scenarios-template\.md' "domain-template-lab command points to L2-to-L3 playbook template"
  Require-Contains "ai/prompts/maintainers/23-domain-template-lab.md" 'L2-to-L3 playbook' "domain-template-lab prompt lists L2-to-L3 playbook asset"
  Require-Contains "ai/prompts/maintainers/23-domain-template-lab.md" 'domain-derived-scenarios-template\.md' "domain-template-lab prompt points to L2-to-L3 playbook template"
  Require-Contains "ai/commands/new-project.md" 'L2-to-L3 playbook' "new-project command routes domain-derived project creation"
  Require-Contains "ai/commands/sync-methodology.md" 'L2-to-L3 playbook' "sync-methodology command routes domain overlay sync"
  Require-Contains "ai/commands/submit-proposal.md" 'adjacent-layer upstream' "submit-proposal command defines adjacent-layer proposal flow"
  Require-Contains "ai/commands/submit-feedback.md" 'adjacent-layer upstream' "submit-feedback command defines adjacent-layer feedback flow"

  Write-Host ""
  if ($script:NativeFailures -eq 0) {
    Write-Host "OK: PowerShell fallback template check passed"
    return 0
  }

  Write-Host ("FAIL: PowerShell fallback template check found " + $script:NativeFailures + " issue(s)")
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

    $fallbackExit = Invoke-NativeTemplateCheck -Root $root
    exit $fallbackExit
  }

  & $bash "scripts/check-template.sh"
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
