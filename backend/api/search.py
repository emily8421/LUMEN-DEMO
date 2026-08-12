"""FastAPI router for Sprint-4A degraded full-text search."""

from __future__ import annotations

from backend.model.schemas import ApiEnvelope, SearchPageView
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.search import SearchResult, search_documents

from fastapi import APIRouter, Depends


router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("", response_model=ApiEnvelope[SearchPageView])
def search_endpoint(
    q: str = "",
    page: int = 1,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    result_page = search_documents(
        repository=repository,
        user_id=ctx.user_id,
        current_space_id=ctx.current_space_id,
        query=q,
        page=page,
    )

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
