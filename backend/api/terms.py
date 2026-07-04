"""FastAPI router for Sprint-5 term management."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.model.entities import Term, TermStatus
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.service.demo_repository import repository
from backend.service.term import (
    TermAccessError,
    TermNotFoundError,
    TermValidationError,
    TermWrite,
    create_term,
    delete_term,
    get_visible_term,
    list_visible_terms,
    update_term,
)

try:
    from fastapi import APIRouter, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/terms", tags=["terms"])

    class TermWriteRequest(BaseModel):
        term: str
        definition: str
        aliases: list[str] = []
        status: TermStatus = TermStatus.CONFIRMED
        source_document_id: int | None = None

    @router.get("")
    def list_terms_endpoint(
        q: str = "",
        status: TermStatus | None = None,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            terms = list_visible_terms(repository, payload.user_id, payload.current_space_id, query=q, status=status)
        except TermAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": {"items": [_term_detail(term) for term in terms], "total": len(terms), "page": 1}}

    @router.post("")
    def create_term_endpoint(request: TermWriteRequest, authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            term = create_term(repository, payload.user_id, payload.current_space_id, _term_write(request))
        except TermAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except TermValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": _term_detail(term)}

    @router.get("/{term_id}")
    def get_term_endpoint(term_id: int, authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            term = get_visible_term(repository, payload.user_id, payload.current_space_id, term_id)
        except TermAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except TermNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "term not found"}) from exc
        return {"code": 0, "msg": "ok", "data": _term_detail(term)}

    @router.put("/{term_id}")
    def update_term_endpoint(
        term_id: int,
        request: TermWriteRequest,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            term = update_term(repository, payload.user_id, payload.current_space_id, term_id, _term_write(request))
        except TermAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except TermNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "term not found"}) from exc
        except TermValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": _term_detail(term)}

    @router.delete("/{term_id}")
    def delete_term_endpoint(term_id: int, authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            delete_term(repository, payload.user_id, payload.current_space_id, term_id)
        except TermAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except TermNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "term not found"}) from exc
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    def _term_write(request: TermWriteRequest) -> TermWrite:
        return TermWrite(
            term=request.term,
            definition=request.definition,
            aliases=request.aliases,
            status=request.status,
            source_document_id=request.source_document_id,
        )

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc

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
        }
else:
    router = None
