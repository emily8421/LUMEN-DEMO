# Backend Runtime

> Phase1 backend runtime notes. Sprint-1 currently exposes demo auth and spaces APIs only.

## Python Runtime

- Target runtime: Python 3.12.x, per `docs/05-tech-spec.md`.
- Local auxiliary Python may differ; before productionizing, create a Python 3.12 virtual environment.

## Install Dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

## Start API

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Or use the local helper:

```powershell
.\scripts\run-backend.ps1
```

## Smoke Test

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"external_id":"alice","current_space_id":10}'

$token = $login.data.token
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:8000/api/spaces `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/spaces/switch `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"space_id":20}'
```

## Validation

```powershell
python -m unittest discover -s tests/backend -v
python -m compileall backend tests/backend
python -c "from backend.main import create_app; app=create_app(); print([route.path for route in app.routes if route.path.startswith('/api')])"
```

## Notes

- Demo token signing key defaults to a local development value and can be overridden with `LUMEN_DEMO_TOKEN_KEY`.
- Sprint-1 API uses an in-memory demo repository until PostgreSQL repository integration is implemented.
- SQL foundation lives in `backend/migrations/001_sprint1_space_permissions.sql`.
- If local port binding is restricted by the host environment, `tests/backend/test_api_routes.py` validates the Sprint-1 API handlers without opening a socket.
