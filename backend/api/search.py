"""FastAPI router for Sprint-4A degraded full-text search."""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.search import SearchResult, SearchValidationError, search_documents

try:
    from fastapi import APIRouter, Depends, HTTPException
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/search", tags=["search"])

    @router.get("")
    def search_endpoint(
        q: str = "",
        page: int = 1,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            result_page = search_documents(
                repository=repository,
                user_id=ctx.user_id,
                current_space_id=ctx.current_space_id,
                query=q,
                page=page,
            )
        except SearchValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc

        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "items": [_search_result_item(item) for item in result_page.items],
                "total": result_page.total,
                "page": result_page.page,
            },
        }


    def _search_result_item(item: SearchResult) -> dict[str, object]:
        return {
            "doc_id": item.doc_id,
            "title": item.title,
            "snippet": item.snippet,
            "chunk_id": item.chunk_id,
            "ordinal": item.ordinal,
        }
else:
    router = None
