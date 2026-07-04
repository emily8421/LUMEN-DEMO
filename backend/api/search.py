"""FastAPI router for Sprint-4A degraded full-text search."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.service.demo_repository import repository
from backend.service.search import SearchResult, SearchValidationError, search_documents

try:
    from fastapi import APIRouter, Header, HTTPException
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/search", tags=["search"])

    @router.get("")
    def search_endpoint(
        q: str = "",
        page: int = 1,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            result_page = search_documents(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
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

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc

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
