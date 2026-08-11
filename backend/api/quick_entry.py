"""FastAPI router for REQ-025 quick entries (API-017, Phase2A minimal).

POST /api/quick-entry（capture：mode=draft / create_document / append_document）；
DELETE /api/quick-entry/{id}（discard：仅 status=draft → discarded）。
全部带空间隔离与文档权限过滤（service 层）。
"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.quick_entry import (
    QuickEntryCaptureRequest,
    QuickEntryView,
    capture_quick_entry,
    discard_quick_entry,
)

try:
    from fastapi import APIRouter, Depends
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object


if APIRouter is not None:
    router = APIRouter(tags=["quick-entry"])

    class QuickEntryCaptureBody(BaseModel):
        title: str
        content_md: str = ""
        source: str | None = None
        target_document_id: int | None = None
        tag_ids: list[int] = []
        mode: str = "draft"

    @router.post("/api/quick-entry")
    def capture_quick_entry_endpoint(
        request: QuickEntryCaptureBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        view = capture_quick_entry(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            QuickEntryCaptureRequest(
                title=request.title,
                content_md=request.content_md,
                source=request.source,
                target_document_id=request.target_document_id,
                tag_ids=tuple(request.tag_ids),
                mode=request.mode,
            ),
        )
        return {"code": 0, "msg": "ok", "data": _quick_entry_view(view)}

    @router.delete("/api/quick-entry/{entry_id}")
    def discard_quick_entry_endpoint(
        entry_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        view = discard_quick_entry(repository, ctx.user_id, ctx.current_space_id, entry_id)
        return {"code": 0, "msg": "ok", "data": _quick_entry_view(view)}

    def _quick_entry_view(view: QuickEntryView) -> dict[str, object]:
        return {
            "id": view.id,
            "status": view.status,
            "created_document_id": view.created_document_id,
            "target_document_id": view.target_document_id,
            "title": view.title,
            "owner_id": view.owner_id,
        }

else:
    router = None
