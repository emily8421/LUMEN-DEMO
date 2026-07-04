param(
    [string]$HostAddress = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$versionOutput = python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($versionOutput -ne "3.12") {
    Write-Warning "Current python is $versionOutput, while docs/05-tech-spec.md currently pins backend runtime to Python 3.12.x. Python 3.14 support is under evaluation; see docs/research/2026-07-04-tech-env-evaluation-phase1.md."
}

python -c "import fastapi, uvicorn, pydantic" | Out-Null
python -m uvicorn backend.main:app --reload --host $HostAddress --port $Port
