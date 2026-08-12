"""FastAPI router for Sprint-5 term management."""

from __future__ import annotations

from backend.model.schemas import ApiEnvelope, DeletedOk, TermDetail, TermListPage
from backend.model.entities import Term, TermStatus
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.term import (
    TermWrite,
    create_term,
    delete_term,
    get_visible_term,
    list_visible_terms,
    update_term,
)

from fastapi import APIRouter, Depends
from pydantic import BaseModel


router = APIRouter(prefix="/api/terms", tags=["terms"])

class TermWriteRequest(BaseModel):
    term: str
    definition: str
    aliases: list[str] = []
    status: TermStatus = TermStatus.CONFIRMED
    source_document_id: int | None = None
    # 术语管理增强（REQ-036 领域树，migration 017）。
    category_id: int | None = None
    category: str | None = None
    source: str | None = None

@router.get("", response_model=ApiEnvelope[TermListPage])
def list_terms_endpoint(
    q: str = "",
    status: TermStatus | None = None,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    terms = list_visible_terms(repository, ctx.user_id, ctx.current_space_id, query=q, status=status)
    return {"code": 0, "msg": "ok", "data": {"items": [_term_detail(term) for term in terms], "total": len(terms), "page": 1}}

@router.post("", response_model=ApiEnvelope[TermDetail])
def create_term_endpoint(request: TermWriteRequest, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    term = create_term(repository, ctx.user_id, ctx.current_space_id, _term_write(request))
    return {"code": 0, "msg": "ok", "data": _term_detail(term)}

@router.get("/{term_id}", response_model=ApiEnvelope[TermDetail])
def get_term_endpoint(term_id: int, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    term = get_visible_term(repository, ctx.user_id, ctx.current_space_id, term_id)
    return {"code": 0, "msg": "ok", "data": _term_detail(term)}

@router.put("/{term_id}", response_model=ApiEnvelope[TermDetail])
def update_term_endpoint(
    term_id: int,
    request: TermWriteRequest,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    term = update_term(repository, ctx.user_id, ctx.current_space_id, term_id, _term_write(request))
    return {"code": 0, "msg": "ok", "data": _term_detail(term)}

@router.delete("/{term_id}", response_model=ApiEnvelope[DeletedOk])
def delete_term_endpoint(term_id: int, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    delete_term(repository, ctx.user_id, ctx.current_space_id, term_id)
    return {"code": 0, "msg": "ok", "data": {"deleted": True}}

def _term_write(request: TermWriteRequest) -> TermWrite:
    return TermWrite(
        term=request.term,
        definition=request.definition,
        aliases=request.aliases,
        status=request.status,
        source_document_id=request.source_document_id,
        category_id=request.category_id,
        category=request.category,
        source=request.source,
    )


def _term_detail(term: Term) -> dict[str, object]:
    return {
        "id": term.id,
        "space_id": term.space_id,
        "term": term.term,
        "definition": term.definition,
        "aliases": term.aliases,
        "owner_id": term.owner_id,
        "status": term.status,
        "source_document_id": term.source_document_id,
        "category_id": term.category_id,
        "category": term.category,
        "source": term.source,
    }
