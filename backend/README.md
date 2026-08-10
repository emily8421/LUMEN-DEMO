# Backend Runtime

> Phase1 backend runtime notes. Sprint-2 currently exposes demo auth, spaces, document CRUD, and document version APIs.

## Python Runtime

- Current documented backend runtime baseline: Python 3.12.x, per `docs/05-tech-spec.md`.
- Local environment currently has Python 3.14.3; Python 3.14 support is under formal evaluation in `docs/research/2026-07-04-tech-env-evaluation-phase1.md`.
- Do not treat Python 3.12 as a permanent preference by default. The project should prefer the current local/team runtime when dependencies support it; use Python 3.12 only until the Python 3.14 route is evaluated and accepted.

## Install Dependencies

Current documented baseline path:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

If `py` is unavailable or cannot be executed, install Python 3.12 first and use the Python 3.12 executable directly, for example:

```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

Python 3.14 route: do not reuse the current pinned `backend/requirements.txt` blindly. First complete the dependency matrix evaluation in `docs/research/2026-07-04-tech-env-evaluation-phase1.md`, then update `docs/05-tech-spec.md` and this requirements file together.

## Start API

```powershell
.\.venv\Scripts\Activate.ps1
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1
```

Equivalent direct command:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 18000
```

If port `18000` is blocked or reserved, try another port:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1 -Port 28000
```

## Smoke Test

Replace `18000` with the port you used if needed.

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"external_id":"alice","current_space_id":10}'

$token = $login.data.token
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:18000/api/spaces `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18000/api/spaces/switch `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"space_id":20}'

$doc = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18000/api/documents `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"title":"Sprint-2 Demo","content_md":"v1","permission":"team"}'

$docId = $doc.data.id

foreach ($version in 2..4) {
  Invoke-RestMethod -Method Put -Uri "http://127.0.0.1:18000/api/documents/$docId" `
    -ContentType 'application/json' `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body "{`"title`":`"Sprint-2 Demo`",`"content_md`":`"v$version`",`"permission`":`"team`"}"
}

Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:18000/api/documents/$docId/versions" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:18000/api/documents/$docId/versions/2/restore" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Sprint-3 degraded text import

When Docker / PDF / OCR / Embedding are not ready, Sprint-3 exposes a degraded Demo import path for pre-extracted `.txt` / `.md` content. It creates a Markdown document and in-memory chunks, but does not parse PDFs, run OCR, or write embeddings.

```powershell
$samplePath = Join-Path $PWD "sample-import.md"
Set-Content -Encoding UTF8 $samplePath "# Imported`n`nPre-extracted Sprint-3 demo text."

curl.exe -s -X POST http://127.0.0.1:18000/api/import `
  -H "Authorization: Bearer $token" `
  -F "title=Imported Demo" `
  -F "permission=team" `
  -F "file=@$samplePath;type=text/markdown"
```

The response contains `status=done`, `parsed_doc_id`, `chunk_count`, and `mode=degraded_text`. Use `GET /api/documents/{parsed_doc_id}` to read the generated document.

## Validation

```powershell
# Default unit tests (no PG connection; integration tests are excluded)
python -m pytest tests/backend -m "not integration" -v
python -m compileall backend tests/backend
python -c "from backend.main import create_app; app=create_app(); print([route.path for route in app.routes if route.path.startswith('/api')])"
# PG integration tests require a separate lumen_test DB + three guard env vars
# (see tests/backend/pg_test_support.py). Powershell example:
#   $env:LUMEN_ENV='test'; $env:ALLOW_DESTRUCTIVE_TEST_DB='1'; $env:DATABASE_URL='postgresql://lumen:lumen@localhost:15432/lumen_test'
#   python -m pytest tests/backend -m integration -v
```

## Troubleshooting

### `pydantic-core` build fails on Python 3.14

Current known failure: Phase1 pins Pydantic 2.10.x per `docs/05-tech-spec.md`; with Python 3.14 this can fall back to building `pydantic-core` from source and require MSVC `link.exe`.

This does not prove Python 3.14 is unsuitable. It proves the current pinned dependency set is not valid for Python 3.14. Complete the evaluation in `docs/research/2026-07-04-tech-env-evaluation-phase1.md` before changing the baseline.

### `WinError 10013` when starting Uvicorn

Cause: Windows may block binding the selected address / port because of permissions, reservation, firewall, security software, or another service.

Try:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1 -Port 28000
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1 -HostAddress 127.0.0.1 -Port 28000
```

You can also inspect whether a port is in use:

```powershell
netstat -ano | findstr :18000
```

If local port binding remains blocked by the host environment, `tests/backend/test_api_routes.py` validates the Sprint-1 API handlers without opening a socket.

## Notes

- Demo token signing key defaults to a local development value and can be overridden with `LUMEN_DEMO_TOKEN_KEY`.
- Sprint-1 API uses an in-memory demo repository until PostgreSQL repository integration is implemented.
- SQL foundation lives in `backend/migrations/001_sprint1_space_permissions.sql`.



