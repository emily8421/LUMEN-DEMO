"""FastAPI router for Sprint-17 document / space export (API-030, REQ-038).

两个端点横跨 ``/api/documents/{id}/export`` 与 ``/api/export/space``，故 ``router`` 取
``/api`` 前缀统一收纳导出子系统（与 ``backend/service/export.py``、``docs/design/export-delivery.md``
Flow-007 对应）。成功路径返回二进制 ``Response``（项目首例，绕过 ``{code,msg,data}`` JSON 封装）；
错误路径仍 ``raise HTTPException(detail={"code","msg"})``，由 ``backend/main.py`` 全局 handler 统一封装。
"""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.repository import repository
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.service.document import DocumentNotFoundError, VersionNotFoundError
from backend.service.export import ExportError, export_document_md, export_space_zip
from backend.service.space import SpaceAccessError

try:
    from fastapi import APIRouter, Header, HTTPException, Query
    from fastapi.responses import Response
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    Header = None
    HTTPException = Exception
    Query = None
    Response = object


if APIRouter is not None:
    router = APIRouter(prefix="/api", tags=["export"])

    @router.get("/documents/{document_id}/export")
    def export_document_endpoint(
        document_id: int,
        format: str = Query(default="md"),
        version_no: int | None = Query(default=None),
        authorization: str = Header(default=""),
    ) -> Response:
        payload = _read_token_payload(authorization)
        if format != "md":
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "only markdown export is supported"})

        try:
            export = export_document_md(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
                document_id=document_id,
                version_no=version_no,
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except VersionNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "version not found"}) from exc

        return Response(
            content=export.content,
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{export.filename}"'},
        )

    @router.get("/export/space")
    def export_space_endpoint(
        format: str = Query(default="zip"),
        authorization: str = Header(default=""),
    ) -> Response:
        payload = _read_token_payload(authorization)
        if format != "zip":
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "only zip space export is supported"})

        try:
            export = export_space_zip(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
            )
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc
        except ExportError as exc:
            raise HTTPException(status_code=500, detail={"code": 5000, "msg": "failed to export space"}) from exc

        return Response(
            content=export.archive,
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="lumen-space-export.zip"'},
        )

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc
else:
    router = None
