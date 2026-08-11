"""FastAPI router for Sprint-3 degraded text import."""

from __future__ import annotations

from backend.model.entities import DocumentPermission
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.imports import (
    BatchImportFileRequest,
    BatchImportRequest,
    ImportTextRequest,
    import_batch,
    import_extracted_text,
)
from backend.service.space import SpaceAccessError

try:
    from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    File = None
    Form = None
    HTTPException = Exception
    UploadFile = object


if APIRouter is not None:
    router = APIRouter(prefix="/api/import", tags=["imports"])

    @router.post("")
    async def import_file_endpoint(
        file: UploadFile = File(...),
        title: str | None = Form(default=None),
        permission: DocumentPermission = Form(default=DocumentPermission.TEAM),
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        content = await file.read()
        try:
            resolved_permission = DocumentPermission(permission)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "invalid document permission"}) from exc
        # space access（SpaceAccessError，B-5 未迁移需保留 except）；ImportValidationError 已继承 ApiError 冒泡 main.py handler。
        try:
            result = import_extracted_text(
                repository=repository,
                user_id=ctx.user_id,
                current_space_id=ctx.current_space_id,
                request=ImportTextRequest(
                    filename=file.filename or "",
                    content=content,
                    title=title,
                    permission=resolved_permission,
                ),
            )
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc

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

    @router.post("/batch")
    async def import_batch_endpoint(
        files: list[UploadFile] = File(...),
        relative_paths: list[str] | None = Form(default=None),
        conflict_policy: str = Form(default="skip"),
        preserve_structure: bool = Form(default=True),
        permission: DocumentPermission = Form(default=DocumentPermission.TEAM),
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            resolved_permission = DocumentPermission(permission)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "invalid document permission"}) from exc

        upload_requests: list[BatchImportFileRequest] = []
        for index, file in enumerate(files):
            content = await file.read()
            upload_requests.append(
                BatchImportFileRequest(
                    filename=file.filename or "",
                    content=content,
                    relative_path=_relative_path_at(relative_paths, index),
                )
            )

        try:
            result = import_batch(
                repository=repository,
                user_id=ctx.user_id,
                current_space_id=ctx.current_space_id,
                request=BatchImportRequest(
                    files=upload_requests,
                    permission=resolved_permission,
                    conflict_policy=conflict_policy,
                    preserve_structure=preserve_structure,
                ),
            )
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc

        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "batch_id": result.batch_id,
                "total": result.total,
                "success_count": result.success_count,
                "failed_count": result.failed_count,
                "skipped_count": result.skipped_count,
                "items": [
                    {
                        "filename": item.filename,
                        "relative_path": item.relative_path,
                        "title": item.title,
                        "status": item.status,
                        "import_id": item.import_id,
                        "parsed_doc_id": item.parsed_doc_id,
                        "folder_id": item.folder_id,
                        "chunk_count": item.chunk_count,
                        "error": item.error,
                    }
                    for item in result.items
                ],
            },
        }


    def _relative_path_at(relative_paths: list[str] | None, index: int) -> str | None:
        if relative_paths is None or index >= len(relative_paths):
            return None
        return relative_paths[index]
else:
    router = None
