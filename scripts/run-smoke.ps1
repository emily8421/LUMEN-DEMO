# run-smoke.ps1 — 一键浏览器 smoke：起 demo（后端 + 前端）→ 跑 smoke 脚本 → 自动停止
#
# 复用 scripts/run-sprint16-demo.ps1 -Detached 的完整启动链路（含 Wait-ready /
# frontend identity 检查 / runtime.json），避免每次 smoke 手动编排后端 + 前端 + CDP。
# smoke 脚本本身负责拉起 CDP 浏览器（见 scripts/smoke-*-browser.mjs 与 .tmp/*-smoke.mjs）。
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts/run-smoke.ps1
#       # 默认起 18000/5174，跑 .tmp/sliceD-workspace-smoke.mjs，完成后自动停止
#   powershell -ExecutionPolicy Bypass -File scripts/run-smoke.ps1 -SmokeScript .tmp/sliceB4-codegen-smoke.mjs
#   powershell -ExecutionPolicy Bypass -File scripts/run-smoke.ps1 -SmokeScript scripts/smoke-vault-local-mount-browser.mjs -UsePostgres
#   powershell -ExecutionPolicy Bypass -File scripts/run-smoke.ps1 -NoStop   # 跑完保留服务便于人工复查
#   powershell -ExecutionPolicy Bypass -File scripts/run-smoke.ps1 -Stop     # 仅停止 18000/5174 上遗留的 demo 服务
#
# 端口参数耦合边界：.tmp/*-smoke.mjs 硬编码 frontend/debug 端口（不读 argv），
# 故改 -FrontendPort / -DebugPort 时 .tmp 脚本不会跟随；scripts/smoke-*-browser.mjs
# 支持 --frontend-url / --debug-port argv，可随 -FrontendPort / -DebugPort 联动。
param(
    [string]$SmokeScript = ".tmp/sliceD-workspace-smoke.mjs",
    [int]$BackendPort = 18000,
    [int]$FrontendPort = 5174,
    [int]$DebugPort = 9226,
    [switch]$UsePostgres,
    [switch]$NoStop,
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$demoLauncher = Join-Path $PSScriptRoot "run-sprint16-demo.ps1"

function Stop-DemoServices {
    Write-Host "Stopping demo services (backend $BackendPort / frontend $FrontendPort)..."
    & $demoLauncher -BackendPort $BackendPort -FrontendPort $FrontendPort -Stop
}

if ($Stop) {
    Stop-DemoServices
    exit 0
}

# 解析 smoke 脚本：相对仓库根或绝对路径
$smokePath = if ([System.IO.Path]::IsPathRooted($SmokeScript)) {
    $SmokeScript
} else {
    Join-Path $repoRoot $SmokeScript
}
if (-not (Test-Path $smokePath)) {
    Write-Error "Smoke script not found: $smokePath"
    exit 2
}

try {
    # 1. 起 demo（detached：等 ready 后返回，服务保持后台）
    Write-Host "Starting demo (backend $BackendPort / frontend $FrontendPort)..."
    $launcherArgs = @{
        BackendPort  = $BackendPort
        FrontendPort = $FrontendPort
        NoBrowser    = $true
        Detached     = $true
    }
    if ($UsePostgres) { $launcherArgs.UsePostgres = $true }
    & $demoLauncher @launcherArgs

    # 2. 跑 smoke（脚本自行拉起 CDP 浏览器）
    $smokeUrl = "http://localhost:$FrontendPort"
    $backendUrl = "http://127.0.0.1:$BackendPort"
    Write-Host "Running smoke: $smokePath"
    Write-Host "  frontend=$smokeUrl backend=$backendUrl debug-port=$DebugPort"
    & volta run --node 22.17.1 node $smokePath --frontend-url $smokeUrl --backend-url $backendUrl --debug-port $DebugPort
    $smokeExit = $LASTEXITCODE
    if ($smokeExit -ne 0) {
        Write-Host "Smoke FAILED with exit code $smokeExit" -ForegroundColor Red
    } else {
        Write-Host "Smoke PASSED." -ForegroundColor Green
    }
} finally {
    if (-not $NoStop) {
        Stop-DemoServices
    } else {
        Write-Host "Services kept running (NoStop). Stop manually with: $($MyInvocation.MyCommand.Path) -Stop"
    }
}
