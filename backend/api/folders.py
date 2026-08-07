"""FastAPI router for REQ-039 folders (API-034..037, Phase2B 第三 slice 候选 minimal).

GET /api/folders?parent_id= ；POST /api/folders ；
PATCH/DELETE /api/folders/{id}；POST /api/folders/reorder。
全部带空间隔离（token ``current_space_id``）与文档可见性过滤（service 层）。

API 路径裁定（2026-08-02 用户确认）：遵循既有项目惯例（tags/documents 均用 token
current_space_id）与设计 §4，使用 ``/api/folders``；07 原草案 ``/api/spaces/{id}/folders``
随完成包同步修订为 ``/api/folders``。

PATCH 同时支持改名（name）与移动（parent_id，null=移到根）；用 ``model_fields_set``
区分「字段未传」与「字段显式 null」。
"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.folder import (
    UNSET,
    FolderAccessError,
    FolderConflictError,
    FolderCreateRequest,
    FolderNotFoundError,
    FolderUpdateRequest,
    FolderValidationError,
    FolderView,
    create_folder,
    delete_folder,
    list_folders,
    reorder_folders,
    update_folder,
)

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(tags=["folders"])

    class FolderCreateBody(BaseModel):
        name: str
        parent_id: int | None = None

    class FolderUpdateBody(BaseModel):
        name: str | None = None
        parent_id: int | None = None

    class FolderReorderBody(BaseModel):
        parent_id: int | None = None
        ordered_ids: list[int]

    @router.get("/api/folders")
    def list_folders_endpoint(
        parent_id: int | None = None,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            views = list_folders(repository, ctx.user_id, ctx.current_space_id, parent_id)
        except FolderAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        items = [_folder_view(v) for v in views]
        return {"code": 0, "msg": "ok", "data": {"items": items, "total": len(items)}}

    @router.post("/api/folders")
    def create_folder_endpoint(
        request: FolderCreateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            folder = create_folder(
                repository,
                ctx.user_id,
                ctx.current_space_id,
                FolderCreateRequest(name=request.name, parent_id=request.parent_id),
            )
        except FolderAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except FolderConflictError as exc:
            raise HTTPException(status_code=409, detail={"code": 4090, "msg": str(exc)}) from exc
        except FolderValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": _folder_detail(folder)}

    @router.patch("/api/folders/{folder_id}")
    def update_folder_endpoint(
        folder_id: int,
        request: FolderUpdateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        fields = _fields_set(request)
        name = request.name if "name" in fields else UNSET
        target_parent = request.parent_id if "parent_id" in fields else UNSET
        try:
            folder = update_folder(
                repository,
                ctx.user_id,
                ctx.current_space_id,
                folder_id,
                FolderUpdateRequest(name=name, parent_id=target_parent),
            )
        except FolderAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except FolderNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": str(exc)}) from exc
        except FolderConflictError as exc:
            raise HTTPException(status_code=409, detail={"code": 4090, "msg": str(exc)}) from exc
        except FolderValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": _folder_detail(folder)}

    @router.delete("/api/folders/{folder_id}")
    def delete_folder_endpoint(
        folder_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            delete_folder(repository, ctx.user_id, ctx.current_space_id, folder_id)
        except FolderAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except FolderNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": str(exc)}) from exc
        except FolderConflictError as exc:
            raise HTTPException(status_code=409, detail={"code": 4090, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    @router.post("/api/folders/reorder")
    def reorder_folders_endpoint(
        request: FolderReorderBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            reorder_folders(
                repository,
                ctx.user_id,
                ctx.current_space_id,
                request.parent_id,
                request.ordered_ids,
            )
        except FolderAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except FolderValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": {"ok": True}}

    def _fields_set(model) -> set[str]:
        # Pydantic v2: model_fields_set；v1: __fields_set__
        return getattr(model, "model_fields_set", None) or getattr(model, "__fields_set__", set()) or set()

    def _folder_view(view: FolderView) -> dict[str, object]:
        return {
            "id": view.id,
            "name": view.name,
            "parent_id": view.parent_id,
            "order": view.order,
            "document_count": view.document_count,
            "child_folder_count": view.child_folder_count,
            "created_at": view.created_at,
            "updated_at": view.updated_at,
        }

    def _folder_detail(folder) -> dict[str, object]:
        return {
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "order": folder.order,
        }

else:
    router = None
