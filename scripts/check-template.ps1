<#
check-template.ps1 - Windows PowerShell entrypoint for template self-check.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-template.ps1

Notes:
  This script prefers Git Bash so Windows does not accidentally invoke WSL
  bash. If Git Bash cannot be started from PowerShell on this machine, it
  falls back to a native PowerShell structural check.
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

    if (Select-String -Path $fullPath -Pattern $Pattern -Quiet) {
      Pass $Message
    } else {
      Fail $Message
    }
  }

  function Get-SyncFiles {
    $syncPath = Join-Path $Root "template-sync.json"
    $json = Get-Content $syncPath -Raw -Encoding UTF8 | ConvertFrom-Json
    return @($json.files)
  }

  Write-Host "==> PowerShell fallback template check"
  Write-Host "Git Bash could not be started from PowerShell on this machine."
  Write-Host "Running a native structural subset check instead."
  Write-Host ""

  foreach ($path in @(
      "README.md",
      "template-docs/beginner-guide.md",
      "template-docs/scenario-guides.md",
      "template-docs/env-setup.md",
      "template-docs/ai-cli-setup.md",
      "template-docs/smoke-test.md",
      "template-docs/smoke-test-report-template.md",
      "template-docs/template-methodology.md",
      "CHANGELOG.md",
      "VERSION",
      "template-sync.json",
      "AGENTS.md",
      "CLAUDE.md",
      ".cursor/rules/project-rules.mdc",
      "ai/index.md",
      "ai/global-rules.md",
      "ai/document-lifecycle-rules.md",
      "ai/project-rules.md",
      "ai/commands/scenario.md",
      "docs/README.md",
      "docs/env/README.md",
      "docs/inputs/README.md",
      "scripts/check-prereqs.ps1",
      "scripts/bootstrap-dev-env.ps1",
      "scripts/collect-env.ps1",
      "scripts/new-project.sh",
      "scripts/sync-template.sh",
      "scripts/check-template.sh"
    )) {
    Require-File $path
  }

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

  $version = (Get-Content (Join-Path $Root "VERSION") -Raw -Encoding UTF8).Trim()
  if ($version -match '^v\d+\.\d+\.\d+$') {
    Pass ("VERSION uses semantic format: " + $version)
  } else {
    Fail "VERSION does not use vMAJOR.MINOR.PATCH"
  }

  Require-Contains "CHANGELOG.md" ([regex]::Escape($version)) "CHANGELOG includes current VERSION"
  Require-Contains "README.md" "template-docs/env-setup\.md" "README includes environment setup entry"
  Require-Contains "README.md" "template-docs/smoke-test\.md" "README includes smoke test entry"
  Require-Contains "README.md" "newbie AI CLI onboarding path" "README includes AI CLI onboarding path"
  Require-Contains "README.md" "scripts/check-prereqs\.ps1" "README starts with prerequisite check"
  Require-Contains "README.md" "bash scripts/new-project\.sh my-demo --visibility private" "README includes default project creation path"
  Require-Contains "README.md" "smoke-demo --local --no-remote" "README keeps local smoke-test path in maintainer section"
  Require-Contains "template-docs/beginner-guide.md" "scripts/bootstrap-dev-env\.ps1" "BEGINNER-GUIDE includes beginner environment decision path"
  Require-Contains "template-docs/beginner-guide.md" "scripts/check-prereqs\.ps1" "BEGINNER-GUIDE starts with prerequisite check"
  Require-Contains "template-docs/beginner-guide.md" "newbie AI CLI onboarding path" "BEGINNER-GUIDE includes AI CLI onboarding path"
  Require-Contains "template-docs/beginner-guide.md" "template-docs/smoke-test\.md" "BEGINNER-GUIDE includes smoke test entry"
  Require-Contains "template-docs/ai-cli-setup.md" "newbie AI CLI onboarding path" "AI-CLI-SETUP includes first-run template prompt"
  Require-Contains "template-docs/env-setup.md" "OK: all required items are present" "ENV-SETUP includes beginner decision table"
  Require-Contains "template-docs/env-setup.md" "bootstrap-dev-env\.ps1" "ENV-SETUP includes bootstrap script"
  Require-Contains "template-docs/env-setup.md" "check-prereqs\.ps1" "ENV-SETUP includes prerequisite check script"
  Require-Contains "template-docs/smoke-test.md" "Suggested next steps" "SMOKE-TEST keeps environment check first"
  Require-Contains "template-docs/smoke-test.md" "scripts/check-prereqs\.ps1" "SMOKE-TEST includes prerequisite check step"
  Require-Contains "template-docs/smoke-test.md" "scripts/new-project\.sh smoke-demo --local --no-remote" "SMOKE-TEST includes local smoke project creation"
  Require-Contains "template-docs/smoke-test.md" "scripts/collect-env\.ps1" "SMOKE-TEST includes environment collection step"
  Require-Contains "docs/env/README.md" "template-docs/env-setup\.md" "docs/env README includes environment setup entry"
  Require-Contains "scripts/new-project.sh" "template-docs/env-setup\.md" "new-project README template includes environment setup entry"
  Require-Contains "scripts/new-project.sh" "check-prereqs\.ps1" "new-project README template includes prerequisite check step"
  Require-Contains "scripts/new-project.sh" "newbie AI CLI onboarding path" "new-project README template includes AI CLI onboarding path"
  Require-Contains "scripts/check-prereqs.ps1" "Git Bash" "check-prereqs checks Git Bash"
  Require-Contains "scripts/sync-template.ps1" "Invoke-NativeTemplateSync" "sync-template PowerShell fallback exists"
  Require-Contains "scripts/check-derived-sync.ps1" "Invoke-NativeDerivedSyncCheck" "check-derived-sync PowerShell fallback exists"
  Require-Contains "README.md" "PowerShell fallback" "README documents PowerShell fallback"
  Require-Contains "template-docs/derived-sync-report-template.md" "PowerShell fallback" "sync report records PowerShell fallback"
  Require-Contains "scripts/bootstrap-dev-env.ps1" "Git\.Git" "bootstrap script installs Git for Windows"
  Require-Contains "scripts/bootstrap-dev-env.ps1" "GitHub\.cli" "bootstrap script installs GitHub CLI"
  Require-Contains "ai/commands/scenario.md" "scenario-guides\.md" "scenario command routes to scenario-guides"
  Require-Contains "README.md" "scenario-guides" "README points to scenario-guides"
  Require-Contains "ai/document-lifecycle-rules.md" "mermaid" "document-lifecycle defaults diagrams to mermaid"
  Require-Contains "ai/project-rules.md" "mermaid" "project-rules includes diagram format preference"

  $syncFiles = Get-SyncFiles
  if ($syncFiles.Count -gt 0) {
    Pass "template-sync.json parsed successfully"
  } else {
    Fail "template-sync.json did not return any files"
  }

  foreach ($syncFile in $syncFiles) {
    Require-File $syncFile
    if ($syncFile -like "*.md") {
      Require-Contains $syncFile "Sync notice" ($syncFile + " contains sync notice")
    }
  }

  Require-Contains "AGENTS.md" "Sync notice" "AGENTS.md contains sync notice"
  Require-Contains "CLAUDE.md" "Sync notice" "CLAUDE.md contains sync notice"
  Require-Contains ".cursor/rules/project-rules.mdc" "Sync notice" "Cursor rules contain sync notice"

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
