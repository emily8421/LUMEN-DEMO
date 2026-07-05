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
  Write-Host "Note: This is a structural fallback check, not equivalent to the full"
  Write-Host "      template self-check. For release, always rely on CI or Bash self-check."

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
  Require-Contains "README.md" "scenario-guides" "README quick start points to scenario-guides"
  Require-Contains "README.md" "SOP\.md" "README quick start points to SOP"
  Require-Contains "README.md" "template-docs/beginner-guide\.md" "README quick start points to beginner guide"
  Require-Contains "README.md" "template-docs/ai-cli-setup\.md" "README includes AI CLI setup entry"
  Require-Contains "README.md" "scripts/check-prereqs\.ps1" "README starts with prerequisite check"
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
  Require-Contains "SOP.md" "PowerShell fallback" "SOP documents PowerShell fallback"
  Require-Contains "MAINTAINERS.md" "PowerShell native fallback" "MAINTAINERS documents PowerShell fallback"
  Require-Contains "template-docs/derived-sync-report-template.md" "PowerShell fallback" "sync report records PowerShell fallback"
  Require-Contains "scripts/bootstrap-dev-env.ps1" "Git\.Git" "bootstrap script installs Git for Windows"
  Require-Contains "scripts/bootstrap-dev-env.ps1" "GitHub\.cli" "bootstrap script installs GitHub CLI"
  Require-Contains "ai/commands/scenario.md" "scenario-guides\.md" "scenario command routes to scenario-guides"
  Require-Contains "README.md" "scenario-guides" "README points to scenario-guides"
  Require-Contains "ai/document-lifecycle-rules.md" "mermaid" "document-lifecycle defaults diagrams to mermaid"
  Require-Contains "ai/document-lifecycle-rules.md" "Inputs-first" "document-lifecycle defines inputs-first mode"
  Require-Contains "ai/document-lifecycle-rules.md" "input-review-report\.md" "document-lifecycle defines vision readiness review"
  Require-Contains "docs/README.md" "input-review-report\.md" "docs README defines inputs review report"
  Require-Contains "docs/inputs/README.md" "input-review-report\.md" "docs inputs README defines input review report"
  Require-Contains "ai/prompts/docs/01-review-inputs.md" "Product Vision" "input review prompt checks Product Vision readiness"
  Require-Contains "ai/prompts/docs/01-review-inputs.md" "input-review-report\.md" "input review prompt includes minimal supplement checklist"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "Not Ready" "generate docs prompt blocks not-ready input"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "product-vision\.md" "generate docs prompt creates product vision first"
  Require-Contains "ai/commands/docs-evaluation.md" "Go" "docs-evaluation command defines Go conclusion"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "Go" "docs-evaluation prompt defines Go conclusion"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "E1" "docs-evaluation prompt defines phase evaluation codes"
  Require-Contains "template-sync.json" "ai/commands/docs-evaluation\.md" "template-sync includes docs-evaluation command"
  Require-Contains "template-sync.json" "ai/prompts/review/19-docs-evaluation\.md" "template-sync includes docs-evaluation prompt"
  Require-Contains "template-docs/scenario-guides.md" "docs-evaluation" "scenario guides include docs-evaluation"
  Require-Contains "ai/document-lifecycle-rules.md" "E1" "document lifecycle includes evaluation codes"
  Require-Contains "ai/implementation-lifecycle-rules.md" "Conditional Go" "implementation lifecycle references evaluation result"
  Require-Contains "ai/global-rules.md" "AI" "global rules mentions AI recommendations"
  Require-Contains "ai/document-lifecycle-rules.md" "C-001" "document lifecycle defines confirmation item structure"
  Require-Contains "ai/session-rules.md" "AI" "session rules define confirmation item structure"
  Require-Contains "ai/doc-standards/README.md" "AI" "doc standards define confirmation item recommendations"
  Require-Contains "ai/commands/README.md" "AI" "commands README mentions confirmation recommendations"
  Require-Contains "docs/03-prd.md" "C-001" "docs templates include structured confirmation items"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "AI" "docs checklist validates confirmation recommendations"
  Require-Contains "ai/global-rules.md" "frontend-interaction\.md" "global-rules defines frontend interaction design path"
  Require-Contains "ai/document-lifecycle-rules.md" "前端交互设计触发规则" "document lifecycle defines frontend interaction trigger rules"
  Require-Contains "docs/README.md" "docs/design/frontend-interaction\.md" "docs README defines frontend interaction design path"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "docs/design/frontend-interaction\.md" "generate docs prompt handles frontend interaction design"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "前端交互设计" "docs checklist validates frontend interaction design"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "前端交互" "docs system audit validates frontend interaction design"
  Require-Contains "template-docs/scenario-guides.md" "补前端交互设计" "scenario guides route frontend interaction design requests"
  Require-Contains "ai/commands/tech-env-evaluation.md" "技术环境评估" "tech-env-evaluation command exists"
  Require-Contains "ai/prompts/review/20-tech-env-evaluation.md" "No-Go" "tech-env-evaluation prompt defines No-Go conclusion"
  Require-Contains "template-sync.json" "ai/commands/tech-env-evaluation\.md" "template-sync includes tech-env-evaluation command"
  Require-Contains "template-sync.json" "ai/prompts/review/20-tech-env-evaluation\.md" "template-sync includes tech-env-evaluation prompt"
  Require-Contains "ai/document-lifecycle-rules.md" "tech-env-evaluation" "document lifecycle references tech env evaluation"
  Require-Contains "ai/implementation-lifecycle-rules.md" "真实运行依赖" "implementation lifecycle gates real runtime dependencies"
  Require-Contains "ai/prompts/setup/13-collect-env.md" "不替代技术路线" "collect-env prompt distinguishes collection from evaluation"
  Require-Contains "docs/05-tech-spec.md" "技术环境评估结论" "05 tech spec includes tech env evaluation result section"
  Require-Contains "docs/09-verification.md" "技术环境评估验证" "09 verification includes tech env evaluation verification"
  Require-Contains "template-docs/scenario-guides.md" "A8.5 技术路线与环境支撑评估" "scenario guides route tech env evaluation"
  Require-Contains "ai/index.md" "ai/implementation-lifecycle-rules\.md" "ai/index includes implementation lifecycle rules"
  Require-Contains "ai/global-rules.md" "ai/implementation-lifecycle-rules\.md" "global-rules points to implementation lifecycle rules"
  Require-Contains "ai/implementation-lifecycle-rules.md" "Phase" "implementation lifecycle defines Phase layer"
  Require-Contains "ai/implementation-lifecycle-rules.md" "Test Case" "implementation lifecycle defines test case layer"
  Require-Contains "ai/implementation-lifecycle-rules.md" "Commit / PR" "implementation lifecycle defines commit and PR layer"
  Require-Contains "docs/08-dev-plan.md" "Test Case" "08 dev plan defines test case traceability"
  Require-Contains "docs/08-dev-plan.md" "tasks/task-00X-xxx\.md" "08 dev plan includes task split file path"
  Require-Contains "docs/09-verification.md" "TC-ID" "09 verification includes test case evidence"
  Require-Contains "docs/09-verification.md" "BUG-001" "09 verification includes bug regression record"
  Require-Contains "ai/prompts/planning/19-plan-phases-and-sprints.md" "docs/08-dev-plan\.md" "A9 planning prompt outputs 08 draft"
  Require-Contains "ai/prompts/planning/19-plan-phases-and-sprints.md" "docs/09-verification\.md" "A9 planning prompt outputs 09 draft"
  Require-Contains "template-docs/scenario-guides.md" "M0" "scenario guides include M0 help entry"
  Require-Contains "template-docs/scenario-guides.md" "19-plan-phases-and-sprints" "scenario guides point A9 to planning prompt"
  Require-Contains "template-docs/scenario-guides.md" "check-derived-sync" "scenario guides describe derived sync validation"
  Require-Contains "ai/prompts/dev/02-run-task.md" "Test Case" "run task prompt requires test case traceability"
  Require-Contains "ai/prompts/dev/09-sprint-summary.md" "docs/09-verification\.md" "sprint summary prompt writes verification record"
  Require-Contains "template-docs/beginner-guide.md" "ai/implementation-lifecycle-rules\.md" "beginner guide points to implementation lifecycle"
  Require-Contains "ai/project-rules.md" "CLI" "project rules mention CLI permission boundary"
  Require-Contains "ai/project-rules.md" "git diff" "project rules mention git diff audit"
  Require-Contains "template-docs/ai-cli-setup.md" "approval" "AI CLI setup mentions approval mode"
  Require-Contains "template-docs/ai-cli-setup.md" "sandbox" "AI CLI setup mentions sandbox mode"
  Require-Contains "ai/prompts/dev/02-run-task.md" "git status" "run task prompt asks for git status summary"
  Require-Contains "ai/prompts/dev/05-fix-bug.md" "git status" "fix bug prompt asks for git status summary"
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
