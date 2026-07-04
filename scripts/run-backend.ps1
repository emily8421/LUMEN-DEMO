param(
    [string]$HostAddress = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

python -c "import fastapi, uvicorn, pydantic" | Out-Null
python -m uvicorn backend.main:app --reload --host $HostAddress --port $Port

