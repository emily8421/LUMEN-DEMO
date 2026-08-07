"""FastAPI router for Sprint-4B degraded RAG answers."""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.rag import RagSource, RagValidationError, answer_question

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/query", tags=["rag"])

    class QueryRequest(BaseModel):
        question: str

    @router.post("")
    def query_endpoint(request: QueryRequest, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        try:
            answer = answer_question(
                repository=repository,
                user_id=ctx.user_id,
                current_space_id=ctx.current_space_id,
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


    def _source_item(source: RagSource) -> dict[str, object]:
        return {
            "doc_id": source.doc_id,
            "title": source.title,
            "snippet": source.snippet,
            "source_type": source.source_type,
        }
else:
    router = None
