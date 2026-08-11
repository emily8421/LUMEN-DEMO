"""FastAPI router for REQ-012 tags (API-014/027/031/032, Phase2A minimal).

GET/POST /api/tags；GET/PUT/DELETE /api/tags/{id}；
GET/POST /api/documents/{id}/tags；DELETE /api/documents/{id}/tags/{tag_id}；
GET /api/tags/{id}/documents。全部带空间隔离与文档权限过滤（service 层）。
单 router、全路径：因混 /api/tags 与 /api/documents/{id}/tags 两类根，不便用统一 prefix。
"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.document import DocumentNotFoundError
from backend.service.tag import (
    DocumentTagView,
    Tag,
    TagCreateRequest,
    TagUpdateRequest,
    TagView,
    add_document_tag,
    archive_tag,
    create_tag,
    get_tag_detail,
    list_document_tags,
    list_documents_by_tag,
    list_tags,
    remove_document_tag,
    update_tag,
)

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(tags=["tags"])

    class TagCreateBody(BaseModel):
        name: str
        color: str | None = None
        description: str | None = None

    class TagUpdateBody(BaseModel):
        name: str | None = None
        color: str | None = None
        description: str | None = None
        status: str | None = None

    class DocumentTagCreateBody(BaseModel):
        tag_id: int

    @router.get("/api/tags")
    def list_tags_endpoint(
        q: str | None = None,
        status: str | None = "active",
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        views = list_tags(repository, ctx.user_id, ctx.current_space_id, q, status)
        items = [_tag_view(view) for view in views]
        return {"code": 0, "msg": "ok", "data": {"items": items, "total": len(items)}}

    @router.post("/api/tags")
    def create_tag_endpoint(
        request: TagCreateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        tag = create_tag(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            TagCreateRequest(name=request.name, color=request.color, description=request.description),
        )
        return {"code": 0, "msg": "ok", "data": _tag_detail(tag)}

    @router.get("/api/tags/{tag_id}")
    def get_tag_endpoint(tag_id: int, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        view = get_tag_detail(repository, ctx.user_id, ctx.current_space_id, tag_id)
        return {"code": 0, "msg": "ok", "data": _tag_view(view)}

    @router.put("/api/tags/{tag_id}")
    def update_tag_endpoint(
        tag_id: int,
        request: TagUpdateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        tag = update_tag(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            tag_id,
            TagUpdateRequest(
                name=request.name,
                color=request.color,
                description=request.description,
                status=request.status,
            ),
        )
        return {"code": 0, "msg": "ok", "data": _tag_detail(tag)}

    @router.delete("/api/tags/{tag_id}")
    def archive_tag_endpoint(tag_id: int, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        tag = archive_tag(repository, ctx.user_id, ctx.current_space_id, tag_id)
        return {"code": 0, "msg": "ok", "data": _tag_detail(tag)}

    @router.get("/api/documents/{document_id}/tags")
    def list_document_tags_endpoint(
        document_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            views = list_document_tags(repository, ctx.user_id, ctx.current_space_id, document_id)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        items = [_document_tag_view(view) for view in views]
        return {"code": 0, "msg": "ok", "data": {"items": items, "total": len(items)}}

    @router.post("/api/documents/{document_id}/tags")
    def add_document_tag_endpoint(
        document_id: int,
        request: DocumentTagCreateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            link = add_document_tag(
                repository, ctx.user_id, ctx.current_space_id, document_id, request.tag_id
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "tag_id": link.tag_id,
                "document_id": link.document_id,
                "link_source": link.link_source,
            },
        }

    @router.delete("/api/documents/{document_id}/tags/{tag_id}")
    def remove_document_tag_endpoint(
        document_id: int,
        tag_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            remove_document_tag(repository, ctx.user_id, ctx.current_space_id, document_id, tag_id)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    @router.get("/api/tags/{tag_id}/documents")
    def list_documents_by_tag_endpoint(
        tag_id: int,
        status: str | None = "active",
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        documents = list_documents_by_tag(
            repository, ctx.user_id, ctx.current_space_id, tag_id, status
        )
        items = [_document_view(document) for document in documents]
        return {"code": 0, "msg": "ok", "data": {"items": items, "total": len(items)}}

    def _tag_view(view: TagView) -> dict[str, object]:
        return {
            "id": view.id,
            "name": view.name,
            "color": view.color,
            "description": view.description,
            "document_count": view.document_count,
            "status": view.status,
        }

    def _tag_detail(tag: Tag) -> dict[str, object]:
        return {
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
            "description": tag.description,
            "status": tag.status,
        }

    def _document_tag_view(view: DocumentTagView) -> dict[str, object]:
        return {
            "tag_id": view.tag_id,
            "name": view.name,
            "color": view.color,
            "link_source": view.link_source,
        }

    def _document_view(document) -> dict[str, object]:
        return {
            "id": document.id,
            "title": document.title,
            "permission": document.permission.value,
            "owner_id": document.owner_id,
            "updated_at": document.updated_at,
        }

else:
    router = None
