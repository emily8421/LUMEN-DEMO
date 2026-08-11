"""FastAPI router for Sprint-17/18 document / space export.

两个端点横跨 ``/api/documents/{id}/export`` 与 ``/api/export/space``，故 ``router`` 取
``/api`` 前缀统一收纳导出子系统（与 ``backend/service/export.py``、``docs/design/export-delivery.md``
Flow-007/008 对应）。API-030 成功路径返回二进制 ``Response``（绕过 ``{code,msg,data}`` JSON
封装）；API-019 的创建路径返回导出任务 JSON，下载路径返回 PDF 二进制。错误路径仍
``raise HTTPException(detail={"code","msg"})``，由 ``backend/main.py`` 全局 handler 统一封装。
"""

from __future__ import annotations

from urllib.parse import quote

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.export import (
    PdfExportOptions,
    create_pdf_export,
    download_pdf_export,
    export_document_md,
    export_space_zip,
)

try:
    from fastapi import APIRouter, Depends, HTTPException, Query
    from fastapi.responses import Response
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception
    Query = None
    Response = object


if APIRouter is not None:
    router = APIRouter(prefix="/api", tags=["export"])

    class PdfExportOptionsBody(BaseModel):
        include_sources: bool = False
        theme: str = "default"

    class PdfExportRequestBody(BaseModel):
        document_id: int
        version_no: int | None = None
        options: PdfExportOptionsBody | None = None

    @router.get("/documents/{document_id}/export")
    def export_document_endpoint(
        document_id: int,
        format: str = Query(default="md"),
        version_no: int | None = Query(default=None),
        ctx: TokenContext = Depends(get_current_user),
    ) -> Response:
        if format != "md":
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "only markdown export is supported"})

        export = export_document_md(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            document_id=document_id,
            version_no=version_no,
        )

        return Response(
            content=export.content,
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": _content_disposition_attachment(export.filename)},
        )

    @router.get("/export/space")
    def export_space_endpoint(
        format: str = Query(default="zip"),
        ctx: TokenContext = Depends(get_current_user),
    ) -> Response:
        if format != "zip":
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "only zip space export is supported"})

        # 空间访问被拒（SpaceAccessError）冒泡 main.py ApiError handler → 403/4003 envelope
        export = export_space_zip(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
        )

        return Response(
            content=export.archive,
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="lumen-space-export.zip"'},
        )

    @router.post("/export-pdf")
    def export_pdf_endpoint(
        request: PdfExportRequestBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict:
        options = request.options or PdfExportOptionsBody()

        result = create_pdf_export(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            document_id=request.document_id,
            version_no=request.version_no,
            options=PdfExportOptions(
                include_sources=options.include_sources,
                theme=options.theme,
            ),
        )

        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "export_id": result.export_id,
                "status": result.status,
                "artifact_path": result.artifact_path,
            },
        }

    @router.get("/export-pdf/{export_id}/download")
    def download_pdf_endpoint(
        export_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> Response:

        artifact = download_pdf_export(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            export_id=export_id,
        )

        return Response(
            content=artifact.content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": _content_disposition_attachment(
                    artifact.filename,
                    fallback_filename="document.pdf",
                )
            },
        )


    def _content_disposition_attachment(filename: str, fallback_filename: str = "document.md") -> str:
        fallback = "".join(
            char if 32 <= ord(char) <= 126 and char not in {'"', "\\", "/", ";"} else "_"
            for char in filename
        ).strip()
        fallback = fallback or fallback_filename
        return f'attachment; filename="{fallback}"; filename*=UTF-8\'\'{quote(filename, safe="")}'
else:
    router = None
