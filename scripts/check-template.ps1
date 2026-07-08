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

  function Require-Absent-Contains {
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
      Fail $Message
    } else {
      Pass $Message
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
      "scripts/check-github-context.ps1",
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
  Require-Contains "CHANGELOG.md" "版本是发布边界，不是提案数量边界" "CHANGELOG explains version as release boundary"
  Require-Contains "CONTRIBUTING.md" "提案收件箱增长不触发版本递增" "CONTRIBUTING separates proposal inbox from version bumps"
  Require-Contains "CONTRIBUTING.md" "Release impact" "CONTRIBUTING includes release impact decision"
  Require-Contains "CONTRIBUTING.md" "同主题小改可聚合为同一个版本发布" "CONTRIBUTING explains themed release aggregation"
  Require-Contains "MAINTAINERS.md" "Release impact" "MAINTAINERS checks release impact"
  Require-Contains "MAINTAINERS.md" "Release strategy" "MAINTAINERS checks release strategy"
  Require-Contains "_proposals/README.md" "Release impact" "_proposals README documents release impact field"
  Require-Contains "_proposals/README.md" "Release strategy" "_proposals README documents release strategy field"
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
  Require-Contains "scripts/check-github-context.ps1" "gh auth status" "GitHub context preflight checks gh auth status"
  Require-Contains "git-guide.md" "scripts/check-github-context\.ps1" "git-guide documents GitHub context preflight"
  Require-Contains "SOP.md" "check-github-context\.ps1" "SOP includes GitHub context preflight command"
  Require-Contains "ai/commands/submit-proposal.md" "--body-file" "submit-proposal uses body-file for Markdown issue body"
  Require-Contains "ai/prompts/maintainers/17-submit-proposal.md" "--body-file" "submit-proposal prompt uses body-file"
  Require-Contains "ai/prompts/maintainers/17-submit-proposal.md" "来源标签缺失" "submit-proposal prompt handles missing source label"
  Require-Contains "ai/prompts/maintainers/17-submit-proposal.md" "半成品 issue" "submit-proposal prompt checks partial issue after failure"
  Require-Contains "scripts/sync-template.ps1" "Invoke-NativeTemplateSync" "sync-template PowerShell fallback exists"
  Require-Contains "scripts/check-derived-sync.ps1" "Invoke-NativeDerivedSyncCheck" "check-derived-sync PowerShell fallback exists"
  Require-Contains "scripts/sync-template.ps1" "Get-GitUtf8Text" "sync-template PowerShell fallback decodes Git output as UTF-8"
  Require-Contains "scripts/check-derived-sync.ps1" "Get-GitUtf8Text" "check-derived-sync PowerShell fallback decodes Git output as UTF-8"
  Require-Contains "scripts/check-derived-sync.ps1" "param\(\[string\[\]\]\`$CheckArgs\)" "check-derived-sync fallback avoids ambiguous Args parameter name"
  Require-Contains "scripts/check-derived-sync.ps1" "<sync-commit>" "check-derived-sync PowerShell entry documents explicit sync commit"
  Require-Contains "scripts/check-derived-sync.sh" "<sync-commit>" "check-derived-sync Bash entry documents explicit sync commit"
  Require-Contains "scripts/check-derived-sync.sh" "merge commit" "check-derived-sync Bash entry warns about merge commits"
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
  Require-Contains "template-docs/scenario-guides.md" "完整闭环说法" "A13 scenario includes complete-closure wording"
  Require-Contains "template-docs/scenario-guides.md" "sync-methodology → post-sync-cleanup → docs-system-audit → 提案回流收口 → 同步报告留痕" "A13 complete-closure wording lists key steps"
  Require-Contains "ai/commands/README.md" "A13 完整闭环" "commands README sync-methodology entry mentions A13 complete closure"
  Require-Contains "_proposals/README.md" "PSObject\.Properties\['pull_request'\]" "proposal README documents robust GitHub issue filtering"
  Require-Contains "_proposals/README.md" "列表 \+ 单项状态复核" "proposal README requires list and single issue state recheck"
  Require-Contains "ai/prompts/maintainers/11-template-proposal-summary.md" "单项状态复核" "proposal summary prompt requires single issue state recheck"
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
  Require-Contains "_proposals/README.md" "_proposals/_remote-issues/" "proposal inbox documents remote issue mirror directory"
  Require-Contains "_proposals/README.md" "镜像硬门禁" "proposal README defines remote issue mirror hard gate"
  Require-Contains "_proposals/README.md" "不得把未落盘正文直接作为" "proposal README forbids analyzing unmirrored remote issue body"
  Require-Contains "_proposals/README.md" "必须引用本地镜像路径" "proposal README requires local mirror path as analysis source"
  Require-Contains "ai/commands/template-proposal-summary.md" "_proposals/_remote-issues/issue-<number>\.md" "template-proposal-summary command mirrors remote issues before analysis"
  Require-Contains "ai/commands/template-proposal-summary.md" "没有本地镜像路径的 issue 不得进入正文分析" "template-proposal-summary command blocks analysis without mirror path"
  Require-Contains "ai/prompts/maintainers/11-template-proposal-summary.md" "一批一范围、报告先行、事实与模板分离、去重可审计、可续接" "proposal summary prompt defines Batch governance principles"
  Require-Contains "ai/prompts/maintainers/11-template-proposal-summary.md" "issue 镜像刷新结果与本地镜像路径清单" "proposal summary prompt outputs local mirror path list"
  Require-Contains "template-docs/scenario-guides.md" "生成整个文档体系" "scenario guides route full docs generation through A6"
  Require-Contains "template-docs/scenario-guides.md" "镜像路径确认后再分析" "scenario guides require C1 mirror path confirmation before analysis"
  Require-Contains "ai/document-lifecycle-rules.md" "## 7\.1 横切状态词典" "document lifecycle defines cross-cutting status dictionary"
  Require-Contains "ai/document-lifecycle-rules.md" "## 6\.2 待确认事项总览" "document lifecycle defines open item overview"
  Require-Contains "ai/document-lifecycle-rules.md" "## 10\.1 文档体系生成总控最低规则" "document lifecycle defines docs generation control rule"
  Require-Contains "ai/document-lifecycle-rules.md" "## 10\.2 需求探索原型边界" "document lifecycle defines UI prototype exploration boundary"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "分阶段确认模式" "generate docs prompt offers staged confirmation mode"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "输入充分后批量生成模式" "generate docs prompt offers batch generation mode"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "横切状态冲突" "docs system audit reports cross-cutting status conflicts"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "状态与待确认项对结论的影响" "docs evaluation links statuses and open items to Go decisions"
  Require-Contains "ai/commands/README.md" "docs-open-items" "commands README includes docs-open-items"
  Require-Contains "ai/commands/docs-open-items.md" "生成 open items" "docs-open-items command exists"
  Require-Contains "ai/prompts/docs/21-docs-open-items.md" "待确认事项总览" "docs-open-items prompt exists"
  Require-Contains "template-docs/docs-open-items.example.md" "待确认事项总览示例" "open items example template exists"
  Require-Contains "template-sync.json" "ai/commands/docs-open-items\.md" "template-sync includes docs-open-items command"
  Require-Contains "template-sync.json" "ai/prompts/docs/21-docs-open-items\.md" "template-sync includes docs-open-items prompt"
  Require-Contains "template-sync.json" "template-docs/docs-open-items\.example\.md" "template-sync includes open items example"
  Require-Contains "ai/commands/README.md" "ui-prototype-exploration" "commands README includes UI prototype exploration"
  Require-Contains "ai/commands/README.md" "resume" "commands README includes resume command"
  Require-Contains "ai/commands/resume.md" "快速续接模式" "resume command exists"
  Require-Contains "template-sync.json" "ai/commands/resume\.md" "template-sync includes resume command"
  Require-Contains "ai/session-rules.md" "快速续接模式" "session rules define fast resume mode"
  Require-Contains "ai/session-rules.md" "场景化裁剪" "session rules define fast resume as scoped routing"
  Require-Contains "ai/index.md" "快速续接例外" "ai/index declares fast resume exception"
  Require-Contains "ai/commands/README.md" "不展开完整规则审计" "commands README keeps resume from full rule audit"
  Require-Contains "ai/commands/resume.md" "不展开读取全部规则" "resume command only confirms fast resume exception"
  Require-Contains "AGENTS.md" "快速续接模式做最小只读恢复" "AGENTS entry mentions fast resume minimal read-only recovery"
  Require-Contains "CLAUDE.md" "快速续接模式做最小只读恢复" "CLAUDE entry mentions fast resume minimal read-only recovery"
  Require-Contains ".cursor/rules/project-rules.mdc" "快速续接模式做最小只读恢复" "Cursor entry mentions fast resume minimal read-only recovery"
  Require-Contains "ai/session-rules.md" "handoff stale" "session rules define stale handoff decision"
  Require-Contains "template-docs/session-handoff.example.md" "Updated at" "handoff example includes metadata"
  Require-Contains "ai/commands/ui-prototype-exploration.md" "先看原型" "ui-prototype-exploration command exists"
  Require-Contains "ai/prompts/docs/22-ui-prototype-exploration.md" "需求探索原型" "UI prototype exploration prompt exists"
  Require-Contains "template-docs/ui-prototype-exploration-template.md" "需求探索原型记录模板" "UI prototype exploration template exists"
  Require-Contains "template-docs/ui-prototype-strategy-template.md" "UI 原型策略 / 实现前原型记录模板" "UI prototype strategy template exists"
  Require-Contains "template-docs/README.md" "glossary\.md" "template-docs README links glossary"
  Require-Contains "template-docs/README.md" "docs-scaffold/" "template-docs README links docs scaffold"
  Require-Contains "template-docs/glossary.md" "文档链路" "glossary includes document chain category"
  Require-Contains "template-docs/glossary.md" "ID / 追溯" "glossary includes ID traceability category"
  Require-Contains "template-docs/glossary.md" "状态词典" "glossary includes status dictionary category"
  Require-Contains "template-docs/glossary.md" "原型 / 前端交互" "glossary includes prototype and frontend category"
  Require-Contains "template-docs/glossary.md" "会话续接" "glossary includes session handoff category"
  Require-Contains "template-docs/glossary.md" "模板治理 / 同步" "glossary includes template governance category"
  Require-Contains "template-docs/docs-scaffold/README.md" "docs/00-09.*项目事实" "docs scaffold README distinguishes project facts"
  Require-Contains "template-docs/docs-scaffold/README.md" "template-docs/docs-scaffold/00-09.*结构模板" "docs scaffold README distinguishes scaffold templates"
  Require-Contains "template-docs/docs-scaffold/README.md" "ai/doc-standards/00-09.*审计基线" "docs scaffold README distinguishes standards"
  Require-Contains "template-docs/docs-scaffold/README.md" "design/subsystem-design\.md" "docs scaffold README lists subsystem design scaffold"
  Require-Contains "template-docs/docs-scaffold/README.md" "research/tech-env-evaluation\.md" "docs scaffold README lists tech env evaluation scaffold"
  foreach ($scaffoldFile in @(
      "00-scenario.md",
      "01-user-requirements.md",
      "02-srs.md",
      "03-prd.md",
      "04-architecture.md",
      "05-tech-spec.md",
      "06-db-design.md",
      "07-api-spec.md",
      "08-dev-plan.md",
      "09-verification.md"
    )) {
    $scaffoldPath = "template-docs/docs-scaffold/$scaffoldFile"
    Require-File $scaffoldPath
    Require-Contains $scaffoldPath "撰写提要" ("docs scaffold includes writing hint: " + $scaffoldFile)
  }
  Require-Contains "template-docs/docs-scaffold/design/subsystem-design.md" "职责与边界" "subsystem design scaffold includes responsibility boundary"
  Require-Contains "template-docs/docs-scaffold/design/subsystem-design.md" "readiness gate" "subsystem design scaffold includes readiness gate"
  Require-Contains "template-docs/docs-scaffold/design/frontend-interaction.md" "页面 / 路由清单与 REQ 追溯" "frontend interaction scaffold includes page traceability"
  Require-Contains "template-docs/docs-scaffold/design/frontend-interaction.md" "权限可见性" "frontend interaction scaffold includes permission visibility"
  Require-Contains "template-docs/docs-scaffold/design/ui-prototype-strategy.md" "与需求探索原型的区别" "UI prototype strategy scaffold distinguishes exploration prototype"
  Require-Contains "template-docs/docs-scaffold/design/ui-prototype-strategy.md" "原型形式与权威位置" "UI prototype strategy scaffold includes prototype authority"
  Require-Contains "template-docs/docs-scaffold/research/ui-prototype-exploration.md" "需求探索" "UI prototype exploration scaffold includes exploration positioning"
  Require-Contains "template-docs/docs-scaffold/research/ui-prototype-exploration.md" "边界声明" "UI prototype exploration scaffold includes boundary statement"
  Require-Contains "template-docs/docs-scaffold/research/tech-env-evaluation.md" "Readiness Gate 结论" "tech env evaluation scaffold includes readiness gate conclusion"
  Require-Contains "template-docs/docs-scaffold/research/tech-env-evaluation.md" "Go / Conditional Go / No-Go" "tech env evaluation scaffold includes Go decisions"
  Require-Contains "template-docs/docs-scaffold/inputs/input-review-report.md" "愿景缺口矩阵" "input review scaffold includes vision gap matrix"
  Require-Contains "template-docs/docs-scaffold/inputs/input-review-report.md" "最小补充清单" "input review scaffold includes minimum supplement list"
  Require-Contains "template-docs/docs-scaffold/vision/product-vision.md" "愿景功能全景" "product vision scaffold includes capability overview"
  Require-Contains "template-docs/docs-scaffold/vision/product-vision.md" "PV-SC" "product vision scaffold includes scenario anchors"
  Require-Contains "template-docs/docs-scaffold/decisions/ADR-template.md" "横切事实" "ADR scaffold includes cross-cutting fact positioning"
  Require-Contains "template-docs/docs-scaffold/decisions/ADR-template.md" "备选方案" "ADR scaffold includes alternatives"
  Require-Contains "template-docs/docs-scaffold/research/docs-open-items.md" "待确认事项总览" "open items scaffold includes open item overview"
  Require-Contains "template-docs/docs-scaffold/research/docs-open-items.md" "Go / Conditional Go / No Go" "open items scaffold includes gate decision"
  Require-Contains "README.md" "template-docs/docs-scaffold" "README links docs scaffold"
  Require-Contains "README.md" "template-docs/glossary" "README links glossary"
  Require-Contains "docs/README.md" "template-docs/docs-scaffold/" "docs README distinguishes scaffold templates"
  Require-Contains "docs/README.md" "ai/doc-standards/00-09" "docs README distinguishes doc standards"
  Require-Contains "template-docs/beginner-guide.md" "template-docs/docs-scaffold/" "beginner guide explains docs scaffold"
  Require-Contains "template-docs/beginner-guide.md" "template-docs/glossary.md" "beginner guide links glossary"
  Require-Contains "template-docs/template-methodology.md" "template-docs/glossary.md" "methodology links glossary"
  Require-Contains "template-docs/template-methodology.md" "template-docs/docs-scaffold/" "methodology links docs scaffold"
  Require-Contains "template-sync.json" "template-docs/glossary\.md" "template-sync includes glossary"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/README\.md" "template-sync includes docs scaffold README"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/inputs/input-review-report\.md" "template-sync includes input review scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/vision/product-vision\.md" "template-sync includes product vision scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/09-verification\.md" "template-sync includes docs scaffold 00-09"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/design/subsystem-design\.md" "template-sync includes subsystem design scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/design/frontend-interaction\.md" "template-sync includes frontend interaction scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/decisions/ADR-template\.md" "template-sync includes ADR scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/research/docs-open-items\.md" "template-sync includes open items scaffold"
  Require-Contains "template-sync.json" "template-docs/docs-scaffold/research/tech-env-evaluation\.md" "template-sync includes tech env evaluation scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/glossary\.md" "sync-template fallback includes glossary"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/09-verification\.md" "sync-template fallback includes docs scaffold 00-09"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/inputs/input-review-report\.md" "sync-template fallback includes input review scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/vision/product-vision\.md" "sync-template fallback includes product vision scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/design/subsystem-design\.md" "sync-template fallback includes subsystem design scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/design/frontend-interaction\.md" "sync-template fallback includes frontend interaction scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/decisions/ADR-template\.md" "sync-template fallback includes ADR scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/research/docs-open-items\.md" "sync-template fallback includes open items scaffold"
  Require-Contains "scripts/sync-template.sh" "template-docs/docs-scaffold/research/tech-env-evaluation\.md" "sync-template fallback includes tech env evaluation scaffold"
  Require-Contains "template-sync.json" "ai/commands/ui-prototype-exploration\.md" "template-sync includes UI prototype exploration command"
  Require-Contains "template-sync.json" "ai/prompts/docs/22-ui-prototype-exploration\.md" "template-sync includes UI prototype exploration prompt"
  Require-Contains "template-sync.json" "template-docs/ui-prototype-exploration-template\.md" "template-sync includes UI prototype exploration template"
  Require-Contains "template-sync.json" "template-docs/ui-prototype-strategy-template\.md" "template-sync includes UI prototype strategy template"
  Require-Contains "template-docs/scenario-guides.md" "A5\.5 需求探索原型" "scenario guides include A5.5 UI prototype exploration"
  Require-Contains "template-docs/scenario-guides.md" "A7\.5 UI 原型策略 / 实现前原型" "scenario guides include A7.5 UI prototype strategy"
  Require-Contains "docs/README.md" "YYYY-MM-DD-ui-prototype-exploration\.md" "docs README documents UI prototype exploration report path"
  Require-Contains "template-docs/scenario-guides.md" "A17 待确认事项总览" "scenario guides include A17 open items"
  Require-Contains "template-docs/scenario-guides.md" "A18 专题方案讨论" "scenario guides include A18 topic discussion"
  Require-Contains "template-docs/scenario-guides.md" "A19 文档定稿门禁" "scenario guides include A19 finalization gate"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "专题讨论优先" "generate docs prompt requires topic discussion before facts"
  Require-Contains "ai/document-lifecycle-rules.md" "## 10\.3 专题方案讨论边界" "document lifecycle defines topic discussion boundary"
  Require-Contains "ai/document-lifecycle-rules.md" "docs/research/YYYY-MM-DD-docs-open-items\.md" "document lifecycle defines open items default path"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "open items 中存在阻塞当前 Sprint" "docs checklist checks blocking open items"
  Require-Contains "ai/prompts/planning/08-phase-upgrade.md" "阻塞项未关闭或未被风险接受时，不得建议直接升级" "phase upgrade checks blocking open items"
  Require-Contains "ai/doc-standards/README.md" "SC-ID → U-ID → REQ-ID → Phase → AC / TC" "doc-standards README defines 00-03 requirements chain health"
  Require-Contains "ai/document-lifecycle-rules.md" "00-03 需求链健康度" "document lifecycle defines 00-03 requirements chain health"
  Require-Contains "docs/00-scenario.md" "边界 / 非目标" "00 scenario includes boundary and non-goal table"
  Require-Contains "docs/01-user-requirements.md" "AC-ID" "01 user requirements include AC-ID"
  Require-Contains "docs/02-srs.md" "验证入口" "02 SRS includes verification entry"
  Require-Contains "docs/03-prd.md" "证据 / 验收引用" "03 PRD includes evidence and acceptance references"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "SC-ID → U-ID → REQ-ID → Phase → AC / TC" "generate docs prompt checks requirements chain health"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "00-03 需求链断点" "docs audit prompt reports 00-03 requirements chain breaks"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "需求链健康度" "docs evaluation prompt checks requirements chain health"
  Require-Contains "ai/prompts/planning/08-phase-upgrade.md" "Phase 状态传播检查" "phase upgrade prompt checks phase state propagation"
  Require-Contains "template-sync.json" "ai/doc-standards/00-scenario\.md" "template-sync includes 00 scenario standard"
  Require-Contains "template-sync.json" "ai/doc-standards/01-user-requirements\.md" "template-sync includes 01 user requirements standard"
  Require-Contains "template-sync.json" "ai/doc-standards/02-srs\.md" "template-sync includes 02 SRS standard"
  Require-Contains "template-sync.json" "ai/doc-standards/03-prd\.md" "template-sync includes 03 PRD standard"
  Require-Contains "template-sync.json" "ai/doc-standards/04-architecture\.md" "template-sync includes 04 architecture standard"
  Require-Contains "template-sync.json" "ai/doc-standards/05-tech-spec\.md" "template-sync includes 05 tech spec standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/00-scenario\.md" "sync-template fallback includes 00 scenario standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/01-user-requirements\.md" "sync-template fallback includes 01 user requirements standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/02-srs\.md" "sync-template fallback includes 02 SRS standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/03-prd\.md" "sync-template fallback includes 03 PRD standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/04-architecture\.md" "sync-template fallback includes 04 architecture standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/05-tech-spec\.md" "sync-template fallback includes 05 tech spec standard"
  Require-Contains "ai/doc-standards/README.md" "三层分工" "doc-standards README defines standards layering"
  Require-Contains "ai/document-lifecycle-rules.md" "文档标准分层与按 scope 读取规则" "document lifecycle defines scoped standards lookup"
  Require-Contains "ai/doc-standards/00-scenario.md" "SC-ID" "00 scenario standard defines SC-ID"
  Require-Contains "ai/doc-standards/01-user-requirements.md" "U-ID" "01 user requirements standard defines U-ID"
  Require-Contains "ai/doc-standards/02-srs.md" "REQ-ID" "02 SRS standard defines REQ-ID"
  Require-Contains "ai/doc-standards/03-prd.md" "Phase" "03 PRD standard defines Phase"
  Require-Contains "ai/doc-standards/README.md" "REQ / NFR → Phase → COMP-ID → MOD-ID → Flow-ID → Risk-ID → TC / Sprint" "doc-standards README defines 04-05 design risk chain"
  Require-Contains "ai/doc-standards/04-architecture.md" "架构视图检查表" "04 architecture standard includes view checklist"
  Require-Contains "ai/doc-standards/04-architecture.md" "COMP-ID" "04 architecture standard defines component IDs"
  Require-Contains "ai/doc-standards/05-tech-spec.md" "Readiness Gate" "05 tech spec standard defines readiness gate"
  Require-Contains "ai/doc-standards/05-tech-spec.md" "Risk-ID" "05 tech spec standard defines Risk-ID"
  Require-Contains "template-sync.json" "ai/doc-standards/06-db-design\.md" "template-sync includes 06 DB standard"
  Require-Contains "template-sync.json" "ai/doc-standards/07-api-spec\.md" "template-sync includes 07 API standard"
  Require-Contains "template-sync.json" "ai/doc-standards/08-dev-plan\.md" "template-sync includes 08 dev plan standard"
  Require-Contains "template-sync.json" "ai/doc-standards/09-verification\.md" "template-sync includes 09 verification standard"
  Require-Contains "template-sync.json" "ai/doc-standards/design-doc\.md" "template-sync includes design doc standard"
  Require-Contains "template-sync.json" "ai/doc-standards/frontend-interaction\.md" "template-sync includes frontend interaction standard"
  Require-Contains "template-sync.json" "ai/doc-standards/ui-prototype-strategy\.md" "template-sync includes UI prototype strategy standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/06-db-design\.md" "sync-template fallback includes 06 DB standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/07-api-spec\.md" "sync-template fallback includes 07 API standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/08-dev-plan\.md" "sync-template fallback includes 08 dev plan standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/09-verification\.md" "sync-template fallback includes 09 verification standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/design-doc\.md" "sync-template fallback includes design doc standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/frontend-interaction\.md" "sync-template fallback includes frontend interaction standard"
  Require-Contains "scripts/sync-template.sh" "ai/doc-standards/ui-prototype-strategy\.md" "sync-template fallback includes UI prototype strategy standard"
  Require-Contains "scripts/sync-template.sh" "00-09 已升级为独立标准文件" "sync-template documents standalone 00-09 standards"
  Require-Absent-Contains "scripts/sync-template.sh" "DOC_STANDARD_DOCS=\([^)]*docs/08-dev-plan\.md" "sync-template no longer mirrors docs/08 over 08 standard"
  Require-Absent-Contains "scripts/sync-template.sh" "DOC_STANDARD_DOCS=\([^)]*docs/09-verification\.md" "sync-template no longer mirrors docs/09 over 09 standard"
  Require-Contains "ai/doc-standards/README.md" "REQ / NFR → Phase → COMP-ID / MOD-ID / Flow-ID → Table / Field → API-ID → Error / Permission → TC / Sprint" "doc-standards README defines 06-07 contract chain"
  Require-Contains "ai/doc-standards/06-db-design.md" "字段级契约" "06 DB standard includes field-level contract"
  Require-Contains "ai/doc-standards/06-db-design.md" "目标结构与当前实现对照" "06 DB standard includes target/current comparison"
  Require-Contains "ai/doc-standards/06-db-design.md" "迁移 / seed / 回滚" "06 DB standard includes migration seed rollback"
  Require-Contains "ai/doc-standards/07-api-spec.md" "Endpoint contract matrix" "07 API standard includes endpoint contract matrix"
  Require-Contains "ai/doc-standards/07-api-spec.md" "API-ID" "07 API standard defines API-ID"
  Require-Contains "ai/doc-standards/07-api-spec.md" "请求 / 响应 / 错误 / 权限 / 兼容" "07 API standard includes contract dimensions"
  Require-Contains "docs/06-db-design.md" "目标结构与当前实现对照" "06 DB template includes target/current comparison"
  Require-Contains "docs/07-api-spec.md" "Endpoint contract matrix" "07 API template includes endpoint contract matrix"
  Require-Contains "ai/document-lifecycle-rules.md" "06-07 DB / API 契约状态与升阶段门槛" "document lifecycle defines 06-07 contract gate"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "06-07 契约门禁缺口" "docs audit prompt reports 06-07 contract gaps"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "DB / API 契约健康度" "docs evaluation prompt checks DB/API contract health"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "endpoint contract matrix" "docs checklist checks endpoint contract matrix"
  Require-Contains "ai/prompts/planning/08-phase-upgrade.md" "DB / API 契约门槛检查" "phase upgrade prompt checks DB/API contract gate"
  Require-Contains "ai/prompts/dev/02-run-task.md" "表字段、API-ID、错误码、权限边界、契约状态和 TC-ID" "run task prompt checks DB/API contract status"
  Require-Contains "ai/doc-standards/README.md" "REQ / NFR → Phase → Sprint / Task → TC-ID / 验证包 → Commit / PR → Sprint 验收包 → Phase 验收 / 回写" "doc-standards README defines 08-09 execution evidence chain"
  Require-Contains "ai/doc-standards/08-dev-plan.md" "Sprint 验证包" "08 dev plan standard defines sprint verification package"
  Require-Contains "ai/doc-standards/08-dev-plan.md" "Sprint 完成包" "08 dev plan standard defines sprint completion package"
  Require-Contains "ai/doc-standards/08-dev-plan.md" "Task 模板最低要求" "08 dev plan standard defines task template minimum"
  Require-Contains "ai/doc-standards/09-verification.md" "TC 状态枚举" "09 verification standard defines TC status enumeration"
  Require-Contains "ai/doc-standards/09-verification.md" "正式回写与 handoff 边界" "09 verification standard defines formal writeback and handoff boundary"
  Require-Contains "ai/doc-standards/09-verification.md" "缺陷 / 回归" "09 verification standard includes defect and regression evidence"
  Require-Contains "ai/doc-standards/design-doc.md" "分类 checklist" "design doc standard includes classification checklist"
  Require-Contains "ai/doc-standards/design-doc.md" "实现偏差 / 设计回写" "design doc standard includes implementation drift writeback"
  Require-Contains "ai/doc-standards/design-doc.md" "readiness gate" "design doc standard includes readiness gate"
  Require-Contains "ai/doc-standards/frontend-interaction.md" "页面 / 路由清单与 REQ 追溯" "frontend interaction standard includes page traceability"
  Require-Contains "ai/doc-standards/frontend-interaction.md" "权限可见性" "frontend interaction standard includes permission visibility"
  Require-Contains "ai/doc-standards/ui-prototype-strategy.md" "与需求探索原型的区别" "UI prototype strategy distinguishes exploration prototype"
  Require-Contains "ai/doc-standards/ui-prototype-strategy.md" "原型形式" "UI prototype strategy standard includes prototype format"
  Require-Contains "ai/doc-standards/README.md" "docs/design/\*" "doc-standards README defines design baseline"
  Require-Contains "ai/document-lifecycle-rules.md" "docs/design/\*" "document lifecycle defines design trigger and writeback rules"
  Require-Contains "ai/document-lifecycle-rules.md" "UI 原型策略触发与边界规则" "document lifecycle defines UI prototype strategy gate"
  Require-Contains "ai/project-rules.md" "## 2\.7 UI 原型策略" "project rules include UI prototype strategy section"
  Require-Contains "ai/doc-standards/05-tech-spec.md" "UI 原型策略记录位" "05 tech spec standard includes UI prototype strategy slot"
  Require-Contains "ai/doc-standards/README.md" "UI 原型策略是前端交互设计" "doc-standards README explains UI prototype evidence relation"
  Require-Contains "docs/05-tech-spec.md" "UI 原型策略" "05 tech spec template includes UI prototype strategy field"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "ai/doc-standards/design-doc.md" "generate docs prompt reads design standard"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "ai/doc-standards/frontend-interaction.md" "generate docs prompt reads frontend interaction standard"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "ai/doc-standards/ui-prototype-strategy.md" "generate docs prompt reads UI prototype strategy standard"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "选择原型策略" "generate docs prompt checks UI prototype strategy"
  Require-Contains "ai/prompts/docs/04-edit-single-doc.md" "design-doc\.md" "edit doc prompt checks design writeback"
  Require-Contains "ai/prompts/docs/04-edit-single-doc.md" "ai/doc-standards/frontend-interaction.md" "edit single doc prompt reads frontend interaction standard"
  Require-Contains "ai/prompts/docs/04-edit-single-doc.md" "ai/doc-standards/ui-prototype-strategy.md" "edit single doc prompt reads UI prototype strategy standard"
  Require-Contains "ai/prompts/docs/04-edit-single-doc.md" "原型形式、权威位置" "edit doc prompt checks UI prototype evidence"
  Require-Contains "ai/prompts/docs/07-sync-docs-from-code.md" "docs/design/*" "sync docs from code prompt writes design drift"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "docs/design/\*" "docs checklist validates generic design docs"
  Require-Contains "ai/prompts/review/10-docs-checklist.md" "UI 原型策略（如触发）" "docs checklist validates UI prototype strategy"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "docs/design/\*" "docs audit reports generic design gaps"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "UI 原型策略缺口" "docs audit reports UI prototype strategy gaps"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "docs/design/\*" "docs evaluation checks generic design docs"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "UI 原型策略" "docs evaluation checks UI prototype strategy"
  Require-Contains "template-docs/scenario-guides.md" "选择原型策略" "scenario guides route UI prototype strategy selection"
  Require-Contains "docs/08-dev-plan.md" "验证包 / TC" "08 dev plan template includes verification package and TC"
  Require-Contains "docs/08-dev-plan.md" "Sprint 完成包" "08 dev plan template includes sprint completion package"
  Require-Contains "docs/09-verification.md" "TC 状态" "09 verification template includes TC status"
  Require-Contains "docs/09-verification.md" "Sprint 验收包" "09 verification template includes sprint acceptance package"
  Require-Contains "ai/implementation-lifecycle-rules.md" "Sprint / Task 完成后必须形成最小完成包" "implementation lifecycle requires sprint/task completion package"
  Require-Contains "ai/session-rules.md" "长期事实必须回写" "session rules keep handoff separate from 08/09 formal records"
  Require-Contains "ai/session-rules.md" "不联网，不查询 GitHub issue / PR / Actions" "fast resume avoids remote lookups by default"
  Require-Contains "ai/session-rules.md" "默认不展开读取 .* 全部规则文件|默认不展开读取.*全部规则文件" "fast resume avoids full rule reading by default"
  Require-Contains "ai/prompts/dev/09-sprint-summary.md" "Sprint 验收包" "sprint summary prompt outputs sprint acceptance package"
  Require-Contains "docs/04-architecture.md" "架构视图检查表" "04 architecture template includes view checklist"
  Require-Contains "docs/05-tech-spec.md" "Readiness Gate" "05 tech spec template includes readiness gate"
  Require-Contains "ai/document-lifecycle-rules.md" "04-05 总体设计风险验证规则" "document lifecycle defines 04-05 risk verification"
  Require-Contains "ai/implementation-lifecycle-rules.md" "readiness gate" "implementation lifecycle checks readiness gate"
  Require-Contains "ai/prompts/docs/00-generate-or-complete-docs.md" "readiness gate" "generate docs prompt requires readiness gate"
  Require-Contains "ai/prompts/review/16-docs-system-audit.md" "04-05 设计门禁缺口" "docs audit prompt reports 04-05 gate gaps"
  Require-Contains "ai/prompts/review/19-docs-evaluation.md" "架构视图健康度" "docs evaluation prompt checks architecture view health"
  Require-Contains "ai/prompts/review/20-tech-env-evaluation.md" "Readiness gate" "tech env evaluation prompt outputs readiness gate"
  Require-Contains "ai/prompts/planning/08-phase-upgrade.md" "readiness gate 检查" "phase upgrade prompt checks readiness gate"
  Require-Contains "ai/commands/tech-env-evaluation.md" "Risk-ID" "tech-env command mentions Risk-ID"
  Require-Contains "ai/commands/docs-evaluation.md" "readiness gate" "docs-evaluation command mentions readiness gate"

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
