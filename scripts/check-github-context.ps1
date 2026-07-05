<#
check-github-context.ps1 - Inspect Git / GitHub CLI context before push, PR, or merge.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1
  powershell -ExecutionPolicy Bypass -File scripts/check-github-context.ps1 -ExpectedOwner <owner> -ExpectedRepo <repo>

Notes:
  This script is read-only. It does not switch accounts, modify remotes,
  push, create PRs, or merge. It is intended as a preflight check for
  multi-repository / multi-AI sessions.
#>
[CmdletBinding()]
param(
  [string]$ExpectedOwner,
  [string]$ExpectedRepo
)

$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-TextCommand {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  try {
    $output = & $Command @Arguments 2>&1
    return [pscustomobject]@{
      ExitCode = $LASTEXITCODE
      Text     = (($output | ForEach-Object { $_.ToString() }) -join "`n").Trim()
    }
  } catch {
    return [pscustomobject]@{
      ExitCode = 1
      Text     = $_.Exception.Message
    }
  }
}

function Write-Item {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    $Value = "(not detected)"
  }
  Write-Host ("{0,-24} {1}" -f ($Name + ":"), $Value)
}

function Get-OriginRepoSlug {
  param([string]$RemoteUrl)

  if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
    return $null
  }

  if ($RemoteUrl -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>.+)$') {
    $repoName = $Matches.repo -replace '\.git$', ''
    return [pscustomobject]@{
      Owner = $Matches.owner
      Repo  = $repoName
      Slug  = "$($Matches.owner)/$repoName"
    }
  }

  return $null
}

Write-Host "==> Git / GitHub context preflight (read-only)"

if (-not (Test-CommandExists "git")) {
  Write-Error "git is not installed or not on PATH."
  exit 1
}

$insideWorkTree = (Invoke-TextCommand "git" @("rev-parse", "--is-inside-work-tree"))
if ($insideWorkTree.ExitCode -ne 0 -or $insideWorkTree.Text -ne "true") {
  Write-Error "Current directory is not inside a Git work tree."
  exit 1
}

$repoRoot = (Invoke-TextCommand "git" @("rev-parse", "--show-toplevel")).Text
$branch = (Invoke-TextCommand "git" @("branch", "--show-current")).Text
$status = (Invoke-TextCommand "git" @("status", "--short", "--branch", "--untracked-files=all")).Text
$remoteUrl = (Invoke-TextCommand "git" @("remote", "get-url", "origin")).Text
$remoteSlug = Get-OriginRepoSlug -RemoteUrl $remoteUrl
$userName = (Invoke-TextCommand "git" @("config", "user.name")).Text
$userEmail = (Invoke-TextCommand "git" @("config", "user.email")).Text

Write-Item "repo root" $repoRoot
Write-Item "branch" $branch
Write-Item "origin" $remoteUrl
Write-Item "origin slug" $(if ($remoteSlug) { $remoteSlug.Slug } else { "(not a github.com remote or not detected)" })
Write-Item "git user.name" $userName
Write-Item "git user.email" $userEmail
Write-Host ""
Write-Host "==> Git status"
Write-Host $status

$warnings = New-Object System.Collections.Generic.List[string]

if ($ExpectedOwner -and $remoteSlug -and ($remoteSlug.Owner -ne $ExpectedOwner)) {
  $warnings.Add("Expected owner '$ExpectedOwner' but origin owner is '$($remoteSlug.Owner)'.")
}

if ($ExpectedRepo -and $remoteSlug -and ($remoteSlug.Repo -ne $ExpectedRepo)) {
  $warnings.Add("Expected repo '$ExpectedRepo' but origin repo is '$($remoteSlug.Repo)'.")
}

if (-not [string]::IsNullOrWhiteSpace($status) -and ($status -match '(?m)^\?\?|^ [MDARC]|^[MDARC] ')) {
  $warnings.Add("Working tree has uncommitted changes. Do not push / merge until you confirm these changes are intended.")
}

Write-Host ""
Write-Host "==> GitHub CLI"
if (-not (Test-CommandExists "gh")) {
  $warnings.Add("gh is not installed or not on PATH. PR / merge commands will fail until gh is installed and authenticated.")
  Write-Host "gh: (not installed)"
} else {
  Write-Host "Running: gh auth status"
  $auth = Invoke-TextCommand "gh" @("auth", "status")
  Write-Host $auth.Text
  if ($auth.ExitCode -ne 0) {
    $warnings.Add("gh auth status failed. Run gh auth login or refresh GitHub CLI credentials before remote operations.")
  }

  $repoView = Invoke-TextCommand "gh" @("repo", "view", "--json", "nameWithOwner,url,viewerPermission")
  if ($repoView.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($repoView.Text)) {
    try {
      $repoInfo = $repoView.Text | ConvertFrom-Json
      Write-Host ""
      Write-Host "==> gh repo view"
      Write-Item "repo" $repoInfo.nameWithOwner
      Write-Item "url" $repoInfo.url
      Write-Item "viewer permission" $repoInfo.viewerPermission
    } catch {
      $warnings.Add("Could not parse gh repo view JSON output.")
    }
  } else {
    $warnings.Add("gh repo view failed. Active gh account may lack access to this repository, or authentication may be missing / expired.")
    if ($repoView.Text) {
      Write-Host ""
      Write-Host "gh repo view output:"
      Write-Host $repoView.Text
    }
  }
}

Write-Host ""
if ($warnings.Count -gt 0) {
  Write-Host "==> Warnings"
  foreach ($warning in $warnings) {
    Write-Host ("WARN  " + $warning)
  }
  Write-Host ""
  Write-Host "Preflight finished with warnings. Review before push / PR / merge."
  exit 2
}

Write-Host "OK preflight finished without warnings. Still confirm the target operation before push / PR / merge."
exit 0
