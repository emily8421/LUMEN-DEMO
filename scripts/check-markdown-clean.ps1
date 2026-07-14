<#
check-markdown-clean.ps1 - Markdown whitespace preflight for proposal / mirror files.

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/check-markdown-clean.ps1
  powershell -ExecutionPolicy Bypass -File scripts/check-markdown-clean.ps1 _proposals ai-records

Checks:
  - no UTF-8 BOM
  - no trailing spaces or tabs
  - exactly one final newline
  - no extra blank lines at EOF
#>
$ErrorActionPreference = "Stop"

$paths = @($args | Where-Object { $_ })
if ($paths.Count -eq 0) {
  $paths = @("_proposals")
}

$failures = 0

function Add-Failure {
  param([string]$Message)
  Write-Error $Message -ErrorAction Continue
  $script:failures++
}

function Get-MarkdownFiles {
  param([string[]]$InputPaths)

  $files = New-Object System.Collections.Generic.List[string]
  foreach ($inputPath in $InputPaths) {
    if (-not (Test-Path -LiteralPath $inputPath)) {
      Write-Host "skip missing path: $inputPath"
      continue
    }

    $item = Get-Item -LiteralPath $inputPath
    if ($item.PSIsContainer) {
      Get-ChildItem -LiteralPath $item.FullName -Recurse -File -Filter "*.md" | ForEach-Object {
        [void]$files.Add($_.FullName)
      }
    } elseif ($item.Extension -eq ".md") {
      [void]$files.Add($item.FullName)
    }
  }

  return @($files | Sort-Object -Unique)
}

function Test-MarkdownFile {
  param([string]$Path)

  $relativePath = Resolve-Path -LiteralPath $Path -Relative
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Add-Failure "UTF-8 BOM detected: $relativePath"
  }

  $text = [System.Text.Encoding]::UTF8.GetString($bytes)
  if ($text.Length -eq 0) {
    return
  }

  if ($text -notmatch "`n\z") {
    Add-Failure "missing final newline: $relativePath"
  }

  if ($text -match "(`r?`n){2,}\z") {
    Add-Failure "extra blank lines at EOF: $relativePath"
  }

  $lines = $text -split "`n", -1
  $lineNumber = 0
  foreach ($line in $lines) {
    $lineNumber++
    if ($lineNumber -eq $lines.Count -and $line -eq "") {
      continue
    }
    $normalized = $line.TrimEnd("`r")
    if ($normalized -match "[ \t]+\z") {
      Add-Failure "trailing whitespace: ${relativePath}:$lineNumber"
    }
  }
}

$markdownFiles = Get-MarkdownFiles -InputPaths $paths
if ($markdownFiles.Count -eq 0) {
  Write-Host "OK: no Markdown files found"
  exit 0
}

foreach ($file in $markdownFiles) {
  Test-MarkdownFile -Path $file
}

if ($failures -gt 0) {
  Write-Error "Markdown clean check failed: $failures issue(s)." -ErrorAction Continue
  exit 1
}

Write-Host "OK: Markdown clean check passed ($($markdownFiles.Count) file(s))"
