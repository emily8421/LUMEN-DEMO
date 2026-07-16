"""FastAPI router for REQ-026 internal links / backlinks (API-018, Phase2A).

GET /api/doc-links?document_id=&direction=outbound|backlink 查出链 / 反链（权限过滤）；
POST /api/doc-links 手动登记 manual 链接（wikilink 由文档保存时正文解析，不接受手动 POST）。
"""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.repository import repository
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.service.doc_links import (
    DocLinkCreateRequest,
    DocLinkValidationError,
    list_links,
    upsert_link,
)
from backend.service.document import DocumentNotFoundError

try:
    from fastapi import APIRouter, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/doc-links", tags=["doc-links"])

    class DocLinkCreateBody(BaseModel):
        source_document_id: int
        link_text: str
        target_document_id: int | None = None
        target_title: str | None = None
        link_type: str = "manual"

    @router.get("")
    def list_links_endpoint(
        document_id: int,
        direction: str = "outbound",
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        if direction not in ("outbound", "backlink"):
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": "direction must be outbound or backlink"})
        views = list_links(repository, payload.user_id, payload.current_space_id, document_id, direction)
        return {"code": 0, "msg": "ok", "data": [_link_view(view) for view in views]}

    @router.post("")
    def create_link_endpoint(
        request: DocLinkCreateBody,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            link = upsert_link(
                repository,
                payload.user_id,
                payload.current_space_id,
                DocLinkCreateRequest(
                    source_document_id=request.source_document_id,
                    link_text=request.link_text,
                    target_document_id=request.target_document_id,
                    target_title=request.target_title,
                    link_type=request.link_type,
                ),
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except DocLinkValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": {"id": link.id, "status": link.status}}

    def _link_view(view) -> dict[str, object]:
        return {
            "id": view.id,
            "source_document_id": view.source_document_id,
            "target_document_id": view.target_document_id,
            "target_title": view.target_title,
            "link_text": view.link_text,
            "link_type": view.link_type,
            "status": view.status,
        }

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc
else:
    router = None
