param(
    [int]$BackendPort = 18000,
    [int]$FrontendPort = 5173,
    [switch]$NoBrowser,
    [switch]$StopExisting,
    [switch]$Detached,
    [switch]$UsePostgres,
    [string[]]$RequiredBackendRoute = @(),
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontendRoot = Join-Path $repoRoot "frontend"
$tempRoot = Join-Path $env:TEMP "lumen-sprint16-demo"
$runtimeStatePath = Join-Path $tempRoot "runtime.json"
$processes = @()
$startedServices = @()
$leaveRunning = $false
$suppressFinalStopMessage = $false
$hadViteApiBase = Test-Path Env:VITE_API_BASE
$oldViteApiBase = $env:VITE_API_BASE
$hadDemoBackendProxyUrl = Test-Path Env:DEMO_BACKEND_PROXY_URL
$oldDemoBackendProxyUrl = $env:DEMO_BACKEND_PROXY_URL

function Normalize-ProcessPathEnvironment() {
    $processEnvironment = [System.Environment]::GetEnvironmentVariables("Process")
    $pathKeys = @($processEnvironment.Keys | Where-Object { [string]$_ -ieq "Path" })
    if ($pathKeys.Count -le 1) {
        return
    }

    $pathValue = [System.Environment]::GetEnvironmentVariable("Path", "Process")
    if ([string]::IsNullOrEmpty($pathValue)) {
        $pathValue = [System.Environment]::GetEnvironmentVariable("PATH", "Process")
    }

    foreach ($pathKey in $pathKeys) {
        [System.Environment]::SetEnvironmentVariable([string]$pathKey, $null, "Process")
    }
    [System.Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")
}

function Get-PortOwners([int]$Port) {
    @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 })
}

function Stop-PortOwners([int]$Port) {
    $owners = Get-PortOwners $Port
    foreach ($processId in $owners) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    return $owners.Count
}

function Quote-CmdArgument([string]$Value) {
    return '"' + ($Value -replace '"', '""') + '"'
}

function Join-CmdArguments([string[]]$Arguments) {
    return ($Arguments | ForEach-Object { Quote-CmdArgument $_ }) -join " "
}

function Get-VoltaCommand() {
    $volta = Get-Command "volta" -ErrorAction SilentlyContinue
    if ($volta -and $volta.Source) {
        return $volta.Source
    }
    return "volta"
}

function Assert-PortAvailable([int]$Port, [string]$Name) {
    $owners = Get-PortOwners $Port
    if ($owners.Count -gt 0) {
        throw "$Name port $Port is already in use by PID(s): $($owners -join ', '). Rerun with -StopExisting or choose another port."
    }
}

function Wait-HttpOk([string]$Uri, [int]$TimeoutSeconds = 30) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        } catch {
            Start-Sleep -Milliseconds 400
        }
    }
    throw "Timed out waiting for $Uri"
}

function Assert-FrontendIdentity([string]$Uri) {
    $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 5
    if ($response.Content -notmatch '<meta\s+name="lumen-demo-app"\s+content="knowledge-base-workbench"') {
        throw "Frontend identity marker mismatch at $Uri. The port may be serving another local app."
    }
}

function Get-BackendPython() {
    $venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
    if (Test-Path $venvPython) {
        return $venvPython
    }
    return "python"
}

function Start-DetachedCommandFile([string]$CommandFile, [string]$WorkingDirectory) {
    $commandLine = "cmd.exe /d /c " + (Quote-CmdArgument $CommandFile)
    $arguments = @{
        CommandLine = $commandLine
        CurrentDirectory = $WorkingDirectory
    }
    try {
        $startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly
        $startup.ShowWindow = 0
        $arguments.ProcessStartupInformation = $startup
    } catch {
        # ShowWindow is best-effort; the detached launch still works without it.
    }

    try {
        $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments $arguments
    } catch {
        throw "Detached mode needs permission to call WMI/CIM Win32_Process.Create. Run this script from an elevated terminal, or ask the AI tool to execute this one command with escalation. Original error: $($_.Exception.Message)"
    }
    if ($result.ReturnValue -ne 0) {
        throw "Failed to start detached process with WMI/CIM. ReturnValue=$($result.ReturnValue), command=$commandLine"
    }
    return [int]$result.ProcessId
}

function Test-HttpReachable([string]$Uri) {
    try {
        Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 读取项目根 .env（KEY=VALUE，忽略 # 注释 / 空行；剥掉值两侧引号），返回 hashtable。
# 用途：demo 后端进程注入 LLM 配置（LLM_PROVIDER / LLM_BASE_URL / LLM_MODEL / LLM_API_KEY），
# 让通用对话 / RAG 走真实内网中转 GLM，而非默认 mock 降级。.env 已被 gitignore，密钥不进入仓库。
function Read-EnvFile([string]$Path) {
    $result = @{}
    if (-not (Test-Path $Path)) {
        return $result
    }
    Get-Content -Path $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }
        $separator = $line.IndexOf("=")
        $key = $line.Substring(0, $separator).Trim()
        $value = $line.Substring($separator + 1).Trim()
        if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ($key) {
            $result[$key] = $value
        }
    }
    return $result
}

function Start-DemoProcess([string]$Name, [string[]]$CommandParts, [string]$WorkingDirectory, [hashtable]$Environment = @{}) {
    $stdout = Join-Path $tempRoot "$Name.out.log"
    $stderr = Join-Path $tempRoot "$Name.err.log"
    $commandFile = Join-Path $tempRoot "$Name.cmd"
    Remove-Item $stdout, $stderr -ErrorAction SilentlyContinue

    $lines = New-Object 'System.Collections.Generic.List[string]'
    $lines.Add("@echo off")
    $lines.Add("cd /d " + (Quote-CmdArgument $WorkingDirectory))
    foreach ($key in ($Environment.Keys | Sort-Object)) {
        $lines.Add("set " + (Quote-CmdArgument "$key=$($Environment[$key])"))
    }
    $lines.Add((Join-CmdArguments $CommandParts) + " > " + (Quote-CmdArgument $stdout) + " 2> " + (Quote-CmdArgument $stderr))
    $lines | Set-Content -Path $commandFile -Encoding ASCII

    if ($Detached) {
        $processId = Start-DetachedCommandFile $commandFile $WorkingDirectory
        Write-Host "Started $Name detached via WMI/CIM (launcher PID $processId); logs: $stdout / $stderr"
        $script:startedServices += [pscustomobject]@{
            name = $Name
            launcher_pid = $processId
            command_file = $commandFile
            stdout = $stdout
            stderr = $stderr
            mode = "wmi"
        }
    } else {
        $arguments = "/d /c " + (Quote-CmdArgument $commandFile)
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList $arguments -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -PassThru
        $script:processes += $process
        Write-Host "Started $Name (launcher PID $($process.Id)); logs: $stdout / $stderr"
        $script:startedServices += [pscustomobject]@{
            name = $Name
            launcher_pid = $process.Id
            command_file = $commandFile
            stdout = $stdout
            stderr = $stderr
            mode = "start-process"
        }
    }
}

function Find-Browser() {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"),
        (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
        (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe")
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) {
            return $candidate
        }
    }
    return $null
}

try {
    Normalize-ProcessPathEnvironment
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    if ($Stop) {
        if (Test-Path $runtimeStatePath) {
            $runtimeState = Get-Content -Raw -Encoding UTF8 $runtimeStatePath | ConvertFrom-Json
            if (-not $PSBoundParameters.ContainsKey("BackendPort") -and $runtimeState.backend_port) {
                $BackendPort = [int]$runtimeState.backend_port
            }
            if (-not $PSBoundParameters.ContainsKey("FrontendPort") -and $runtimeState.frontend_port) {
                $FrontendPort = [int]$runtimeState.frontend_port
            }
        }
        [void](Stop-PortOwners $BackendPort)
        [void](Stop-PortOwners $FrontendPort)
        Start-Sleep -Milliseconds 500
        $backendStillReachable = Test-HttpReachable "http://127.0.0.1:$BackendPort/docs"
        $frontendStillReachable = Test-HttpReachable "http://127.0.0.1:$FrontendPort"
        if ($backendStillReachable -or $frontendStillReachable) {
            throw "Demo stop could not terminate service(s) on backend port $BackendPort / frontend port $FrontendPort. If they were started through elevated WMI/CIM, rerun -Stop with the same/elevated permission."
        }
        Remove-Item $runtimeStatePath -ErrorAction SilentlyContinue
        Write-Host "Demo services stopped for backend port $BackendPort and frontend port $FrontendPort."
        $suppressFinalStopMessage = $true
        return
    }

    if ($StopExisting) {
        [void](Stop-PortOwners $BackendPort)
        [void](Stop-PortOwners $FrontendPort)
        Start-Sleep -Milliseconds 500
    } else {
        Assert-PortAvailable $BackendPort "Backend"
        Assert-PortAvailable $FrontendPort "Frontend"
    }

    $backendScript = Join-Path $tempRoot "sprint16_demo_backend.py"
    if ($UsePostgres) {
        @"
import sys
from pathlib import Path

repo_root = Path(r"$repoRoot")
sys.path.insert(0, str(repo_root))

import backend.main as main

app = main.create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=$BackendPort, log_level="warning")
"@ | Set-Content -Path $backendScript -Encoding UTF8
    } else {
        @"
from contextlib import asynccontextmanager
import importlib.util
import sys
import types
from pathlib import Path

repo_root = Path(r"$repoRoot")
sys.path.insert(0, str(repo_root))

demo_repository_path = repo_root / "backend" / "repository" / "demo_repository.py"
spec = importlib.util.spec_from_file_location("backend.repository.demo_repository", demo_repository_path)
demo_repository_module = importlib.util.module_from_spec(spec)
sys.modules["backend.repository.demo_repository"] = demo_repository_module
spec.loader.exec_module(demo_repository_module)

repository_module = types.ModuleType("backend.repository")
repository_module.__path__ = [str(repo_root / "backend" / "repository")]
repository_module.DemoRepository = demo_repository_module.DemoRepository
repository_module.demo_repository = demo_repository_module
repository_module.repository = demo_repository_module.DemoRepository()
sys.modules["backend.repository"] = repository_module

import backend.main as main

@asynccontextmanager
async def noop_lifespan(_app):
    yield

main.lifespan = noop_lifespan
app = main.create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=$BackendPort, log_level="warning")
"@ | Set-Content -Path $backendScript -Encoding UTF8
    }

    Remove-Item Env:VITE_API_BASE -ErrorAction SilentlyContinue
    $env:DEMO_BACKEND_PROXY_URL = "http://127.0.0.1:$BackendPort"
    $backendPython = Get-BackendPython
    $voltaCommand = Get-VoltaCommand
    Write-Host "Using backend Python: $backendPython"
    Write-Host "Using Volta command: $voltaCommand"

    $envVariables = Read-EnvFile (Join-Path $repoRoot ".env")
    if ($envVariables.Count -gt 0) {
        Write-Host "Loading $($envVariables.Count) env var(s) from .env into backend process (LLM: $($envVariables.LLM_PROVIDER)/$($envVariables.LLM_MODEL))."
    }
    Start-DemoProcess "backend" @($backendPython, $backendScript) $repoRoot $envVariables
    Start-DemoProcess "frontend" @($voltaCommand, "run", "--node", "22.17.1", "npm", "exec", "vite", "--", "--host", "localhost", "--port", "$FrontendPort", "--strictPort") $frontendRoot @{
        VITE_API_BASE = ""
        DEMO_BACKEND_PROXY_URL = "http://127.0.0.1:$BackendPort"
    }

    Wait-HttpOk "http://127.0.0.1:$BackendPort/docs" 30
    Wait-HttpOk "http://localhost:$FrontendPort" 30

    $frontendUrl = "http://localhost:$FrontendPort"
    Assert-FrontendIdentity $frontendUrl
    if ($RequiredBackendRoute.Count -gt 0) {
        $runtimeCheckScript = Join-Path $repoRoot "scripts\check-runtime-openapi.ps1"
        & $runtimeCheckScript -BackendUrl "http://127.0.0.1:$BackendPort" -RequireRoute $RequiredBackendRoute
    }
    Write-Host ""
    Write-Host "Sprint-16 demo is ready: $frontendUrl"
    if ($UsePostgres) {
        Write-Host "Login account: alice / demo-pass-1234 (seeded account, real PG authentication)"
    } else {
        Write-Host "Login account: alice (demo mode, no password)"
    }
    Write-Host "Try: Documents view -> batch import panel -> drag/select .md/.txt files or a folder -> Search/Query."
    if ($UsePostgres) {
        Write-Host "Backend uses the PostgreSQL repository (persistent); data survives restarts. Requires the lumen-pg container."
    } else {
        Write-Host "Backend uses an in-memory demo repository for this run; no PostgreSQL data is changed."
    }

    if (-not $NoBrowser) {
        $browser = Find-Browser
        if ($browser) {
            Start-Process -FilePath $browser -ArgumentList @($frontendUrl) | Out-Null
        } else {
            Start-Process $frontendUrl | Out-Null
        }
    }

    if ($Detached) {
        $leaveRunning = $true
        $runtimeState = [pscustomobject]@{
            started_at = (Get-Date).ToString("s")
            backend_port = $BackendPort
            frontend_port = $FrontendPort
            backend_url = "http://127.0.0.1:$BackendPort"
            frontend_url = $frontendUrl
            backend_port_owners = @(Get-PortOwners $BackendPort)
            frontend_port_owners = @(Get-PortOwners $FrontendPort)
            required_backend_routes = $RequiredBackendRoute
            services = $startedServices
        }
        $runtimeState | ConvertTo-Json -Depth 6 | Set-Content -Path $runtimeStatePath -Encoding UTF8
        Write-Host ""
        Write-Host "Demo services are running in background."
        Write-Host "Runtime state: $runtimeStatePath"
        Write-Host "Stop them with: powershell -ExecutionPolicy Bypass -File scripts/run-sprint16-demo.ps1 -BackendPort $BackendPort -FrontendPort $FrontendPort -Stop"
        return
    }

    Write-Host ""
    Read-Host "Press Enter here to stop the demo services"
} finally {
    if (-not $leaveRunning) {
        foreach ($process in $processes) {
            if ($process -and -not $process.HasExited) {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
        [void](Stop-PortOwners $BackendPort)
        [void](Stop-PortOwners $FrontendPort)
    }
    if ($hadViteApiBase) {
        $env:VITE_API_BASE = $oldViteApiBase
    } else {
        Remove-Item Env:VITE_API_BASE -ErrorAction SilentlyContinue
    }
    if ($hadDemoBackendProxyUrl) {
        $env:DEMO_BACKEND_PROXY_URL = $oldDemoBackendProxyUrl
    } else {
        Remove-Item Env:DEMO_BACKEND_PROXY_URL -ErrorAction SilentlyContinue
    }
    if ((-not $leaveRunning) -and (-not $suppressFinalStopMessage)) {
        Write-Host "Demo services stopped."
    }
}
