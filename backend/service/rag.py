"""Degraded Sprint-4B RAG service over in-memory document chunks."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Document, DocumentChunk
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service import llm_adapter
from backend.service.term import find_matching_terms
from backend.service.rag_text import _build_snippet, _extract_terms, _score_chunk


NOT_FOUND_ANSWER = "未在当前空间知识库找到相关内容"
MAX_CANDIDATES = 3
# task-008 T6: cosine-similarity gate for vector recall. Empirically tuned
# (bge-small-zh): true hits ~0.87, unrelated Chinese ~0.51 max, so 0.6 cleanly
# separates them and preserves the "库外不编造" not-found path.
VECTOR_SIMILARITY_THRESHOLD = 0.6
# Rank vector-recalled chunks below strong keyword hits (which score by term
# count); just needs to be > 0 so they are not dropped by the score filter.
_VECTOR_CANDIDATE_SCORE = 1


class RagValidationError(ApiError):
    """RAG 查询请求非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


@dataclass(frozen=True)
class RagSource:
    doc_id: int | None
    title: str
    snippet: str
    source_type: str = "document"


@dataclass(frozen=True)
class RagAnswer:
    answer: str
    sources: list[RagSource]


@dataclass(frozen=True)
class _CandidateChunk:
    document: Document
    chunk: DocumentChunk | None
    score: int
    snippet: str
    source_type: str = "document"


def answer_question(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    question: str,
    history: list[dict[str, str]] | None = None,
    use_knowledge_base: bool = True,
    llm_provider: str | None = None,
) -> RagAnswer:
    """RAG 问答（REQ-008）。

    ``use_knowledge_base=False`` 时走通用对话（批3 AI 抽屉「基于知识库」开关关闭）：
    不检索知识库、无来源，直接调 LLM 纯对话；LLM 未配置 / 失败时降级。
    ``history`` 为前端维护的多轮对话（``[{role, content}]``），拼进 LLM prompt
    （路径 A：前端管理 history，后端透传），检索仍只基于当前 question。
    ``llm_provider`` 为命名 LLM 配置名（``LLM_PROVIDERS`` 列表项，2026-08-07 多通道切换）；
    None 用默认配置。
    """
    normalized_question = _normalize_question(question)
    if not use_knowledge_base:
        return _answer_without_knowledge_base(normalized_question, history, llm_provider)
    terms = _extract_terms(normalized_question)
    question_term_sources = _find_term_sources(repository, current_space_id, normalized_question)
    candidates = _find_candidate_chunks(repository, user_id, current_space_id, terms, normalized_question)
    if not candidates:
        if question_term_sources:
            return RagAnswer(answer=_build_term_only_answer(question_term_sources), sources=question_term_sources)
        return RagAnswer(answer=NOT_FOUND_ANSWER, sources=[])

    selected_candidates = candidates[:MAX_CANDIDATES]
    sources = [
        RagSource(doc_id=candidate.document.id, title=candidate.document.title, snippet=candidate.snippet)
        for candidate in selected_candidates
    ]
    snippet_term_sources = _find_term_sources(
        repository,
        current_space_id,
        "\n".join([normalized_question, *(candidate.snippet for candidate in selected_candidates)]),
    )
    term_sources = _dedupe_sources([*question_term_sources, *snippet_term_sources])
    answer = _build_answer(sources, term_sources, question, _resolve_chat_fn(llm_provider), history=history)
    sources.extend(term_sources)
    return RagAnswer(answer=answer, sources=sources)


def _find_term_sources(repository: RepositoryProtocol, current_space_id: int, text: str) -> list[RagSource]:
    return [
        RagSource(
            doc_id=term.source_document_id,
            title=f"术语：{term.term}",
            snippet=f"{term.definition}（状态：{term.status}；别名：{', '.join(term.aliases) or '无'}）",
            source_type="term",
        )
        for term in find_matching_terms(repository, current_space_id, text)
    ]


def _dedupe_sources(sources: list[RagSource]) -> list[RagSource]:
    deduped_sources: list[RagSource] = []
    seen_keys: set[tuple[int | None, str, str]] = set()
    for source in sources:
        key = (source.doc_id, source.title, source.source_type)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped_sources.append(source)
    return deduped_sources


def _normalize_question(question: str) -> str:
    normalized_question = question.strip().lower()
    if not normalized_question:
        raise RagValidationError("question is required")
    return normalized_question


def _find_candidate_chunks(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    terms: list[str],
    question: str,
) -> list[_CandidateChunk]:
    visible_documents = repository.list_visible_documents(user_id, current_space_id)
    documents_by_id = {document.id: document for document in visible_documents}
    candidates: list[_CandidateChunk] = []
    matched_document_ids: set[int] = set()
    for chunk in repository.list_all_document_chunks():
        document = documents_by_id.get(chunk.document_id)
        if document is None:
            continue
        score = _score_chunk(chunk.text, terms)
        if score <= 0:
            continue
        matched_document_ids.add(document.id)
        candidates.append(
            _CandidateChunk(
                document=document,
                chunk=chunk,
                score=score,
                snippet=_build_snippet(chunk.text, terms),
            )
        )
    # task-008 T6: additive vector recall (semantic). The in-memory fake returns
    # [] (no embeddings) so in-memory tests keep hitting the keyword path above;
    # PgRepository returns pgvector ANN matches above VECTOR_SIMILARITY_THRESHOLD.
    # Merged in, deduped by chunk id — never replaces a keyword hit. "not found"
    # still triggers when both keyword and vector paths come up empty.
    existing_chunk_ids = {candidate.chunk.id for candidate in candidates if candidate.chunk is not None}
    for chunk in repository.recall_chunks(
        [document.id for document in visible_documents],
        question,
        MAX_CANDIDATES,
        VECTOR_SIMILARITY_THRESHOLD,
    ):
        if chunk.id in existing_chunk_ids:
            continue
        document = documents_by_id.get(chunk.document_id)
        if document is None:
            continue
        matched_document_ids.add(document.id)
        candidates.append(
            _CandidateChunk(
                document=document,
                chunk=chunk,
                score=_VECTOR_CANDIDATE_SCORE,
                snippet=_build_snippet(chunk.text, terms),
            )
        )
    for document in visible_documents:
        if document.id in matched_document_ids:
            continue
        title_score = _score_chunk(document.title, terms)
        if title_score <= 0:
            continue
        candidates.append(
            _CandidateChunk(
                document=document,
                chunk=None,
                score=title_score,
                snippet=f"标题匹配：{document.title}",
                source_type="title",
            )
        )
    return sorted(candidates, key=lambda candidate: (-candidate.score, candidate.document.id, candidate.chunk.ordinal if candidate.chunk else 0))


def _build_answer(
    sources: list[RagSource],
    term_sources: list[RagSource],
    question: str,
    chat_fn=None,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Build the RAG answer. When ``chat_fn`` is provided, call the LLM with a
    source-grounded prompt; fall back to the degraded answer when the LLM is not
    configured or fails. ``chat_fn`` is injected so tests can exercise the LLM
    path without a real endpoint.

    ``history``（前端维护的多轮对话）以文本拼进 system prompt，作为对话上下文
    供 LLM 参考；检索仍只基于当前 question。保持 ``chat_fn(system, user)`` 两参
    调用不变，兼容既有测试注入的 lambda。
    """
    degraded = _build_degraded_answer(sources, term_sources)
    if chat_fn is None:
        return degraded
    history_text = _format_history(history)
    system_prompt = (
        "你是 LUMEN 知识库问答助手。仅依据下方「给定内容」回答用户问题；"
        "在答案中标注信息来自哪个来源；若给定内容无依据，"
        f"回复「{NOT_FOUND_ANSWER}」，不要编造。"
    )
    if history_text:
        system_prompt = f"{system_prompt}\n\n{history_text}"
    user_prompt = f"问题：{question}\n\n{_format_context(sources, term_sources)}"
    try:
        llm_answer = chat_fn(system_prompt, user_prompt)
    except Exception:
        return degraded
    return llm_answer or degraded


def _answer_without_knowledge_base(
    question: str,
    history: list[dict[str, str]] | None,
    llm_provider: str | None = None,
) -> RagAnswer:
    """通用对话模式（批3「基于知识库」开关关闭）：不检索知识库、无来源。

    直接调 LLM 纯对话；LLM 未配置 / 调用失败 / 返回为空时降级为明确文案，
    不编造知识库内容（守住「不编造」产品红线）。数据外发为单条显式触发的
    用户对话，符合 RG-008「由用户自判是否触发」护栏。``llm_provider`` 指定
    命名 LLM 配置（多通道切换）。
    """
    chat_fn = _resolve_chat_fn(llm_provider)
    if chat_fn is None:
        return RagAnswer(answer="降级模式：未配置 LLM，通用对话不可用。请开启「基于知识库」问答。", sources=[])
    history_text = _format_history(history)
    system_prompt = "你是 LUMEN AI 助手。请基于对话上下文直接回答用户问题；若无依据，如实说明，不要编造。"
    user_prompt = f"{history_text}当前问题：{question}" if history_text else f"问题：{question}"
    try:
        answer = chat_fn(system_prompt, user_prompt)
    except Exception:
        return RagAnswer(answer="降级模式：LLM 调用失败，通用对话不可用。请稍后重试。", sources=[])
    if not answer:
        return RagAnswer(answer="降级模式：LLM 返回为空。请重新提问。", sources=[])
    return RagAnswer(answer=answer, sources=[])


def _format_history(history: list[dict[str, str]] | None) -> str:
    """把前端维护的多轮对话历史格式化为 prompt 文本；无有效轮次返回空串。"""
    if not history:
        return ""
    lines: list[str] = []
    for turn in history:
        role = turn.get("role")
        content = (turn.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            prefix = "用户" if role == "user" else "助手"
            lines.append(f"{prefix}：{content}")
    if not lines:
        return ""
    return "以下是对话历史：\n" + "\n".join(lines)


def _resolve_chat_fn(llm_provider: str | None = None):
    """Return an LLM chat callable bound to the selected config, else None (degraded mode).

    ``llm_provider`` selects a named LLM config (2026-08-07 多通道切换); None uses the
    default config. Returns a two-arg closure ``chat_fn(system, user)`` so downstream
    ``_build_answer`` / ``_answer_without_knowledge_base`` call it with the bound config —
    otherwise ``llm_adapter.chat`` would re-``load_config()`` and lose the switch.
    """
    cfg = llm_adapter.load_config(llm_provider)
    if not cfg.enabled:
        return None
    return lambda system_prompt, user_prompt: llm_adapter.chat(system_prompt, user_prompt, cfg)


def _format_context(sources: list[RagSource], term_sources: list[RagSource]) -> str:
    lines: list[str] = []
    for index, source in enumerate(sources, start=1):
        lines.append(f"[来源{index}] {source.title}：{source.snippet}")
    for source in term_sources:
        lines.append(f"[术语] {source.title}：{source.snippet}")
    return "\n".join(lines)


def _build_degraded_answer(sources: list[RagSource], term_sources: list[RagSource]) -> str:
    snippets = "；".join(source.snippet for source in sources)
    term_context = "；".join(source.snippet for source in term_sources)
    title_only = sources and all(source.snippet.startswith("标题匹配：") for source in sources)
    if term_context:
        if title_only:
            return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；仅命中文档标题，未找到正文候选片段：{snippets}"
        return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；以下内容仅来自当前空间知识库候选片段：{snippets}"
    if title_only:
        return f"降级模式：未调用 LLM；仅命中文档标题，未找到正文候选片段：{snippets}"
    return f"降级模式：未调用 LLM；以下内容仅来自当前空间知识库候选片段：{snippets}"


def _build_term_only_answer(term_sources: list[RagSource]) -> str:
    term_context = "；".join(source.snippet for source in term_sources)
    return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；未匹配到当前空间文档候选片段"
