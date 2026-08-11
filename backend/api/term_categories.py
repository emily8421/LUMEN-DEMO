"""FastAPI router for REQ-036 术语领域树（migration 017，领域树增强）。

GET /api/term-categories?parent_id= ；POST /api/term-categories ；
PATCH/DELETE /api/term-categories/{id}；POST /api/term-categories/reorder。
全部带空间隔离（token ``current_space_id``）与术语可见性（service 层）。

仿 ``folders.py``（REQ-039 API-034..037）。PATCH 同时支持改名（name）与移动
（parent_id，null=移到根）；用 ``model_fields_set`` 区分「字段未传」与「字段显式 null」。
"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.term_category import (
    UNSET,
    TermCategoryCreateRequest,
    TermCategoryUpdateRequest,
    TermCategoryView,
    create_term_category,
    delete_term_category,
    list_term_categories,
    reorder_term_categories,
    update_term_category,
)

try:
    from fastapi import APIRouter, Depends
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object


if APIRouter is not None:
    router = APIRouter(tags=["term-categories"])

    class TermCategoryCreateBody(BaseModel):
        name: str
        parent_id: int | None = None

    class TermCategoryUpdateBody(BaseModel):
        name: str | None = None
        parent_id: int | None = None

    class TermCategoryReorderBody(BaseModel):
        parent_id: int | None = None
        ordered_ids: list[int]

    @router.get("/api/term-categories")
    def list_term_categories_endpoint(
        parent_id: int | None = None,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        views = list_term_categories(repository, ctx.user_id, ctx.current_space_id, parent_id)
        items = [_term_category_view(v) for v in views]
        return {"code": 0, "msg": "ok", "data": {"items": items, "total": len(items)}}

    @router.post("/api/term-categories")
    def create_term_category_endpoint(
        request: TermCategoryCreateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        category = create_term_category(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            TermCategoryCreateRequest(name=request.name, parent_id=request.parent_id),
        )
        return {"code": 0, "msg": "ok", "data": _term_category_detail(category)}

    @router.patch("/api/term-categories/{category_id}")
    def update_term_category_endpoint(
        category_id: int,
        request: TermCategoryUpdateBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        fields = _fields_set(request)
        name = request.name if "name" in fields else UNSET
        target_parent = request.parent_id if "parent_id" in fields else UNSET
        category = update_term_category(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            category_id,
            TermCategoryUpdateRequest(name=name, parent_id=target_parent),
        )
        return {"code": 0, "msg": "ok", "data": _term_category_detail(category)}

    @router.delete("/api/term-categories/{category_id}")
    def delete_term_category_endpoint(
        category_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        delete_term_category(repository, ctx.user_id, ctx.current_space_id, category_id)
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    @router.post("/api/term-categories/reorder")
    def reorder_term_categories_endpoint(
        request: TermCategoryReorderBody,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        reorder_term_categories(
            repository,
            ctx.user_id,
            ctx.current_space_id,
            request.parent_id,
            request.ordered_ids,
        )
        return {"code": 0, "msg": "ok", "data": {"ok": True}}

    def _fields_set(model) -> set[str]:
        # Pydantic v2: model_fields_set；v1: __fields_set__
        return getattr(model, "model_fields_set", None) or getattr(model, "__fields_set__", set()) or set()

    def _term_category_view(view: TermCategoryView) -> dict[str, object]:
        return {
            "id": view.id,
            "name": view.name,
            "parent_id": view.parent_id,
            "order_idx": view.order_idx,
            "term_count": view.term_count,
            "child_category_count": view.child_category_count,
            "created_at": view.created_at,
            "updated_at": view.updated_at,
        }

    def _term_category_detail(category) -> dict[str, object]:
        return {
            "id": category.id,
            "name": category.name,
            "parent_id": category.parent_id,
            "order_idx": category.order_idx,
        }

else:
    router = None
