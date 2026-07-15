"""FastAPI router for Sprint-4B degraded RAG answers."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.repository import repository
from backend.service.rag import RagSource, RagValidationError, answer_question

try:
    from fastapi import APIRouter, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/query", tags=["rag"])

    class QueryRequest(BaseModel):
        question: str

    @router.post("")
    def query_endpoint(request: QueryRequest, authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            answer = answer_question(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
                question=request.question,
            )
        except RagValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc

        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "answer": answer.answer,
                "sources": [_source_item(source) for source in answer.sources],
            },
        }

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc

    def _source_item(source: RagSource) -> dict[str, object]:
        return {
            "doc_id": source.doc_id,
            "title": source.title,
            "snippet": source.snippet,
            "source_type": source.source_type,
        }
else:
    router = None
