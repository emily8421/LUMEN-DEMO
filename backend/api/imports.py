"""FastAPI router for Sprint-3 degraded text import."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.model.entities import DocumentPermission
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.repository import repository
from backend.service.imports import ImportTextRequest, ImportValidationError, import_extracted_text

try:
    from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    File = None
    Form = None
    Header = None
    HTTPException = Exception
    UploadFile = object


if APIRouter is not None:
    router = APIRouter(prefix="/api/import", tags=["imports"])

    @router.post("")
    async def import_file_endpoint(
        file: UploadFile = File(...),
        title: str | None = Form(default=None),
        permission: DocumentPermission = Form(default=DocumentPermission.TEAM),
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        content = await file.read()
        try:
            resolved_permission = DocumentPermission(permission)
            result = import_extracted_text(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
                request=ImportTextRequest(
                    filename=file.filename or "",
                    content=content,
                    title=title,
                    permission=resolved_permission,
                ),
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "invalid document permission"}) from exc
        except ImportValidationError as exc:
            if str(exc) == "space access denied":
                raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc

        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "import_id": result.import_job.id,
                "status": result.import_job.status,
                "parsed_doc_id": result.parsed_doc_id,
                "chunk_count": result.chunk_count,
                "mode": "degraded_text",
            },
        }

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc
else:
    router = None
