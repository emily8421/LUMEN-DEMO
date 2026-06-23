<#
collect-env.ps1 — 采集本机运行环境并生成 docs/env/local-env.md

用法:
  powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1
  powershell -ExecutionPolicy Bypass -File scripts/collect-env.ps1 -OutputPath docs/env/local-env.md

说明:
  本脚本只采集本机环境并写入目标 Markdown 文件，不安装依赖、不修改系统配置。
#>
param(
  [string]$OutputPath = "docs/env/local-env.md"
)

$ErrorActionPreference = "SilentlyContinue"

function Get-CommandVersion {
  param(
    [string]$Command,
    [string[]]$Arguments = @("--version")
  )

  $cmd = Get-Command $Command -ErrorAction SilentlyContinue
  if (-not $cmd) {
    return "未安装或不在 PATH"
  }

  try {
    $output = & $Command @Arguments 2>&1 | Select-Object -First 1
    if ($output) {
      return ($output.ToString()).Trim()
    }
    return "已安装（未获取到版本）"
  } catch {
    return "已安装（版本获取失败）"
  }
}

function Format-Bytes {
  param([double]$Bytes)
  if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
  if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
  if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
  return "{0:N0} B" -f $Bytes
}

function First-NonEmpty {
  param([object[]]$Values)
  foreach ($value in $Values) {
    if ($null -ne $value) {
      $text = $value.ToString().Trim()
      if (-not [string]::IsNullOrWhiteSpace($text) -and $text -ne "()") {
        return $value
      }
    }
  }
  return "未知"
}

function Join-NonEmpty {
  param([object[]]$Values)
  $parts = @()
  foreach ($value in $Values) {
    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace($value.ToString())) {
      $parts += $value.ToString().Trim()
    }
  }
  return ($parts -join " ").Trim()
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$fullOutputPath = Join-Path $repoRoot $OutputPath
$outputDir = Split-Path -Parent $fullOutputPath
New-Item -ItemType Directory -Force $outputDir | Out-Null

$computer = Get-CimInstance Win32_ComputerSystem
$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpus = Get-CimInstance Win32_VideoController
$drives = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
$computerInfo = $null
try {
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $computerInfo = New-Object Microsoft.VisualBasic.Devices.ComputerInfo
} catch {
  $computerInfo = $null
}

$osDescription = First-NonEmpty @(
  (Join-NonEmpty @($os.Caption, $os.Version, $os.OSArchitecture)),
  $(if ($computerInfo) { $computerInfo.OSFullName }),
  [System.Runtime.InteropServices.RuntimeInformation]::OSDescription,
  [System.Environment]::OSVersion.VersionString
)
$cpuName = First-NonEmpty @($cpu.Name, $env:PROCESSOR_IDENTIFIER)
$cpuCores = First-NonEmpty @($cpu.NumberOfCores, "未知")
$cpuThreads = First-NonEmpty @($cpu.NumberOfLogicalProcessors, [System.Environment]::ProcessorCount)
$totalMemory = First-NonEmpty @($computer.TotalPhysicalMemory, $(if ($os.TotalVisibleMemorySize) { [double]$os.TotalVisibleMemorySize * 1KB }), $(if ($computerInfo) { $computerInfo.TotalPhysicalMemory }))

$gpuLines = @()
if ($gpus) {
  foreach ($gpu in $gpus) {
    $memory = if ($gpu.AdapterRAM) { Format-Bytes $gpu.AdapterRAM } else { "未知" }
    $gpuLines += "- $($gpu.Name)（显存/显存近似：$memory）"
  }
} else {
  $gpuLines += "- 未检测到 GPU 信息"
}

$driveLines = @()
foreach ($drive in $drives) {
  $driveLines += "- $($drive.DeviceID) 可用 $(Format-Bytes $drive.FreeSpace) / 总计 $(Format-Bytes $drive.Size)"
}
if ($driveLines.Count -eq 0) {
  $fileSystemDrives = [System.IO.DriveInfo]::GetDrives()
  foreach ($drive in $fileSystemDrives) {
    if ($drive.IsReady) {
      $driveLines += "- $($drive.Name) 可用 $(Format-Bytes $drive.AvailableFreeSpace) / 总计 $(Format-Bytes $drive.TotalSize)"
    }
  }
}
if ($driveLines.Count -eq 0) {
  $driveLines += "- 未检测到磁盘容量信息"
}

$dockerVersion = Get-CommandVersion "docker"
$dockerStatus = "未检测"
if ((Get-Command docker -ErrorAction SilentlyContinue)) {
  try {
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { $dockerStatus = "可用" } else { $dockerStatus = "已安装但当前不可用" }
  } catch {
    $dockerStatus = "已安装但当前不可用"
  }
} else {
  $dockerStatus = "未安装或不在 PATH"
}

$content = @"
# 本机运行环境采集

> 由 ``scripts/collect-env.ps1`` 自动生成。自动采集项用于辅助技术方案选择；“人工确认项”仍需项目负责人补充。

## 自动采集

- 采集时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
- 计算机名：$($env:COMPUTERNAME)
- 当前用户：$($env:USERNAME)
- 工作目录：$repoRoot
- 操作系统：$osDescription
- PowerShell：$($PSVersionTable.PSVersion)
- CPU：$cpuName
- CPU 核心 / 线程：$cpuCores 核 / $cpuThreads 线程
- 内存总量：$(if ($totalMemory -eq "未知") { "未知" } else { Format-Bytes $totalMemory })
- 系统架构：$($env:PROCESSOR_ARCHITECTURE)

### GPU

$($gpuLines -join "`n")

### 磁盘

$($driveLines -join "`n")

### 常用工具

- Git：$(Get-CommandVersion "git")
- Python：$(Get-CommandVersion "python")
- Node.js：$(Get-CommandVersion "node")
- npm：$(Get-CommandVersion "npm")
- Java：$(Get-CommandVersion "java" @("-version"))
- Docker：$dockerVersion
- Docker 运行状态：$dockerStatus

## 人工确认项

- Demo 阶段允许最大内存占用：待确认
- Demo 阶段允许最大显存占用：待确认
- Demo 阶段允许最大磁盘占用：待确认
- 是否允许联网调用外部 API：待确认
- 是否允许安装新依赖 / Docker 镜像：待确认
- 是否允许使用公司服务器：待确认
- 是否涉及公司数据 / 隐私数据：待确认
- 本机必须跑通的功能：待确认
- 可 Mock / 可远程运行的功能：待确认

## 服务器资源预案

> 当本机资源不足以实现完整功能时填写。若 Demo / MVP 全部可本机运行，可写“暂不需要”。

- 触发条件：待确认
- CPU：待确认
- 内存：待确认
- GPU / 显存：待确认
- 磁盘：待确认
- 网络 / 端口：待确认
- 部署方式建议：待确认
- 权限 / 成本 / 安全注意事项：待确认
"@

Set-Content -Path $fullOutputPath -Value $content -Encoding UTF8
Write-Host "✅ 已生成: $fullOutputPath"



