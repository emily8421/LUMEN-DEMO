"""FastAPI router for Sprint-4B degraded RAG answers."""

from __future__ import annotations

from backend.model.schemas import ApiEnvelope, LlmConfigView, QueryAnswerView
from backend.repository import repository
from backend.service import llm_adapter
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.rag import RagSource, answer_question

from fastapi import APIRouter, Depends
from pydantic import BaseModel


router = APIRouter(prefix="/api/query", tags=["rag"])

class QueryRequest(BaseModel):
    question: str
    # 批3 AI 抽屉多轮对话（路径 A）：前端维护 [{role, content}]，后端拼 prompt。
    history: list[dict[str, str]] = []
    # 批3「基于知识库」开关：True=RAG 检索增强问答（默认）；False=通用对话（不检索）。
    use_knowledge_base: bool = True
    # 多通道切换（2026-08-07）：命名 LLM 配置名（LLM_PROVIDERS 列表项），None=默认。
    llm_provider: str | None = None

@router.post("", response_model=ApiEnvelope[QueryAnswerView])
def query_endpoint(request: QueryRequest, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    answer = answer_question(
        repository=repository,
        user_id=ctx.user_id,
        current_space_id=ctx.current_space_id,
        question=request.question,
        history=request.history,
        use_knowledge_base=request.use_knowledge_base,
        llm_provider=request.llm_provider,
    )

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


# 多通道切换（2026-08-07）：返回可用 LLM 配置元信息（脱敏，不含 api_key），供前端下拉。
config_router = APIRouter(prefix="/api/llm-configs", tags=["llm"])

@config_router.get("", response_model=ApiEnvelope[list[LlmConfigView]])
def list_llm_configs(ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    return {"code": 0, "msg": "ok", "data": llm_adapter.list_configs()}
