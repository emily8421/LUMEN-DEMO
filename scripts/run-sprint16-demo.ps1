param(
    [int]$BackendPort = 18000,
    [int]$FrontendPort = 5173,
    [switch]$NoBrowser,
    [switch]$StopExisting
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontendRoot = Join-Path $repoRoot "frontend"
$tempRoot = Join-Path $env:TEMP "lumen-sprint16-demo"
$processes = @()
$hadViteApiBase = Test-Path Env:VITE_API_BASE
$oldViteApiBase = $env:VITE_API_BASE
$hadDemoBackendProxyUrl = Test-Path Env:DEMO_BACKEND_PROXY_URL
$oldDemoBackendProxyUrl = $env:DEMO_BACKEND_PROXY_URL

function Get-PortOwners([int]$Port) {
    @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 })
}

function Stop-PortOwners([int]$Port) {
    foreach ($processId in Get-PortOwners $Port) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
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

function Start-DemoProcess([string]$Name, [string]$FilePath, [string[]]$ArgumentList, [string]$WorkingDirectory) {
    $stdout = Join-Path $tempRoot "$Name.out.log"
    $stderr = Join-Path $tempRoot "$Name.err.log"
    Remove-Item $stdout, $stderr -ErrorAction SilentlyContinue
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    $script:processes += $process
    Write-Host "Started $Name (PID $($process.Id)); logs: $stdout / $stderr"
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
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    if ($StopExisting) {
        Stop-PortOwners $BackendPort
        Stop-PortOwners $FrontendPort
        Start-Sleep -Milliseconds 500
    } else {
        Assert-PortAvailable $BackendPort "Backend"
        Assert-PortAvailable $FrontendPort "Frontend"
    }

    $backendScript = Join-Path $tempRoot "sprint16_demo_backend.py"
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

    Remove-Item Env:VITE_API_BASE -ErrorAction SilentlyContinue
    $env:DEMO_BACKEND_PROXY_URL = "http://127.0.0.1:$BackendPort"
    $backendPython = Get-BackendPython
    Write-Host "Using backend Python: $backendPython"

    Start-DemoProcess "backend" $backendPython @($backendScript) $repoRoot
    Start-DemoProcess "frontend" "npm.cmd" @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$FrontendPort", "--strictPort") $frontendRoot

    Wait-HttpOk "http://127.0.0.1:$BackendPort/docs" 30
    Wait-HttpOk "http://127.0.0.1:$FrontendPort" 30

    $frontendUrl = "http://127.0.0.1:$FrontendPort"
    Assert-FrontendIdentity $frontendUrl
    Write-Host ""
    Write-Host "Sprint-16 demo is ready: $frontendUrl"
    Write-Host "Login account: alice"
    Write-Host "Try: Documents view -> batch import panel -> drag/select .md/.txt files or a folder -> Search/Query."
    Write-Host "Backend uses an in-memory demo repository for this run; no PostgreSQL data is changed."

    if (-not $NoBrowser) {
        $browser = Find-Browser
        if ($browser) {
            Start-Process -FilePath $browser -ArgumentList @($frontendUrl) | Out-Null
        } else {
            Start-Process $frontendUrl | Out-Null
        }
    }

    Write-Host ""
    Read-Host "Press Enter here to stop the demo services"
} finally {
    foreach ($process in $processes) {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Stop-PortOwners $BackendPort
    Stop-PortOwners $FrontendPort
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
    Write-Host "Demo services stopped."
}
